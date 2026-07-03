"use strict";

const EMPLOYEE_API = "https://employee-management-system-jt3h.onrender.com/api/employees";

async function getEmployees() {

    const token = localStorage.getItem("token");

    const response = await fetch(EMPLOYEE_API, {
        headers: {
            Authorization: "Bearer " + token
        }
    });

    if (!response.ok)
        throw new Error("Failed to load employees");

    return await response.json();
}

async function saveEmployee(employee) {

    const token = localStorage.getItem("token");

    const response = await fetch(EMPLOYEE_API, {

        method: "POST",

        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },

        body: JSON.stringify(employee)

    });

    return await response.json();
}

async function updateEmployee(id, employee) {

    const token = localStorage.getItem("token");

    const response = await fetch(

        EMPLOYEE_API + "/" + id,

        {

            method: "PUT",

            headers: {

                "Content-Type": "application/json",

                Authorization: "Bearer " + token

            },

            body: JSON.stringify(employee)

        }

    );

    return await response.json();

}

async function deleteEmployee(id) {

    const token = localStorage.getItem("token");

    await fetch(

        EMPLOYEE_API + "/" + id,

        {

            method: "DELETE",

            headers: {

                Authorization: "Bearer " + token

            }

        }

    );

}