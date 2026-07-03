/**
 * payroll.js — Payroll Management
 * Salary table, payslip modal, charts, search/filter,
 * pagination, multi-format professional export.
 *
 * API-ready: swap EMS.fakeApi() with fetch('/api/payroll')
 */

'use strict';

const user = JSON.parse(localStorage.getItem("user"));

if (user && user.role !== "ADMIN") {

    alert("Access Denied");

    window.location.href = "dashboard.html";

}



if (user) {

    document.querySelectorAll("[data-user-name]").forEach(el => {
        el.textContent = user.fullName;
    });

    document.querySelectorAll("[data-user-role]").forEach(el => {
        el.textContent = user.role;
    });

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        const initials = user.fullName
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);

        el.textContent = initials;
    });

}

function debounce(func, delay) {
    let timer;

    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadEmployees() {

    try {

        const response = await fetch(EMPLOYEE_API);

        EMPLOYEES = await response.json();

    } catch (e) {

        console.error(e);

    }

}

async function loadPayroll() {

    try {

        const response = await fetch(PAYROLL_API);

        const data = await response.json();

        PAYROLL_DATA = data.map(p => ({

            id: p.id,

            employeeId: p.employeeId,

            name: p.employeeName,

            department: p.departmentName,

            designation: p.designation,

            month: p.month,

            year: p.year,

            basicSalary: Number(p.basicSalary),

            hra: Number(p.hra),

            transportAllowance: Number(p.transportAllowance),

            bonus: Number(p.bonus),

            tax: Number(p.tax),

            pf: Number(p.pf),

            otherDeduction: Number(p.otherDeduction),

            grossSalary: Number(p.grossSalary),

            totalDeduction: Number(p.totalDeduction),

            netSalary: Number(p.netSalary),

            status: p.status

        }));

        applyFilters();

        updateSummaryCards();

        buildCharts();

    } catch (e) {

        console.error(e);

    }

}



if (user.role === "EMPLOYEE") {

    PAYROLL_DATA = PAYROLL_DATA.filter(
        p => p.employeeId == user.employeeId
    );

}
/* ════════════════════════════════════════
   DUMMY DATA
════════════════════════════════════════ */
const PAYROLL_API = "https://employee-management-system-jt3h.onrender.com/api/payroll";
const EMPLOYEE_API = "https://employee-management-system-jt3h.onrender.com/api/employees";

let PAYROLL_DATA = [];
let EMPLOYEES = [];

/* helpers */
function gross(r) {
    return r.grossSalary;
}

function deductions(r) {
    return r.totalDeduction;
}

function net(r) {
    return r.netSalary;
}
function fmt(n)        { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); }
function initials(n)   { return n.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2); }

const AVATAR_COLORS = [
  {bg:'#ECFDF5',c:'#065F46'},{bg:'#EFF6FF',c:'#2563EB'},
  {bg:'#FFFBEB',c:'#D97706'},{bg:'#F5F3FF',c:'#7C3AED'},
  {bg:'#FEF2F2',c:'#DC2626'},{bg:'#ECFEFF',c:'#0891B2'},
];
function aC(id) {
    return AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length];
}

/* ════════════════════════════════════════
   STATE
════════════════════════════════════════ */
const PAGE_SIZE   = 8;
let currentPage   = 1;
let filtered      = [];
let slipRecord    = null;
let chartInstance = null;

