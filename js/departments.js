"use strict";

const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

if (user.role !== "ADMIN") {

    alert("Access Denied");

    window.location.href = "dashboard.html";

}

const API_URL = `${API_BASE_URL}/api/departments`;

let departments = [];
let filteredDepartments = [];
let editingId = null;

function loadLoggedInUser() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        console.log("No user found in localStorage");
        return;
    }

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
        .map(word => word.charAt(0))
        .join("")
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

}

async function loadDepartments() {

    try {

        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Failed to load departments");
        }

        departments = await response.json();

        filteredDepartments = [...departments];

        renderTable();
        updateSummaryCards();

    } catch (error) {

        console.error(error);

        alert("Unable to load departments.");

    }

}

function renderTable() {

    const tbody = document.getElementById("deptTbody");

    tbody.innerHTML = "";

    if (filteredDepartments.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    No Departments Found
                </td>
            </tr>
        `;

        return;
    }

    filteredDepartments.forEach(dept => {

        tbody.innerHTML += `
            <tr>

                <td>${dept.id}</td>

                <td>${dept.departmentName}</td>

                <td>${dept.departmentCode}</td>

                <td>${dept.description ?? "-"}</td>

                <td>

                    ${
                        dept.active
                            ? '<span class="badge bg-success">Active</span>'
                            : '<span class="badge bg-danger">Inactive</span>'
                    }

                </td>

                <td>

                    <button
                        class="btn btn-primary btn-sm"
                        onclick="editDepartment(${dept.id})">

                        Edit

                    </button>

                    <button
                        class="btn btn-danger btn-sm"
                        onclick="deleteDepartment(${dept.id})">

                        Delete

                    </button>

                </td>

            </tr>
        `;

    });

}

function searchDepartment() {

    const keyword =
        document.getElementById("deptSearch")
        .value
        .toLowerCase();

    filteredDepartments = departments.filter(dept =>

        dept.departmentName.toLowerCase().includes(keyword) ||

        dept.departmentCode.toLowerCase().includes(keyword)

    );

    renderTable();

}

async function saveDepartment() {

    const department = {

        departmentName: document.getElementById("add_name").value.trim(),

        departmentCode: document.getElementById("add_code").value.trim(),

        description: document.getElementById("add_desc").value.trim()

    };

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },

            body: JSON.stringify(department)

        });

        if (!response.ok) {

            throw new Error("Failed to save department");

        }

        alert("Department Added Successfully");

        document.getElementById("addDeptForm").reset();

        bootstrap.Modal.getInstance(
            document.getElementById("addDeptModal")
        ).hide();

        loadDepartments();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}



document.addEventListener("DOMContentLoaded", () => {

    loadLoggedInUser();

    loadDepartments();

    document
        .getElementById("deptSearch")
        .addEventListener("keyup", searchDepartment);

    document
        .getElementById("btnSaveAdd")
        .addEventListener("click", saveDepartment);

    document
        .getElementById("btnOpenAdd")
        .addEventListener("click", () => {

            const modal = new bootstrap.Modal(
                document.getElementById("addDeptModal")
            );

            modal.show();

    document
        .getElementById("btnSaveEdit")
        .addEventListener("click", updateDepartment);

        });

    document
        .getElementById("btnOpenAdd")
        .addEventListener("click", () => {

            const modal = new bootstrap.Modal(
                document.getElementById("addDeptModal")
            );

            modal.show();

        });

});

function updateSummaryCards() {

    document.querySelectorAll(".sc-value")[0].textContent = departments.length;

    document.querySelectorAll(".sc-value")[1].textContent =
        departments.filter(d => d.active).length;

    document.querySelectorAll(".sc-value")[2].textContent = 0;

    document.querySelectorAll(".sc-value")[3].textContent = departments.length;

}

function editDepartment(id) {
    alert("Edit Department: " + id);
}

function deleteDepartment(id) {
    if (confirm("Delete Department?")) {
        alert("Delete API will be implemented next.");
    }
}

async function editDepartment(id) {

    try {

        const response = await fetch(`${API_URL}/${id}`);

        const dept = await response.json();

        editingId = id;

        document.getElementById("edit_name").value = dept.departmentName;
        document.getElementById("edit_code").value = dept.departmentCode;
        document.getElementById("edit_desc").value = dept.description ?? "";

        const modal = new bootstrap.Modal(
            document.getElementById("editDeptModal")
        );

        modal.show();

    } catch (error) {

        console.error(error);
        alert("Unable to load department.");

    }

}

async function updateDepartment() {

    const department = {

        departmentName: document.getElementById("edit_name").value.trim(),
        departmentCode: document.getElementById("edit_code").value.trim(),
        description: document.getElementById("edit_desc").value.trim()

    };

    try {

        const response = await fetch(`${API_URL}/${editingId}`, {

            method: "PUT",

            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },

            body: JSON.stringify(department)

        });

        if (!response.ok) {
            throw new Error("Update Failed");
        }

        bootstrap.Modal.getInstance(
            document.getElementById("editDeptModal")
        ).hide();

        loadDepartments();

        alert("Department Updated Successfully");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}

async function deleteDepartment(id) {

    if (!confirm("Are you sure you want to delete this department?")) {
        return;
    }

    try {

        const response = await fetch(`${API_URL}/${id}`, {

            method: "DELETE",

            headers: {
                "Authorization": "Bearer " + localStorage.getItem("token")
            }

        });

        if (!response.ok) {
            throw new Error("Delete Failed");
        }

        alert("Department Deleted Successfully");

        loadDepartments();

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}