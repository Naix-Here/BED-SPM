/* ==========================================================================
   order-history.js — Enhanced order history with feedback, stats, guest support
   ========================================================================== */
const token = sessionStorage.getItem('hawkerhubToken');
const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const money = n => `$${Number(n).toFixed(2)}`;
async function api(path, opts = {}) { const r = await fetch(`/api${path}`, { ...opts, headers: { ...headers(), ...opts.headers } }); const b = await r.json(); if (!r.ok) throw new Error(b.error || 'Request failed.'); return b; }
function initials(n) { return n.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase(); }
function notice(text, success = false) { const box = document.querySelector('#page-notice'); if (!box) return; box.textContent = text; box.style.color = success ? '#86efac' : '#fca5a5'; box.hidden = false; setTimeout(() => box.hidden = true, 5000); }

async function refreshHeader() {
  try { const { user } = await api('/auth/me'); document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name); document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials(user.name)); } catch { sessionStorage.clear(); location.href = '../Login.html'; }
}

async function logout() { try { await api('/auth/logout', { method: 'POST' }); } finally { sessionStorage.clear(); location.href = '../Home-Page.html'; } }

async function loadOrderHistory() {
  try {
    const params = new URLSearchParams();
    const status = document.querySelector('#order-status-filter')?.value;
    if (status) params.set('status', status);
    const sort = document.querySelector('#order-sort')?.value || 'DESC';
    params.set('order', sort);

    const res = await api(`/orders/my-orders?${params.toString()}`);
    const container = document.querySelector('#order-history-list');
    if (!container) return;

    const orders = res.orders || [];
    const pagination = res.pagination || {};

    container.innerHTML = orders.length ? orders.map(o => `<article class="order-card"><div class="order-icon">🍽️</div><div><h3>Order #${o.OrderId}</h3><p>${(o.Items||[]).map(i => i.ItemName).join(', ')} · ${new Date(o.CreatedAt||o.OrderDate).toLocaleDateString()}</p></div><div class="order-price"><strong>${money(o.TotalAmount)}</strong><span class="status-badge ${o.Status === 'Delivered'||o.Status==='completed' ? 'complete' : o.Status==='Cancelled'?'cancelled': 'preparing'}">${o.Status}</span>${o.Status !== 'Cancelled' && o.Status !== 'Delivered' ? `<br><button class="btn btn-danger btn-small" data-cancel="${o.OrderId}" style="margin-top:6px">Cancel</button>` : ''}${o.Status==='Delivered' && !o.Feedback ? `<br><button class="btn btn-secondary btn-small" data-feedback="${o.OrderId}" style="margin-top:6px">Review</button>` : ''}${o.Feedback ? `<br><span style="font-size:.72rem;color:var(--accent)">⭐ ${o.Feedback.Rating}/5</span>` : ''}</div></article>`).join('') : '<div class="empty-state"><p>No orders found.</p></div>';

    // Pagination
    const pagEl = document.querySelector('#order-pagination');
    if (pagEl && pagination.totalPages > 1) {
      pagEl.innerHTML = `<div style="display:flex;gap:8px;justify-content:center;margin-top:20px">${Array.from({length: pagination.totalPages}, (_, i) => `<button class="btn btn-small ${i+1===pagination.page?'btn-primary':'btn-secondary'}" data-page="${i+1}">${i+1}</button>`).join('')}</div>`;
    }

    // Stats
    try {
      const stats = await api('/orders/stats');
      const statsBox = document.querySelector('#order-stats');
      if (statsBox) statsBox.innerHTML = `<div class="metrics-row"><div class="metric-card" style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;text-align:center"><span class="value" style="font-size:1.8rem;font-weight:800;display:block">${stats.data.totalOrders}</span><span class="label" style="font-size:.75rem;color:var(--muted)">Total Orders</span></div><div class="metric-card" style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;text-align:center"><span class="value" style="font-size:1.8rem;font-weight:800;display:block">${money(stats.data.totalSpent)}</span><span class="label" style="font-size:.75rem;color:var(--muted)">Total Spent</span></div><div class="metric-card" style="background:var(--card);border:1px solid var(--border);border-radius:14px;padding:18px;text-align:center"><span class="value" style="font-size:1.8rem;font-weight:800;display:block">${(stats.data.statusBreakdown||[]).length}</span><span class="label" style="font-size:.75rem;color:var(--muted)">Status Types</span></div></div>`;
    } catch {}
  } catch (err) { notice(err.message); }
}

// Cancel order / Submit feedback / Pagination (delegated)
document.addEventListener('click', async e => {
  if (e.target.dataset.cancel) {
    if (!confirm('Cancel this order?')) return;
    try { await api(`/orders/${e.target.dataset.cancel}`, { method: 'DELETE' }); notice('Order cancelled.', true); loadOrderHistory(); } catch (err) { notice(err.message); }
  }
  if (e.target.dataset.feedback) {
    const orderId = e.target.dataset.feedback;
    const rating = prompt('Rate your experience (1-5):', '5');
    if (!rating || rating < 1 || rating > 5) return;
    const comment = prompt('Any comments? (optional)');
    try { await api(`/orders/${orderId}/feedback`, { method: 'POST', body: JSON.stringify({ rating: parseInt(rating), comment }) }); notice('Feedback submitted!', true); loadOrderHistory(); } catch (err) { notice(err.message); }
  }
  if (e.target.dataset.page) {
    document.querySelector('#order-status-filter')?.setAttribute('data-page', e.target.dataset.page);
    loadOrderHistory();
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  if (!token) return location.href = '../Login.html';
  try { await refreshHeader(); if (document.querySelector('#order-history-list')) await loadOrderHistory(); document.querySelectorAll('[data-logout]').forEach(x => x.onclick = logout); } catch { sessionStorage.clear(); location.href = '../Login.html'; }
});
