/**
 * reports.js — Analytics & Reports
 *
 * All numbers are derived LIVE from window.EMS_DATA, a shared
 * data store (see shared-data.js) used by Payroll, Leaves and
 * Attendance pages. No dummy data is declared in this file.
 *
 * Loading order in HTML must be:
 *   shared-data.js  →  app.js  →  reports.js
 *
 * API-ready: replace shared-data.js with fetch() calls to your
 * backend (e.g. /api/payroll, /api/leaves, /api/attendance) and
 * this file requires no changes — it only reads window.EMS_DATA.
 */

'use strict';

function loadUserProfile() {

    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        window.location.href = "index.html";
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
        .substring(0, 2)
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

}

/* ════════════════════════════════════════════
   DATA REFERENCES  (from other modules)
   These constants are declared in their own JS files.
   Reports simply reads them — no duplication.
════════════════════════════════════════════ */
const PAY  = (window.EMS_DATA && window.EMS_DATA.payroll)         || [];
const LEAV = (window.EMS_DATA && window.EMS_DATA.leaves)          || [];
const ATT  = (window.EMS_DATA && window.EMS_DATA.attendanceToday) || [];

/* ════════════════════════════════════════════
   COMPUTED METRICS  (derived, not hardcoded)
════════════════════════════════════════════ */
const M = (() => {
  /* Payroll */
  const totalGross      = PAY.reduce((s,r) => s + (r.basic+r.hra+r.transport+r.bonus), 0);
  const totalNet        = PAY.reduce((s,r) => s + (r.basic+r.hra+r.transport+r.bonus-r.tax-r.pf-r.other), 0);
  const totalBonus      = PAY.reduce((s,r) => s + r.bonus, 0);
  const totalDed        = PAY.reduce((s,r) => s + (r.tax+r.pf+r.other), 0);
  const avgSalary       = PAY.length ? Math.round(totalNet / PAY.length) : 0;
  const payProcessed    = PAY.filter(r => r.status === 'Processed').length;
  const payPending      = PAY.filter(r => r.status !== 'Processed').length;

  /* Leaves */
  const totalLeaves     = LEAV.length;
  const leavePending    = LEAV.filter(r => r.status === 'Pending').length;
  const leaveApproved   = LEAV.filter(r => r.status === 'Approved').length;
  const leaveRejected   = LEAV.filter(r => r.status === 'Rejected').length;
  const totalDaysOff    = LEAV.filter(r => r.status === 'Approved').reduce((s,r) => s + r.days, 0);

  /* Employees */
  const totalEmp        = PAY.length;                   // use payroll as proxy for total
  const activeEmp       = PAY.length;
  const depts           = [...new Set(PAY.map(r => r.dept))];
  const totalDepts      = depts.length;

  /* Attendance (today's snapshot) */
  const presentToday    = ATT.filter(r => r.status === 'Present').length;
  const absentToday     = ATT.filter(r => r.status === 'Absent').length;
  const lateToday       = ATT.filter(r => r.status === 'Late').length;
  const onLeaveToday    = ATT.filter(r => r.status === 'On Leave').length;
  const attTotal        = ATT.length || 1;
  const attRate         = Math.round((presentToday + lateToday) / attTotal * 100);

  /* Dept breakdown */
  const deptBreakdown   = depts.map(dept => {
    const rows       = PAY.filter(r => r.dept === dept);
    const headcount  = rows.length;
    const netTotal   = rows.reduce((s,r) => s + (r.basic+r.hra+r.transport+r.bonus-r.tax-r.pf-r.other), 0);
    const avgNet     = headcount ? Math.round(netTotal / headcount) : 0;
    const bonus      = rows.reduce((s,r) => s + r.bonus, 0);
    return { dept, headcount, netTotal, avgNet, bonus };
  }).sort((a,b) => b.headcount - a.headcount);

  /* Leave by type */
  const leaveByType = {};
  LEAV.forEach(r => { leaveByType[r.type] = (leaveByType[r.type] || 0) + 1; });

  return {
    totalGross, totalNet, totalBonus, totalDed, avgSalary,
    payProcessed, payPending, totalLeaves, leavePending,
    leaveApproved, leaveRejected, totalDaysOff,
    totalEmp, totalDepts, depts, deptBreakdown,
    presentToday, absentToday, lateToday, onLeaveToday, attRate,
    leaveByType,
  };
})();

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */
const fmt  = n => '$' + Number(n).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0});
const fmtK = n => n >= 1000 ? '$' + (n/1000).toFixed(1) + 'k' : fmt(n);

