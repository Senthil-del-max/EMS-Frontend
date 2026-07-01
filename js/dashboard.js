/**
 * dashboard.js
 * Handles: sidebar toggle, notifications, profile dropdown,
 * Chart.js charts, mini-calendar, activity feed, auth guard.
 */

'use strict';
const user = JSON.parse(localStorage.getItem("user"));


document.addEventListener("DOMContentLoaded", () => {

    applyRolePermissions();

});
/* ════════════════════════════════════════════
   0. AUTH GUARD
   ════════════════════════════════════════════ */
//(function authGuard() {
  //const loggedIn = sessionStorage.getItem('ems_logged_in');
  //if (!loggedIn) {
    //window.location.href = 'login.html';
  //}
   //Hydrate user info
  /* ════════════════════════════════════════════
     0. AUTH GUARD
  ════════════════════════════════════════════ */


const adminSection = document.getElementById("adminSection");
const employeeSection = document.getElementById("employeeSection");

if (adminSection && employeeSection && user) {

    if (user.role === "EMPLOYEE") {
        adminSection.style.display = "none";
        employeeSection.style.display = "block";
    } else {
        adminSection.style.display = "block";
        employeeSection.style.display = "none";
    }
}
  document.addEventListener("DOMContentLoaded", () => {



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
          .map(word => word[0])
          .join("")
          .substring(0, 2)
          .toUpperCase();

      document.querySelectorAll("[data-user-initials]").forEach(el => {
          el.textContent = initials;
      });

      applyRolePermissions(user.role);

  });

  document.addEventListener("DOMContentLoaded", () => {

      loadDashboardStats();

      //loadEmployeeDashboard();

  });

  /* ════════════════════════════════════════════
     ROLE PERMISSIONS
  ════════════════════════════════════════════ */



  function showMenu(id) {

      document.getElementById(id)?.classList.remove("d-none");

  }



/* ════════════════════════════════════════════
   1. SIDEBAR TOGGLE
   ════════════════════════════════════════════ */
const sidebar        = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const sidebarToggle  = document.getElementById('sidebarToggle');

sidebarToggle?.addEventListener('click', () => toggleSidebar());
sidebarOverlay?.addEventListener('click', () => closeSidebar());

function toggleSidebar() {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('show');
}
function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('show');
}

// Auto-close sidebar when a nav link is clicked on mobile
document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    if (window.innerWidth < 992) closeSidebar();
  });
});

/* ════════════════════════════════════════════
   2. LOGOUT
   ════════════════════════════════════════════ */
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
  e.preventDefault();
  if (confirm('Are you sure you want to sign out?')) {
    sessionStorage.clear();
    window.location.href = 'login.html';
  }
});

/* ════════════════════════════════════════════
   3. GREETING
   ════════════════════════════════════════════ */
(function setGreeting() {
  const hour = new Date().getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  if (hour >= 17) greeting = 'Good evening';
  const el = document.getElementById('greetingText');
  if (el) el.textContent = greeting;
})();

/* ════════════════════════════════════════════
   4. ANIMATED STAT COUNTERS
   ════════════════════════════════════════════ */
function animateCounter(el, target, duration = 900) {
  const start = performance.now();
  const isFloat = String(target).includes('.');

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const value = eased * target;
    el.textContent = isFloat ? value.toFixed(1) : Math.floor(value).toLocaleString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
  }
  requestAnimationFrame(step);
}

// Kick off after small delay for visual effect
setTimeout(() => {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    animateCounter(el, target);
  });
}, 300);

/* ════════════════════════════════════════════
   5. CHART.JS — HEADCOUNT TREND (BAR + LINE)
   ════════════════════════════════════════════ */