/* ════════════════════════════════════════
   SUMMARY CARDS
════════════════════════════════════════ */
function updateSummaryCards() {
  const totalGross = PAYROLL_DATA.reduce((s,r) => s + gross(r), 0);
  const totalNet   = PAYROLL_DATA.reduce((s,r) => s + net(r),   0);
  const totalDed   = PAYROLL_DATA.reduce((s,r) => s + deductions(r), 0);
  const totalBonus = PAYROLL_DATA.reduce((s,r) => s + r.bonus, 0);

  document.getElementById('pcGross').textContent  = fmt(totalGross);
  document.getElementById('pcNet').textContent    = fmt(totalNet);
  document.getElementById('pcDed').textContent    = fmt(totalDed);
  document.getElementById('pcBonus').textContent  = fmt(totalBonus);

  /* Hero meta */
  document.getElementById('heroTotal').textContent    = fmt(totalNet);
  document.getElementById('heroCount').textContent    = PAYROLL_DATA.length;
  document.getElementById('heroProcessed').textContent= PAYROLL_DATA.filter(r=>r.status==='Processed').length;

  /* Progress bars */
  const pct = n => Math.round(n / totalGross * 100);
  animateBar('barNet',  pct(totalNet));
  animateBar('barDed',  pct(totalDed));
  animateBar('barBonus',pct(totalBonus));
}

function animateBar(id, pct) {
  const el = document.getElementById(id);
  if (!el) return;
  setTimeout(() => { el.style.width = pct + '%'; }, 300);
}

/* ════════════════════════════════════════
   STATUS BADGE
════════════════════════════════════════ */
function statusBadge(s) {
  const map = {
    Processed: 'badge-approved pay-status-processed',
    Pending:   'badge-pending  pay-status-pending',
    Draft:     'badge-inactive pay-status-draft',
    Failed:    'badge-rejected pay-status-failed',
  };
  return `<span class="badge-status ${map[s]||'badge-inactive'}">${s}</span>`;
}

/* ════════════════════════════════════════
   FILTER / SEARCH / SORT
════════════════════════════════════════ */
function applyFilters() {
  const q    = (document.getElementById('paySearch').value || '').toLowerCase().trim();
  const dept = document.getElementById('payDeptFilter').value;
  const stat = document.getElementById('payStatusFilter').value;
  const month= document.getElementById('payMonthFilter').value;
  const sort = document.getElementById('paySortSelect').value;

  filtered = PAYROLL_DATA.filter(r => {
   const mQ =
       !q ||
       r.name.toLowerCase().includes(q) ||
       String(r.employeeId).includes(q) ||
       r.designation.toLowerCase().includes(q);

   const mD =
       !dept || r.department === dept;

   const mS =
       !stat || r.status === stat;

   const mM =
       !month || r.month === month;

    return mQ && mD && mS && mM;
  });

  if (sort === 'name-asc')   filtered.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'net-desc')   filtered.sort((a,b) => net(b) - net(a));
  if (sort === 'net-asc')    filtered.sort((a,b) => net(a) - net(b));
  if (sort === 'gross-desc') filtered.sort((a,b) => gross(b) - gross(a));
  if (sort === 'bonus-desc') filtered.sort((a,b) => b.bonus - a.bonus);

  currentPage = 1;
  renderTable();
  updateStatsBar();
}

function updateStatsBar() {
  const totalNet = filtered.reduce((s,r) => s+net(r), 0);
  document.getElementById('psbCount').textContent  = filtered.length;
  document.getElementById('psbNet').textContent    = fmt(totalNet);
  document.getElementById('psbPending').textContent= filtered.filter(r=>r.status!=='Processed').length;
}

document.getElementById('paySearch').addEventListener('input',       debounce(applyFilters, 250));
document.getElementById('payDeptFilter').addEventListener('change',  applyFilters);
document.getElementById('payStatusFilter').addEventListener('change',applyFilters);
document.getElementById('payMonthFilter').addEventListener('change', applyFilters);
document.getElementById('paySortSelect').addEventListener('change',  applyFilters);
document.getElementById('globalSearch').addEventListener('input',    debounce(function(){
  document.getElementById('paySearch').value = this.value; applyFilters();
}, 300));

document.getElementById('btnResetPay').addEventListener('click', () => {
  ['paySearch','globalSearch'].forEach(id => { const e=document.getElementById(id); if(e) e.value=''; });
  ['payDeptFilter','payStatusFilter','payMonthFilter'].forEach(id => { document.getElementById(id).value=''; });
  document.getElementById('paySortSelect').value = 'net-desc';
  applyFilters();
});

