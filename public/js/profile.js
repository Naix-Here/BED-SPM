// public/js/profile.js — Profile & settings page.

let currentRole = null;
let isEditing = false;

function getInitials(name) {
  return (name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
}

async function loadProfile() {
  if (!isLoggedIn()) {
    showNotice('You must be logged in to view your profile', 'error');
    setTimeout(() => (window.location.href = '/login.html'), 1200);
    return;
  }
  const user = getCurrentUser();
  currentRole = user.role;

  document.getElementById('profile-name').textContent = user.fullName || 'User';
  document.getElementById('profile-email').textContent = user.email || '';
  document.getElementById('profile-role').textContent = user.role || '';
  document.getElementById('avatar-initials').textContent = getInitials(user.fullName);

  // Show role-specific fields
  if (user.role === 'Customer') {
    document.getElementById('phone-wrap').style.display = 'block';
    document.getElementById('lang-wrap').style.display = 'block';
    document.getElementById('loyalty-wrap').style.display = 'block';
    try {
      const res = await apiFetch('/customer-profile');
      const p = (res && res.data) || null;
      if (p) {
        document.getElementById('phone').value = p.Phone || '';
        document.getElementById('preferred-language').value = p.PreferredLanguage || 'en';
        document.getElementById('loyalty-points').value = p.LoyaltyPoints || 0;
      }
    } catch (e) { /* ignore — profile may not exist yet */ }
  } else if (user.role === 'Vendor') {
    document.getElementById('business-wrap').style.display = 'block';
    document.getElementById('contact-wrap').style.display = 'block';
    try {
      const res = await apiFetch('/vendor-profile');
      const p = (res && res.data) || null;
      if (p) {
        document.getElementById('business-name').value = p.BusinessName || '';
        document.getElementById('contact-number').value = p.ContactNumber || '';
      }
    } catch (e) { /* ignore */ }
  }
}

async function saveInfo() {
  const user = getCurrentUser();
  try {
    if (user.role === 'Customer') {
      const body = {
        phone: document.getElementById('phone').value.trim() || null,
        preferredLanguage: document.getElementById('preferred-language').value,
        loyaltyPoints: parseInt(document.getElementById('loyalty-points').value) || 0,
      };
      // Try PUT first; if no profile exists, POST to create
      try {
        await apiFetch('/customer-profile', { method: 'PUT', body: JSON.stringify(body) });
      } catch (err) {
        if (err.status === 404) {
          await apiFetch('/customer-profile', { method: 'POST', body: JSON.stringify(body) });
        } else {
          throw err;
        }
      }
    } else if (user.role === 'Vendor') {
      const body = {
        businessName: document.getElementById('business-name').value.trim() || null,
        contactNumber: document.getElementById('contact-number').value.trim() || null,
      };
      try {
        await apiFetch('/vendor-profile', { method: 'PUT', body: JSON.stringify(body) });
      } catch (err) {
        if (err.status === 404) {
          await apiFetch('/vendor-profile', { method: 'POST', body: JSON.stringify(body) });
        } else {
          throw err;
        }
      }
    } else {
      // Operator / NEA — just acknowledge
    }
    showNotice('Profile updated', 'success');
  } catch (err) {
    showNotice(err.message || 'Failed to update profile', 'error');
  }
}

async function changePassword() {
  const oldPw = document.getElementById('old-password').value;
  const newPw = document.getElementById('new-password').value;
  const confirmPw = document.getElementById('confirm-password').value;

  if (!oldPw || !newPw) {
    showNotice('All password fields are required', 'error');
    return;
  }
  if (newPw !== confirmPw) {
    showNotice('New passwords do not match', 'error');
    return;
  }
  if (newPw.length < 8 || !/[A-Za-z]/.test(newPw) || !/\d/.test(newPw)) {
    showNotice('New password must be at least 8 characters with 1 letter and 1 number', 'error');
    return;
  }

  try {
    await apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
    });
    showNotice('Password changed successfully', 'success');
    document.getElementById('old-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  } catch (err) {
    showNotice(err.message || 'Failed to change password', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('profile');
  loadProfile();
  document.getElementById('save-info').addEventListener('click', saveInfo);
  document.getElementById('change-pw').addEventListener('click', changePassword);
});
