/**
 * leaves.js — Leave Management
 * Handles: leave requests table, status tabs, approve/reject,
 * search/filter/sort, pagination, charts, multi-format export.
 *
 * API-ready: swap EMS.fakeApi() calls with fetch('/api/leaves')
 */

'use strict';
const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";

const user = JSON.parse(localStorage.getItem("user"));

if (user.role !== "ADMIN") {

    alert("Access Denied");

    window.location.href = "dashboard.html";

}


(function () {

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
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

})();

/* ════════════════════════════════════════════
   DUMMY DATA
   Replace with: fetch('/api/leave-requests')
════════════════════════════════════════════ */
const LEAVE_TYPES = {
  Annual:    { icon: 'bi-umbrella-fill',       bg: '#EFF6FF', color: '#2563EB', label: 'Annual Leave'    },
  Sick:      { icon: 'bi-heart-pulse-fill',    bg: '#FEF2F2', color: '#DC2626', label: 'Sick Leave'      },
  Casual:    { icon: 'bi-sun-fill',            bg: '#FFFBEB', color: '#D97706', label: 'Casual Leave'    },
  Maternity: { icon: 'bi-gender-female',       bg: '#F5F3FF', color: '#7C3AED', label: 'Maternity Leave' },
  Paternity: { icon: 'bi-gender-male',         bg: '#ECFEFF', color: '#0891B2', label: 'Paternity Leave' },
  Emergency: { icon: 'bi-exclamation-triangle-fill', bg: '#FEF2F2', color: '#DC2626', label: 'Emergency Leave' },
  Unpaid:    { icon: 'bi-wallet2',             bg: '#F1F5F9', color: '#64748B', label: 'Unpaid Leave'    },
};

const AVATAR_COLORS = [
  { bg: '#EFF6FF', c: '#2563EB' }, { bg: '#ECFDF5', c: '#059669' },
  { bg: '#FFFBEB', c: '#D97706' }, { bg: '#F5F3FF', c: '#7C3AED' },
  { bg: '#FEF2F2', c: '#DC2626' }, { bg: '#ECFEFF', c: '#0891B2' },
];
function aC(idx) { return AVATAR_COLORS[idx % AVATAR_COLORS.length]; }

const LEAVE_API = `${API_BASE_URL}/api/leaves`;
const EMPLOYEE_API = `${API_BASE_URL}/api/employees`;

let leaveRequests = [];
let EMPLOYEES_REF = [];
let editingLeaveId = null;

function debounce(func, delay) {

    let timer;

    return function (...args) {

        clearTimeout(timer);

        timer = setTimeout(() => {

            func.apply(this, args);

        }, delay);

    };

}

async function loadLeaves() {

    try {

        const response = await fetch(LEAVE_API);

        const data = await response.json();

        leaveRequests = data.map(l => ({

            id: l.id,

            empId: l.employeeId,

            name: l.employeeName,

            dept: l.departmentName,

            type: l.leaveType,

            from: l.startDate,

            to: l.endDate,

            days: l.totalDays,

            reason: l.reason,

            status: l.status,

            appliedOn: l.createdAt
                ? l.createdAt.substring(0,10)
                : "",

            approvedBy: l.approvedBy || "-"

        }));

        updateSummaryCards();

        applyFilters();

        updateCharts();
        console.log(leaveRequests);
    }

    catch(e){

        console.error(e);

    }

}

