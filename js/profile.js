/**
 * profile.js — My Profile
 *
 * The logged-in user's identity (name, email, role) comes from
 * sessionStorage (set during login — see login.js). Extended
 * profile fields entered here (phone, address, skills, etc.)
 * are persisted to localStorage under the user's email, so they
 * survive a page refresh without needing a backend yet.
 *
 * API-ready: swap the localStorage read/write in loadProfile()
 * and saveProfile() with fetch('/api/profile') calls.
 */

'use strict';

async function loadTopRightProfile() {

    try {

        const token = localStorage.getItem("token");
        const currentUser = JSON.parse(localStorage.getItem("user"));

        const response = await fetch(
            "http://localhost:8080/api/profile/" + currentUser.email,
            {
                headers: {
                    Authorization: "Bearer " + token
                }
            }
        );

        if (!response.ok) return;

        const user = await response.json();

        const initials = user.fullName
            .split(" ")
            .map(x => x[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        document.querySelectorAll("[data-user-name]").forEach(el => {
            el.textContent = user.fullName;
        });

        document.querySelectorAll("[data-user-role]").forEach(el => {
            el.textContent = user.role;
        });

        document.querySelectorAll("[data-user-email]").forEach(el => {
            el.textContent = user.email;
        });

        document.querySelectorAll("[data-user-initials]").forEach(el => {
            el.textContent = initials;
        });

    } catch (err) {

        console.error(err);

    }

}

/* ════════════════════════════════════════
   SESSION USER  (no dummy data — comes from login)
════════════════════════════════════════ */
const sessionUser = JSON.parse(sessionStorage.getItem('ems_user') || '{}');
const STORAGE_KEY  = `ems_profile_${sessionUser.email || 'guest'}`;

/* ════════════════════════════════════════
   DEFAULT EXTENDED PROFILE SHAPE
   (only used the very first time — afterwards
   real values from localStorage take over)
════════════════════════════════════════ */
function defaultProfile() {
  return {
    name:     sessionUser.name  || 'Admin User',
    email:    sessionUser.email || '',
    role:     sessionUser.role  || 'Administrator',
    phone:    '',
    location: '',
    dept:     '',
    empId:    '',
    joinDate: '',
    bio:      '',
    skills:   [],
    education:[],
    experience:[],
  };
}

let profile = {};

async function loadProfile() {

    const token = localStorage.getItem("token");
    const currentUser = JSON.parse(localStorage.getItem("user"));

    const response = await fetch(
        "http://localhost:8080/api/profile/" + currentUser.email,
        {
            headers: {
                Authorization: "Bearer " + token
            }
        }
    );

    profile = await response.json();

    renderHeader();
    renderForm();

}

function saveProfileToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/* ════════════════════════════════════════
   INITIALS / AVATAR
════════════════════════════════════════ */
function initials(name) {
  return (name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

/* ════════════════════════════════════════
   RENDER HEADER
════════════════════════════════════════ */
function renderHeader() {
  document.getElementById('profAvatarXl').textContent = initials(profile.fullName);
  document.getElementById('profNameHeader').textContent = profile.fullName;
  document.getElementById('profRoleHeader').textContent = profile.role;
  document.getElementById('profEmailSmall').textContent = profile.email;

  /* Sidebar info card */
  document.getElementById('infoEmail').textContent    = profile.email || '—';
  document.getElementById('infoPhone').textContent     = profile.phone || '—';
  document.getElementById('infoLocation').textContent = profile.location || '—';
  document.getElementById('infoDept').textContent      = profile.department|| '—';
  document.getElementById('infoEmpId').textContent     = profile.employeeId || '—';
  document.getElementById('infoJoinDate').textContent  = profile.joiningDate ? EMS.formatDate(profile.joiningDate) : '—';
}

/* ════════════════════════════════════════
   RENDER FORM (Personal Info tab)
════════════════════════════════════════ */
function renderForm() {
  document.getElementById('fName').value     = profile.fullName;
  document.getElementById('fEmail').value    = profile.email;
  document.getElementById('fPhone').value    = profile.phone;
  document.getElementById('fLocation').value = profile.location;
  document.getElementById('fDept').value     = profile.department;
  document.getElementById('fEmpId').value    = profile.employeeId;
  document.getElementById('fJoinDate').value = profile.joiningDate;
  document.getElementById('fRole').value     = profile.designation;
  document.getElementById('fBio').value      = profile.bio;
}

/* ════════════════════════════════════════
   SAVE PROFILE (Personal Info form)
════════════════════════════════════════ */
document.getElementById('btnSaveProfile').addEventListener('click', async () => {
  const btn = document.getElementById('btnSaveProfile');
  const name = document.getElementById('fName').value.trim();
  const email = document.getElementById('fEmail').value.trim();

  if (!name) { EMS.toast('Name is required.', 'warning'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { EMS.toast('Enter a valid email.', 'warning'); return; }

  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
  btn.disabled = true;
  await EMS.fakeApi(null, 700);

  profile.fullName     = name;
  profile.email    = email;
  profile.phone    = document.getElementById('fPhone').value.trim();
  profile.location = document.getElementById('fLocation').value.trim();
  profile.department     = document.getElementById('fDept').value.trim();
  profile.employeeId    = document.getElementById('fEmpId').value.trim();
  profile.joinDate = document.getElementById('fJoinDate').value;
  profile.bio      = document.getElementById('fBio').value.trim();

  saveProfileToStorage();
  renderHeader();

  /* Also update session display name/avatar across pages */
  //sessionUser.name = profile.fullName;
  //sessionStorage.setItem('ems_user', JSON.stringify(sessionUser));
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = profile.fullName);
  document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials(profile.fullName));

  btn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
  btn.disabled = false;
  EMS.toast('Profile updated successfully!', 'success');
});

document.getElementById('btnCancelProfile').addEventListener('click', () => {
  renderForm();
  EMS.toast('Changes discarded.', 'info');
});

/* ════════════════════════════════════════
   AVATAR UPLOAD (preview only, no backend)
════════════════════════════════════════ */
document.getElementById('avatarFileInput')?.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) { EMS.toast('Please select an image file.', 'warning'); return; }

  const reader = new FileReader();
  reader.onload = ev => {
    const avatarEl = document.getElementById('profAvatarXl');
    avatarEl.innerHTML = `<img src="${ev.target.result}" alt="Profile photo" />`;
    EMS.toast('Photo preview updated — click Save to confirm.', 'info');
  };
  reader.readAsDataURL(file);
});

/* ════════════════════════════════════════
   SKILLS EDITOR
════════════════════════════════════════ */
function renderSkills() {
  const wrap = document.getElementById('skillChipsWrap');
  if (!wrap) return;

  if (!profile.skills.length) {
    wrap.innerHTML = `<span style="font-size:12px;color:var(--text-muted);">No skills added yet — add your first one below.</span>`;
    return;
  }

  wrap.innerHTML = profile.skills.map((s, i) => `
    <span class="skill-chip">
      ${s}
      <button onclick="removeSkill(${i})" aria-label="Remove ${s}"><i class="bi bi-x"></i></button>
    </span>`).join('');
}

window.removeSkill = idx => {
  profile.skills.splice(idx, 1);
  saveProfileToStorage();
  renderSkills();
  EMS.toast('Skill removed.', 'info');
};

document.getElementById('btnAddSkill').addEventListener('click', addSkillFromInput);
document.getElementById('skillInput').addEventListener('keypress', e => {
  if (e.key === 'Enter') { e.preventDefault(); addSkillFromInput(); }
});

function addSkillFromInput() {
  const input = document.getElementById('skillInput');
  const val = input.value.trim();
  if (!val) return;
  if (profile.skills.includes(val)) { EMS.toast('Skill already added.', 'warning'); return; }
  profile.skills.push(val);
  saveProfileToStorage();
  renderSkills();
  input.value = '';
}

/* ════════════════════════════════════════
   EXPERIENCE TIMELINE
════════════════════════════════════════ */
function renderExperience() {
  const list = document.getElementById('experienceList');
  if (!list) return;

  if (!profile.experience.length) {
    list.innerHTML = `<p style="font-size:12.5px;color:var(--text-muted);text-align:center;padding:16px 0;">No experience entries yet.</p>`;
    return;
  }

  list.innerHTML = profile.experience.map((exp, i) => `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-actions">
        <button class="btn-icon danger" style="width:26px;height:26px;" onclick="removeExperience(${i})" title="Remove">
          <i class="bi bi-trash3" style="font-size:12px;"></i>
        </button>
      </div>
      <div class="timeline-title">${exp.title}</div>
      <div class="timeline-org">${exp.company}</div>
      <div class="timeline-date">${exp.start} — ${exp.end || 'Present'}</div>
      ${exp.desc ? `<div class="timeline-desc">${exp.desc}</div>` : ''}
    </div>`).join('');
}

window.removeExperience = idx => {
  profile.experience.splice(idx, 1);
  saveProfileToStorage();
  renderExperience();
  EMS.toast('Experience entry removed.', 'info');
};

document.getElementById('expForm').addEventListener('submit', e => {
  e.preventDefault();
  const title   = document.getElementById('expTitle').value.trim();
  const company = document.getElementById('expCompany').value.trim();
  const start   = document.getElementById('expStart').value;
  const end     = document.getElementById('expEnd').value;
  const desc    = document.getElementById('expDesc').value.trim();

  if (!title || !company || !start) { EMS.toast('Title, company and start date are required.', 'warning'); return; }

  profile.experience.unshift({ title, company, start, end, desc });
  saveProfileToStorage();
  renderExperience();
  e.target.reset();
  bootstrap.Collapse.getOrCreateInstance(document.getElementById('expFormCollapse')).hide();
  EMS.toast('Experience added!', 'success');
});

/* ════════════════════════════════════════
   EDUCATION TIMELINE
════════════════════════════════════════ */
function renderEducation() {
  const list = document.getElementById('educationList');
  if (!list) return;

  if (!profile.education.length) {
    list.innerHTML = `<p style="font-size:12.5px;color:var(--text-muted);text-align:center;padding:16px 0;">No education entries yet.</p>`;
    return;
  }

  list.innerHTML = profile.education.map((ed, i) => `
    <div class="timeline-item">
      <div class="timeline-dot" style="background:#0891B2;box-shadow:0 0 0 2px #CFFAFE;"></div>
      <div class="timeline-actions">
        <button class="btn-icon danger" style="width:26px;height:26px;" onclick="removeEducation(${i})" title="Remove">
          <i class="bi bi-trash3" style="font-size:12px;"></i>
        </button>
      </div>
      <div class="timeline-title">${ed.degree}</div>
      <div class="timeline-org" style="color:#0891B2;">${ed.school}</div>
      <div class="timeline-date">${ed.year}</div>
    </div>`).join('');
}

window.removeEducation = idx => {
  profile.education.splice(idx, 1);
  saveProfileToStorage();
  renderEducation();
  EMS.toast('Education entry removed.', 'info');
};

document.getElementById('eduForm').addEventListener('submit', e => {
  e.preventDefault();
  const degree = document.getElementById('eduDegree').value.trim();
  const school  = document.getElementById('eduSchool').value.trim();
  const year    = document.getElementById('eduYear').value.trim();

  if (!degree || !school || !year) { EMS.toast('All fields are required.', 'warning'); return; }

  profile.education.unshift({ degree, school, year });
  saveProfileToStorage();
  renderEducation();
  e.target.reset();
  bootstrap.Collapse.getOrCreateInstance(document.getElementById('eduFormCollapse')).hide();
  EMS.toast('Education added!', 'success');
});

/* ════════════════════════════════════════
   CHANGE PASSWORD
════════════════════════════════════════ */
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8)              score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  return score; // 0–4
}

