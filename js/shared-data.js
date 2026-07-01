/**
 * shared-data.js
 * Central data store shared across pages (Payroll, Leaves, Attendance, Reports).
 * This avoids loading entire page-controller scripts (which attach
 * page-specific DOM listeners) just to reuse their data arrays.
 *
 * In a real backend-connected app, this file would be replaced by
 * API calls (fetch('/api/payroll'), fetch('/api/leaves'), etc.)
 * and each page would request only the data it needs.
 */

'use strict';

window.EMS_DATA = {

  /* ───────── Payroll records (June 2025) ───────── */
  payroll: [
    { id:'PAY-001', empId:'EMP-0001', name:'James Carter',    dept:'Engineering',     title:'VP of Engineering',     basic:10800, hra:3240,  transport:800, bonus:2000, tax:2160, pf:1296, other:400, status:'Processed', month:'Jun 2025' },
    { id:'PAY-002', empId:'EMP-0002', name:'Priya Sharma',    dept:'Engineering',     title:'Sr. Frontend Engineer', basic:8500,  hra:2550,  transport:800, bonus:500,  tax:1700, pf:1020, other:200, status:'Processed', month:'Jun 2025' },
    { id:'PAY-003', empId:'EMP-0003', name:'Marcus Lee',      dept:'Marketing',       title:'Brand Strategist',      basic:6800,  hra:2040,  transport:600, bonus:400,  tax:1360, pf:816,  other:150, status:'Processed', month:'Jun 2025' },
    { id:'PAY-004', empId:'EMP-0004', name:'Anna Johnson',    dept:'Human Resources', title:'HR Specialist',         basic:5800,  hra:1740,  transport:600, bonus:300,  tax:1160, pf:696,  other:100, status:'Processed', month:'Jun 2025' },
    { id:'PAY-005', empId:'EMP-0005', name:'David Kim',       dept:'Finance',         title:'Financial Analyst',     basic:7200,  hra:2160,  transport:700, bonus:600,  tax:1440, pf:864,  other:180, status:'Pending',   month:'Jun 2025' },
    { id:'PAY-006', empId:'EMP-0006', name:'Sofia Rodriguez', dept:'Sales',           title:'Sales Manager',         basic:7500,  hra:2250,  transport:700, bonus:1200, tax:1500, pf:900,  other:200, status:'Processed', month:'Jun 2025' },
    { id:'PAY-007', empId:'EMP-0007', name:'Ryan Brooks',     dept:'Operations',      title:'Operations Lead',       basic:6400,  hra:1920,  transport:600, bonus:0,    tax:1280, pf:768,  other:120, status:'Pending',   month:'Jun 2025' },
    { id:'PAY-008', empId:'EMP-0008', name:'Emily Chen',      dept:'Product',         title:'Product Manager',       basic:9000,  hra:2700,  transport:800, bonus:800,  tax:1800, pf:1080, other:220, status:'Processed', month:'Jun 2025' },
    { id:'PAY-009', empId:'EMP-0009', name:'Oliver Grant',    dept:'Design',          title:'UX Lead',               basic:7800,  hra:2340,  transport:700, bonus:500,  tax:1560, pf:936,  other:160, status:'Processed', month:'Jun 2025' },
    { id:'PAY-010', empId:'EMP-0010', name:'Natasha Williams',dept:'Engineering',     title:'Backend Engineer',      basic:8200,  hra:2460,  transport:800, bonus:600,  tax:1640, pf:984,  other:200, status:'Draft',     month:'Jun 2025' },
    { id:'PAY-011', empId:'EMP-0011', name:'Carlos Mendez',   dept:'Sales',           title:'Account Executive',     basic:6200,  hra:1860,  transport:600, bonus:900,  tax:1240, pf:744,  other:140, status:'Processed', month:'Jun 2025' },
    { id:'PAY-012', empId:'EMP-0012', name:'Jennifer Patel',  dept:'Human Resources', title:'Recruiter',             basic:5400,  hra:1620,  transport:500, bonus:200,  tax:1080, pf:648,  other:100, status:'Processed', month:'Jun 2025' },
  ],

  /* ───────── Leave requests ───────── */
  leaves: [
    { id:'LV-001', empId:'EMP-0003', name:'Marcus Lee',       dept:'Marketing',       type:'Annual',    from:'2025-07-01', to:'2025-07-03', days:3, status:'Pending',  appliedOn:'2025-06-18' },
    { id:'LV-002', empId:'EMP-0005', name:'David Kim',        dept:'Finance',         type:'Sick',      from:'2025-06-25', to:'2025-06-27', days:3, status:'Approved', appliedOn:'2025-06-24' },
    { id:'LV-003', empId:'EMP-0004', name:'Anna Johnson',     dept:'Human Resources', type:'Casual',    from:'2025-07-10', to:'2025-07-10', days:1, status:'Pending',  appliedOn:'2025-06-20' },
    { id:'LV-004', empId:'EMP-0006', name:'Sofia Rodriguez',  dept:'Sales',           type:'Annual',    from:'2025-07-15', to:'2025-07-19', days:5, status:'Approved', appliedOn:'2025-06-10' },
    { id:'LV-005', empId:'EMP-0007', name:'Ryan Brooks',      dept:'Operations',      type:'Emergency', from:'2025-06-20', to:'2025-06-21', days:2, status:'Approved', appliedOn:'2025-06-20' },
    { id:'LV-006', empId:'EMP-0010', name:'Natasha Williams', dept:'Engineering',     type:'Sick',      from:'2025-06-28', to:'2025-06-30', days:3, status:'Pending',  appliedOn:'2025-06-27' },
    { id:'LV-007', empId:'EMP-0009', name:'Oliver Grant',     dept:'Design',          type:'Casual',    from:'2025-07-05', to:'2025-07-05', days:1, status:'Rejected', appliedOn:'2025-06-22' },
    { id:'LV-008', empId:'EMP-0008', name:'Emily Chen',       dept:'Product',         type:'Annual',    from:'2025-08-01', to:'2025-08-08', days:8, status:'Pending',  appliedOn:'2025-06-15' },
    { id:'LV-009', empId:'EMP-0002', name:'Priya Sharma',     dept:'Engineering',     type:'Casual',    from:'2025-07-12', to:'2025-07-12', days:1, status:'Approved', appliedOn:'2025-06-25' },
    { id:'LV-010', empId:'EMP-0011', name:'Carlos Mendez',    dept:'Sales',           type:'Sick',      from:'2025-07-02', to:'2025-07-03', days:2, status:'Rejected', appliedOn:'2025-06-26' },
    { id:'LV-011', empId:'EMP-0012', name:'Jennifer Patel',   dept:'Human Resources', type:'Maternity', from:'2025-09-01', to:'2025-11-30', days:90,status:'Approved', appliedOn:'2025-06-01' },
    { id:'LV-012', empId:'EMP-0014', name:'Rachel Adams',     dept:'Finance',         type:'Unpaid',    from:'2025-07-20', to:'2025-07-25', days:6, status:'Pending',  appliedOn:'2025-06-28' },
  ],

  /* ───────── Today's attendance snapshot ───────── */
  attendanceToday: [
    { empId:'EMP-0001', name:'James Carter',    dept:'Engineering',     status:'Present'  },
    { empId:'EMP-0002', name:'Priya Sharma',    dept:'Engineering',     status:'Present'  },
    { empId:'EMP-0003', name:'Marcus Lee',      dept:'Marketing',       status:'Late'     },
    { empId:'EMP-0004', name:'Anna Johnson',    dept:'Human Resources', status:'Present'  },
    { empId:'EMP-0005', name:'David Kim',       dept:'Finance',         status:'On Leave' },
    { empId:'EMP-0006', name:'Sofia Rodriguez', dept:'Sales',           status:'Present'  },
    { empId:'EMP-0007', name:'Ryan Brooks',     dept:'Operations',      status:'Absent'   },
    { empId:'EMP-0008', name:'Emily Chen',      dept:'Product',         status:'Present'  },
    { empId:'EMP-0009', name:'Oliver Grant',    dept:'Design',          status:'Present'  },
    { empId:'EMP-0010', name:'Natasha Williams',dept:'Engineering',     status:'Present'  },
    { empId:'EMP-0011', name:'Carlos Mendez',   dept:'Sales',           status:'Present'  },
    { empId:'EMP-0012', name:'Jennifer Patel',  dept:'Human Resources', status:'Present'  },
  ],

};