/* ════════════════════════════════════════════
   STATE
════════════════════════════════════════════ */
const PAGE_SIZE    = 8;
let currentPage    = 1;
let activeTab      = 'all';   // 'all' | 'Pending' | 'Approved' | 'Rejected'
let filtered       = [];
let viewingLeaveId = null;

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
function statusBadge(s) {
  const map = {
    Pending:  'badge-pending',
    Approved: 'badge-approved',
    Rejected: 'badge-rejected',
  };
  return `<span class="badge-status ${map[s] || 'badge-inactive'}">${s}</span>`;
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function empColor(empId) {

    return aC(Number(empId) || 0);

}

function formatDate(date) {

    return new Date(date).toLocaleDateString("en-GB");

}

function formatDateRange(from, to) {

    const f = formatDate(from);
    const t = formatDate(to);

    return from === to ? f : `${f} - ${t}`;

}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/* ════════════════════════════════════════════
   SUMMARY CARDS
════════════════════════════════════════════ */
function updateSummaryCards() {
  const all      = leaveRequests.length;
  const pending  = leaveRequests.filter(r => r.status === 'Pending').length;
  const approved = leaveRequests.filter(r => r.status === 'Approved').length;
  const rejected = leaveRequests.filter(r => r.status === 'Rejected').length;
  const balance  = 18; // static demo

  document.getElementById('scTotal').textContent    = all;
  document.getElementById('scPending').textContent  = pending;
  document.getElementById('scApproved').textContent = approved;
  document.getElementById('scRejected').textContent = rejected;
  document.getElementById('scBalance').textContent  = balance;

  // Update tab counts
  document.getElementById('tabCountAll').textContent      = all;
  document.getElementById('tabCountPending').textContent  = pending;
  document.getElementById('tabCountApproved').textContent = approved;
  document.getElementById('tabCountRejected').textContent = rejected;
}

/* ════════════════════════════════════════════
   STATUS TABS
════════════════════════════════════════════ */
document.querySelectorAll('.status-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    activeTab = tab.dataset.tab;
    currentPage = 1;
    applyFilters();
  });
});

/* ════════════════════════════════════════════
   FILTER / SEARCH / SORT
════════════════════════════════════════════ */
function applyFilters() {
  const q    = (document.getElementById('leaveSearch').value || '').toLowerCase().trim();
  const type = document.getElementById('leaveTypeFilter').value;
  const dept = document.getElementById('leaveDeptFilter').value;
  const sort = document.getElementById('leaveSortSelect').value;



  filtered = leaveRequests.filter(r => {
    const mTab  = activeTab === 'all' || r.status === activeTab;
   const mQ =
       !q ||
       r.name.toLowerCase().includes(q) ||
       String(r.id).includes(q) ||
       r.dept.toLowerCase().includes(q);
    const mType = !type || r.type === type;
    const mDept = !dept || r.dept === dept;
    return mTab && mQ && mType && mDept;
  });
     console.log(leaveRequests);
     console.log(filtered);
  if (sort === 'date-desc') filtered.sort((a, b) => b.appliedOn.localeCompare(a.appliedOn));
  if (sort === 'date-asc')  filtered.sort((a, b) => a.appliedOn.localeCompare(b.appliedOn));
  if (sort === 'days-desc') filtered.sort((a, b) => b.days - a.days);
  if (sort === 'days-asc')  filtered.sort((a, b) => a.days - b.days);
  if (sort === 'name-asc')  filtered.sort((a, b) => a.name.localeCompare(b.name));

  currentPage = 1;
  renderTable();
  updateStatsBar();
}

function updateStatsBar() {
  document.getElementById('leaveStatShowing').textContent  = filtered.length;
  document.getElementById('leaveStatPending').textContent  = filtered.filter(r => r.status === 'Pending').length;
  document.getElementById('leaveStatApproved').textContent = filtered.filter(r => r.status === 'Approved').length;
}

/* Wire up filters */

document.getElementById('leaveTypeFilter').addEventListener('change', applyFilters);
document.getElementById('leaveDeptFilter').addEventListener('change', applyFilters);
document.getElementById('leaveSortSelect').addEventListener('change', applyFilters);
document.getElementById('leaveSearch').addEventListener(
    'input',
    debounce(applyFilters, 250)
);

document.getElementById('globalSearch').addEventListener(
    'input',
    debounce(function () {
        document.getElementById('leaveSearch').value = this.value;
        applyFilters();
    }, 300)
);

