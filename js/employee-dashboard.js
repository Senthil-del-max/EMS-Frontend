async function loadEmployeeDashboard() {



    if (!user || user.role !== "EMPLOYEE") return;

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://employee-management-system-jt3h.onrender.com/api/dashboard/employee?email=${user.email}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok)
            throw new Error("Failed to load dashboard");

        const data = await response.json();

        document.getElementById("myAttendance").textContent =
            data.attendancePercentage.toFixed(1) + "%";

        document.getElementById("myLeaveBalance").textContent =
            data.leaveBalance;

        document.getElementById("myPendingLeaves").textContent =
            data.pendingLeaves;

        document.getElementById("mySalary").textContent =
            "₹" + data.latestSalary;

        document.getElementById("empDepartment").textContent =
            data.department;

        document.getElementById("empDesignation").textContent =
            data.designation;

        });

    } catch (err) {

        console.error(err);

    }

  document.addEventListener("DOMContentLoaded", () => {

        const user = getCurrentUser();

        if (!user) return;

        if (user.role === "EMPLOYEE") {
            loadEmployeeDashboard();
        }

    });