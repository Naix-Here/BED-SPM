// public/js/order-history.js — Show order history for the logged-in customer,
// or for guests via localStorage.
(async function () {
  const list = document.getElementById('orderList');
  const subtitle = document.getElementById('subtitle');
  const guestNotice = document.getElementById('guestNotice');

  function statusClass(status) {
    if (status === 'Completed') return 'complete';
    if (status === 'Cancelled') return 'cancelled';
    return 'preparing';
  }

  function statusColor(status) {
    if (status === 'Completed') return { bg: 'rgba(34,197,94,.14)', color: '#22c55e' };
    if (status === 'Cancelled') return { bg: 'rgba(239,68,68,.14)', color: '#ef4444' };
    if (status === 'Ready') return { bg: 'rgba(59,130,246,.14)', color: '#60a5fa' };
    return { bg: 'rgba(251,146,60,.15)', color: '#fb923c' };
  }

  function orderIcon(status) {
    if (status === 'Completed') return '✅';
    if (status === 'Cancelled') return '❌';
    if (status === 'Ready') return '🛎️';
    if (status === 'Preparing') return '🍳';
    return '⏳';
  }

  function renderOrderCard(o) {
    const sc = statusColor(o.Status);
    const trackable = ['Pending', 'Preparing', 'Ready'].includes(o.Status);
    return `
      <div class="order-card" data-order-id="${o.OrderId}">
        <div class="order-icon">${orderIcon(o.Status)}</div>
        <div>
          <h3>Order #${o.OrderId} &middot; ${escapeHtml(o.StallName || 'Stall')}</h3>
          <p>${formatDateTime(o.OrderDate)} &middot; ${o.ItemCount || 0} item(s)</p>
          ${
            o.GuestName
              ? `<p style="font-style:italic;">Guest: ${escapeHtml(o.GuestName)}</p>`
              : ''
          }
        </div>
        <div class="order-price">
          <strong>${formatPrice(o.TotalAmount)}</strong>
          <span class="status-badge ${statusClass(o.Status)}" style="background:${sc.bg};color:${sc.color};">${escapeHtml(o.Status)}</span>
        </div>
        <div style="grid-column:1/-1;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
          ${
            trackable
              ? `<a href="/order-tracking.html?orderId=${o.OrderId}" class="btn btn-primary btn-small">Track Order</a>`
              : ''
          }
        </div>
      </div>
    `;
  }

  // ----- Registered customers -----
  if (isLoggedIn() && hasRole('Customer')) {
    try {
      const res = await apiFetch('/orders/my-orders');
      const orders = res.data || res || [];
      subtitle.textContent = orders.length
        ? `${orders.length} order${orders.length === 1 ? '' : 's'} on file.`
        : 'You have no orders yet.';
      if (!orders.length) {
        list.innerHTML = `
          <div class="empty-state">
            <i class="fa-solid fa-bowl-food" style="color:var(--accent);"></i>
            <p>No orders yet. <a href="/stalls.html" class="text-link">Browse stalls</a> to get started.</p>
          </div>
        `;
      } else {
        list.innerHTML = orders.map(renderOrderCard).join('');
      }
    } catch (err) {
      list.innerHTML = `<div class="order-card"><p>${escapeHtml(err.message)}</p></div>`;
    }
    return;
  }

  // ----- Guest / other roles -----
  guestNotice.style.display = '';
  subtitle.textContent = 'Showing orders placed in this browser (guest mode).';

  let guestOrders = [];
  try {
    const raw = localStorage.getItem('guestOrders');
    guestOrders = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(guestOrders)) guestOrders = [];
  } catch (_) {
    guestOrders = [];
  }

  if (!guestOrders.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-receipt" style="color:var(--accent);"></i>
        <p>No guest orders found. <a href="/stalls.html" class="text-link">Browse stalls</a> to place one.</p>
      </div>
    `;
    return;
  }

  // Render from localStorage; details may be limited
  list.innerHTML = guestOrders
    .map((o) => {
      const sc = statusColor(o.status || 'Pending');
      return `
        <div class="order-card">
          <div class="order-icon">${orderIcon(o.status || 'Pending')}</div>
          <div>
            <h3>Order #${o.orderId} &middot; ${escapeHtml(o.stallName || 'Stall')}</h3>
            <p>${formatDateTime(o.orderDate || o.createdAt)} &middot; ${o.itemCount || 0} item(s)</p>
            <p style="font-style:italic;">Guest: ${escapeHtml(o.guestName || 'You')}</p>
          </div>
          <div class="order-price">
            <strong>${formatPrice(o.totalAmount || 0)}</strong>
            <span class="status-badge ${statusClass(o.status || 'Pending')}" style="background:${sc.bg};color:${sc.color};">${escapeHtml(o.status || 'Pending')}</span>
          </div>
        </div>
      `;
    })
    .join('');
})();