document.getElementById('btnResetLeave').addEventListener('click', () => {
  document.getElementById('leaveSearch').value    = '';
  document.getElementById('globalSearch').value   = '';
  document.getElementById('leaveTypeFilter').value = '';
  document.getElementById('leaveDeptFilter').value = '';
  document.getElementById('leaveSortSelect').value = 'date-desc';
  activeTab = 'all';
  document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.status-tab[data-tab="all"]').classList.add('active');
  applyFilters();
});

/* ════════════════════════════════════════════
   RENDER TABLE
════════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById('leaveTbody');
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9">
          <div class="tbl-empty">
            <i class="bi bi-calendar-x"></i>
            <h6>No leave requests found</h6>
            <p>Try adjusting the filters or search term.</p>
            <button class="btn-primary-ems" onclick="document.getElementById('btnResetLeave').click()">
              <i class="bi bi-arrow-counterclockwise"></i> Reset Filters
            </button>
          </div>
        </td>
      </tr>`;
    updatePageMeta(0, 0, 0);
    renderPagination();
    return;
  }

  tbody.innerHTML = slice.map(r => {
    const lt   = LEAVE_TYPES[r.type] || LEAVE_TYPES.Annual;
    const col  = empColor(r.empId);
    const ini  = initials(r.name);

    /* Approve / Reject buttons only for Pending */
    const actionBtns = r.status === 'Pending'
      ? `<button class="leave-action-approve" onclick="quickApprove('${r.id}')">
           <i class="bi bi-check-lg"></i> Approve
         </button>
         <button class="leave-action-reject ms-1" onclick="quickReject('${r.id}')">
           <i class="bi bi-x-lg"></i> Reject
         </button>`
      : `<div class="action-btns">
           <button class="btn-icon" title="View" onclick="openLeaveDetail('${r.id}')">
             <i class="bi bi-eye"></i>
           </button>
         </div>`;

    return `
      <tr data-id="${r.id}">
        <td>
          <span style="font-size:11px;font-weight:600;color:var(--secondary);
                       background:var(--light);padding:3px 8px;border-radius:4px;">
            ${r.id}
          </span>
        </td>

        <td>
          <div class="emp-cell">
            <div class="emp-avatar" style="background:${col.bg};color:${col.c};">${ini}</div>
            <div>
              <div class="emp-name">${r.name}</div>
              <div class="emp-id">${r.empId}</div>
            </div>
          </div>
        </td>

        <td>
          <span class="tag tag-gray">
            <i class="bi bi-diagram-3" style="font-size:11px;"></i> ${r.dept}
          </span>
        </td>

        <td>
          <div class="leave-type-cell">
            <div class="leave-type-icon"
                 style="background:${lt.bg};color:${lt.color};">
              <i class="bi ${lt.icon}"></i>
            </div>
            <span style="font-size:12.5px;font-weight:500;color:var(--dark);">
              ${lt.label}
            </span>
          </div>
        </td>

        <td>
          <div style="font-size:12.5px;font-weight:500;color:var(--dark);">
            ${formatDateRange(r.from, r.to)}
          </div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">
            Applied: ${formatDate(r.appliedOn)}
          </div>
        </td>

        <td>
          <span class="days-badge">
            <i class="bi bi-calendar3"></i> ${r.days} day${r.days > 1 ? 's' : ''}
          </span>
        </td>

        <td>${statusBadge(r.status)}</td>

        <td>
          <button class="btn-icon" title="View details"
                  onclick="openLeaveDetail('${r.id}')">
            <i class="bi bi-eye"></i>
          </button>
        </td>

        <td>
          <div style="display:flex;gap:5px;align-items:center;">
            ${actionBtns}
          </div>
        </td>
      </tr>`;
  }).join('');

  const end = Math.min(start + PAGE_SIZE, filtered.length);
  updatePageMeta(start + 1, end, filtered.length);
  renderPagination();
}

