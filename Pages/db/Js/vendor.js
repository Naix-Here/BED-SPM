/* ==========================================================================
   vendor.js — Vendor management front-end (dashboard, menu, rental agreements)
   ========================================================================== */
const token = sessionStorage.getItem('hawkerhubToken');
const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const money = n => `$${Number(n).toFixed(2)}`;
async function api(path, opts = {}) { const r = await fetch(`/api${path}`, { ...opts, headers: { ...headers(), ...opts.headers } }); const b = await r.json(); if (!r.ok) throw new Error(b.error || 'Request failed.'); return b; }
function initials(n) { return n.split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase(); }
function notice(text, error = true) { const box = document.querySelector('#page-notice'); if (!box) return; box.textContent = text; box.style.color = error ? '#fca5a5' : '#86efac'; box.hidden = false; setTimeout(() => box.hidden = true, 4000); }

async function refreshVendorHeader() {
  try { const { user } = await api('/auth/me'); document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name); document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials(user.name)); } catch { sessionStorage.clear(); location.href = '../Login.html'; }
}

async function logout() { try { await api('/auth/logout', { method: 'POST' }); } finally { sessionStorage.clear(); location.href = '../Home-Page.html'; } }

// ===== DASHBOARD =====
async function loadVendorDashboard() {
  try {
    const stalls = await api('/vendor/stalls');
    document.querySelector('#stall-count').textContent = stalls.data.length;
    const container = document.querySelector('#dashboard-stalls'); if (!container) return;
    container.innerHTML = stalls.data.length ? stalls.data.map(s => `<div class="panel" style="margin-bottom:16px"><div class="row" style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><h3 style="margin:0">${s.StallName}</h3><p style="margin:4px 0 0;font-size:.82rem">${s.CentreName || ''} · ${s.CuisineType || ''} · Stall ${s.StallNumber || ''}</p></div><div style="display:flex;gap:18px;align-items:center"><div style="text-align:center"><strong style="font-size:1.2rem">${s.TotalOrders||0}</strong><br><span style="font-size:.72rem;color:var(--muted)">Orders</span></div><div style="text-align:center"><strong style="font-size:1.2rem">${Number(s.AvgRating||0).toFixed(1)}</strong><br><span style="font-size:.72rem;color:var(--muted)">Rating</span></div><span class="tag tag-${s.Status==='active'?'success':'warning'}">${s.Status}</span></div></div></div>`).join('') : '<p class="empty-state">No stalls found.</p>';

    // Load upcoming expiries
    const expiries = await api('/vendor/rental-agreements/upcoming-expiries?days=90');
    const expiryBox = document.querySelector('#upcoming-expiries');
    if (expiryBox) expiryBox.innerHTML = expiries.data.length ? expiries.data.map(e => `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);font-size:.85rem"><span><strong>${e.StallName}</strong> · ${e.StallNumber}</span><span style="color:var(--accent)">${e.DaysRemaining} days left</span></div>`).join('') : '<p style="color:var(--muted);font-size:.85rem">No upcoming expiries.</p>';
  } catch (err) { notice(err.message); }
}