(function headcountChart() {
  const ctx = document.getElementById('headcountChart')?.getContext('2d');
  if (!ctx) return;

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const joined = [12, 8, 15, 10, 18, 22, 14, 9, 16, 20, 11, 17];
  const left   = [3,  2,  5,  4,  6,  3,  7,  2,  4,  5,  3,  6];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'New Hires',
          data: joined,
          backgroundColor: 'rgba(37,99,235,.75)',
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: 'Departures',
          data: left,
          backgroundColor: 'rgba(239,68,68,.6)',
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: 'Poppins', size: 11 },
          bodyFont: { family: 'Poppins', size: 11 },
          padding: 10,
          cornerRadius: 8,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Poppins', size: 10 }, color: '#94A3B8' },
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: { font: { family: 'Poppins', size: 10 }, color: '#94A3B8', stepSize: 5 },
          beginAtZero: true,
        },
      },
    },
  });
})();

/* ════════════════════════════════════════════
   6. CHART.JS — ATTENDANCE OVERVIEW (LINE)
   ════════════════════════════════════════════ */
(function attendanceChart() {
  const ctx = document.getElementById('attendanceChart')?.getContext('2d');
  if (!ctx) return;

  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const present = [218, 224, 220, 215, 210, 98, 12];
  const absent  = [14,  8,   12,  17,  22,  34,  4];
  const leave   = [10,  10,  10,  10,  10,  10,  0];

  // Gradient helper
  function makeGradient(ctx, color) {
    const g = ctx.createLinearGradient(0, 0, 0, 200);
    g.addColorStop(0, color.replace('1)', '.18)'));
    g.addColorStop(1, color.replace('1)', '0)'));
    return g;
  }

  new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Present',
          data: present,
          borderColor: '#10B981',
          backgroundColor: makeGradient(ctx, 'rgba(16,185,129,1)'),
          fill: true,
          tension: .4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10B981',
          borderWidth: 2,
        },
        {
          label: 'Absent',
          data: absent,
          borderColor: '#EF4444',
          backgroundColor: makeGradient(ctx, 'rgba(239,68,68,1)'),
          fill: true,
          tension: .4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#EF4444',
          borderWidth: 2,
        },
        {
          label: 'On Leave',
          data: leave,
          borderColor: '#8B5CF6',
          backgroundColor: makeGradient(ctx, 'rgba(139,92,246,1)'),
          fill: true,
          tension: .4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#8B5CF6',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: 'Poppins', size: 11 },
          bodyFont: { family: 'Poppins', size: 11 },
          padding: 10,
          cornerRadius: 8,
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: 'Poppins', size: 10 }, color: '#94A3B8' },
        },
        y: {
          grid: { color: '#F1F5F9' },
          ticks: { font: { family: 'Poppins', size: 10 }, color: '#94A3B8' },
          beginAtZero: true,
        },
      },
    },
  });
})();

/* ════════════════════════════════════════════
   7. CHART.JS — DEPARTMENT DONUT
   ════════════════════════════════════════════ */
