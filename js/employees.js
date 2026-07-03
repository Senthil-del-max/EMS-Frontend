"use strict";

/* ==============================
   API URLs
============================== */

const user = JSON.parse(localStorage.getItem("user"));


const EMPLOYEE_API = "https://employee-management-system-jt3h.onrender.com/api/employees";
const DEPARTMENT_API = "https://employee-management-system-jt3h.onrender.com/api/departments";

let employees = [];
let departments = [];
let filteredEmployees = [];
let editingEmployeeId = null;

/* ==============================
   Logged In User
============================== */

function loadLoggedInUser() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) return;

    document.querySelectorAll("[data-user-name]").forEach(el => {
        el.textContent = user.fullName;
    });

    document.querySelectorAll("[data-user-role]").forEach(el => {
        el.textContent = user.role;
    });

    document.querySelectorAll("[data-user-email]").forEach(el => {
        el.textContent = user.email;
    });

    const initials = user.fullName
        .split(" ")
        .map(x => x[0])
        .join("")
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

}

/* ==============================
   Load Departments
============================== */

async function loadDepartments(){

    try{

        const response = await fetch(DEPARTMENT_API,{

            headers:{
                Authorization:"Bearer "+localStorage.getItem("token")
            }

        });

        if (!response.ok) {
            throw new Error("Failed to load departments");
        }

        departments = await response.json();

        fillDepartmentDropdown();

    }catch(error){

        console.error(error);

    }

}

/* ==============================
   Fill Dropdown
============================== */

function fillDepartmentDropdown(){

    const add=document.getElementById("ae_dept");

    const edit=document.getElementById("ee_dept");

    add.innerHTML='<option value="">Select Department</option>';

    edit.innerHTML='<option value="">Select Department</option>';

    departments.forEach(dept=>{

        add.innerHTML+=`
        <option value="${dept.id}">
            ${dept.departmentName}
        </option>`;

        edit.innerHTML+=`
        <option value="${dept.id}">
            ${dept.departmentName}
        </option>`;

    });

}

/* ==============================
   Load Employees
============================== */

async function loadEmployees(){

    try{

        const response=await fetch(EMPLOYEE_API,{

            headers:{
                Authorization:"Bearer "+localStorage.getItem("token")
            }

        });

        if (!response.ok) {
            throw new Error("Failed to load employees");
        }

        employees=await response.json();

        filteredEmployees=[...employees];

        renderEmployees();

        updateSummary();

    }

    catch(error){

        console.error(error);

    }

}

/* ==============================
   Render Employee Table
============================== */

function renderEmployees() {

    const tbody = document.getElementById("empTbody");

    tbody.innerHTML = "";

    if (filteredEmployees.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    No Employees Found
                </td>
            </tr>
        `;

        return;

    }

    filteredEmployees.forEach(emp => {

        tbody.innerHTML += `

        <tr>

            <td>

                <strong>${emp.fullName}</strong><br>

                <small>${emp.employeeId}</small>

            </td>

            <td>${emp.departmentName}</td>

            <td>${emp.designation}</td>

            <td>

                ${emp.email}<br>

                <small>${emp.phone}</small>

            </td>

            <td>${emp.joiningDate}</td>

            <td>₹${emp.salary}</td>

            <td>

                ${
                    emp.active
                    ? '<span class="badge bg-success">Active</span>'
                    : '<span class="badge bg-danger">Inactive</span>'
                }

            </td>

            <td>

                <button
                    class="btn btn-sm btn-primary"
                    onclick="editEmployee(${emp.id})">

                    Edit

                </button>

                <button
                    class="btn btn-sm btn-danger"
                    onclick="deleteEmployee(${emp.id})">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

}

/* ==============================
   Search Employee
============================== */

function searchEmployees() {

    const keyword = document
        .getElementById("empSearch")
        .value
        .toLowerCase();

    filteredEmployees = employees.filter(emp =>

        emp.fullName.toLowerCase().includes(keyword) ||

        emp.email.toLowerCase().includes(keyword) ||

        emp.designation.toLowerCase().includes(keyword) ||

        emp.employeeId.toLowerCase().includes(keyword)

    );

    renderEmployees();

}

/* ==============================
   Summary Cards
============================== */

function updateSummary() {

    const cards = document.querySelectorAll(".sc-value");

    cards[0].textContent = employees.length;

    cards[1].textContent =
        employees.filter(e => e.active).length;

    cards[2].textContent = 0;

    cards[3].textContent =
        employees.filter(e => !e.active).length;

}

/* ==============================
   View Employee
============================== */

function viewEmployee(id){

    const emp=employees.find(e=>e.id===id);

    if(!emp) return;

    document.getElementById("viewEmpName").textContent=
        emp.fullName;

    document.getElementById("viewEmpTitle").textContent=
        emp.designation;

    document.getElementById("viewEmpId").textContent=
        emp.employeeId;

    document.getElementById("viewEmpDept").textContent=
        emp.departmentName;

    document.getElementById("viewEmpEmail").textContent=
        emp.email;

    document.getElementById("viewEmpPhone").textContent=
        emp.phone;

    document.getElementById("viewEmpJoin").textContent=
        emp.joiningDate;

    document.getElementById("viewEmpSalary").textContent=
        "₹"+emp.salary;

    document.getElementById("viewEmpStatus").textContent=
        emp.active?"Active":"Inactive";

    document.getElementById("viewEmpAvatar").textContent=

        emp.fullName
           .split(" ")
           .map(x=>x[0])
           .join("");

    new bootstrap.Modal(

        document.getElementById("viewEmpModal")

    ).show();

}

/* ==============================
   Add Employee
============================== */

async function saveEmployee() {

    const employee = {

        employeeId: "EMP" + Date.now(),

        fullName:
            document.getElementById("ae_fname").value.trim() + " " +
            document.getElementById("ae_lname").value.trim(),

        email:
            document.getElementById("ae_email").value.trim(),

        phone:
            document.getElementById("ae_phone").value.trim(),

        designation:
            document.getElementById("ae_title").value.trim(),

        salary:
            parseFloat(document.getElementById("ae_salary").value),

        joiningDate:
            document.getElementById("ae_joindate").value,

        departmentId:
            parseInt(document.getElementById("ae_dept").value),

        active:
            document.getElementById("ae_status").value === "Active"

    };

    try {

        const response = await fetch(EMPLOYEE_API, {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                "Authorization":
                    "Bearer " + localStorage.getItem("token")

            },

            body: JSON.stringify(employee)

        });

        if (!response.ok)
            throw new Error();

        bootstrap.Modal
            .getInstance(document.getElementById("addEmpModal"))
            .hide();

        document.getElementById("addEmpForm").reset();

        loadEmployees();

        showToast("Employee Added Successfully");

    }

    catch(error){

        console.error(error);

        alert(error);

    }

}

