/**
 * settings.js — System Settings
 *
 * All preferences are read from / written to localStorage under
 * a per-user key (mirrors the pattern used in profile.js), so
 * settings persist across reloads without a backend.
 *
 * No dummy/mock settings are hardcoded — every toggle starts at
 * a sensible default the first time, then reflects whatever the
 * user actually saved.
 *
 * API-ready: replace loadSettings()/saveSettings() body with
 * fetch('/api/settings') GET/PUT calls — the rest of the file
 * (UI wiring) needs no changes.
 */

'use strict';

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
        .substring(0, 2)
        .toUpperCase();

    document.querySelectorAll("[data-user-initials]").forEach(el => {
        el.textContent = initials;
    });

}


const sessionUser   = JSON.parse(sessionStorage.getItem('ems_user') || '{}');
const SETTINGS_KEY  = `ems_settings_${sessionUser.email || 'guest'}`;

/* ════════════════════════════════════════
   DEFAULTS
════════════════════════════════════════ */
function defaultSettings() {
  return {
    theme: {
      color: 'blue',        // blue | violet | green | rose | amber | slate
      density: 'comfortable', // comfortable | compact
      darkMode: false,
    },
    notifications: {
      emailLeave:     true,
      emailPayroll:   true,
      emailAttendance:false,
      pushNotif:      true,
      weeklyDigest:   true,
      soundAlerts:    false,
    },
    security: {
      twoFactor:       false,
      loginAlerts:     true,
      sessionTimeout:  '30',  // minutes
    },
    preferences: {
      language: 'en',
      timezone: 'UTC-05:00',
      dateFormat: 'MM/DD/YYYY',
      startPage: 'dashboard',
    },
  };
}

let settings = loadSettings();

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const def = defaultSettings();
      return {
        theme: { ...def.theme, ...parsed.theme },
        notifications: { ...def.notifications, ...parsed.notifications },
        security: { ...def.security, ...parsed.security },
        preferences: { ...def.preferences, ...parsed.preferences },
      };
    }
  } catch (e) { /* ignore */ }
  return defaultSettings();
}

function saveSettingsToStorage() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* ════════════════════════════════════════
   SIDE NAV SWITCHING
════════════════════════════════════════ */
document.querySelectorAll('.settings-nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.settings-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');
  });
});

/* ════════════════════════════════════════
   THEME PANEL
════════════════════════════════════════ */
const THEME_COLORS = {
  blue:   '#2563EB',
  violet: '#7C3AED',
  green:  '#059669',
  rose:   '#E11D48',
  amber:  '#D97706',
  slate:  '#475569',
};

function renderThemeSwatches() {
  document.querySelectorAll('.theme-swatch').forEach(sw => {
    sw.classList.toggle('selected', sw.dataset.color === settings.theme.color);
  });
}

document.querySelectorAll('.theme-swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    settings.theme.color = sw.dataset.color;
    renderThemeSwatches();
    EMS.toast(`Theme color set to ${sw.dataset.color}. Save to apply.`, 'info');
  });
});

function renderDensity() {
  document.querySelectorAll('.density-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.density === settings.theme.density);
  });
}
document.querySelectorAll('.density-card').forEach(card => {
  card.addEventListener('click', () => {
    settings.theme.density = card.dataset.density;
    renderDensity();
  });
});

document.getElementById('toggleDarkMode').addEventListener('change', function () {
  settings.theme.darkMode = this.checked;
});

/* ════════════════════════════════════════
   NOTIFICATIONS PANEL
════════════════════════════════════════ */
const notifToggleMap = {
  toggleEmailLeave:      'emailLeave',
  toggleEmailPayroll:    'emailPayroll',
  toggleEmailAttendance: 'emailAttendance',
  togglePushNotif:       'pushNotif',
  toggleWeeklyDigest:    'weeklyDigest',
  toggleSoundAlerts:     'soundAlerts',
};
Object.entries(notifToggleMap).forEach(([id, key]) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('change', function () { settings.notifications[key] = this.checked; });
});