(function deptDonut() {
  const ctx = document.getElementById('deptDonutChart')?.getContext('2d');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'],
      datasets: [{
        data: [87, 42, 65, 28, 34, 56],
        backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'],
        borderWidth: 0,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1E293B',
          titleFont: { family: 'Poppins', size: 11 },
          bodyFont: { family: 'Poppins', size: 11 },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.raw} employees`,
          },
        },
      },
    },
  });
})();

/* ════════════════════════════════════════════
   8. MINI CALENDAR WIDGET
   ════════════════════════════════════════════ */
(function miniCalendar() {
  const daysGrid    = document.getElementById('calDays');
  const monthLabel  = document.getElementById('calMonthLabel');
  const prevBtn     = document.getElementById('calPrev');
  const nextBtn     = document.getElementById('calNext');
  if (!daysGrid) return;

  // Days with events (day numbers of current month)
  const eventDays = new Set([3, 8, 12, 15, 19, 22, 27]);

  const today   = new Date();
  let viewYear  = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-based

  const MONTH_NAMES = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

  function render() {
    monthLabel.textContent = `${MONTH_NAMES[viewMonth]} ${viewYear}`;
    daysGrid.innerHTML = '';

    const firstDay  = new Date(viewYear, viewMonth, 1).getDay();  // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrev  = new Date(viewYear, viewMonth, 0).getDate();

    // Trailing days from previous month
    for (let i = firstDay - 1; i >= 0; i--) {
      daysGrid.appendChild(makeDay(daysInPrev - i, true, false));
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = (
        d === today.getDate() &&
        viewMonth === today.getMonth() &&
        viewYear  === today.getFullYear()
      );
      daysGrid.appendChild(makeDay(d, false, isToday, eventDays.has(d)));
    }

    // Leading days from next month to fill 6-row grid
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    let nextDay = 1;
    for (let i = firstDay + daysInMonth; i < totalCells; i++) {
      daysGrid.appendChild(makeDay(nextDay++, true, false));
    }
  }

  function makeDay(num, otherMonth, isToday, hasEvent = false) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (otherMonth) el.classList.add('other-month');
    if (isToday)    el.classList.add('today');
    if (hasEvent)   el.classList.add('has-event');
    el.textContent = num;
    el.addEventListener('click', () => {
      document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
      el.classList.add('selected');
    });
    return el;
  }

  prevBtn.addEventListener('click', () => {
    viewMonth--;
    if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    render();
  });
  nextBtn.addEventListener('click', () => {
    viewMonth++;
    if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    render();
  });

  render();
})();

/* ════════════════════════════════════════════
   9. NOTIFICATIONS — mark all read
   ════════════════════════════════════════════ */
document.getElementById('markAllRead')?.addEventListener('click', () => {
  document.querySelectorAll('.notif-item.unread').forEach(item => {
    item.classList.remove('unread');
  });
  const badge = document.getElementById('notifBadgeDot');
  if (badge) badge.style.display = 'none';
});

/* ════════════════════════════════════════════
   10. PERIOD TAB SWITCHES (headcount chart)
   ════════════════════════════════════════════ */
document.querySelectorAll('.period-tabs button').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.period-tabs').querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // In a real app, this would reload chart data for the period
  });
});

/* ════════════════════════════════════════════
   11. SEARCH BAR — live filter recent table
   ════════════════════════════════════════════ */
const globalSearch = document.getElementById('globalSearch');
globalSearch?.addEventListener('input', function () {
  const q = this.value.toLowerCase();
  document.querySelectorAll('#recentEmpTable tbody tr').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(q) ? '' : 'none';
  });
});

/* ════════════════════════════════════════════
   12. TOAST UTILITY (exported for all pages)
   ════════════════════════════════════════════ */
window.showToast = function (message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill',
                  warning: 'bi-exclamation-triangle-fill', info: 'bi-info-circle-fill' };

  const toast = document.createElement('div');
  toast.className = `toast-ems ${type}`;
  toast.innerHTML = `
    <i class="bi ${icons[type] || icons.info}"></i>
    <span>${message}</span>
    <button class="toast-close" aria-label="Close">&times;</button>
  `;

  container.appendChild(toast);
  toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));

  setTimeout(() => removeToast(toast), 4000);
};

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(20px)';
  toast.style.transition = 'opacity .25s, transform .25s';
  setTimeout(() => toast.remove(), 250);
}

document.getElementById("logoutBtn")?.addEventListener("click", function (e) {

    e.preventDefault();

    if (confirm("Logout?")) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.clear();

        window.location.href = "login.html";
    }

});


if (user) {
    applyRolePermissions(user.role);
}
const brandTagline = document.getElementById("brandTagline");

if (brandTagline) {
    brandTagline.textContent =
        user.role === "ADMIN" ? "Admin Panel" : "Employee Panel";
}



    document.addEventListener("DOMContentLoaded", () => {

                loadDashboardStats();

               // loadEmployeeDashboard();


});



if (user && user.role === "EMPLOYEE") {

    document.getElementById("adminSection")?.style.setProperty("display", "none");
    document.getElementById("employeeSection")?.style.setProperty("display", "block");

} else {

    document.getElementById("adminSection")?.style.setProperty("display", "block");
    document.getElementById("employeeSection")?.style.setProperty("display", "none");

}