// public/js/vendor-dashboard.js — Vendor dashboard with metrics + recent orders.
(async function () {
  if (!requireRole('Vendor')) return;

  const tbody = document.getElementById('ordersTbody');
  const stallNameEl = document.getElementById('stallName');
  const me = getCurrentUser();

  // ----- Helpers -----
  function statusTag(status) {
    if (status === 'Completed') return '<span class="tag tag-success">Completed</span>';
    if (status === 'Cancelled') return '<span class="tag tag-danger">Cancelled</span>';
    if (status === 'Ready') return '<span class="tag tag-info">Ready</span>';
    return '<span class="tag tag-warning">' + escapeHtml(status) + '</span>';
  }

  function nextActionButton(status, orderId) {
    if (status === 'Pending') {
      return `<button class="btn btn-primary btn-small" data-action="Preparing" data-id="${orderId}">Start Preparing</button>`;
    }
    if (status === 'Preparing') {
      return `<button class="btn btn-primary btn-small" data-action="Ready" data-id="${orderId}">Mark Ready</button>`;
    }
    if (status === 'Ready') {
      return `<button class="btn btn-primary btn-small" data-action="Completed" data-id="${orderId}">Complete</button>`;
    }
    return '<span style="color:var(--muted);">—</span>';
  }

  // ----- Find the vendor's primary stall -----
  let stall = null;
  try {
    const res = await apiFetch('/stalls');
    const stalls = res.data || res || [];
    stall = stalls.find((s) => s.OwnerId === me.userId) || null;
    if (!stall) {
      // Vendor without a stall — show empty state
      stallNameEl.innerHTML = '<em>No stall assigned to your account yet.</em>';
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">No stall found. Please contact an operator.</td></tr>';
      return;
    }
  } catch (err) {
    stallNameEl.innerHTML = `<em>${escapeHtml(err.message)}</em>`;
    return;
  }

  stallNameEl.textContent = `Welcome back, ${me.fullName || me.email}. Operating: ${stall.Name}`;

  // ----- Metrics + performance -----
  async function loadMetrics() {
    try {
      const perfRes = await apiFetch(`/stalls/${stall.StallId}/performance`);
      const p = perfRes.data || perfRes || {};
      document.getElementById('metricPending').textContent = p.pendingOrders ?? 0;
      document.getElementById('metricRating').textContent =
        p.averageRating ? Number(p.averageRating).toFixed(1) + '★' : '—';
      document.getElementById('metricHygiene').textContent = p.currentHygieneGrade || '—';
      document.getElementById('perfTotal').textContent = p.totalOrders ?? 0;
      document.getElementById('perfCompleted').textContent = p.completedOrders ?? 0;
      document.getElementById('perfRevenue').textContent = formatPrice(p.revenue || 0);
      document.getElementById('perfFeedback').textContent = p.totalFeedback ?? 0;
      document.getElementById('perfLikes').textContent = p.totalLikes ?? 0;
    } catch (err) {
      console.warn('Could not load performance:', err.message);
    }
  }

  // ----- Recent orders -----
  async function loadOrders() {
    try {
      const res = await apiFetch(`/orders/stall/${stall.StallId}`);
      const orders = (res.data || res || []).slice(0, 10);
      if (!orders.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);">No orders yet.</td></tr>';
        return;
      }
      tbody.innerHTML = orders.map((o) => `
        <tr>
          <td>#${o.OrderId}</td>
          <td>${escapeHtml(o.CustomerName || o.GuestName || 'Guest')}</td>
          <td>${o.ItemCount || 0}</td>
          <td>${formatPrice(o.TotalAmount)}</td>
          <td>${statusTag(o.Status)}</td>
          <td>${formatDateTime(o.OrderDate)}</td>
          <td>${nextActionButton(o.Status, o.OrderId)}</td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger);">${escapeHtml(err.message)}</td></tr>`;
    }
  }

  // ----- Status update handler -----
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const newStatus = btn.getAttribute('data-action');
    const orderId = btn.getAttribute('data-id');
    btn.disabled = true;
    try {
      await apiFetch(`/orders/${orderId}`, { method: 'PUT', body: { status: newStatus } });
      showNotice(`Order #${orderId} updated to ${newStatus}.`, 'success');
      await loadOrders();
      await loadMetrics();
    } catch (err) {
      showNotice('Could not update order: ' + err.message, 'error');
      btn.disabled = false;
    }
  });

  // Initial load
  await loadMetrics();
  await loadOrders();

  // ----- 5-second polling for new pending orders -----
  setInterval(async () => {
    try {
      const perfRes = await apiFetch(`/stalls/${stall.StallId}/performance`).catch(() => null);
      if (perfRes) {
        const p = perfRes.data || perfRes;
        document.getElementById('metricPending').textContent = p.pendingOrders ?? 0;
      }
      // Refresh orders quietly
      const res = await apiFetch(`/orders/stall/${stall.StallId}`).catch(() => null);
      if (res) {
        const orders = res.data || res || [];
        const newPending = orders.filter((o) => o.Status === 'Pending').length;
        const oldPending = Number(document.getElementById('metricPending').textContent || 0);
        if (newPending > oldPending) {
          showNotice(`${newPending - oldPending} new pending order(s).`, 'info');
        }
        document.getElementById('metricPending').textContent = newPending;
        // Only re-render table if order count changed
        const existingRows = tbody.querySelectorAll('tr').length;
        if (existingRows !== Math.min(orders.length, 10)) {
          await loadOrders();
        } else {
          // Re-render anyway so statuses stay current
          await loadOrders();
        }
      }
    } catch (err) {
      console.warn('Polling error:', err.message);
    }
  }, 5000);
})();