function updatePageMeta(from, to, total) {
  document.getElementById('leavePageInfo').textContent  = total ? `${from}–${to}` : '0';
  document.getElementById('leaveTotalInfo').textContent = total;
}

/* ════════════════════════════════════════════
   PAGINATION
════════════════════════════════════════════ */
function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const c     = document.getElementById('leavePagination');
  if (total <= 1) { c.innerHTML = ''; return; }

  let h = `<button class="page-btn" onclick="goLeavePage(${currentPage - 1})"
             ${currentPage === 1 ? 'disabled' : ''}>
             <i class="bi bi-chevron-left"></i>
           </button>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - currentPage) <= 1) {
      h += `<button class="page-btn ${i === currentPage ? 'active' : ''}"
               onclick="goLeavePage(${i})">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      h += `<span style="padding:0 4px;color:var(--text-muted);">…</span>`;
    }
  }

  h += `<button class="page-btn" onclick="goLeavePage(${currentPage + 1})"
          ${currentPage === total ? 'disabled' : ''}>
          <i class="bi bi-chevron-right"></i>
        </button>`;

  c.innerHTML = h;
}

window.goLeavePage = p => {
  const max = Math.ceil(filtered.length / PAGE_SIZE);
  if (p < 1 || p > max) return;
  currentPage = p;
  renderTable();
};

/* ════════════════════════════════════════════
   QUICK APPROVE / REJECT (inline in table)
════════════════════════════════════════════ */
window.quickApprove = async (id) => {

    if (!confirm("Approve this leave request?")) return;

    try {

        const response = await fetch(`${LEAVE_API}/${id}/approve`, {
            method: "PUT"
        });

        if (!response.ok) {
            throw new Error("Failed to approve");
        }

        await loadLeaves();

        alert("Leave Approved Successfully", "success");

    } catch (e) {

        console.error(e);

        alert("Unable to approve leave");

    }

};

window.quickReject = async (id) => {

    if (!confirm("Reject this leave request?")) return;

    try {

        const response = await fetch(`${LEAVE_API}/${id}/reject`, {
            method: "PUT"
        });

        if (!response.ok) {
            throw new Error("Failed to reject");
        }

        await loadLeaves();

        alert("Leave Rejected Successfully", "danger");

    } catch (e) {

        console.error(e);

        alert("Unable to reject leave");

    }

};
/* ════════════════════════════════════════════
   DETAIL MODAL
════════════════════════════════════════════ */
window.openLeaveDetail = id => {
  const r = leaveRequests.find(x => x.id === id);
  if (!r) return;
  viewingLeaveId = id;

  const col = empColor(r.empId);
  const lt  = LEAVE_TYPES[r.type] || LEAVE_TYPES.Annual;

  document.getElementById('ldAvatar').textContent        = initials(r.name);
  document.getElementById('ldAvatar').style.background   = col.bg;
  document.getElementById('ldAvatar').style.color        = col.c;
  document.getElementById('ldName').textContent          = r.name;
  document.getElementById('ldSub').textContent           = `${r.dept}  ·  ${r.empId}`;
  document.getElementById('ldReqId').textContent         = r.id;
  document.getElementById('ldLeaveType').innerHTML =
    `<span style="display:inline-flex;align-items:center;gap:6px;background:${lt.bg};
       color:${lt.color};padding:3px 10px;border-radius:99px;font-size:12px;font-weight:600;">
       <i class="bi ${lt.icon}"></i>${lt.label}
     </span>`;
  document.getElementById('ldDateRange').textContent     = formatDateRange(r.from, r.to);
  document.getElementById('ldDays').textContent          = `${r.days} day${r.days > 1 ? 's' : ''}`;
  document.getElementById("ldApplied").textContent = formatDate(r.appliedOn);
  document.getElementById('ldApprovedBy').textContent    = r.approvedBy;
  document.getElementById('ldStatus').innerHTML          = statusBadge(r.status);
  document.getElementById('ldReason').textContent        = r.reason || '—';

  /* Show / hide approve/reject buttons */
  const actSection = document.getElementById('ldModalActions');
  if (r.status === 'Pending') {
    actSection.style.display = 'flex';
  } else {
    actSection.style.display = 'none';
  }

  new bootstrap.Modal(document.getElementById("leaveDetailModal")).show();
};

