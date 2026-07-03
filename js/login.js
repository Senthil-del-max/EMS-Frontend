/**
 * login.js — Login page logic
 * Handles form validation, auth simulation, remember-me, and forgot-password flow.
 */

'use strict';

/* ── Demo credentials ── */
//const DEMO_USERS = [
  //{ email: 'admin@emspro.com',   password: 'Admin@123',   name: 'Sarah Mitchell',  role: 'Super Admin' },
  //{ email: 'hr@emspro.com',      password: 'Hr@123456',   name: 'James Wilson',    role: 'HR Manager' },
  //{ email: 'manager@emspro.com', password: 'Manager@123', name: 'Emily Rodriguez', role: 'Department Manager' },
//];

/* ── DOM refs ── */
const loginForm      = document.getElementById('loginForm');
const emailInput     = document.getElementById('loginEmail');
const passwordInput  = document.getElementById('loginPassword');
const rememberMe     = document.getElementById('rememberMe');
const btnLogin       = document.getElementById('btnLogin');
const loginAlert     = document.getElementById('loginAlert');
const togglePassBtn  = document.getElementById('togglePass');

// Forgot password flow
const forgotLink        = document.getElementById('forgotLink');
const forgotPanel       = document.getElementById('forgotPanel');
const loginFormInner    = document.getElementById('loginFormInner');
const backToLoginBtn    = document.getElementById('backToLogin');
const forgotForm        = document.getElementById('forgotForm');
const forgotEmailInput  = document.getElementById('forgotEmail');
const forgotAlert       = document.getElementById('forgotAlert');

/* ── On load: restore remembered email ── */
document.addEventListener('DOMContentLoaded', () => {
  const remembered = localStorage.getItem('ems_remembered_email');
  if (remembered) {
    emailInput.value = remembered;
    rememberMe.checked = true;
  }
});

/* ── Toggle password visibility ── */
togglePassBtn?.addEventListener('click', () => {
  const isText = passwordInput.type === 'text';
  passwordInput.type = isText ? 'password' : 'text';
  togglePassBtn.innerHTML = isText
    ? '<i class="bi bi-eye-slash"></i>'
    : '<i class="bi bi-eye"></i>';
});

/* ── Real-time validation ── */
emailInput.addEventListener('blur', () => validateEmail());
passwordInput.addEventListener('blur', () => validatePassword());
emailInput.addEventListener('input', () => clearError('emailGroup'));
passwordInput.addEventListener('input', () => clearError('passwordGroup'));

function validateEmail() {
  const val = emailInput.value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!val) {
    return showFieldError('emailGroup', 'Email is required.');
  }
  if (!re.test(val)) {
    return showFieldError('emailGroup', 'Enter a valid email address.');
  }
  clearError('emailGroup');
  return true;
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val) {
    return showFieldError('passwordGroup', 'Password is required.');
  }
  if (val.length < 6) {
    return showFieldError('passwordGroup', 'Password must be at least 6 characters.');
  }
  clearError('passwordGroup');
  return true;
}

function showFieldError(groupId, message) {
  const group = document.getElementById(groupId);
  group.querySelector('input').classList.add('error');
  group.querySelector('.error-msg').textContent = message;
  group.querySelector('.error-msg').classList.add('show');
  return false;
}

function clearError(groupId) {
  const group = document.getElementById(groupId);
  group.querySelector('input').classList.remove('error');
  group.querySelector('.error-msg').classList.remove('show');
}

function showAlert(type, message) {
  loginAlert.className = `login-alert ${type} show`;
  loginAlert.querySelector('span').textContent = message;
}

function hideAlert() {
  loginAlert.classList.remove('show');
}

/* ── Login form submit ── */
loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    hideAlert();

    const emailOk = validateEmail();
    const passOk = validatePassword();

    if (!emailOk || !passOk) return;

    btnLogin.classList.add("loading");
    btnLogin.disabled = true;

    try {

        const response = await fetch("https://employee-management-system-jt3h.onrender.com/api/auth/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                email: emailInput.value.trim(),

                password: passwordInput.value

            })

        });

        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));

        btnLogin.classList.remove("loading");
        btnLogin.disabled = false;

        if (!response.ok) {

            showAlert("error", data.message || "Login Failed");

            return;

        }

        if (rememberMe.checked) {

            localStorage.setItem(
                "ems_remembered_email",
                emailInput.value.trim()
            );

        } else {

            localStorage.removeItem("ems_remembered_email");

        }

        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data));

        sessionStorage.setItem("ems_logged_in", "true");

        showAlert("success", "Login Successful");

        setTimeout(() => {

            window.location.href = "dashboard.html";

        }, 1000);

    } catch (error) {

        btnLogin.classList.remove("loading");
        btnLogin.disabled = false;

        showAlert("error", "Cannot connect to the server.");

    }

});

/* ── Forgot password toggle ── */
forgotLink?.addEventListener('click', (e) => {
  e.preventDefault();
  loginFormInner.classList.add('hidden');
  forgotPanel.classList.add('active');
  forgotEmailInput.focus();
});

backToLoginBtn?.addEventListener('click', () => {
  forgotPanel.classList.remove('active');
  loginFormInner.classList.remove('hidden');
  forgotAlert.classList.remove('show');
});

forgotForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = forgotEmailInput.value.trim();
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !re.test(email)) {
    forgotAlert.className = 'login-alert error show';
    forgotAlert.querySelector('span').textContent = 'Please enter a valid email address.';
    return;
  }

  const submitBtn = forgotForm.querySelector('[type="submit"]');
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  await delay(1400);

  submitBtn.textContent = 'Send Reset Link';
  submitBtn.disabled = false;

  forgotAlert.className = 'login-alert success show';
  forgotAlert.querySelector('span').textContent = 'Password reset link sent! Check your inbox.';
  forgotEmailInput.value = '';
});

/* ── Quick demo-fill buttons ── */
document.querySelectorAll('[data-fill]').forEach(btn => {

    btn.addEventListener('click', () => {

        emailInput.value = "admin@ems.com";
        passwordInput.value = "Admin@123";

        clearError("emailGroup");
        clearError("passwordGroup");

        hideAlert();

    });

});
/* ── Utility ── */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