/* ════════════════════════════════════════════
   KPI CARDS
════════════════════════════════════════════ */
function renderKPIs() {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  set('kpiEmp',     M.totalEmp);
  set('kpiDepts',   M.totalDepts);
  set('kpiAttRate', M.attRate + '%');
  set('kpiLeaves',  M.leavePending);
  set('kpiPayroll', fmtK(M.totalNet));

  // Banner chips
  set('rbEmp',     M.totalEmp);
  set('rbDepts',   M.totalDepts);
  set('rbPay',     fmtK(M.totalNet));
}

/* ════════════════════════════════════════════
   DEPT BREAKDOWN TABLE
════════════════════════════════════════════ */
function renderDeptTable() {
  const tbody = document.getElementById('deptRptTbody');
  if (!tbody || !M.deptBreakdown.length) return;

  const maxH = Math.max(...M.deptBreakdown.map(d => d.headcount));
  const DEPT_COLORS = {
    Engineering: '#6366F1', Marketing: '#F59E0B', Sales: '#10B981',
    'Human Resources': '#8B5CF6', Finance: '#06B6D4', Operations: '#EF4444',
    'Customer Support': '#10B981', Product: '#2563EB', Design: '#F59E0B',
  };

  tbody.innerHTML = M.deptBreakdown.map(d => {
    const pct   = Math.round(d.headcount / maxH * 100);
    const color = DEPT_COLORS[d.dept] || '#6366F1';
    return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
            <span style="font-weight:600;color:var(--dark);">${d.dept}</span>
          </div>
        </td>
        <td style="font-weight:700;color:var(--dark);">${d.headcount}</td>
        <td>
          <div class="dept-mini-bar">
            <div class="dept-mini-bar-fill" style="width:${pct}%;background:${color};"></div>
          </div>
        </td>
        <td style="font-weight:600;color:var(--dark);">${fmt(d.avgNet)}</td>
        <td style="color:#2563EB;font-weight:600;">${d.bonus > 0 ? '+'+fmt(d.bonus) : '—'}</td>
        <td style="font-weight:700;color:#059669;">${fmt(d.netTotal)}</td>
      </tr>`;
  }).join('');

  // Animate bars after render
  setTimeout(() => {
    document.querySelectorAll('.dept-mini-bar-fill').forEach(el => {
      const w = el.style.width; el.style.width = '0';
      setTimeout(() => { el.style.width = w; }, 50);
    });
  }, 100);
}

/* ════════════════════════════════════════════
   INSIGHTS
════════════════════════════════════════════ */
function renderInsights() {
  const list = document.getElementById('insightsList');
  if (!list) return;

  // Build insights from real computed metrics
  const topDept   = M.deptBreakdown[0];
  const topPay    = PAY.reduce((best,r) => {
    const n = r.basic+r.hra+r.transport+r.bonus-r.tax-r.pf-r.other;
    return n > best.net ? {name:r.name, net:n} : best;
  }, {name:'—', net:0});
  const mostBonus = PAY.reduce((best,r) => r.bonus > best.bonus ? {name:r.name, bonus:r.bonus} : best, {name:'—', bonus:0});

  const items = [
    { color:'#6366F1', text:`<strong>${topDept?.dept || '—'}</strong> is the largest department with <strong>${topDept?.headcount || 0}</strong> employees.`, time:'Based on current payroll data' },
    { color:'#10B981', text:`Attendance rate today is <strong>${M.attRate}%</strong> — <strong>${M.presentToday}</strong> present, <strong>${M.absentToday}</strong> absent.`, time:'Live from today\'s records' },
    { color:'#F59E0B', text:`<strong>${M.leavePending}</strong> leave request${M.leavePending !== 1 ? 's' : ''} are pending review and need action.`, time:'Current leave queue' },
    { color:'#2563EB', text:`Total payroll this month is <strong>${fmtK(M.totalNet)}</strong> net across <strong>${M.totalEmp}</strong> employees.`, time:'June 2025 payroll' },
    { color:'#8B5CF6', text:`<strong>${topPay.name}</strong> has the highest net salary at <strong>${fmtK(topPay.net)}</strong>.`, time:'From payroll records' },
    { color:'#EF4444', text:`<strong>${mostBonus.name}</strong> received the largest bonus of <strong>${fmtK(mostBonus.bonus)}</strong> this period.`, time:'Bonus analytics' },
    { color:'#059669', text:`<strong>${M.leaveApproved}</strong> leave requests approved, <strong>${M.leaveRejected}</strong> rejected this cycle.`, time:'Leave status summary' },
  ];

  list.innerHTML = items.map(i => `
    <div class="insight-item">
      <div class="insight-dot" style="background:${i.color};"></div>
      <div>
        <div class="insight-text">${i.text}</div>
        <div class="insight-time"><i class="bi bi-clock" style="font-size:10px;"></i> ${i.time}</div>
      </div>
    </div>`).join('');
}

/* ════════════════════════════════════════════
   CHARTS  (all data computed from real sources)
════════════════════════════════════════════ */
function buildCharts() {

  // ── 1. Employee headcount by department (bar) ──
  const deptNames   = M.deptBreakdown.map(d => d.dept.replace('Human Resources','HR').replace('Customer Support','Support'));
  const deptCounts  = M.deptBreakdown.map(d => d.headcount);
  const deptColors  = ['#6366F1','#F59E0B','#10B981','#8B5CF6','#06B6D4','#EF4444','#2563EB','#F59E0B','#10B981'];

  const ctx1 = document.getElementById('chartDeptHeadcount')?.getContext('2d');
  if (ctx1) new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: deptNames,
      datasets: [{
        data: deptCounts,
        backgroundColor: deptColors.slice(0, deptNames.length).map(c => c + 'CC'),
        borderColor:     deptColors.slice(0, deptNames.length),
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} employees` } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { family:'Poppins', size:10 } } },
        y: { grid: { color:'#F1F5F9' }, ticks: { font: { family:'Poppins', size:10 }, stepSize: 2 }, beginAtZero: true },
      },
    },
  });

  // ── 2. Payroll breakdown donut ──
  const ctx2 = document.getElementById('chartPayrollDonut')?.getContext('2d');
  if (ctx2) {
    const basic  = PAY.reduce((s,r) => s+r.basic,     0);
    const hra    = PAY.reduce((s,r) => s+r.hra,       0);
    const trans  = PAY.reduce((s,r) => s+r.transport, 0);
    const bonus  = PAY.reduce((s,r) => s+r.bonus,     0);
    const deduc  = PAY.reduce((s,r) => s+r.tax+r.pf+r.other, 0);

    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Basic Salary','HRA','Transport','Bonus','Deductions'],
        datasets: [{ data:[basic,hra,trans,bonus,deduc], backgroundColor:['#6366F1','#10B981','#F59E0B','#2563EB','#EF4444'], borderWidth:0, hoverOffset:6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${fmtK(ctx.raw)}` } } },
      },
    });
  }

  // ── 3. Attendance breakdown donut ──
  const ctx3 = document.getElementById('chartAttDonut')?.getContext('2d');
  if (ctx3) {
    const p  = M.presentToday;
    const ab = M.absentToday;
    const la = M.lateToday;
    const ol = M.onLeaveToday;

    new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: ['Present','Absent','Late','On Leave'],
        datasets: [{ data:[p,ab,la,ol], backgroundColor:['#10B981','#EF4444','#F59E0B','#8B5CF6'], borderWidth:0, hoverOffset:6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}` } } },
      },
    });
  }

  // ── 4. Leave by type pie ──
  const ctx4 = document.getElementById('chartLeaveType')?.getContext('2d');
  if (ctx4) {
    const leaveLabels = Object.keys(M.leaveByType);
    const leaveVals   = Object.values(M.leaveByType);
    const leaveColors = ['#2563EB','#EF4444','#F59E0B','#8B5CF6','#0891B2','#DC2626','#94A3B8'];

    new Chart(ctx4, {
      type: 'pie',
      data: {
        labels: leaveLabels,
        datasets: [{ data: leaveVals, backgroundColor: leaveColors.slice(0, leaveLabels.length), borderWidth: 0, hoverOffset: 6 }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'right', labels:{ font:{ family:'Poppins', size:10 }, padding:12, boxWidth:10 } },
                   tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} requests` } } },
      },
    });
  }

  // ── 5. Salary distribution by dept (horizontal bar) ──
  const ctx5 = document.getElementById('chartSalaryDept')?.getContext('2d');
  if (ctx5) {
    const sortedDepts = [...M.deptBreakdown].sort((a,b) => b.avgNet - a.avgNet);
    new Chart(ctx5, {
      type: 'bar',
      data: {
        labels: sortedDepts.map(d => d.dept.replace('Human Resources','HR').replace('Customer Support','Support')),
        datasets: [{
          label: 'Avg Net Salary',
          data: sortedDepts.map(d => d.avgNet),
          backgroundColor: '#6366F188',
          borderColor: '#6366F1',
          borderWidth: 1.5,
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmtK(ctx.raw)} avg net` } } },
        scales: {
          x: { grid: { color:'#F1F5F9' }, ticks: { font:{ family:'Poppins', size:10 }, callback: v => fmtK(v) }, beginAtZero: true },
          y: { grid: { display: false }, ticks: { font:{ family:'Poppins', size:10 } } },
        },
      },
    });
  }

  // ── 6. Leave status bar chart ──
  const ctx6 = document.getElementById('chartLeaveStatus')?.getContext('2d');
  if (ctx6) new Chart(ctx6, {
    type: 'bar',
    data: {
      labels: ['Pending','Approved','Rejected'],
      datasets: [{
        data: [M.leavePending, M.leaveApproved, M.leaveRejected],
        backgroundColor: ['#FDE68ACC','#A7F3D0CC','#FECACACC'],
        borderColor:     ['#F59E0B',  '#10B981',   '#EF4444'],
        borderWidth: 1.5,
        borderRadius: 8,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font:{ family:'Poppins', size:11 } } },
        y: { grid: { color:'#F1F5F9' }, ticks: { font:{ family:'Poppins', size:10 }, stepSize: 1 }, beginAtZero: true },
      },
    },
  });
}

