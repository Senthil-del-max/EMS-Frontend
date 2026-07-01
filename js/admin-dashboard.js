"use strict";

const user = JSON.parse(localStorage.getItem("user"));

function loadUserProfile() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "login.html";
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
        .map(w => w[0])
        .join("")
        .substring(0,2)
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

}

(function () {

    const hour = new Date().getHours();

    let greeting = "Good morning";

    if (hour >= 12 && hour < 17)
        greeting = "Good afternoon";

    if (hour >= 17)
        greeting = "Good evening";

    const el = document.getElementById("greetingText");

    if (el)
        el.textContent = greeting;

})();

async function loadDashboardStats() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/stats",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load dashboard statistics");
        }

        const data = await response.json();

        document.getElementById("totalUsers").textContent = data.totalEmployees;
        document.getElementById("totalDepartments").textContent = data.totalDepartments;
        document.getElementById("activeUsers").textContent = data.presentToday;
        document.getElementById("pendingLeaves").textContent = data.pendingLeaves;

    } catch (error) {

        console.error("Dashboard Stats Error:", error);

    }

}

async function loadRecentEmployees() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/employees/recent",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load recent employees");
        }

        const employees = await response.json();

        const tbody = document.getElementById("recentEmpTableBody");

        if (!tbody) return;

        tbody.innerHTML = "";

        employees.forEach(emp => {

            const initials = emp.fullName
                .split(" ")
                .map(x => x[0])
                .join("")
                .substring(0, 2);

            tbody.innerHTML += `
                <tr>
                    <td>
                        <div class="emp-cell">
                            <div class="emp-avatar">
                                ${initials}
                            </div>
                            <div>
                                <div class="emp-name">${emp.fullName}</div>
                                <div class="emp-id">${emp.employeeId}</div>
                            </div>
                        </div>
                    </td>

                    <td>${emp.departmentName}</td>

                    <td>${emp.designation}</td>

                    <td>${emp.joiningDate}</td>

                    <td>
                        <span class="badge-status ${emp.active ? "badge-active" : "badge-inactive"}">
                            ${emp.active ? "Active" : "Inactive"}
                        </span>
                    </td>

                    <td>
                        <a href="employees.html" class="btn-icon">
                            <i class="bi bi-eye"></i>
                        </a>
                    </td>
                </tr>
            `;

        });

    } catch (error) {

        console.error("Recent Employee Error:", error);

    }

}

let departmentChart = null;

async function loadDepartmentChart() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/department-summary",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const departments = await response.json();

        const labels = departments.map(d => d.departmentName);
        const values = departments.map(d => d.totalEmployees);

        const colors = [
            "#2563EB",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#8B5CF6",
            "#06B6D4",
            "#EC4899",
            "#84CC16"
        ];

        const ctx = document
            .getElementById("deptDonutChart")
            .getContext("2d");

        if (departmentChart) {
            departmentChart.destroy();
        }

        departmentChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: colors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "65%",
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        // Summary
        const summary =
            document.getElementById("departmentSummary");

        summary.innerHTML = "";

        departments.forEach((d, index) => {

            summary.innerHTML += `
                <div class="donut-row">

                    <span class="label">

                        <span class="dot"
                              style="background:${colors[index]}"></span>

                        ${d.departmentName}

                    </span>

                    <span class="value">

                        ${d.totalEmployees}

                    </span>

                </div>
            `;

        });

    }
    catch (err) {

        console.error(err);

    }

}





let attendanceChart = null;

async function loadAttendanceChart() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/attendance-summary",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load attendance");
        }

        const data = await response.json();

        document.getElementById("avgAttendance").textContent =
            data.attendanceRate + "%";

        document.getElementById("absentRate").textContent =
            data.absentRate + "%";

        document.getElementById("leaveRate").textContent =
            data.leaveRate + "%";

        const ctx = document
            .getElementById("attendanceChart")
            .getContext("2d");

        if (attendanceChart) {
            attendanceChart.destroy();
        }

        attendanceChart = new Chart(ctx, {

            type: "doughnut",

            data: {

                labels: [
                    "Present",
                    "Absent",
                    "On Leave"
                ],

                datasets: [{
                    data: [
                        data.present,
                        data.absent,
                        data.onLeave
                    ],
                    backgroundColor: [
                        "#10B981",
                        "#EF4444",
                        "#8B5CF6"
                    ]
                }]

            },

            options: {

                responsive: true,
                maintainAspectRatio: false,

                cutout: "65%",

                plugins: {
                    legend: {
                        display: false
                    }
                }

            }

        });

    }
    catch (e) {

        console.error(e);

    }

}



