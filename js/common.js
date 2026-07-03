
function logout(e) {

    e.preventDefault();

    if (confirm("Are you sure you want to sign out?")) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();

        window.location.href = "index.html";
    }

}

document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("logoutBtn")?.addEventListener("click", logout);

    document.getElementById("logoutBtn2")?.addEventListener("click", logout);



});

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("user"));
}

function applyRolePermissions() {

    const user = getCurrentUser();

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    // ===========================
    // ADMIN
    // ===========================
    if (user.role === "ADMIN") {
        return;
    }

    // ===========================
    // EMPLOYEE
    // ===========================

    // Hide Admin Modules
    document.getElementById("menuDepartments")?.remove();
    document.getElementById("menuEmployees")?.remove();

    // Hide Admin Buttons
    document.getElementById("btnAddEmployee")?.remove();
    document.getElementById("btnAddDepartment")?.remove();
    document.getElementById("btnGeneratePayroll")?.remove();

    // Leave Approval
    document.getElementById("btnModalApprove")?.remove();
    document.getElementById("btnModalReject")?.remove();

    // Export
    document.getElementById("payExportBtn")?.remove();

}

document.addEventListener("DOMContentLoaded", () => {

    applyRolePermissions();

});

function requireAdmin() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "ADMIN") {

        alert("Access Denied");

        window.location.href = "dashboard.html";

    }

}


document.addEventListener("DOMContentLoaded", () => {

    const currentPage = window.location.pathname
        .split("/")
        .pop()
        .replace(".html", "");

    document.querySelectorAll(".nav-link").forEach(link => {

        link.classList.remove("active");

        if (link.dataset.page === currentPage) {
            link.classList.add("active");
        }

    });

});

const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";