/* ==============================
   Edit Employee
============================== */

function editEmployee(id) {

    const emp = employees.find(e => e.id === id);

    if (!emp) return;

    editingEmployeeId = id;

    const names = emp.fullName.split(" ");

    document.getElementById("ee_fname").value = names[0];

    document.getElementById("ee_lname").value =
        names.slice(1).join(" ");

    document.getElementById("ee_email").value = emp.email;

    document.getElementById("ee_phone").value = emp.phone;

    document.getElementById("ee_title").value = emp.designation;

    document.getElementById("ee_salary").value = emp.salary;

    document.getElementById("ee_joindate").value = emp.joiningDate;

    document.getElementById("ee_dept").value = emp.departmentId;

    document.getElementById("ee_status").value =
        emp.active ? "Active" : "Inactive";

    new bootstrap.Modal(
        document.getElementById("editEmpModal")
    ).show();

}

async function updateEmployee() {

    const oldEmployee = employees.find(e => e.id === editingEmployeeId);

    const employee = {

        employeeId: oldEmployee.employeeId,

        fullName:
            document.getElementById("ee_fname").value + " " +
            document.getElementById("ee_lname").value,

        email: document.getElementById("ee_email").value,

        phone: document.getElementById("ee_phone").value,

        designation: document.getElementById("ee_title").value,

        salary: Number(document.getElementById("ee_salary").value),

        joiningDate: document.getElementById("ee_joindate").value,

        departmentId: Number(document.getElementById("ee_dept").value),

        active:
            document.getElementById("ee_status").value === "Active"

    };
    try {

        const response = await fetch(

            EMPLOYEE_API + "/" + editingEmployeeId,

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json",

                    "Authorization":
                        "Bearer " + localStorage.getItem("token")

                },

                body: JSON.stringify(employee)

            }

        );

        if (!response.ok)
            throw new Error();

        bootstrap.Modal
            .getInstance(document.getElementById("editEmpModal"))
            .hide();

        loadEmployees();

       showToast("Employee Updated");

    }

    catch {

        showToast("Update Failed");

    }

}

async function deleteEmployee(id) {

    if (!confirm("Delete this employee?"))
        return;

    try {

        const response = await fetch(

            EMPLOYEE_API + "/" + id,

            {

                method: "DELETE",

                headers: {

                    "Authorization":
                        "Bearer " + localStorage.getItem("token")

                }

            }

        );

        if (!response.ok)
            throw new Error();

        loadEmployees();

        showToast("Employee Deleted");

    }

    catch {

        showToast("Delete Failed");

    }

}

document.addEventListener("DOMContentLoaded", () => {

    loadLoggedInUser();
    loadDepartments();
    loadEmployees();

    // Search
    document
        .getElementById("empSearch")
        .addEventListener("keyup", searchEmployees);

    // Open Add Employee Modal
    document
        .getElementById("btnOpenAddEmp")
        .addEventListener("click", () => {

            const modal = new bootstrap.Modal(
                document.getElementById("addEmpModal")
            );

            modal.show();

        });

    // Save Employee
    document
        .getElementById("btnSaveAddEmp")
        .addEventListener("click", saveEmployee);

    // Update Employee
    document
        .getElementById("btnSaveEditEmp")
        .addEventListener("click", updateEmployee);

});