/* Approve from modal */
document.getElementById("btnModalApprove")
.addEventListener("click", async () => {

    if (!viewingLeaveId) return;

    await quickApprove(viewingLeaveId);

    bootstrap.Modal.getInstance(document.getElementById("leaveDetailModal")).hide();

});



/* Reject from modal */
document.getElementById("btnModalReject")
.addEventListener("click", async () => {

    if (!viewingLeaveId) return;

    await quickReject(viewingLeaveId);

    EMS.closeModal("leaveDetailModal");

});



/* ════════════════════════════════════════════
   CHARTS
════════════════════════════════════════════ */
let barChartInstance   = null;
let donutChartInstance = null;

function buildCharts() {
  /* Monthly leave requests bar chart */
  const ctxBar = document.getElementById('leaveBarChart')?.getContext('2d');
  if (ctxBar) {
    barChartInstance = new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Approved',
            data: [8, 6, 9, 7, 11, 8, 12, 14, 10, 9, 7, 8],
            backgroundColor: 'rgba(16,185,129,.75)',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Rejected',
            data: [2, 1, 3, 2, 3, 2, 4, 3, 2, 3, 2, 1],
            backgroundColor: 'rgba(239,68,68,.65)',
            borderRadius: 5,
            borderSkipped: false,
          },
          {
            label: 'Pending',
            data: [1, 2, 1, 3, 2, 5, 3, 2, 1, 2, 3, 2],
            backgroundColor: 'rgba(245,158,11,.65)',
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
          tooltip: { mode: 'index', intersect: false },
        },
        scales: {
          x: {
            stacked: false,
            grid: { display: false },
            ticks: { font: { family: 'Poppins', size: 10 } },
          },
          y: {
            grid: { color: '#F1F5F9' },
            ticks: { font: { family: 'Poppins', size: 10 }, stepSize: 5 },
            beginAtZero: true,
          },
        },
      },
    });
  }

  /* Leave type donut */
  const ctxDonut = document.getElementById('leaveTypeDonut')?.getContext('2d');
  if (ctxDonut) {
    donutChartInstance = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Annual', 'Sick', 'Casual', 'Maternity', 'Emergency', 'Unpaid'],
        datasets: [{
          data: [38, 24, 18, 8, 7, 5],
          backgroundColor: [
            '#2563EB', '#EF4444', '#F59E0B',
            '#8B5CF6', '#DC2626', '#94A3B8',
          ],
          borderWidth: 0,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.raw}%`,
            },
          },
        },
      },
    });
  }
}

function updateCharts() {
  /* Recalculate live stats for the donut */
  if (!donutChartInstance) return;
  const total = leaveRequests.length || 1;
  const byType = Object.keys(LEAVE_TYPES).map(t =>
    Math.round(leaveRequests.filter(r => r.type === t).length / total * 100)
  );
  donutChartInstance.data.datasets[0].data = byType;
  donutChartInstance.update();
}

/* ════════════════════════════════════════════
   PROFESSIONAL EXPORT SYSTEM
════════════════════════════════════════════ */

/** Animate the progress bar */
async function animateProgress(labelText) {
  const wrap = document.getElementById('lemProgressWrap');
  const fill = document.getElementById('lemProgressFill');
  const lbl  = document.getElementById('lemProgressLabel');
  const pct  = document.getElementById('lemProgressPct');

  wrap.classList.add('show');
  lbl.textContent = labelText;

  for (let i = 0; i <= 100; i += 10) {
    fill.style.width = `${i}%`;
    pct.textContent  = `${i}%`;
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 280));
  wrap.classList.remove('show');
  fill.style.width = '0%';
}

/** Build exportable row objects */
function buildExportRows() {
  return filtered.map(r => ({
    'Request ID':   r.id,
    'Employee':     r.name,
    'Emp ID':       r.empId,
    'Department':   r.dept,
    'Leave Type':   LEAVE_TYPES[r.type]?.label || r.type,
    'From':         r.from,
    'To':           r.to,
    'Days':         r.days,
    'Applied On':   r.appliedOn,
    'Status':       r.status,
    'Approved By':  r.approvedBy,
    'Reason':       r.reason,
  }));
}

function closeExportDropdown() {
  const btn = document.getElementById('leaveExportBtn');
  bootstrap.Dropdown.getInstance(btn)?.hide();
}

/* CSV */
document.getElementById('lemCsv').addEventListener('click', async () => {
  if (!filtered.length) { EMS.toast('No records to export.', 'warning'); return; }
  await animateProgress('Preparing CSV file…');
  EMS.exportCSV(buildExportRows(), `leave_requests_${new Date().toISOString().slice(0,10)}.csv`);
  alert("Leave Approved Successfully");
  closeExportDropdown();
});

/* Excel */
document.getElementById('lemExcel').addEventListener('click', async () => {
  if (!filtered.length) { EMS.toast('No records to export.', 'warning'); return; }
  await animateProgress('Building Excel workbook…');

  const rows    = buildExportRows();
  const headers = Object.keys(rows[0]);
  const tsv     = [
    headers.join('\t'),
    ...rows.map(r => headers.map(h => r[h]).join('\t')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + tsv], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `leave_requests_${new Date().toISOString().slice(0,10)}.xls`;
  a.click();
  URL.revokeObjectURL(url);

  alert("Excel file downloaded");
  closeExportDropdown();
});

/* PDF */
document.getElementById('lemPdf').addEventListener('click', async () => {
  if (!filtered.length) { EMS.toast('No records to export.', 'warning'); return; }
  await animateProgress('Generating PDF report…');

  const rows    = buildExportRows();
  const headers = Object.keys(rows[0]);
  const date    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  const tableHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:9.5px;font-family:sans-serif;">
      <thead>
        <tr style="background:#2563EB;color:#fff;-webkit-print-color-adjust:exact;">
          ${headers.map(h => `<th style="padding:7px 8px;text-align:left;font-weight:700;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr style="background:${i % 2 === 0 ? '#fff' : '#F8FAFC'};">
            ${headers.map(h => `<td style="padding:6px 8px;border-bottom:1px solid #E2E8F0;">${row[h]}</td>`).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;

  const win = window.open('', '_blank', 'width=1100,height=750');
  win.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Leave Management Report — EMS Pro</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 28px; color: #1E293B; background: #fff; }
        .hdr { display:flex; justify-content:space-between; align-items:flex-start;
               margin-bottom:22px; padding-bottom:14px; border-bottom:3px solid #2563EB; }
        .logo { font-size:22px; font-weight:800; color:#1E293B; }
        .logo span { color:#2563EB; }
        .hdr-title { font-size:15px; font-weight:700; color:#1E293B; margin-top:4px; }
        .hdr-meta  { text-align:right; font-size:11px; color:#64748B; line-height:1.7; }
        .summary   { display:flex; gap:20px; margin-bottom:20px; }
        .sum-box   { flex:1; padding:12px; border-radius:8px; border:1px solid #E2E8F0; text-align:center; }
        .sum-val   { font-size:22px; font-weight:800; color:#1E293B; }
        .sum-lbl   { font-size:10px; color:#64748B; margin-top:2px; }
        .footer    { margin-top:20px; font-size:10px; color:#94A3B8; text-align:center; padding-top:12px; border-top:1px solid #E2E8F0; }
        .print-btn { margin-top:18px; text-align:center; }
        .print-btn button { background:#2563EB;color:#fff;border:none;padding:10px 28px;
                            border-radius:8px;font-size:13px;cursor:pointer;font-weight:600; }
        @media print { .print-btn { display:none; } }
      </style>
    </head>
    <body>
      <div class="hdr">
        <div>
          <div class="logo">EMS<span>Pro</span></div>
          <div class="hdr-title">Leave Management Report</div>
        </div>
        <div class="hdr-meta">
          <div><strong>Generated:</strong> ${date}</div>
          <div><strong>Total Records:</strong> ${rows.length}</div>
          <div><strong>Exported by:</strong> Admin</div>
        </div>
      </div>

      <div class="summary">
        <div class="sum-box" style="border-color:#FDE68A;">
          <div class="sum-val" style="color:#D97706;">${leaveRequests.filter(r=>r.status==='Pending').length}</div>
          <div class="sum-lbl">Pending</div>
        </div>
        <div class="sum-box" style="border-color:#A7F3D0;">
          <div class="sum-val" style="color:#059669;">${leaveRequests.filter(r=>r.status==='Approved').length}</div>
          <div class="sum-lbl">Approved</div>
        </div>
        <div class="sum-box" style="border-color:#FECACA;">
          <div class="sum-val" style="color:#DC2626;">${leaveRequests.filter(r=>r.status==='Rejected').length}</div>
          <div class="sum-lbl">Rejected</div>
        </div>
        <div class="sum-box" style="border-color:#BFDBFE;">
          <div class="sum-val" style="color:#2563EB;">${leaveRequests.length}</div>
          <div class="sum-lbl">Total</div>
        </div>
      </div>

      ${tableHTML}

      <div class="footer">
        EMS Pro &mdash; Confidential HR Document &mdash; ${date}
      </div>
      <div class="print-btn">
        <button onclick="window.print()">🖨️  Print / Save as PDF</button>
      </div>
    </body>
    </html>`);
  win.document.close();
  setTimeout(() => win.print(), 800);

  EMS.toast('PDF window opened — use Print → Save as PDF', 'info');
  closeExportDropdown();
});

/* Print */
document.getElementById('lemPrint').addEventListener('click', () => {
  window.print();
  closeExportDropdown();
});



/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async () => {

    await loadEmployees();

    await loadLeaves();

    buildCharts();

});

  /* Update export count label when dropdown opens */
  document.getElementById('leaveExportBtn')
    .addEventListener('click', () => {
      const count = document.getElementById('leaveTotalInfo')?.textContent || '0';
      document.getElementById('lemHeaderSub').textContent =
        `${count} records ready to export`;
    });


async function loadEmployees() {

    try {

        const response = await fetch(EMPLOYEE_API);

        EMPLOYEES_REF = await response.json();

        populateEmployeeDropdown();

        populateDepartmentFilter();

    } catch (e) {

        console.error(e);

    }

}

function populateEmployeeDropdown() {

    const select = document.getElementById("leave_employee");

    if (!select) return;

    select.innerHTML = '<option value="">Select Employee</option>';

    EMPLOYEES_REF.forEach(emp => {

        select.innerHTML += `
            <option value="${emp.id}">
                ${emp.fullName}
            </option>
        `;

    });

}

function populateDepartmentFilter() {

    const select = document.getElementById("leaveDeptFilter");

    if (!select) return;

    const departments = [...new Set(
        EMPLOYEES_REF.map(e => e.departmentName)
    )];

    select.innerHTML = `<option value="">All Departments</option>`;

    departments.forEach(dep => {

        select.innerHTML += `
            <option value="${dep}">
                ${dep}
            </option>
        `;

    });

}



if (user.role === "EMPLOYEE") {

    leaveRequests = leaveRequests.filter(
        l => l.employeeId == user.employeeId
    );

}