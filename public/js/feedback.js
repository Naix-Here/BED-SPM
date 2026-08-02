// public/js/feedback.js — Feedback & reviews page.

let selectedRating = 5;
let allStalls = [];

function renderStars() {
  const stars = document.querySelectorAll('#star-rating i');
  stars.forEach((s) => {
    const v = parseInt(s.dataset.val);
    s.style.color = v <= selectedRating ? '#eab308' : '#475569';
  });
}

async function loadStalls() {
  const sel = document.getElementById('fb-stall');
  const filter = document.getElementById('filter-stall');
  try {
    const res = await apiFetch('/stalls');
    allStalls = (res && res.data) || [];
    if (!allStalls.length) {
      sel.innerHTML = '<option>No stalls available</option>';
      return;
    }
    const opts = allStalls.map((s) => `<option value="${s.StallId}">${escapeHtml(s.Name)}</option>`).join('');
    sel.innerHTML = opts;
    filter.innerHTML = '<option value="">All stalls</option>' + opts;
  } catch (err) {
    sel.innerHTML = `<option>${escapeHtml(err.message)}</option>`;
  }
}

async function loadReviews() {
  const list = document.getElementById('reviews-list');
  list.innerHTML = '<p style="color:var(--text-dimmed);">Loading reviews…</p>';
  const stallFilter = document.getElementById('filter-stall').value;
  const query = stallFilter ? `?stallId=${stallFilter}` : '';
  try {
    const res = await apiFetch('/feedback' + query);
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-comments"></i><p>No reviews yet. Be the first!</p></div>';
      return;
    }
    list.innerHTML = items.map((f) => {
      const stars = '★'.repeat(f.Rating) + '☆'.repeat(5 - f.Rating);
      return `
        <div class="card" style="background:var(--card-bg); border:1px solid var(--border-subtle); border-radius:14px; padding:18px; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
            <div>
              <div style="color:#eab308; font-size:1.05rem; margin-bottom:4px;">${stars}</div>
              <strong>${escapeHtml(f.CustomerName || 'Customer')}</strong>
              <span style="color:var(--text-dimmed);"> · ${escapeHtml(f.StallName || '')}</span>
            </div>
            <small style="color:var(--text-dimmed);">${formatDate(f.CreatedAt)}</small>
          </div>
          ${f.Comment ? `<p style="color:var(--text-dimmed); margin:0;">${escapeHtml(f.Comment)}</p>` : '<p style="color:var(--text-dimmed); font-style:italic;">No comment</p>'}
        </div>
      `;
    }).join('');
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
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
    showNotice('Review submitted!', 'success');
    document.getElementById('fb-comment').value = '';
    loadReviews();
  } catch (err) {
    showNotice(err.message || 'Failed to submit', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('engagement');

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

  document.getElementById('submit-btn').addEventListener('click', submitFeedback);
  document.getElementById('filter-stall').addEventListener('change', loadReviews);

  loadStalls();
  loadReviews();
});
