function redirectByRole(role) {
  switch (role) {
    case 'Customer': window.location.href = '/stalls.html'; break;
    case 'Vendor': window.location.href = '/vendor-dashboard.html'; break;
    case 'NEAOfficer': window.location.href = '/nea-inspections.html'; break;
    case 'Operator': window.location.href = '/vendor-rentals.html'; break;
    default: window.location.href = '/index.html';
  }
}

async function handleLogin() {
  const emailEl = document.getElementById('email');
  const pwEl = document.getElementById('password');
  if (!emailEl || !pwEl) return;
  const email = emailEl.value.trim();
  const password = pwEl.value;
  const errorDiv = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!errorDiv) return;
  errorDiv.style.display = 'none';

  if (!email || !password) {
    errorDiv.textContent = 'Please enter both email and password';
    errorDiv.style.display = 'block';
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Signing in…';
    }
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.data.token);
    setCurrentUser(data.data.user);
    redirectByRole(data.data.user.role);
  } catch (error) {
    errorDiv.textContent = error.message || 'Login failed. Check your credentials.';
    errorDiv.style.display = 'block';
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }
}

async function handleRegister() {
  const fullName = document.getElementById('fullName')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const password = document.getElementById('password')?.value;
  const confirmPassword = document.getElementById('confirmPassword')?.value;
  const role = document.getElementById('role')?.value;
  const businessName = document.getElementById('businessName')?.value.trim();
  const errorDiv = document.getElementById('register-error');
  const btn = document.getElementById('register-btn');

  if (errorDiv) errorDiv.style.display = 'none';

  if (!fullName || !email || !password || !role) {
    if (errorDiv) {
      errorDiv.textContent = 'All fields are required';
      errorDiv.style.display = 'block';
    }
    return;
  }
  if (password !== confirmPassword) {
    if (errorDiv) {
      errorDiv.textContent = 'Passwords do not match';
      errorDiv.style.display = 'block';
    }
    return;
  }
  if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    if (errorDiv) {
      errorDiv.textContent = 'Password must be at least 8 characters with 1 letter and 1 number';
      errorDiv.style.display = 'block';
    }
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Creating account…';
    }
    const body = { fullName, email, password, role };
    if (role === 'Vendor' && businessName) body.businessName = businessName;

    await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Auto-login
    const loginData = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(loginData.data.token);
    setCurrentUser(loginData.data.user);
    redirectByRole(loginData.data.user.role);
  } catch (error) {
    if (errorDiv) {
      errorDiv.textContent = error.message || 'Registration failed.';
      errorDiv.style.display = 'block';
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  }
}

// Wire up button handlers
document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) loginBtn.addEventListener('click', handleLogin);

  const registerBtn = document.getElementById('register-btn');
  if (registerBtn) registerBtn.addEventListener('click', handleRegister);

  // Allow Enter key to submit on login form
  const pwInput = document.getElementById('password');
  if (pwInput && loginBtn) {
    pwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleLogin();
      }
    });
  }

  const params = new URLSearchParams(window.location.search);
  const googleToken = params.get('token');
  if (googleToken && window.location.pathname.endsWith('/auth-callback.html')) {
    try {
      const payload = JSON.parse(atob(googleToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      setToken(googleToken);
      setCurrentUser({ userId: payload.id, email: payload.email, role: payload.role });
      redirectByRole(payload.role);
    } catch { document.getElementById('message').textContent = 'Sign-in failed. Please try again.'; }
  }

  const googleError = params.get('error');
  if (googleError && document.getElementById('login-error')) {
    document.getElementById('login-error').textContent = googleError;
    document.getElementById('login-error').style.display = 'block';
  }

  const continueBtn = document.getElementById('continue');
  if (continueBtn) continueBtn.addEventListener('click', async () => {
    const registration = params.get('registration');
    const role = document.querySelector('input[name="role"]:checked')?.value;
    const error = document.getElementById('error');
    try {
      const data = await apiFetch('/auth/google/complete', { method: 'POST', body: JSON.stringify({ registration, role }) });
      setToken(data.data.token); setCurrentUser(data.data.user); redirectByRole(data.data.user.role);
    } catch (err) { error.textContent = err.message || 'Unable to create account.'; error.style.display = 'block'; }
  });

  const requestReset = document.getElementById('request-reset');
  if (requestReset) requestReset.addEventListener('click', async () => {
    const message = document.getElementById('message');
    try { const data = await apiFetch('/auth/password-reset/request', { method: 'POST', body: JSON.stringify({ email: document.getElementById('email').value.trim() }) }); message.textContent = data.message; message.style.display = 'block'; }
    catch (err) { message.textContent = err.message || 'Unable to send reset link.'; message.style.display = 'block'; }
  });

  const confirmReset = document.getElementById('confirm-reset');
  if (confirmReset) confirmReset.addEventListener('click', async () => {
    const message = document.getElementById('message');
    try { const data = await apiFetch('/auth/password-reset/confirm', { method: 'POST', body: JSON.stringify({ token: params.get('token'), password: document.getElementById('password').value }) }); message.textContent = data.message; message.style.display = 'block'; setTimeout(() => { window.location.href = '/login.html'; }, 1500); }
    catch (err) { message.textContent = err.message || 'Unable to reset password.'; message.style.display = 'block'; }
  });
});

// Redirect if already logged in
if (isLoggedIn() && !window.location.pathname.endsWith('/auth-callback.html') && !window.location.pathname.endsWith('/role-select.html')) {
  const user = getCurrentUser();
  redirectByRole(user.role);
}

// Render navbar (guest view)
renderNavbar();
