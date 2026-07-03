/**
 * attendance.js
 * Attendance Management — table view, calendar view, charts,
 * search/filter/sort, pagination, professional multi-format export.
 */
'use strict';

const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";

document.addEventListener("DOMContentLoaded", () => {

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

});

const ATTENDANCE_API = `${API_BASE_URL}/api/attendance`;
const EMPLOYEE_API = `${API_BASE_URL}/api/employees`;

let ALL_RECORDS = [];
let EMPLOYEES_REF = [];
let editingAttendanceId = null;

function calculateHours(checkIn, checkOut) {

    if (!checkIn || !checkOut) return 0;

    const start = new Date(`2000-01-01T${checkIn}`);
    const end = new Date(`2000-01-01T${checkOut}`);

    return ((end - start) / 3600000).toFixed(1);

}

function debounce(func, delay) {
    let timer;

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}
/* ══════════════════════════════════════════════
   DUMMY DATA (30 records)
   Replace arrays with: fetch('/api/attendance')
══════════════════════════════════════════════ */

function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }





/* ══════════════════════════════════════════════
   STATE
══════════════════════════════════════════════ */
const PAGE_SIZE = 10;
let currentPage  = 1;
let filtered     = [];
let currentView  = 'table'; // 'table' | 'calendar'
let detailRecord = null;

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function statusBadge(s) {
  const map = {
    'Present':  'badge-present',
    'Absent':   'badge-absent',
    'Late':     'badge-late',
    'On Leave': 'badge-leave',
    'Weekend':  'badge-inactive',
  };
  return `<span class="badge-status ${map[s]||'badge-inactive'}">${s}</span>`;
}

function hoursCell(h, status) {
  if (!h || status === 'Absent' || status === 'On Leave' || status === 'Weekend')
    return `<span class="working-hours none">—</span>`;
  if (h >= 8) return `<span class="working-hours good"><i class="bi bi-clock-fill"></i>${h}h</span>`;
  return `<span class="working-hours short"><i class="bi bi-clock"></i>${h}h</span>`;
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

/* ══════════════════════════════════════════════
   SUMMARY CARDS
══════════════════════════════════════════════ */
function updateSummaryCards() {
  const todayRec = ALL_RECORDS.filter(r => r.date === todayStr());
  const present  = todayRec.filter(r => r.status === 'Present').length;
  const absent   = todayRec.filter(r => r.status === 'Absent').length;
  const late     = todayRec.filter(r => r.status === 'Late').length;
  const onLeave  = todayRec.filter(r => r.status === 'On Leave').length;
  const total    = EMPLOYEES_REF.length;
  const rate     = total ? Math.round((present + late) / total * 100) : 0;

  const s = { present, absent, late, onLeave, total, rate };
  document.getElementById('statPresent').textContent  = s.present;
  document.getElementById('statAbsent').textContent   = s.absent;
  document.getElementById('statLate').textContent     = s.late;
  document.getElementById('statLeave').textContent    = s.onLeave;
  document.getElementById('statTotal').textContent    = s.total;
  document.getElementById('statRate').textContent     = `${s.rate}%`;
}

/* ══════════════════════════════════════════════
   FILTER
══════════════════════════════════════════════ */
function applyFilters() {
  const q    = (document.getElementById('attSearch').value || '').toLowerCase().trim();
  const dept = document.getElementById('attDeptFilter').value;
  const stat = document.getElementById('attStatusFilter').value;
  const date = document.getElementById('attDateFilter').value;
  const sort = document.getElementById('attSortSelect').value;

  filtered = ALL_RECORDS.filter(r => {

      const matchSearch =
          !q ||
          (r.name ?? "").toLowerCase().includes(q) ||
          String(r.empId ?? "").toLowerCase().includes(q) ||
          (r.dept ?? "").toLowerCase().includes(q) ||
          (r.status ?? "").toLowerCase().includes(q);

      const matchDept =
          !dept || r.dept === dept;

      const matchStatus =
          !stat || r.status === stat;

      const matchDate =
          !date || r.date === date;

      return matchSearch &&
             matchDept &&
             matchStatus &&
             matchDate;

  });

  if (sort === 'date-desc') filtered.sort((a,b) => b.date.localeCompare(a.date));
  if (sort === 'date-asc')  filtered.sort((a,b) => a.date.localeCompare(b.date));
  if (sort === 'name-asc')  filtered.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'name-desc') filtered.sort((a,b) => b.name.localeCompare(a.name));
  if (sort === 'hrs-desc')  filtered.sort((a,b) => b.hours - a.hours);

  currentPage = 1;
  renderTable();
  if (currentView === 'calendar') renderCalendar();
  updateStatsBar();
}