/* ════════════════════════════════════════════
   PERIOD FILTER  (re-render label only;
   in a real app this would re-fetch)
════════════════════════════════════════════ */
document.getElementById('rptPeriodFilter')?.addEventListener('change', function () {
  const el = document.getElementById('periodLabel');
  if (el) el.textContent = this.options[this.selectedIndex].text;
});

/* ════════════════════════════════════════════
   EXPORT
════════════════════════════════════════════ */
async function animateProgress(label) {
  const wrap = document.getElementById('remProgressWrap');
  const fill = document.getElementById('remProgressFill');
  const lbl  = document.getElementById('remProgressLabel');
  const pct  = document.getElementById('remProgressPct');
  wrap.classList.add('show');
  lbl.textContent = label;
  for (let i=0; i<=100; i+=10) {
    fill.style.width = i+'%'; pct.textContent = i+'%';
    await new Promise(r=>setTimeout(r,40));
  }
  await new Promise(r=>setTimeout(r,280));
  wrap.classList.remove('show'); fill.style.width = '0%';
}

function buildReportRows() {
  return M.deptBreakdown.map(d => ({
    'Department':    d.dept,
    'Headcount':     d.headcount,
    'Avg Net Salary':d.avgNet,
    'Total Bonus':   d.bonus,
    'Total Net Pay': d.netTotal,
  }));
}

