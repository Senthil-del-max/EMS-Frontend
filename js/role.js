"use strict";

function hideMenu(id) {
    document.getElementById(id)?.classList.add("d-none");
}

function hideCard(id) {
    document.getElementById(id)?.style.setProperty("display", "none");
}

function hideElement(id) {
    document.getElementById(id)?.remove();
}

function applyRolePermissions() {

    const user = getCurrentUser();

    if (!user) return;

    switch (user.role) {

        case "ADMIN":
            return;

        case "HR":

            hideMenu("menuPayroll");
            hideMenu("menuSettings");

            hideCard("cardDepartments");

            break;

        case "EMPLOYEE":

            // Sidebar
            hideMenu("menuDepartments");
            hideMenu("menuEmployees");
            hideMenu("menuSettings");

            // Top Settings
            hideElement("topSettings");

            // Dashboard Cards
            hideCard("cardDepartments");
            hideCard("cardLeaves");

            // Dashboard Buttons
            hideElement("btnAddEmployee");
            hideElement("btnRunPayroll");
            hideElement("btnReviewLeaves");

            // Quick Actions
            hideElement("qaAddEmployee");
            hideElement("qaDepartment");

            // Dashboard Sections
            document.getElementById("adminSection")?.style.setProperty("display", "none");
            document.getElementById("employeeSection")?.style.setProperty("display", "block");

            break;
    }
}