/* ════════════════════════════════════════
   SECURITY PANEL
════════════════════════════════════════ */
document.getElementById('toggleTwoFactor').addEventListener('change', function () {
  settings.security.twoFactor = this.checked;
  EMS.toast(this.checked ? '2FA will be enabled on save.' : '2FA will be disabled on save.', 'info');
});
document.getElementById('toggleLoginAlerts').addEventListener('change', function () {
  settings.security.loginAlerts = this.checked;
});
document.getElementById('sessionTimeoutSelect').addEventListener('change', function () {
  settings.security.sessionTimeout = this.value;
});

/* Sign out all other sessions */
document.getElementById('btnSignOutAll').addEventListener('click', async () => {
  if (!confirm('Sign out of all other active sessions? You will remain logged in on this device.')) return;
  await EMS.fakeApi(null, 700);
  EMS.toast('All other sessions have been signed out.', 'success');
});

/* Delete account (danger zone) */
document.getElementById('btnDeleteAccount').addEventListener('click', () => {
  const confirmText = prompt('Type DELETE to permanently remove your account:');
  if (confirmText === 'DELETE') {
    EMS.toast('Account deletion requested. This is a demo — no data was removed.', 'warning');
  } else if (confirmText !== null) {
    EMS.toast('Confirmation text did not match. Account not deleted.', 'danger');
  }
});

/* ════════════════════════════════════════
   PREFERENCES PANEL
════════════════════════════════════════ */
document.getElementById('languageSelect').addEventListener('change', function () { settings.preferences.language = this.value; });
document.getElementById('timezoneSelect').addEventListener('change', function () { settings.preferences.timezone = this.value; });
document.getElementById('dateFormatSelect').addEventListener('change', function () { settings.preferences.dateFormat = this.value; });
document.getElementById('startPageSelect').addEventListener('change', function () { settings.preferences.startPage = this.value; });

/* ════════════════════════════════════════
   RENDER ALL FORM CONTROLS FROM STATE
════════════════════════════════════════ */
function renderAll() {
  renderThemeSwatches();
  renderDensity();

  document.getElementById('toggleDarkMode').checked = settings.theme.darkMode;

  document.getElementById('toggleEmailLeave').checked      = settings.notifications.emailLeave;
  document.getElementById('toggleEmailPayroll').checked    = settings.notifications.emailPayroll;
  document.getElementById('toggleEmailAttendance').checked = settings.notifications.emailAttendance;
  document.getElementById('togglePushNotif').checked       = settings.notifications.pushNotif;
  document.getElementById('toggleWeeklyDigest').checked    = settings.notifications.weeklyDigest;
  document.getElementById('toggleSoundAlerts').checked     = settings.notifications.soundAlerts;

  document.getElementById('toggleTwoFactor').checked   = settings.security.twoFactor;
  document.getElementById('toggleLoginAlerts').checked = settings.security.loginAlerts;
  document.getElementById('sessionTimeoutSelect').value = settings.security.sessionTimeout;

  document.getElementById('languageSelect').value   = settings.preferences.language;
  document.getElementById('timezoneSelect').value   = settings.preferences.timezone;
  document.getElementById('dateFormatSelect').value = settings.preferences.dateFormat;
  document.getElementById('startPageSelect').value  = settings.preferences.startPage;
}

/* ════════════════════════════════════════
   SAVE (global save bar, saves whichever
   panel is active — in this demo it saves
   everything at once for simplicity)
════════════════════════════════════════ */
document.querySelectorAll('.btn-save-settings').forEach(btn => {
  btn.addEventListener('click', async () => {
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving…';
    btn.disabled = true;
    await EMS.fakeApi(null, 700);
    saveSettingsToStorage();
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Save Changes';
    btn.disabled = false;
    EMS.toast('Settings saved successfully!', 'success');
  });
});

document.querySelectorAll('.btn-reset-settings').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!confirm('Reset this section to default values?')) return;
    settings = defaultSettings();
    renderAll();
    EMS.toast('Settings reset to defaults. Click Save to apply.', 'info');
  });
});

/* ════════════════════════════════════════
   INIT
════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', async () => {
  await EMS.fakeApi(null, 400);
  renderAll();
});