function closeExportDD() {
  bootstrap.Dropdown.getInstance(document.getElementById('rptExportBtn'))?.hide();
}

document.getElementById('remCsv').addEventListener('click', async () => {
  await animateProgress('Preparing CSV…');
  EMS.exportCSV(buildReportRows(), `ems_report_${new Date().toISOString().slice(0,10)}.csv`);
  EMS.toast('CSV exported!', 'success'); closeExportDD();
});

document.getElementById('remExcel').addEventListener('click', async () => {
  await animateProgress('Building Excel…');
  const rows = buildReportRows(), headers = Object.keys(rows[0]);
  const tsv  = [headers.join('\t'), ...rows.map(r=>headers.map(h=>r[h]).join('\t'))].join('\n');
  const blob = new Blob(['\uFEFF'+tsv], {type:'application/vnd.ms-excel;charset=utf-8;'});
  const url  = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = `ems_report_${new Date().toISOString().slice(0,10)}.xls`; a.click();
  URL.revokeObjectURL(url);
  EMS.toast('Excel downloaded!', 'success'); closeExportDD();
});

document.getElementById('remPdf').addEventListener('click', async () => {
  await animateProgress('Generating PDF…');
  const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const rows = buildReportRows(), headers = Object.keys(rows[0]);
  const win  = window.open('','_blank','width=1000,height=720');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>EMS Analytics Report</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;padding:28px;color:#1E293B;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:3px solid #6366F1;}
    .logo{font-size:22px;font-weight:800;}.logo span{color:#6366F1;}
    .hdr-meta{text-align:right;font-size:11px;color:#64748B;line-height:1.8;}
    .kpis{display:flex;gap:14px;margin-bottom:20px;}
    .kbox{flex:1;padding:12px;border-radius:8px;border:1px solid #E2E8F0;text-align:center;}
    .kval{font-size:18px;font-weight:800;color:#312E81;}.klbl{font-size:10px;color:#64748B;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:11px;}
    thead tr{background:#312E81;color:#fff;-webkit-print-color-adjust:exact;}
    th{padding:8px 10px;text-align:left;font-weight:700;}
    td{padding:7px 10px;border-bottom:1px solid #E2E8F0;}
    tr:nth-child(even){background:#F8FAFC;}
    .footer{margin-top:18px;font-size:10px;color:#94A3B8;text-align:center;padding-top:10px;border-top:1px solid #E2E8F0;}
    .pbtn{text-align:center;margin-top:16px;}.pbtn button{background:#6366F1;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:13px;cursor:pointer;}
    @media print{.pbtn{display:none;}}</style></head><body>
    <div class="hdr">
      <div><div class="logo">EMS<span>Pro</span></div><div style="font-size:15px;font-weight:700;margin-top:4px;">Analytics Report</div></div>
      <div class="hdr-meta"><div><b>Generated:</b> ${date}</div><div><b>Period:</b> June 2025</div></div>
    </div>
    <div class="kpis">
      <div class="kbox"><div class="kval">${M.totalEmp}</div><div class="klbl">Employees</div></div>
      <div class="kbox"><div class="kval">${M.totalDepts}</div><div class="klbl">Departments</div></div>
      <div class="kbox"><div class="kval">${M.attRate}%</div><div class="klbl">Attendance</div></div>
      <div class="kbox"><div class="kval">${M.leavePending}</div><div class="klbl">Pending Leaves</div></div>
      <div class="kbox"><div class="kval">${fmtK(M.totalNet)}</div><div class="klbl">Net Payroll</div></div>
    </div>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${r[h]}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="footer">EMS Pro Analytics — Confidential — ${date}</div>
    <div class="pbtn"><button onclick="window.print()">🖨️ Print / Save as PDF</button></div>
    </body></html>`);
  win.document.close(); setTimeout(()=>win.print(),700);
  EMS.toast('PDF window opened','info'); closeExportDD();
});

document.getElementById('remPrint').addEventListener('click', () => { window.print(); closeExportDD(); });

/* Update sub-label on open */
document.getElementById('rptExportBtn')?.addEventListener('click', () => {
  document.getElementById('remHeaderSub').textContent = `${M.deptBreakdown.length} dept records ready`;
});

/* ════════════════════════════════════════════
   INIT
════════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  await EMS.fakeApi(null, 600);
  renderKPIs();
  renderDeptTable();
  renderInsights();
  buildCharts();

  /* Animate dept bars */
  setTimeout(() => {
    document.querySelectorAll('.dept-mini-bar-fill').forEach(el => {
      const w = el.dataset.width || el.style.width;
      el.style.transition = 'width .7s ease';
    });
  }, 500);
});

document.addEventListener("DOMContentLoaded", () => {

    loadUserProfile();

});