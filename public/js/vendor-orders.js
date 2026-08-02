// public/js/vendor-orders.js — Vendor orders management with 5-second polling.
(async function () {
  if (!requireRole('Vendor')) return;

  const tbody = document.getElementById('ordersTbody');
  const subtitle = document.getElementById('subtitle');
  const statusFilter = document.getElementById('statusFilter');
  const ageFilter = document.getElementById('ageFilter');
  const newBadge = document.getElementById('newBadge');
  const newBadgeText = document.getElementById('newBadgeText');
  const me = getCurrentUser();

  let stall = null;
  let allOrders = [];
  let lastKnownPendingIds = new Set();

  function statusTag(s) {
    if (s === 'Completed') return '<span class="tag tag-success">Completed</span>';
    if (s === 'Cancelled') return '<span class="tag tag-danger">Cancelled</span>';
    if (s === 'Ready') return '<span class="tag tag-info">Ready</span>';
    return '<span class="tag tag-warning">' + escapeHtml(s) + '</span>';
  }

  function actionButtons(o) {
    const buttons = [];
    if (o.Status === 'Pending') {
      buttons.push(`<button class="btn btn-primary btn-small" data-action="Preparing" data-id="${o.OrderId}">Start Preparing</button>`);
    }
    if (o.Status === 'Preparing') {
      buttons.push(`<button class="btn btn-primary btn-small" data-action="Ready" data-id="${o.OrderId}">Mark Ready</button>`);
    }
    if (o.Status === 'Ready') {
      buttons.push(`<button class="btn btn-primary btn-small" data-action="Completed" data-id="${o.OrderId}">Complete</button>`);
    }
    if (['Pending', 'Preparing', 'Ready'].includes(o.Status)) {
      buttons.push(`<button class="btn btn-danger btn-small" data-action="Cancelled" data-id="${o.OrderId}">Cancel</button>`);
    }
    return buttons.length
      ? `<div class="overflow-actions">${buttons.join(' ')}</div>`
      : '<span style="color:var(--muted);">—</span>';
  }

  function applyFilters(list) {
    const status = statusFilter.value;
    const age = ageFilter.value;
    let filtered = list.slice();
    if (status) filtered = filtered.filter((o) => o.Status === status);
    if (age === 'today') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      filtered = filtered.filter((o) => new Date(o.OrderDate) >= today);
    } else if (age === 'week') {
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
      filtered = filtered.filter((o) => new Date(o.OrderDate) >= cutoff);
    }
    return filtered;
  }

  function renderRows() {
    const rows = applyFilters(allOrders);
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">No orders match the current filter.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((o) => `
      <tr>
        <td>#${o.OrderId}</td>
        <td>${escapeHtml(o.CustomerName || o.GuestName || 'Guest')}</td>
        <td>${o.ItemCount || 0}</td>
        <td>${formatPrice(o.TotalAmount)}</td>
        <td>${formatDateTime(o.OrderDate)}</td>
        <td>${statusTag(o.Status)}</td>
        <td>${actionButtons(o)}</td>
      </tr>
    `).join('');
  }

  async function findStall() {
    const res = await apiFetch('/stalls');
    const stalls = res.data || res || [];
    return stalls.find((s) => s.OwnerId === me.userId) || null;
  }

  async function loadOrders(silent = false) {
    if (!stall) return;
    try {
      const res = await apiFetch(`/orders/stall/${stall.StallId}`);
      const orders = (res.data || res || []).slice();
      // Detect new pending orders
      const currentPendingIds = new Set(orders.filter((o) => o.Status === 'Pending').map((o) => o.OrderId));
      const newPending = [];
      currentPendingIds.forEach((id) => { if (!lastKnownPendingIds.has(id)) newPending.push(id); });
      lastKnownPendingIds = currentPendingIds;

      allOrders = orders;
      renderRows();

      if (newPending.length && !silent) {
        newBadgeText.textContent = String(newPending.length);
        newBadge.style.display = '';
        setTimeout(() => { newBadge.style.display = 'none'; }, 8000);
      }

      subtitle.textContent = `${orders.length} total order${orders.length === 1 ? '' : 's'}.`;
    } catch (err) {
      if (!silent) {
        tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);">${escapeHtml(err.message)}</td></tr>`;
      }
    }
  }

  // ----- Action handler -----
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const newStatus = btn.getAttribute('data-action');
    const orderId = btn.getAttribute('data-id');
    btn.disabled = true;
    try {
      await apiFetch(`/orders/${orderId}`, { method: 'PUT', body: { status: newStatus } });
      showNotice(`Order #${orderId} updated to ${newStatus}.`, 'success');
      await loadOrders(true);
    } catch (err) {
      showNotice('Update failed: ' + err.message, 'error');
      btn.disabled = false;
    }
  });

  // ----- Filters -----
  statusFilter.addEventListener('change', renderRows);
  ageFilter.addEventListener('change', renderRows);

  // ----- Init -----
  try {
    stall = await findStall();
    if (!stall) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">No stall assigned to your account.</td></tr>';
      subtitle.textContent = 'No stall found.';
      return;
    }
    subtitle.textContent = `Showing orders for ${stall.Name}.`;
    await loadOrders();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);">${escapeHtml(err.message)}</td></tr>`;
    return;
  }

  // ----- 5-second polling -----
  setInterval(() => loadOrders(true), 5000);
})();