let headcountChart=null;

async function loadHeadcountChart() {

    const token = localStorage.getItem("token");

    const response = await fetch(
        "http://localhost:8080/api/dashboard/headcount",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    const data = await response.json();

    document.getElementById("totalHires").textContent =
        data.totalHires;

    document.getElementById("totalDepartures").textContent =
        data.totalInactive;

    document.getElementById("netGrowth").textContent =
        data.netGrowth;

    const ctx = document
        .getElementById("headcountChart")
        .getContext("2d");

    if (headcountChart) {
        headcountChart.destroy();
    }

    headcountChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: [
                "Hires",
                "Departures",
                "Net Growth"
            ],
            datasets: [{
                data: [
                    data.totalHires,
                    data.totalInactive,
                    data.netGrowth
                ],
                backgroundColor: [
                    "#2563EB",
                    "#EF4444",
                    "#10B981"
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        precision: 0
                    }
                }
            }
        }
    });

}

async function loadRecentActivities() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/activities",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const activities = await response.json();

        const feed = document.getElementById("activityFeed");

        feed.innerHTML = "";

        activities.forEach(a => {

            feed.innerHTML += `
                <div class="activity-item">

                    <div class="activity-icon">
                        <i class="bi bi-person-check"></i>
                    </div>

                    <div class="activity-content">
                        <div class="activity-title">${a.title}</div>
                        <div class="activity-desc">${a.description}</div>
                        <small>${a.time}</small>
                    </div>

                </div>
            `;

        });

    }
    catch(e){

        console.error(e);

    }

}

async function loadNotifications() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/notifications",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) {
            throw new Error("Failed to load notifications");
        }

        const notifications = await response.json();

        const list = document.getElementById("notificationList");
        const badge = document.getElementById("notifCount");
        const dot = document.getElementById("notifBadgeDot");

        list.innerHTML = "";

        if (notifications.length === 0) {

            list.innerHTML = `
                <div class="p-3 text-center text-muted">
                    No notifications
                </div>
            `;

            badge.textContent = "0 new";
            dot.style.display = "none";
            return;
        }

        badge.textContent = notifications.length + " new";
        dot.style.display = "block";

        notifications.forEach(n => {

            list.innerHTML += `
                <div class="notif-item">

                    <div class="notif-icon">
                        <i class="bi bi-bell-fill"></i>
                    </div>

                    <div class="notif-content">
                        <strong>${n.title}</strong>
                        <div>${n.description}</div>
                        <small class="text-muted">${n.time}</small>
                    </div>

                </div>
            `;
        });

    } catch (err) {

        console.error("Notification Error:", err);

    }

}
async function loadUpcomingEvents() {

    const token = localStorage.getItem("token");

    const response = await fetch(
        "http://localhost:8080/api/dashboard/events",
        {
            headers: {
                Authorization: "Bearer " + token
            }
        });

    const events = await response.json();

    const container = document.getElementById("upcomingEvents");

    container.innerHTML = "";

    events.forEach(e => {

        container.innerHTML += `
            <div class="cal-event-item">

                <div class="cal-event-dot"></div>

                <div>
                    <div class="cal-event-title">${e.title}</div>
                    <div class="cal-event-date">${e.description}</div>
                    <small>${e.time}</small>
                </div>

            </div>
        `;

    });

}

async function loadCalendarEvents() {

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "http://localhost:8080/api/dashboard/events",
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        const events = await response.json();

        const container = document.getElementById("calendarEvents");

        container.innerHTML = "";

        if (events.length === 0) {

            container.innerHTML =
                "<p style='padding:20px'>No upcoming events</p>";

            return;
        }

        events.forEach(e => {

            container.innerHTML += `
                <div class="cal-event-item">

                    <div class="cal-event-dot"></div>

                    <div>

                        <div class="cal-event-title">
                            ${e.title}
                        </div>

                        <div class="cal-event-date">
                            ${e.description}
                        </div>

                        <small>${e.time}</small>

                    </div>

                </div>
            `;

        });

    }
    catch(err){

        console.error(err);

    }

}

document.addEventListener("DOMContentLoaded", () => {

    loadUserProfile();

    const user = getCurrentUser();

    if (!user) return;

    loadDashboardStats();
    loadRecentEmployees();
    loadDepartmentChart();
    loadHeadcountChart();
    loadAttendanceChart();
    loadRecentActivities();
    loadNotifications();
    loadUpcomingEvents();
    loadCalendarEvents();

});