function updateStatsBar() {
  document.getElementById('attStatShowing').textContent = filtered.length;
  document.getElementById('attStatPresent').textContent = filtered.filter(r => r.status === 'Present').length;
  document.getElementById('attStatAbsent').textContent  = filtered.filter(r => r.status === 'Absent').length;
  document.getElementById('attStatLate').textContent    = filtered.filter(r => r.status === 'Late').length;
}

document.getElementById('attSearch').addEventListener(
    'input',
    debounce(applyFilters, 250)
);
document.getElementById('attDeptFilter').addEventListener('change', applyFilters);
document.getElementById('attStatusFilter').addEventListener('change', applyFilters);
document.getElementById('attDateFilter').addEventListener('change', applyFilters);
document.getElementById('attSortSelect').addEventListener('change', applyFilters);
document.getElementById('globalSearch').addEventListener(
    'input',
    debounce(function () {
        document.getElementById('attSearch').value = this.value;
        applyFilters();
    }, 300)
);
document.getElementById('btnResetFilters').addEventListener('click', () => {
  ['attSearch','attDateFilter','globalSearch'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('attDeptFilter').value = '';
  document.getElementById('attStatusFilter').value = '';
  document.getElementById('attSortSelect').value = 'date-desc';
  applyFilters();
});

/* ══════════════════════════════════════════════
   RENDER TABLE
══════════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById('attTbody');
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="tbl-empty">
      <i class="bi bi-calendar-x"></i>
      <h6>No attendance records found</h6>
      <p>Try changing the date or clearing filters.</p>
      <button class="btn-primary-ems" onclick="document.getElementById('btnResetFilters').click()">
        <i class="bi bi-arrow-counterclockwise"></i> Reset Filters
      </button>
    </div></td></tr>`;
    updatePageInfo(0, 0, 0);
    renderPagination();
    return;
  }

  tbody.innerHTML = slice.map(r => `
    <tr>
      <td>
        <div class="emp-cell">
          <div class="emp-avatar" style="background:${r.color.bg};color:${r.color.c};">${r.avatar}</div>
          <div><div class="emp-name">${r.name}</div><div class="emp-id">${r.empId}</div></div>
        </div>
      </td>
      <td><span class="tag tag-gray"><i class="bi bi-diagram-3" style="font-size:11px;"></i> ${r.dept}</span></td>
      <td>
        <div style="font-size:12.5px;font-weight:600;color:var(--dark);">${new Date(r.date).toLocaleDateString("en-GB")}</div>
        <div style="font-size:11px;color:var(--text-muted);">${r.day}</div>
      </td>
      <td><div class="att-time ${r.checkIn === '—' ? 'missing' : ''}">
        ${r.checkIn !== '—' ? '<i class="bi bi-box-arrow-in-right"></i>' : ''}${r.checkIn}
      </div></td>
      <td><div class="att-time ${r.checkOut === '—' ? 'missing' : ''}">
        ${r.checkOut !== '—' ? '<i class="bi bi-box-arrow-right"></i>' : ''}${r.checkOut}
      </div></td>
      <td>${hoursCell(r.hours, r.status)}</td>
      <td>${statusBadge(r.status)}</td>
      <td>
        <div class="action-btns">

            <button class="btn-icon"
                    title="View"
                    onclick="openAttDetail(${r.id})">
                <i class="bi bi-eye"></i>
            </button>

            <button class="btn-icon"
                    title="Edit"
                    onclick="editAttendance(${r.id})">
                <i class="bi bi-pencil"></i>
            </button>

            <button class="btn-icon text-danger"
                    title="Delete"
                    onclick="deleteAttendance(${r.id})">
                <i class="bi bi-trash"></i>
            </button>

        </div>
      </td>
    </tr>`).join('');

  const end = Math.min(start + PAGE_SIZE, filtered.length);
  updatePageInfo(start + 1, end, filtered.length);
  renderPagination();
}

function updatePageInfo(from, to, total) {
  document.getElementById('attPageInfo').textContent  = total ? `${from}–${to}` : '0';
  document.getElementById('attTotalInfo').textContent = total;
}

/* ══════════════════════════════════════════════
   PAGINATION
══════════════════════════════════════════════ */
function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const c     = document.getElementById('attPagination');
  if (total <= 1) { c.innerHTML = ''; return; }
  let h = `<button class="page-btn" onclick="goAttPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
  for (let i=1; i<=total; i++) {
    if (i===1||i===total||Math.abs(i-currentPage)<=1)
      h += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goAttPage(${i})">${i}</button>`;
    else if (Math.abs(i-currentPage)===2)
      h += `<span style="padding:0 4px;color:var(--text-muted);">…</span>`;
  }
  h += `<button class="page-btn" onclick="goAttPage(${currentPage+1})" ${currentPage===total?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
  c.innerHTML = h;
}
window.goAttPage = p => {
  const max = Math.ceil(filtered.length / PAGE_SIZE);
  if (p < 1 || p > max) return;
  currentPage = p; renderTable();
};

/* ══════════════════════════════════════════════
   CALENDAR VIEW
══════════════════════════════════════════════ */
function renderCalendar() {
  const grid  = document.getElementById('calAttGrid');
  const today = new Date();
  const year  = today.getFullYear();
  const month = today.getMonth();

  const firstDay   = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  // Build date→status map for first employee (for demo)
 if (EMPLOYEES_REF.length === 0) return;

 const emp0 = EMPLOYEES_REF[0];
  const recMap = {};
  ALL_RECORDS.filter(r => r.empId === emp0.id).forEach(r => { recMap[r.date] = r.status; });

  let html = '';
  // Trailing prev-month days
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-att-day other-mon"><span class="day-num">${daysInPrev - i}</span></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow     = new Date(year, month, d).getDay();
    const isToday = dateStr === todayStr();
    const status  = recMap[dateStr] || (dow===0||dow===6 ? 'Weekend' : 'absent');
    const cls     = dow===0||dow===6 ? 'weekend' : status.toLowerCase().replace(' ','-');
    const dotColor = {
      Present:'#10B981', Absent:'#EF4444', Late:'#F59E0B',
      'On Leave':'#8B5CF6', Weekend:'#94A3B8'
    }[status] || '#94A3B8';
    html += `<div class="cal-att-day ${cls} ${isToday?'today':''}" title="${dateStr}: ${status}" onclick="showDayDetail('${dateStr}')">
      <span class="day-num">${d}</span>
      ${dow!==0&&dow!==6 ? `<span class="day-dot" style="background:${dotColor};"></span>` : ''}
    </div>`;
  }
  // Leading next-month days
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  for (let i = 1; i <= totalCells - (firstDay + daysInMonth); i++) {
    html += `<div class="cal-att-day other-mon"><span class="day-num">${i}</span></div>`;
  }
  grid.innerHTML = html;

  // Month label
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calMonthLabel').textContent = `${MONTHS[month]} ${year} — ${emp0.name}`;
}

window.showDayDetail = dateStr => {
  const recs = ALL_RECORDS.filter(r => r.date === dateStr && r.status !== 'Weekend');
  if (!recs.length) return;
  openAttDetail(recs[0].id);
};

/* ══════════════════════════════════════════════
   VIEW TOGGLE
══════════════════════════════════════════════ */
document.getElementById('btnTableView').addEventListener('click', () => {
  currentView = 'table';
  document.getElementById('btnTableView').classList.add('active');
  document.getElementById('btnCalView').classList.remove('active');
  document.getElementById('tableListView').classList.remove('hide');
  document.getElementById('calGridView').classList.remove('show');
});
document.getElementById('btnCalView').addEventListener('click', () => {
  currentView = 'calendar';
  document.getElementById('btnCalView').classList.add('active');
  document.getElementById('btnTableView').classList.remove('active');
  document.getElementById('tableListView').classList.add('hide');
  document.getElementById('calGridView').classList.add('show');
  renderCalendar();
});

/* ══════════════════════════════════════════════
   DETAIL MODAL
══════════════════════════════════════════════ */
window.openAttDetail = id => {
  const r = ALL_RECORDS.find(x => x.id === id);
  if (!r) return;
  detailRecord = r;

  document.getElementById('detailEmpAvatar').textContent = r.avatar;
  document.getElementById('detailEmpAvatar').style.background = r.color.bg;
  document.getElementById('detailEmpAvatar').style.color      = r.color.c;
  document.getElementById('detailEmpName').textContent  = r.name;
  document.getElementById('detailEmpSub').textContent =
  `${r.dept} · ${new Date(r.date).toLocaleDateString("en-GB")} (${r.day})`;
  document.getElementById('detailStatus').innerHTML     = statusBadge(r.status);
  document.getElementById('detailCheckIn').textContent  = r.checkIn;
  document.getElementById('detailCheckOut').textContent = r.checkOut;
  document.getElementById('detailHours').textContent    = r.hours ? `${r.hours}h` : '—';
  document.getElementById('detailNote').textContent     = r.note || 'No notes';
  const modal = new bootstrap.Modal(
      document.getElementById("attDetailModal")
  );
  modal.show();
};

/* ══════════════════════════════════════════════
   CHARTS
══════════════════════════════════════════════ */
function buildCharts() {
  // Weekly line chart
  const ctxLine = document.getElementById('attWeekChart')?.getContext('2d');
  if (ctxLine) {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    new Chart(ctxLine, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          { label:'Present', data:[218,224,220,215,210,0,0], borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.1)', fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#10B981', borderWidth:2 },
          { label:'Absent',  data:[14,8,12,17,22,0,0],  borderColor:'#EF4444', backgroundColor:'rgba(239,68,68,.08)', fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#EF4444', borderWidth:2 },
          { label:'Late',    data:[10,10,10,10,10,0,0],  borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,.08)', fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#F59E0B', borderWidth:2 },
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false }, tooltip:{ mode:'index', intersect:false } },
        scales: {
          x:{ grid:{ display:false }, ticks:{ font:{ family:'Poppins', size:10 } } },
          y:{ grid:{ color:'#F1F5F9' }, ticks:{ font:{ family:'Poppins', size:10 } }, beginAtZero:true },
        },
      },
    });
  }

  // Donut chart
  const ctxDonut = document.getElementById('attDonutChart')?.getContext('2d');
  if (ctxDonut) {
    new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: ['Present','Late','Absent','On Leave'],
        datasets: [{ data:[218,10,14,10], backgroundColor:['#10B981','#F59E0B','#EF4444','#8B5CF6'], borderWidth:0, hoverOffset:6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout:'72%',
        plugins: { legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => ` ${ctx.label}: ${ctx.raw}` } } },
      },
    });
  }
}

/* ══════════════════════════════════════════════
   PROFESSIONAL EXPORT SYSTEM
══════════════════════════════════════════════ */

/** Animate the progress bar inside the export dropdown */
async function animateExportProgress(label) {
  const wrap  = document.getElementById('exportProgressWrap');
  const fill  = document.getElementById('exportProgressFill');
  const lbl   = document.getElementById('exportProgressLabel');
  const pct   = document.getElementById('exportProgressPct');

  wrap.classList.add('show');
  lbl.textContent = label;

  // Animate 0→100% in steps
  for (let i = 0; i <= 100; i += 10) {
    fill.style.width = `${i}%`;
    pct.textContent  = `${i}%`;
    await new Promise(r => setTimeout(r, 40));
  }
  await new Promise(r => setTimeout(r, 300));
  wrap.classList.remove('show');
  fill.style.width = '0%';
}

/** Build export rows from filtered data */
function buildExportData() {
  return filtered.map(r => ({
    'Employee ID':  r.empId,
    'Name':         r.name,
    'Department':   r.dept,
    'Date':         r.date,
    'Day':          r.day,
    'Check In':     r.checkIn,
    'Check Out':    r.checkOut,
    'Working Hours':r.hours || 0,
    'Status':       r.status,
    'Notes':        r.note || '',
  }));
}

/* ── CSV ── */
document.getElementById('btnExportCSV').addEventListener('click', async () => {
  if (!filtered.length) { alert("No data to export"); return; }
  await animateExportProgress('Preparing CSV…');
  function exportCSV(data, filename) {

      const headers = Object.keys(data[0]);

      const csv = [
          headers.join(","),
          ...data.map(row =>
              headers.map(h => `"${row[h]}"`).join(",")
          )
      ].join("\n");

      const blob = new Blob([csv], { type: "text/csv" });

      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;

      a.download = filename;

      a.click();

      URL.revokeObjectURL(url);

  }

  exportCSV(buildExportData(), `attendance_${todayStr()}.csv`);
  console.log("CSV exported successfully");
  bootstrap.Dropdown.getInstance(document.getElementById('exportDropdownBtn'))?.hide();
});

/* ── Excel (tab-separated .csv that opens in Excel) ── */
document.getElementById('btnExportExcel').addEventListener('click', async () => {
  if (!filtered.length) {alert("No data to export"); return; }
  await animateExportProgress('Preparing Excel file…');
  const data = buildExportData();
  const headers = Object.keys(data[0]);
  const rows    = data.map(row => headers.map(h => row[h]).join('\t'));
  const content = [headers.join('\t'), ...rows].join('\n');
  const blob    = new Blob(['\uFEFF' + content], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url     = URL.createObjectURL(blob);
  const a       = document.createElement('a');
  a.href = url; a.download = `attendance_${todayStr()}.xls`; a.click();
  URL.revokeObjectURL(url);
  alert('Excel file exported successfully!', 'success');
  bootstrap.Dropdown.getInstance(document.getElementById('exportDropdownBtn'))?.hide();
});

/* ── PDF (print-based) ── */
document.getElementById('btnExportPDF').addEventListener('click', async () => {
  if (!filtered.length) { alert("No data to export"); return; }
  await animateExportProgress('Generating PDF…');
  // Build a print-ready page
  const data    = buildExportData();
  const date    = new Date().toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const headers = Object.keys(data[0]);
  const rows    = data.slice(0, 50); // Limit for PDF

  const tableHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:10px;font-family:sans-serif;">
      <thead>
        <tr style="background:#2563EB;color:#fff;">
          ${headers.map(h => `<th style="padding:6px 8px;text-align:left;font-weight:600;">${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map((row, i) => `
          <tr style="background:${i%2===0?'#fff':'#F8FAFC'};">
            ${headers.map(h => `<td style="padding:5px 8px;border-bottom:1px solid #E2E8F0;">${row[h]}</td>`).join('')}
          </tr>`).join('')}
      </tbody>
    </table>`;

  const win = window.open('', '_blank', 'width=900,height=700');
  win.document.write(`
    <!DOCTYPE html><html><head>
    <title>Attendance Report — EMS Pro</title>
    <style>
      body { font-family: 'Segoe UI', sans-serif; padding: 24px; color: #1E293B; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; padding-bottom:14px; border-bottom:3px solid #2563EB; }
      .logo   { font-size:20px; font-weight:800; } .logo span { color:#2563EB; }
      .meta   { text-align:right; font-size:11px; color:#64748B; }
      h2      { font-size:16px; font-weight:700; margin-bottom:4px; }
      .footer { margin-top:20px; font-size:10px; color:#94A3B8; text-align:center; }
      @media print { button { display:none; } }
    </style>
    </head><body>
    <div class="header">
      <div><div class="logo">EMS<span>Pro</span></div><h2>Attendance Report</h2><div style="font-size:11px;color:#64748B;">Generated: ${date}</div></div>
      <div class="meta"><div>Total Records: <strong>${rows.length}</strong></div><div>Exported by: Admin</div></div>
    </div>
    ${tableHTML}
    <div class="footer">EMS Pro &mdash; Confidential HR Report &mdash; ${date}</div>
    <div style="margin-top:16px;text-align:center;"><button onclick="window.print()" style="background:#2563EB;color:#fff;border:none;padding:10px 24px;border-radius:6px;font-size:13px;cursor:pointer;">🖨️ Print / Save as PDF</button></div>
    </body></html>`);
  win.document.close();
  setTimeout(() => win.print(), 800);
  alert('PDF window opened — use Print → Save as PDF', 'info');
  bootstrap.Dropdown.getInstance(document.getElementById('exportDropdownBtn'))?.hide();
});

/* ── Print ── */
document.getElementById('btnPrint').addEventListener('click', () => {
  window.print();
  bootstrap.Dropdown.getInstance(document.getElementById('exportDropdownBtn'))?.hide();
});

/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", async () => {

    document.getElementById("attDateFilter").value = todayStr();

    await loadEmployees();

    await loadAttendance();

    buildCharts();

    applyFilters();

    // Animate rate bars
    setTimeout(() => {
        document.querySelectorAll(".att-rate-bar[data-pct]").forEach(bar => {
            bar.style.width = bar.dataset.pct + "%";
        });
    }, 400);

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

async function loadAttendance() {

    try {

        const response = await fetch(ATTENDANCE_API);

        const data = await response.json();

        ALL_RECORDS = data.map((a, index) => ({

            id: a.id,

            empId: a.employeeId,

            name: a.employeeName,

            dept: a.departmentName,

            date: a.attendanceDate,

            day: new Date(a.attendanceDate)
                    .toLocaleDateString("en-US",{weekday:"short"}),

            checkIn: a.checkIn || "—",

            checkOut: a.checkOut || "—",

            hours: calculateHours(a.checkIn, a.checkOut),

            status: a.status,

            note: a.remarks || "",

            avatar: a.employeeName.charAt(0),

            color: {

                bg:"#DBEAFE",

                c:"#2563EB"

            }

        }));

        applyFilters();

        updateSummaryCards();

    }

    catch(e){

        console.error(e);

    }

}

document
.getElementById("btnOpenAttendanceModal")
.addEventListener("click", () => {

    document.getElementById("att_date").value =
        new Date().toISOString().split("T")[0];

    const modal = new bootstrap.Modal(
        document.getElementById("attendanceModal")
    );

    modal.show();

});

function populateEmployeeDropdown() {

    const select = document.getElementById("att_employee");

    select.innerHTML = "";

    EMPLOYEES_REF.forEach(emp => {

        select.innerHTML += `
            <option value="${emp.id}">
                ${emp.fullName}
            </option>
        `;

    });

}

document.getElementById("btnSaveAttendance")
.addEventListener("click", saveAttendance);

async function saveAttendance() {

    const attendance = {

        employeeId: Number(document.getElementById("att_employee").value),

        attendanceDate: document.getElementById("att_date").value,

        checkIn: document.getElementById("att_checkin").value || null,

        checkOut: document.getElementById("att_checkout").value || null,

        status: document.getElementById("att_status").value,

        remarks: document.getElementById("att_remarks").value

    };

    console.log(attendance);

    try {

        const response = await fetch(

            editingAttendanceId
                ? `${ATTENDANCE_API}/${editingAttendanceId}`
                : ATTENDANCE_API,

            {

                method: editingAttendanceId ? "PUT" : "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(attendance)

            }

        );

        if (!response.ok) {

            const error = await response.json();

            alert(error.message);

            return;

        }

        alert("Attendance Saved Successfully");

        bootstrap.Modal
            .getInstance(document.getElementById("attendanceModal"))
            .hide();

        await loadAttendance();
        editingAttendanceId = null;

    }

    catch (e) {

        console.error(e);

    }

}

window.deleteAttendance = async function(id) {

    const confirmDelete = confirm("Are you sure you want to delete this attendance?");

    if (!confirmDelete) return;

    try {

        const response = await fetch(`${ATTENDANCE_API}/${id}`, {

            method: "DELETE"

        });

        if (!response.ok) {

            alert("Failed to delete attendance.");

            return;

        }

        alert("Attendance deleted successfully.");

        await loadAttendance();

    }

    catch (error) {

        console.error(error);

        alert("Something went wrong.");

    }

};

window.editAttendance = function (id) {

    editingAttendanceId = id;

    const att = ALL_RECORDS.find(a => a.id === id);

    if (!att) return;

    document.getElementById("att_employee").value = att.empId;
    document.getElementById("att_date").value = att.date;
    document.getElementById("att_checkin").value = att.checkIn === "—" ? "" : att.checkIn;
    document.getElementById("att_checkout").value = att.checkOut === "—" ? "" : att.checkOut;
    document.getElementById("att_status").value = att.status;
    document.getElementById("att_remarks").value = att.note;

    new bootstrap.Modal(
        document.getElementById("attendanceModal")
    ).show();

};

function populateDepartmentFilter() {

    const select = document.getElementById("attDeptFilter");

    const departments = [...new Set(EMPLOYEES_REF.map(e => e.departmentName))];

    select.innerHTML = '<option value="">All Departments</option>';

    departments.forEach(dep => {

        select.innerHTML += `<option value="${dep}">${dep}</option>`;



    });

}

const user = JSON.parse(localStorage.getItem("user"));

if (user.role === "EMPLOYEE") {

    ALL_RECORDS = ALL_RECORDS.filter(
        a => a.employeeId == user.employeeId
    );

}

if (user.role === "EMPLOYEE") {

    document.getElementById("btnMarkAttendance")?.remove();

}