document.getElementById('newPassword').addEventListener('input', function () {
  const score   = passwordStrength(this.value);
  const segs    = document.querySelectorAll('.pw-strength-seg');
  const label   = document.getElementById('pwStrengthLabel');
  const colors  = ['#EF4444', '#EF4444', '#F59E0B', '#10B981', '#059669'];
  const labels  = ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'];

  segs.forEach((seg, i) => {
    seg.style.background = i < score ? colors[score] : 'var(--border)';
  });

  if (this.value) {
    label.textContent = labels[score];
    label.style.color = colors[score];
  } else {
    label.textContent = '';
  }
});

document.getElementById('togglePwOld').addEventListener('click', function () {
  togglePwVisibility('oldPassword', this);
});
document.getElementById('togglePwNew').addEventListener('click', function () {
  togglePwVisibility('newPassword', this);
});
document.getElementById('togglePwConfirm').addEventListener('click', function () {
  togglePwVisibility('confirmPassword', this);
});

function togglePwVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const isPwd = input.type === 'password';
  input.type = isPwd ? 'text' : 'password';
  btn.innerHTML = isPwd ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
}

document.getElementById('changePasswordForm').addEventListener('submit', async e => {
  e.preventDefault();
  const oldPw = document.getElementById('oldPassword').value;
  const newPw = document.getElementById('newPassword').value;
  const confirmPw = document.getElementById('confirmPassword').value;

  if (!oldPw || !newPw || !confirmPw) { EMS.toast('All fields are required.', 'warning'); return; }
  if (newPw.length < 8) { EMS.toast('New password must be at least 8 characters.', 'warning'); return; }
  if (newPw !== confirmPw) { EMS.toast('New password and confirmation do not match.', 'danger'); return; }
  if (passwordStrength(newPw) < 2) { EMS.toast('Choose a stronger password.', 'warning'); return; }

  const btn = document.getElementById('btnChangePassword');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating…';
  btn.disabled = true;

  await EMS.fakeApi(null, 900);

  btn.innerHTML = '<i class="bi bi-shield-check"></i> Update Password';
  btn.disabled = false;
  e.target.reset();
  document.querySelectorAll('.pw-strength-seg').forEach(s => s.style.background = 'var(--border)');
  document.getElementById('pwStrengthLabel').textContent = '';
  EMS.toast('Password updated successfully!', 'success');
});

/* ════════════════════════════════════════
   TAB SWITCHING
════════════════════════════════════════ */
document.querySelectorAll('.profile-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.profile-tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
window.addEventListener("DOMContentLoaded", async () => {

    await loadProfile();

    await loadTopRightProfile();

    renderSkills();
    renderExperience();
    renderEducation();

});