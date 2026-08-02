// public/js/engagement.js — Customer engagement hub.

let selectedRating = 5;
let pollHandle = null;

function changeLanguage(lang) {
  localStorage.setItem('shcms_language', lang);
  showNotice('Language preference saved (' + lang + ')', 'success');
}

function renderStars() {
  const stars = document.querySelectorAll('#star-rating i');
  stars.forEach((s) => {
    const v = parseInt(s.dataset.val);
    s.style.color = v <= selectedRating ? '#eab308' : '#475569';
  });
  document.getElementById('rating-display').textContent = selectedRating + ' / 5';
}

async function loadStalls() {
  const sel = document.getElementById('fb-stall');
  sel.innerHTML = '<option>Loading…</option>';
  try {
    const res = await apiFetch('/stalls');
    const stalls = (res && res.data) || [];
    if (!stalls.length) {
      sel.innerHTML = '<option value="">No stalls available</option>';
      return;
    }
    sel.innerHTML = stalls.map((s) => `<option value="${s.StallId}">${escapeHtml(s.Name)}</option>`).join('');
  } catch (err) {
    sel.innerHTML = `<option>${escapeHtml(err.message)}</option>`;
  }
}

async function loadTrending() {
  const el = document.getElementById('trending-items');
  try {
    const res = await apiFetch('/menu-items');
    const items = (res && res.data) || [];
    // Show top 5 by like count
    const top = items
      .filter((i) => (i.LikeCount || 0) > 0)
      .sort((a, b) => (b.LikeCount || 0) - (a.LikeCount || 0))
      .slice(0, 5);
    if (!top.length) {
      el.innerHTML = '<p style="color:var(--text-dimmed);">No trending items yet.</p>';
      return;
    }
    el.innerHTML = top.map((it, i) => `
      <div class="trending-item" data-menuitem="${it.MenuItemId}">
        <div class="trending-info">
          <div class="trending-rank">${i + 1}</div>
          <div>
            <h4>${escapeHtml(it.Name)}</h4>
            <p>${escapeHtml(it.StallName || '')} · ${formatPrice(it.Price)}</p>
            <span class="rating-badge-inline"><i class="fa-solid fa-heart"></i> ${it.LikeCount || 0} likes</span>
          </div>
        </div>
        <div class="trending-like">
          <button class="like-btn" data-menuitem="${it.MenuItemId}" title="Like this dish">
            <i class="fa-solid fa-heart"></i>
          </button>
          <span class="like-counter">${it.LikeCount || 0}</span>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.like-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!isLoggedIn()) {
          showNotice('Please log in to like dishes', 'error');
          return;
        }
        if (getCurrentUser().role !== 'Customer') {
          showNotice('Only customers can like dishes', 'error');
          return;
        }
        const menuItemId = parseInt(btn.dataset.menuitem);
        try {
          await apiFetch('/likes', { method: 'POST', body: JSON.stringify({ menuItemId }) });
          showNotice('Liked!', 'success');
          loadTrending();
          loadStats();
        } catch (err) {
          if (err.status === 409) {
            showNotice('You have already liked this dish', 'info');
          } else {
            showNotice(err.message || 'Failed to like', 'error');
          }
        }
      });
    });
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function loadPromos() {
  const el = document.getElementById('promo-list');
  try {
    const res = await apiFetch('/promotions');
    const promos = (res && res.data) || [];
    if (!promos.length) {
      el.innerHTML = '<p style="color:var(--text-dimmed);">No active promotions.</p>';
      return;
    }
    el.innerHTML = promos.map((p) => {
      let badge = 'discount';
      let label = '';
      if (p.DiscountType === 'Percentage') { badge = 'discount'; label = p.DiscountValue + '% OFF'; }
      else if (p.DiscountType === 'Fixed') { badge = 'discount'; label = '$' + p.DiscountValue + ' OFF'; }
      else if (p.DiscountType === 'Points') { badge = 'points'; label = p.DiscountValue + ' pts'; }
      else { badge = 'delivery'; label = 'Free Delivery'; }
      return `
        <div class="promotion">
          <div class="promo-header">
            <h3>${escapeHtml(p.Title)}</h3>
            <span class="promo-badge ${badge}">${escapeHtml(label)}</span>
          </div>
          <p>${escapeHtml(p.Description || 'No description.')}</p>
          <small style="color:var(--text-dimmed); display:block; margin-top:6px;">
            <i class="fa-solid fa-store"></i> ${escapeHtml(p.StallName || '')} · Until ${formatDate(p.EndDate)}
          </small>
        </div>
      `;
    }).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function loadMyComplaints() {
  const el = document.getElementById('my-complaints');
  if (!isLoggedIn() || getCurrentUser().role !== 'Customer') {
    el.innerHTML = '<p style="color:var(--text-dimmed);">Log in as a customer to view your complaints.</p>';
    return;
  }
  try {
    const res = await apiFetch('/complaints/mine');
    const items = (res && res.data) || [];
    if (!items.length) {
      el.innerHTML = '<p style="color:var(--text-dimmed);">No complaints filed yet.</p>';
      return;
    }
    el.innerHTML = items.slice(0, 3).map((c) => `
      <div class="complaint-ticket">
        <h4>${escapeHtml(c.Subject)}</h4>
        <p>${escapeHtml(c.StallName || '')} · ${formatDate(c.CreatedAt)}</p>
        <p style="color:var(--text);">Status: <strong>${escapeHtml(c.Status)}</strong></p>
      </div>
    `).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function loadRecentReviews() {
  const el = document.getElementById('recent-reviews');
  try {
    const res = await apiFetch('/feedback');
    const items = (res && res.data) || [];
    if (!items.length) {
      el.innerHTML = '<p style="color:var(--text-dimmed);">No reviews yet.</p>';
      return;
    }
    el.innerHTML = items.slice(0, 4).map((f) => {
      const stars = '★'.repeat(f.Rating) + '☆'.repeat(5 - f.Rating);
      return `
        <div class="review">
          <div class="review-stars">${stars}</div>
          <p><strong>${escapeHtml(f.CustomerName || 'Customer')}</strong> on ${escapeHtml(f.StallName || '')}</p>
          ${f.Comment ? `<p>${escapeHtml(f.Comment)}</p>` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    el.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function loadStats() {
  // Customer-specific stats
  const user = getCurrentUser();
  if (isLoggedIn() && user && user.role === 'Customer') {
    try {
      const res = await apiFetch('/customer-profile');
      const p = (res && res.data) || null;
      const pts = (p && p.LoyaltyPoints) || 0;
      document.getElementById('loyalty-points').textContent = pts + ' pts';
      document.getElementById('loyalty-bar').style.width = Math.min(100, (pts / 200) * 100) + '%';
    } catch (e) { /* no profile yet */ }

    try {
      const fb = await apiFetch('/feedback');
      const likes = await apiFetch('/likes?customerId=' + user.userId);
      document.getElementById('stat-feedback').textContent = ((fb && fb.data) || []).length;
      document.getElementById('stat-likes').textContent = ((likes && likes.data) || []).length;
      document.getElementById('m-feedback').textContent = ((fb && fb.data) || []).length;
      document.getElementById('m-likes').textContent = ((likes && likes.data) || []).length;
    } catch (e) { /* ignore */ }

    try {
      const cm = await apiFetch('/complaints/mine');
      const open = ((cm && cm.data) || []).filter((c) => c.Status !== 'Resolved').length;
      document.getElementById('stat-complaints').textContent = open;
    } catch (e) { /* ignore */ }
  } else {
    // Not a customer — show zero
    document.getElementById('loyalty-points').textContent = '—';
    document.getElementById('loyalty-bar').style.width = '0%';
  }
}

async function pollNotifications() {
  if (!isLoggedIn()) return;
  try {
    const res = await apiFetch('/notifications/unread-count');
    const count = (res && res.data && res.data.unreadCount) || 0;
    const bell = document.getElementById('notif-bell');
    if (!bell) return;
    if (count > 0) {
      bell.style.display = 'inline-block';
      bell.innerHTML = `<option value="">🔔 (${count})</option>`;
    } else {
      bell.style.display = 'none';
    }
  } catch (e) { /* silent */ }
}

async function submitFeedback() {
  const stallId = parseInt(document.getElementById('fb-stall').value);
  const comment = document.getElementById('fb-comment').value.trim();
  if (!stallId) {
    showNotice('Please select a stall', 'error');
    return;
  }
  if (!isLoggedIn() || getCurrentUser().role !== 'Customer') {
    showNotice('Please log in as a customer to submit feedback', 'error');
    return;
  }
  try {
    await apiFetch('/feedback', {
      method: 'POST',
      body: JSON.stringify({ stallId, rating: selectedRating, comment }),
    });
    showNotice('Feedback submitted!', 'success');
    document.getElementById('fb-comment').value = '';
    loadRecentReviews();
    loadStats();
  } catch (err) {
    showNotice(err.message || 'Failed to submit feedback', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Render the shared navbar (with cart icon + avatar dropdown)
  renderNavbar('engagement');

  // Star rating click handlers
  document.querySelectorAll('#star-rating i').forEach((s) => {
    s.addEventListener('click', () => {
      selectedRating = parseInt(s.dataset.val);
      renderStars();
    });
    s.addEventListener('mouseenter', () => {
      const v = parseInt(s.dataset.val);
      document.querySelectorAll('#star-rating i').forEach((x) => {
        const xv = parseInt(x.dataset.val);
        x.style.color = xv <= v ? '#eab308' : '#475569';
      });
    });
  });
  document.getElementById('star-rating').addEventListener('mouseleave', renderStars);
  renderStars();

  document.getElementById('submit-feedback').addEventListener('click', submitFeedback);

  // Loads
  loadStalls();
  loadTrending();
  loadPromos();
  loadMyComplaints();
  loadRecentReviews();
  loadStats();
  pollNotifications();

  // 5-second notification polling
  pollHandle = setInterval(pollNotifications, 5000);
});

window.addEventListener('beforeunload', () => {
  if (pollHandle) clearInterval(pollHandle);
});