// ===== MENU MANAGEMENT =====
async function loadMenuManagement() {
  try {
    const params = new URLSearchParams();
    const stallFilter = document.querySelector('#menu-stall-filter')?.value;
    if (stallFilter) params.set('stall_id', stallFilter);
    const catFilter = document.querySelector('#menu-category-filter')?.value;
    if (catFilter) params.set('category', catFilter);
    const searchVal = document.querySelector('#menu-search')?.value;
    if (searchVal) params.set('search', searchVal);
    const qs = params.toString();

    const [menuRes, stallsRes] = await Promise.all([api(`/vendor/menu-items${qs?'?'+qs:''}`), api('/vendor/stalls')]);
    const items = menuRes.items || [];
    const stalls = stallsRes.data || [];

    // Populate stall filter dropdown
    const sf = document.querySelector('#menu-stall-filter');
    if (sf && stalls.length) { const cur = sf.value; sf.innerHTML = '<option value="">All stalls</option>'+stalls.map(s => `<option value="${s.StallId}">${s.StallName}</option>`).join(''); sf.value = cur; }

    const grid = document.querySelector('#menu-items-grid'); if (!grid) return;
    grid.innerHTML = items.length ? items.map(i => `<div class="item-card"><div style="display:flex;justify-content:space-between;align-items:start"><div><div class="item-category">${i.Category?.replace('_',' ')}</div><div class="item-name">${i.Name}</div></div><span class="tag ${i.IsAvailable?'tag-success':'tag-danger'}">${i.IsAvailable?'Available':'Unavailable'}</span></div><div class="item-price">${money(i.Price)}</div><p class="item-desc">${i.Description||''}</p><div class="item-footer"><div class="cuisine-tags">${(i.Cuisines||[]).map(c => `<span class="cuisine-tag">${c.Name}</span>`).join('')}</div><div style="display:flex;gap:10px;align-items:center"><span style="font-size:.78rem;color:var(--muted)">❤️ ${i.LikeCount||0}</span><button class="btn btn-secondary btn-small" data-edit="${i.ItemId}">Edit</button><button class="btn btn-danger btn-small" data-delete="${i.ItemId}">Delete</button></div></div></div>`).join('') : '<div class="empty-state"><p>No menu items yet. Create your first item!</p></div>';
  } catch (err) { notice(err.message); }
}

async function createMenuItem(data) {
  try { await api('/vendor/menu-items', { method: 'POST', body: JSON.stringify(data) }); notice('Menu item created!', false); document.querySelector('#menu-form-modal')?.classList.remove('open'); loadMenuManagement(); } catch (err) { notice(err.message); }
}

async function updateMenuItem(id, data) {
  try { await api(`/vendor/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }); notice('Menu item updated!', false); document.querySelector('#menu-form-modal')?.classList.remove('open'); loadMenuManagement(); } catch (err) { notice(err.message); }
}

async function deleteMenuItem(id) {
  if (!confirm('Delete this menu item?')) return;
  try { await api(`/vendor/menu-items/${id}`, { method: 'DELETE' }); notice('Menu item deleted.', false); loadMenuManagement(); } catch (err) { notice(err.message); }
}

// ===== RENTAL AGREEMENTS =====
async function loadRentalAgreements() {
  try {
    const [agreeRes, stallsRes] = await Promise.all([api('/vendor/rental-agreements'), api('/vendor/stalls')]);
    const container = document.querySelector('#agreements-list'); if (!container) return;
    container.innerHTML = agreeRes.data.length ? agreeRes.data.map(a => `<div class="agreement-card"><div class="row"><h3 style="margin:0">${a.StallName} · ${a.CentreName||''}</h3><span class="tag tag-${a.Status==='active'?'success':a.Status==='expired'?'danger':'warning'}">${a.Status}</span></div><div class="details"><span>Monthly: <strong>${money(a.MonthlyRent)}</strong></span><span>Deposit: <strong>${money(a.Deposit||0)}</strong></span><span>Start: <strong>${new Date(a.StartDate).toLocaleDateString()}</strong></span><span>End: <strong>${new Date(a.EndDate).toLocaleDateString()}</strong></span></div><div class="overflow-actions"><button class="btn btn-secondary btn-small" data-edit-agreement="${a.AgreementId}">Edit</button><button class="btn btn-danger btn-small" data-delete-agreement="${a.AgreementId}">Delete</button></div></div>`).join('') : '<div class="empty-state"><p>No rental agreements found.</p></div>';
  } catch (err) { notice(err.message); }
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) return location.href = '../Login.html';
  try {
    await refreshVendorHeader();
    if (document.querySelector('#dashboard-stalls')) await loadVendorDashboard();
    if (document.querySelector('#menu-items-grid')) await loadMenuManagement();
    if (document.querySelector('#agreements-list')) await loadRentalAgreements();
    document.querySelectorAll('[data-logout]').forEach(x => x.onclick = logout);
  } catch { sessionStorage.clear(); location.href = '../Login.html'; }
});
