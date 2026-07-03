/* =============================================
   REGISTER PAGE — EMSPro
   Vanilla JavaScript — no frameworks
   ============================================= */

(function () {
  'use strict';
  const API_BASE_URL = "https://employee-management-system-jt3h.onrender.com";

  /* ── DOM refs ─────────────────────────────── */
  const form            = document.getElementById('registerForm');
  const fullNameInput   = document.getElementById('fullName');
  const emailInput      = document.getElementById('email');
  const passwordInput   = document.getElementById('password');
  const confirmInput    = document.getElementById('confirmPassword');
  const roleSelect      = document.getElementById('role');
  const termsCheck      = document.getElementById('terms');
  const submitBtn       = document.getElementById('submitBtn');
  const btnSpinner      = document.getElementById('btnSpinner');
  const alertBox        = document.getElementById('alertBox');

  /* strength bar */
  const strengthBar     = document.getElementById('strengthBar');
  const strengthFill    = document.getElementById('strengthFill');
  const strengthLabel   = document.getElementById('strengthLabel');

  /* eye toggles */
  const togglePassword  = document.getElementById('togglePassword');
  const eyeIcon1        = document.getElementById('eyeIcon1');
  const toggleConfirm   = document.getElementById('toggleConfirm');
  const eyeIcon2        = document.getElementById('eyeIcon2');

  /* ── Helpers ──────────────────────────────── */

  function getErr(id)  { return document.getElementById('err-' + id); }
  function getFg(id)   { return document.getElementById('fg-'  + id); }

  function showError(inputEl, errId, message) {
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
    const el = getErr(errId);
    if (el) el.textContent = message;
  }

  function showValid(inputEl, errId) {
    inputEl.classList.remove('is-invalid');
    inputEl.classList.add('is-valid');
    const el = getErr(errId);
    if (el) el.textContent = '';
  }

  function clearState(inputEl, errId) {
    inputEl.classList.remove('is-invalid', 'is-valid');
    const el = getErr(errId);
    if (el) el.textContent = '';
  }

  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  }

  /* ── Alert box ────────────────────────────── */

  function showAlert(type, message) {
    alertBox.className = 'alert-box show ' + type;
    const icon = type === 'success'
      ? '<i class="fa-solid fa-circle-check"></i>'
      : '<i class="fa-solid fa-triangle-exclamation"></i>';
    alertBox.innerHTML = icon + '<span>' + message + '</span>';
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function hideAlert() {
    alertBox.className = 'alert-box';
    alertBox.innerHTML = '';
  }

  /* ── Password strength ────────────────────── */

  function measureStrength(pwd) {
    let score = 0;
    if (pwd.length >= 8)  score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score; // 0–5
  }

  const STRENGTH_CONFIG = [
    { label: '',          color: 'transparent', pct:   0 },
    { label: 'Very weak', color: '#EF4444',     pct:  20 },
    { label: 'Weak',      color: '#F59E0B',     pct:  40 },
    { label: 'Fair',      color: '#EAB308',     pct:  60 },
    { label: 'Strong',    color: '#10B981',     pct:  80 },
    { label: 'Very strong', color: '#059669',   pct: 100 },
  ];

  function updateStrength(pwd) {
    if (!pwd) {
      strengthBar.classList.remove('show');
      strengthLabel.classList.remove('show');
      strengthFill.style.width = '0%';
      strengthLabel.textContent = '';
      return;
    }
    const score  = measureStrength(pwd);
    const cfg    = STRENGTH_CONFIG[score];
    strengthBar.classList.add('show');
    strengthLabel.classList.add('show');
    strengthFill.style.width      = cfg.pct + '%';
    strengthFill.style.background = cfg.color;
    strengthLabel.textContent     = cfg.label;
    strengthLabel.style.color     = cfg.color;
  }

  /* ── Eye toggle ───────────────────────────── */

  function toggleVisibility(inputEl, iconEl) {
    const isHidden = inputEl.type === 'password';
    inputEl.type   = isHidden ? 'text' : 'password';
    iconEl.className = isHidden ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
  }

  togglePassword.addEventListener('click', () => toggleVisibility(passwordInput, eyeIcon1));
  toggleConfirm.addEventListener('click',  () => toggleVisibility(confirmInput,  eyeIcon2));

  /* ── Inline validation — individual fields ── */

  function validateName(blur) {
    const v = fullNameInput.value.trim();
    if (!v) {
      if (blur) showError(fullNameInput, 'name', 'Full name is required.');
      else clearState(fullNameInput, 'name');
      return false;
    }
    if (v.length < 2) {
      showError(fullNameInput, 'name', 'Name must be at least 2 characters.');
      return false;
    }
    showValid(fullNameInput, 'name');
    return true;
  }

  function validateEmail(blur) {
    const v = emailInput.value.trim();
    if (!v) {
      if (blur) showError(emailInput, 'email', 'Email address is required.');
      else clearState(emailInput, 'email');
      return false;
    }
    if (!isValidEmail(v)) {
      showError(emailInput, 'email', 'Enter a valid email address.');
      return false;
    }
    showValid(emailInput, 'email');
    return true;
  }

  function validatePassword(blur) {
    const v = passwordInput.value;
    updateStrength(v);
    if (!v) {
      if (blur) showError(passwordInput, 'password', 'Password is required.');
      else clearState(passwordInput, 'password');
      return false;
    }
    if (v.length < 8) {
      showError(passwordInput, 'password', 'Password must be at least 8 characters.');
      return false;
    }
    showValid(passwordInput, 'password');
    return true;
  }

  function validateConfirm(blur) {
    const v  = confirmInput.value;
    const pw = passwordInput.value;
    if (!v) {
      if (blur) showError(confirmInput, 'confirm', 'Please confirm your password.');
      else clearState(confirmInput, 'confirm');
      return false;
    }
    if (v !== pw) {
      showError(confirmInput, 'confirm', 'Passwords do not match.');
      return false;
    }
    showValid(confirmInput, 'confirm');
    return true;
  }

  function validateRole(blur) {
    const v = roleSelect.value;
    if (!v) {
      if (blur) showError(roleSelect, 'role', 'Please select a role.');
      else clearState(roleSelect, 'role');
      return false;
    }
    showValid(roleSelect, 'role');
    return true;
  }

  function validateTerms() {
    const el = getErr('terms');
    if (!termsCheck.checked) {
      if (el) el.textContent = 'You must agree to the Terms & Privacy Policy.';
      return false;
    }
    if (el) el.textContent = '';
    return true;
  }

  /* ── Live listeners ───────────────────────── */

  fullNameInput.addEventListener('blur',   () => validateName(true));
  fullNameInput.addEventListener('input',  () => { if (fullNameInput.classList.contains('is-invalid')) validateName(false); });

  emailInput.addEventListener('blur',   () => validateEmail(true));
  emailInput.addEventListener('input',  () => { if (emailInput.classList.contains('is-invalid')) validateEmail(false); });

  passwordInput.addEventListener('blur',  () => validatePassword(true));
  passwordInput.addEventListener('input', () => {
    validatePassword(false);
    if (confirmInput.value) validateConfirm(false);
  });

  confirmInput.addEventListener('blur',  () => validateConfirm(true));
  confirmInput.addEventListener('input', () => { if (confirmInput.classList.contains('is-invalid')) validateConfirm(false); });

  roleSelect.addEventListener('change', () => validateRole(true));
  roleSelect.addEventListener('blur',   () => validateRole(true));

  termsCheck.addEventListener('change', validateTerms);

  /* ── Full form validation ─────────────────── */

  function validateAll() {
    const n = validateName(true);
    const e = validateEmail(true);
    const p = validatePassword(true);
    const c = validateConfirm(true);
    const r = validateRole(true);
    const t = validateTerms();
    return n && e && p && c && r && t;
  }

  /* ── Submit ───────────────────────────────── */

  /* ── Submit ───────────────────────────────── */

  form.addEventListener("submit", async function (ev) {

      ev.preventDefault();

      hideAlert();

      if (!validateAll()) {

          showAlert("error", "Please fix the errors above before continuing.");

          const firstInvalid = form.querySelector(".is-invalid");

          if (firstInvalid) {
              firstInvalid.scrollIntoView({
                  behavior: "smooth",
                  block: "center"
              });

              firstInvalid.focus();
          }

          return;
      }

      setLoading(true);

      try {

          const response = await fetch("https://employee-management-system-jt3h.onrender.com/api/auth/register", {

              method: "POST",

              headers: {
                  "Content-Type": "application/json"
              },

              body: JSON.stringify({

                  fullName: fullNameInput.value.trim(),

                  email: emailInput.value.trim(),

                  password: passwordInput.value,

                  role: roleSelect.value

              })

          });

          const data = await response.json();

          setLoading(false);

          if (!response.ok) {

              showAlert("error", data.message || "Registration Failed");

              return;

          }

          showAlert("success", "Account created successfully! Redirecting to Sign In...");

          form.reset();

          clearAllStates();

          updateStrength("");

          setTimeout(function () {

              window.location.href = "index.html";

          }, 2000);

      }

      catch (error) {

          setLoading(false);

          showAlert("error", "Cannot connect to the server.");

      }

  });


  /* ── Loading state ────────────────────────── */

  function setLoading(on) {
    submitBtn.disabled = on;
    btnSpinner.classList.toggle('show', on);
    submitBtn.querySelector('.btn-text').textContent = on ? 'Creating Account…' : 'Create Account';
  }

  /* ── Clear all states ─────────────────────── */

  function clearAllStates() {
    [fullNameInput, emailInput, passwordInput, confirmInput, roleSelect].forEach(function (el) {
      el.classList.remove('is-valid', 'is-invalid');
    });
    ['name','email','password','confirm','role','terms'].forEach(function (id) {
      const el = getErr(id);
      if (el) el.textContent = '';
    });
  }

  /* ── Subtle entrance focus ────────────────── */
  setTimeout(function () {
    fullNameInput.focus();
  }, 500);

})();