/* ════════════════════════════════════════
   RENDER TABLE
════════════════════════════════════════ */
function renderTable() {
  const tbody = document.getElementById('payTbody');
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="tbl-empty">
          <i class="bi bi-cash-coin"></i>
          <h6>No payroll records found</h6>
          <p>Try adjusting your search or filters.</p>
          <button class="btn-primary-ems" onclick="document.getElementById('btnResetPay').click()" style="background:#059669;">
            <i class="bi bi-arrow-counterclockwise"></i> Reset Filters
          </button>
        </div>
      </td></tr>`;
    updatePageMeta(0,0,0); renderPagination(); return;
  }

  tbody.innerHTML = slice.map(r => {
    const col = aC(r.employeeId);
    const ini = initials(r.name);
    const g   = gross(r);
    const d   = deductions(r);
    const n   = net(r);

    return `
      <tr data-id="${r.id}">
        <td>
          <div class="emp-cell">
            <div class="emp-avatar" style="background:${col.bg};color:${col.c};">${ini}</div>
            <div>
              <div class="emp-name">${r.name}</div>
              <div class="emp-id">${r.employeeId}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="font-size:12.5px;font-weight:500;color:var(--dark);">${r.designation}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${r.department}</div>
        </td>
        <td><span class="month-badge"><i class="bi bi-calendar3"></i>${r.month}</span></td>
        <td><div class="salary-gross">${fmt(g)}</div></td>
        <td>
          <div class="salary-bonus">${r.bonus > 0 ? '+'+fmt(r.bonus) : '—'}</div>
        </td>
        <td>
          <div class="salary-deduction">-${fmt(d)}</div>
          <div style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">Tax + PF</div>
        </td>
        <td><div class="salary-net">${fmt(n)}</div></td>
        <td>${statusBadge(r.status)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon" title="View Payslip" onclick="openPayslip('${r.id}')">
              <i class="bi bi-receipt"></i>
            </button>
            <button class="btn-icon success" title="Download PDF" onclick="downloadPayslipPDF('${r.id}')">
              <i class="bi bi-download"></i>
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');

  const end = Math.min(start + PAGE_SIZE, filtered.length);
  updatePageMeta(start+1, end, filtered.length);
  renderPagination();
}

function updatePageMeta(from, to, total) {
  document.getElementById('payPageInfo').textContent  = total ? `${from}–${to}` : '0';
  document.getElementById('payTotalInfo').textContent = total;
}

/* ════════════════════════════════════════
   PAGINATION
════════════════════════════════════════ */
function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const c     = document.getElementById('payPagination');
  if (total <= 1) { c.innerHTML=''; return; }
  let h = `<button class="page-btn" onclick="goPayPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>`;
  for (let i=1; i<=total; i++) {
    if (i===1||i===total||Math.abs(i-currentPage)<=1)
      h += `<button class="page-btn ${i===currentPage?'active':''}" onclick="goPayPage(${i})">${i}</button>`;
    else if (Math.abs(i-currentPage)===2)
      h += `<span style="padding:0 4px;color:var(--text-muted);">…</span>`;
  }
  h += `<button class="page-btn" onclick="goPayPage(${currentPage+1})" ${currentPage===total?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
  c.innerHTML = h;
}
window.goPayPage = p => {
  const max = Math.ceil(filtered.length/PAGE_SIZE);
  if (p<1||p>max) return;
  currentPage=p; renderTable();
};

/* ════════════════════════════════════════
   PAYSLIP MODAL
════════════════════════════════════════ */
window.openPayslip = id => {
  const r = PAYROLL_DATA.find(x => x.id === id);
  if (!r) return;
  slipRecord = r;

  const col = aC(r.employeeId);
  const g   = gross(r);
  const d   = deductions(r);
  const n   = net(r);

  document.getElementById('slipAvatar').textContent      = initials(r.name);
  document.getElementById('slipAvatar').style.background  = col.bg;
  document.getElementById('slipAvatar').style.color       = col.c;
  document.getElementById('slipName').textContent         = r.name;
  document.getElementById('slipTitle').textContent        = `${r.designation} · ${r.department}`;
  document.getElementById('slipEmpId').textContent        = r.employeeId;
  document.getElementById('slipMonth').textContent        = r.month;
  document.getElementById('slipPayId').textContent        = r.id;
  document.getElementById('slipStatus').innerHTML         = statusBadge(r.status);

  /* Earnings */
  document.getElementById('slipBasic').textContent     = fmt(r.basicSalary);
  document.getElementById('slipHra').textContent       = fmt(r.hra);
  document.getElementById('slipTransport').textContent = fmt(r.transportAllowance);
  document.getElementById('slipBonus').textContent     = r.bonus > 0 ? fmt(r.bonus) : '—';
  document.getElementById('slipGross').textContent     = fmt(g);

  /* Deductions */
  document.getElementById('slipTax').textContent   = fmt(r.tax);
  document.getElementById('slipPf').textContent    = fmt(r.pf);
  document.getElementById('slipOther').textContent = fmt(r.otherDeduction);
  document.getElementById('slipTotalDed').textContent = fmt(d);

  /* Net */
  document.getElementById('slipNet').textContent = fmt(n);

  new bootstrap.Modal(document.getElementById('payslipModal')).show();
};

/* ════════════════════════════════════════
   DOWNLOAD PAYSLIP PDF
════════════════════════════════════════ */
function buildPayslipHTML(r) {
  const g = gross(r), d = deductions(r), n = net(r);
  const date = new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  return `
    <!DOCTYPE html><html lang="en"><head>
    <meta charset="UTF-8">
    <title>Payslip — ${r.name} — ${r.month}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#1E293B;background:#fff;padding:32px;}
      .header{background:linear-gradient(120deg,#064E3B,#065F46);color:#fff;padding:24px 28px;border-radius:10px 10px 0 0;display:flex;justify-content:space-between;align-items:flex-start;}
      .co-name{font-size:20px;font-weight:800;}
      .slip-meta{text-align:right;font-size:12px;opacity:.8;line-height:1.8;}
      .emp-row{background:#F0FDF4;border:1px solid #BBF7D0;padding:14px 28px;display:flex;align-items:center;gap:14px;}
      .emp-av{width:44px;height:44px;border-radius:50%;background:#065F46;color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;flex-shrink:0;}
      .emp-name{font-size:15px;font-weight:700;color:#065F46;}
      .emp-sub{font-size:12px;color:#059669;}
      .body{padding:20px 28px;}
      .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#94A3B8;margin-bottom:10px;margin-top:18px;border-bottom:1px solid #E2E8F0;padding-bottom:5px;}
      table{width:100%;border-collapse:collapse;}
      td{padding:7px 4px;font-size:12px;border-bottom:1px dashed #E2E8F0;}
      td:last-child{text-align:right;font-weight:600;}
      .total-row td{border-top:2px solid #065F46;border-bottom:none;padding-top:10px;font-size:14px;font-weight:800;}
      .total-row td:last-child{color:#059669;font-size:18px;}
      .footer{margin-top:20px;font-size:10px;color:#94A3B8;text-align:center;padding-top:12px;border-top:1px solid #E2E8F0;}
      .btn-wrap{text-align:center;margin-top:20px;}
      .btn-wrap button{background:#059669;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:700;}
      @media print{.btn-wrap{display:none;}}
    </style></head><body>
    <div class="header">
      <div><div class="co-name">EMSPro</div><div style="font-size:12px;opacity:.75;margin-top:3px;">Employee Payslip</div></div>
      <div class="slip-meta">
        <div><b>Pay Period:</b> ${r.month}</div>
        <div><b>Pay ID:</b> ${r.id}</div>
        <div><b>Generated:</b> ${date}</div>
      </div>
    </div>
    <div class="emp-row">
      <div class="emp-av">${initials(r.name)}</div>
      <div>
        <div class="emp-name">${r.name}</div>
        <div class="emp-sub">${r.designation} &nbsp;·&nbsp; ${r.department} &nbsp;·&nbsp; ${r.employeeId}</div>
      </div>
    </div>
    <div class="body">
      <div class="section-title">Earnings</div>
      <table>
        <tr><td>Basic Salary</td><td>${fmt(r.basicSalary)}</td></tr>
        <tr><td>House Rent Allowance (HRA)</td><td>${fmt(r.hra)}</td></tr>
        <tr><td>Transport Allowance</td><td>${fmt(r.transportAllowance)}</td></tr>
        ${r.bonus>0?`<tr><td>Performance Bonus</td><td style="color:#2563EB;">${fmt(r.bonus)}</td></tr>`:''}
        <tr style="font-weight:700;"><td>Gross Salary</td><td>${fmt(g)}</td></tr>
      </table>
      <div class="section-title">Deductions</div>
      <table>
        <tr><td>Income Tax (TDS)</td><td style="color:#EF4444;">-${fmt(r.tax)}</td></tr>
        <tr><td>Provident Fund (PF)</td><td style="color:#EF4444;">-${fmt(r.pf)}</td></tr>
        <tr><td>Other Deductions</td><td style="color:#EF4444;">-${fmt(r.otherDeduction)}</td></tr>
        <tr style="font-weight:700;"><td>Total Deductions</td><td style="color:#EF4444;">-${fmt(d)}</td></tr>
      </table>
      <table style="margin-top:14px;">
        <tr class="total-row"><td>Net Take-Home Pay</td><td>${fmt(n)}</td></tr>
      </table>
      <div class="footer">This is a computer-generated payslip. EMSPro &mdash; Confidential &mdash; ${date}</div>
    </div>
    <div class="btn-wrap"><button onclick="window.print()">🖨️  Print / Save as PDF</button></div>
    </body></html>`;
}

window.downloadPayslipPDF = id => {
  const r = PAYROLL_DATA.find(x => x.id === id);
  if (!r) return;
  const win = window.open('', '_blank', 'width=820,height=700');
  win.document.write(buildPayslipHTML(r));
  win.document.close();
  setTimeout(() => win.print(), 700);
  console.log(`Payslip for ${r.name} opened.`);
};

document.getElementById('btnDownloadPayslip').addEventListener('click', () => {
  if (slipRecord) downloadPayslipPDF(slipRecord.id);
});

/* ════════════════════════════════════════
   CHARTS
════════════════════════════════════════ */
function buildCharts() {
  const ctxBar = document.getElementById('payTrendChart')?.getContext('2d');
  if (ctxBar) {
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
        datasets: [
          { label:'Net Salaries',  data:[318,325,320,330,335,342,0,0,0,0,0,0], backgroundColor:'rgba(5,150,105,.8)',  borderRadius:5, borderSkipped:false },
          { label:'Bonuses',       data:[28, 22, 35, 18, 30, 42, 0,0,0,0,0,0], backgroundColor:'rgba(37,99,235,.7)',  borderRadius:5, borderSkipped:false },
          { label:'Deductions',    data:[62, 64, 63, 66, 67, 69, 0,0,0,0,0,0], backgroundColor:'rgba(239,68,68,.55)', borderRadius:5, borderSkipped:false },
        ],
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{display:false}, tooltip:{mode:'index',intersect:false} },
        scales:{
          x:{ grid:{display:false}, ticks:{font:{family:'Poppins',size:10}} },
          y:{ grid:{color:'#F1F5F9'}, ticks:{font:{family:'Poppins',size:10},callback:v=>'$'+v+'k'}, beginAtZero:true },
        },
      },
    });
  }
}

/* ════════════════════════════════════════
   PROFESSIONAL EXPORT SYSTEM
════════════════════════════════════════ */
async function animateProgress(label) {
  const wrap = document.getElementById('pemProgressWrap');
  const fill = document.getElementById('pemProgressFill');
  const lbl  = document.getElementById('pemProgressLabel');
  const pct  = document.getElementById('pemProgressPct');
  wrap.classList.add('show');
  lbl.textContent = label;
  for (let i=0; i<=100; i+=10) {
    fill.style.width = i+'%'; pct.textContent = i+'%';
    await new Promise(r=>setTimeout(r,40));
  }
  await new Promise(r=>setTimeout(r,280));
  wrap.classList.remove('show'); fill.style.width='0%';
}

function buildExportRows() {
  return filtered.map(r => ({
    'Pay ID':     r.id,
    'Emp ID':     r.employeeId,
    'Name':       r.name,
    'Department': r.department,
    'Title':      r.designation,
    'Month':      r.month,
    'Basic':      r.basicSalary,
    'HRA':        r.hra,
    'Transport': r.transportAllowance,
    'Bonus':      r.bonus,
    'Gross':      gross(r),
    'Tax':        r.tax,
    'PF':         r.pf,
    'Other Ded':  r.otherDeduction,
    'Total Ded':  deductions(r),
    'Net Salary': net(r),
    'Status':     r.status,
  }));
}

function closeExportDD() {
  bootstrap.Dropdown.getInstance(document.getElementById('payExportBtn'))?.hide();
}

document.getElementById('pemCsv').addEventListener('click', async () => {
  if (!filtered.length) {
      alert("No records to export.");
      return;
  }

  await animateProgress("Preparing CSV...");

  downloadCSV(buildExportRows());

  alert("CSV exported successfully!");

});

document.getElementById('pemExcel').addEventListener('click', async () => {
  if (!filtered.length) { alert("No records to export."); return; }
  await animateProgress('Building Excel file…');
  const rows=buildExportRows(), headers=Object.keys(rows[0]);
  const tsv=[headers.join('\t'),...rows.map(r=>headers.map(h=>r[h]).join('\t'))].join('\n');
  const blob=new Blob(['\uFEFF'+tsv],{type:'application/vnd.ms-excel;charset=utf-8;'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download=`payroll_${new Date().toISOString().slice(0,7)}.xls`; a.click();
  URL.revokeObjectURL(url);
  alert("PDF generated successfully!"); closeExportDD();
});

document.getElementById('pemPdf').addEventListener('click', async () => {
  if (!filtered.length) { alert("No records to export."); return; }
  await animateProgress('Generating PDF report…');
  const rows=buildExportRows(), headers=Object.keys(rows[0]);
  const date=new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
  const totalNetVal = filtered.reduce((s,r)=>s+net(r),0);
  const win=window.open('','_blank','width=1100,height=750');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Payroll Report — EMS Pro</title>
    <style>*{box-sizing:border-box;margin:0;padding:0;}
    body{font-family:'Segoe UI',sans-serif;padding:28px;color:#1E293B;background:#fff;}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px;padding-bottom:14px;border-bottom:3px solid #059669;}
    .logo{font-size:22px;font-weight:800;} .logo span{color:#059669;}
    .hdr-title{font-size:15px;font-weight:700;margin-top:4px;}
    .hdr-meta{text-align:right;font-size:11px;color:#64748B;line-height:1.8;}
    .summary{display:flex;gap:16px;margin-bottom:20px;}
    .sbox{flex:1;padding:12px;border-radius:8px;border:1px solid #BBF7D0;background:#F0FDF4;text-align:center;}
    .sval{font-size:18px;font-weight:800;color:#065F46;} .slbl{font-size:10px;color:#059669;margin-top:2px;}
    table{width:100%;border-collapse:collapse;font-size:10px;}
    thead tr{background:#065F46;color:#fff;-webkit-print-color-adjust:exact;}
    th{padding:7px 8px;text-align:left;font-weight:700;}
    td{padding:6px 8px;border-bottom:1px solid #E2E8F0;}
    tr:nth-child(even){background:#F0FDF4;}
    .footer{margin-top:18px;font-size:10px;color:#94A3B8;text-align:center;padding-top:10px;border-top:1px solid #E2E8F0;}
    .pbtn{text-align:center;margin-top:16px;} .pbtn button{background:#059669;color:#fff;border:none;padding:10px 28px;border-radius:8px;font-size:13px;cursor:pointer;}
    @media print{.pbtn{display:none;}}</style></head><body>
    <div class="hdr">
      <div><div class="logo">EMS<span>Pro</span></div><div class="hdr-title">Payroll Summary Report</div></div>
      <div class="hdr-meta"><div><b>Period:</b> Jun 2025</div><div><b>Generated:</b> ${date}</div><div><b>Records:</b> ${rows.length}</div></div>
    </div>
    <div class="summary">
      <div class="sbox"><div class="sval">${rows.length}</div><div class="slbl">Employees</div></div>
      <div class="sbox"><div class="sval">${fmt(totalNetVal)}</div><div class="slbl">Total Net Payout</div></div>
      <div class="sbox"><div class="sval">${filtered.filter(r=>r.status==='Processed').length}</div><div class="slbl">Processed</div></div>
      <div class="sbox"><div class="sval">${filtered.filter(r=>r.status!=='Processed').length}</div><div class="slbl">Pending</div></div>
    </div>
    <table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr>${headers.map(h=>`<td>${r[h]}</td>`).join('')}</tr>`).join('')}</tbody></table>
    <div class="footer">EMS Pro — Confidential Payroll Document — ${date}</div>
    <div class="pbtn"><button onclick="window.print()">🖨️ Print / Save as PDF</button></div>
    </body></html>`);
  win.document.close(); setTimeout(()=>win.print(),700);
  alert("PDF window opened. Click Print → Save as PDF.");closeExportDD();
});

document.getElementById('pemPrint').addEventListener('click', () => {
  window.print(); closeExportDD();
});

/* Update record count when dropdown opens */
document.getElementById('payExportBtn').addEventListener('click', () => {
  const count = document.getElementById('payTotalInfo')?.textContent || '0';
  document.getElementById('pemHeaderSub').textContent = `${count} payroll records ready`;
});

/* ════════════════════════════════════════
   GENERATE PAYROLL (bulk action)
════════════════════════════════════════ */


document.getElementById('btnGeneratePayroll').addEventListener('click', async () => {

    const btn = document.getElementById('btnGeneratePayroll');

    btn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    btn.disabled = true;

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1200));

    btn.innerHTML =
        '<i class="bi bi-lightning-charge-fill"></i> Run Payroll';

    btn.disabled = false;

    alert("Payroll generated successfully!");

    await loadPayroll();

});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", async function () {

    const user = JSON.parse(localStorage.getItem("user"));

    if (user) {

        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = user.fullName;
        });

        document.querySelectorAll("[data-user-role]").forEach(el => {
            el.textContent = user.role;
        });

        document.querySelectorAll("[data-user-initials]").forEach(el => {
            const initials = user.fullName
                .split(" ")
                .map(word => word[0])
                .join("")
                .toUpperCase()
                .substring(0, 2);

            el.textContent = initials;
        });

    }

    await loadEmployees();
    await loadPayroll();

});

function downloadCSV(rows) {

    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csv = [
        headers.join(","),
        ...rows.map(r =>
            headers.map(h => `"${r[h]}"`).join(",")
        )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "payroll.csv";

    a.click();

    URL.revokeObjectURL(url);

}