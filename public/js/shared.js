// public/js/shared.js — Global utilities used by ALL frontend pages.
const API_BASE = '/api';

// ============================================================
// Token & user management
// ============================================================

function getToken() {
  return localStorage.getItem('shcms_token');
}

function setToken(token) {
  localStorage.setItem('shcms_token', token);
}

function clearToken() {
  localStorage.removeItem('shcms_token');
  localStorage.removeItem('shcms_user');
}

function getCurrentUser() {
  const raw = localStorage.getItem('shcms_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('shcms_user', JSON.stringify(user));
}

function isLoggedIn() {
  return !!getToken();
}

function hasRole(role) {
  const u = getCurrentUser();
  return u && u.role === role;
}

function hasAnyRole(...roles) {
  const u = getCurrentUser();
  return u && roles.includes(u.role);
}

// ============================================================
// Guest session id (for guest carts — shared across all pages)
// ============================================================

function getOrCreateSessionId() {
  let sid = localStorage.getItem('shcms_session_id');
  if (!sid) {
    sid = 'sess-' + Math.random().toString(36).slice(2) + '-' + Date.now();
    localStorage.setItem('shcms_session_id', sid);
  }
  return sid;
}

// ============================================================
// Cart badge (shown for Customers and Guests on every page)
// ============================================================

// Returns true if the current viewer can use the shopping cart.
function canUseCart() {
  const u = getCurrentUser();
  if (!u) return true; // Guest
  return u.role === 'Customer';
}

// Fetches the total item count across all of the viewer's active carts
// and updates the navbar badge. Safe to call on any page.
async function refreshCartBadge() {
  const badge = document.getElementById('cart-badge');
  if (!badge) return;

  try {
    const opts = { headers: {} };
    if (!isLoggedIn()) {
      opts.headers['x-session-id'] = getOrCreateSessionId();
    }
    const res = await apiFetch('/cart', opts);
    const carts = (res && res.data) || [];

    let count = 0;
    for (const c of carts) {
      try {
        const detail = await apiFetch('/cart/' + c.CartId, opts);
        const items = (detail && detail.data && detail.data.Items) || [];
        count += items.reduce((sum, it) => sum + Number(it.Quantity || 0), 0);
      } catch {
        // ignore individual cart failures
      }
    }

    badge.textContent = String(count);
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch {
    badge.style.display = 'none';
  }
}

// ============================================================
// Authenticated fetch wrapper
// ============================================================

async function apiFetch(endpoint, options = {}) {
  const opts = Object.assign(
    {
      method: 'GET',
      headers: {},
    },
    options
  );

  // Default JSON headers
  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers['Content-Type'] = 'application/json';
    if (typeof opts.body !== 'string') {
      opts.body = JSON.stringify(opts.body);
    }
  }

  // Attach auth token if present
  const token = getToken();
  if (token) {
    opts.headers['Authorization'] = 'Bearer ' + token;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : API_BASE + (endpoint.startsWith('/') ? endpoint : '/' + endpoint);

  let res;
  try {
    res = await fetch(url, opts);
  } catch (networkErr) {
    throw new Error('Network error: cannot reach the server.');
  }

  // Try to parse JSON body
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text().catch(() => null);
  }

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed with status ${res.status}.`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// ============================================================
// Page guards
// ============================================================

function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

function requireRole(role) {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return false;
  }
  if (!hasRole(role)) {
    showNotice('You do not have access to this page.', 'error');
    setTimeout(() => (window.location.href = '/index.html'), 1500);
    return false;
  }
  return true;
}

// ============================================================
// Logout
// ============================================================

function logout() {
  clearToken();
  window.location.href = '/index.html';
}

// ============================================================
// Navbar renderer
// ============================================================

function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;

  const user = getCurrentUser();
  const loggedIn = isLoggedIn() && user;

  let linksHtml = '';
  let rightHtml = '';

  if (!loggedIn) {
    // Guest — guests can browse, cart, and checkout too
    linksHtml = `
      <a href="/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
      <a href="/stalls.html" class="${activePage === 'stalls' ? 'active' : ''}">Browse Stalls</a>
      <a href="/order-tracking.html" class="${activePage === 'tracking' ? 'active' : ''}">Track Order</a>
    `;
    const cartIcon = `
      <a href="/cart.html" class="cart-link" title="My Cart">
        <i class="fa-solid fa-bag-shopping"></i>
        <span class="cart-badge" id="cart-badge">0</span>
      </a>
    `;
    rightHtml = `
      ${cartIcon}
      <a href="/login.html" class="btn btn-secondary btn-small">Login</a>
      <a href="/register.html" class="btn btn-primary btn-small">Register</a>
    `;

    nav.innerHTML = `
      <div class="navbar-inner">
        <a href="/index.html" class="logo">
          <i class="fa-solid fa-bowl-food"></i>
          <span>SHCMS</span>
        </a>
        <nav class="nav-links">${linksHtml}</nav>
        <div class="nav-buttons">${rightHtml}</div>
      </div>
    `;
    refreshCartBadge();
    return;
  } else {
    const initials = (user.fullName || user.email || '?')
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    let portalLinks = '';
    if (user.role === 'Customer') {
      portalLinks = `
        <a href="/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="/stalls.html" class="${activePage === 'stalls' ? 'active' : ''}">Browse Stalls</a>
        <a href="/order-history.html" class="${activePage === 'orders' ? 'active' : ''}">My Orders</a>
        <a href="/engagement.html" class="${activePage === 'engagement' ? 'active' : ''}">Engagement</a>
      `;
    } else if (user.role === 'Vendor') {
      portalLinks = `
        <a href="/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="/vendor-dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">Dashboard</a>
        <a href="/vendor-menu.html" class="${activePage === 'menu' ? 'active' : ''}">Menu</a>
        <a href="/vendor-orders.html" class="${activePage === 'orders' ? 'active' : ''}">Orders</a>
        <a href="/vendor-rentals.html" class="${activePage === 'rentals' ? 'active' : ''}">Rentals</a>
      `;
    } else if (user.role === 'NEAOfficer') {
      portalLinks = `
        <a href="/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="/nea-inspections.html" class="${activePage === 'inspections' ? 'active' : ''}">Inspections</a>
        <a href="/nea-hygiene.html" class="${activePage === 'hygiene' ? 'active' : ''}">Hygiene Grades</a>
      `;
    } else if (user.role === 'Operator') {
      portalLinks = `
        <a href="/index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
        <a href="/stalls.html" class="${activePage === 'stalls' ? 'active' : ''}">Stalls</a>
        <a href="/vendor-rentals.html" class="${activePage === 'rentals' ? 'active' : ''}">Rentals</a>
      `;
    }

    let cartIcon = '';
    if (user.role === 'Customer') {
      cartIcon = `
        <a href="/cart.html" class="cart-link" title="My Cart">
          <i class="fa-solid fa-bag-shopping"></i>
          <span class="cart-badge" id="cart-badge">0</span>
        </a>
      `;
    }

    const dropdown = `
      <div class="avatar-dropdown">
        <button class="avatar-btn" onclick="toggleAvatarMenu(event)">
          <span class="avatar-initials">${initials}</span>
        </button>
        <div class="avatar-menu" id="avatarMenu">
          <div class="avatar-menu-header">
            <strong>${escapeHtml(user.fullName || '')}</strong>
            <small>${escapeHtml(user.email || '')}</small>
            <span class="role-badge">${escapeHtml(user.role)}</span>
          </div>
          <a href="/profile.html"><i class="fa-solid fa-user"></i> My Profile</a>
          <a href="#" onclick="logout(); return false;"><i class="fa-solid fa-right-from-bracket"></i> Logout</a>
        </div>
      </div>
    `;

    linksHtml = portalLinks;
    rightHtml = cartIcon + dropdown;
  }

  nav.innerHTML = `
    <div class="navbar-inner">
      <a href="/index.html" class="logo">
        <i class="fa-solid fa-bowl-food"></i>
        <span>SHCMS</span>
      </a>
      <nav class="nav-links">${linksHtml}</nav>
      <div class="nav-buttons">${rightHtml}</div>
    </div>
  `;

  // Refresh the cart badge for customers (guests refresh in their own branch above)
  if (loggedIn && getCurrentUser() && getCurrentUser().role === 'Customer') {
    refreshCartBadge();
  }
}

function toggleAvatarMenu(event) {
  event.preventDefault();
  event.stopPropagation();
  const menu = document.getElementById('avatarMenu');
  if (menu) menu.classList.toggle('open');

  // close on outside click
  setTimeout(() => {
    const close = (e) => {
      if (menu && !menu.contains(e.target)) {
        menu.classList.remove('open');
        document.removeEventListener('click', close);
      }
    };
    document.addEventListener('click', close);
  }, 0);
}

// ============================================================
// Formatting helpers
// ============================================================

function formatPrice(amount) {
  const n = parseFloat(amount);
  if (isNaN(n)) return '$0.00';
  return '$' + n.toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================
// Page notice banner
// ============================================================

function showNotice(message, type = 'info') {
  // Remove any existing notice
  const existing = document.getElementById('page-notice');
  if (existing) existing.remove();

  const notice = document.createElement('div');
  notice.id = 'page-notice';
  notice.className = `page-notice page-notice-${type}`;
  notice.textContent = message;
  document.body.appendChild(notice);

  // Auto-dismiss after 4s
  setTimeout(() => {
    if (notice && notice.parentNode) {
      notice.classList.add('fading');
      setTimeout(() => notice.remove(), 300);
    }
  }, 4000);
}

// ============================================================
// On-load hook — render navbar & footer year automatically
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // Set footer year
  const y = document.getElementById('footer-year');
  if (y) y.textContent = new Date().getFullYear();
});
