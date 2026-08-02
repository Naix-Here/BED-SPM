// public/js/order-tracking.js — Real-time order tracking via HTTP polling every 5s.

let pollHandle = null;
let currentOrderId = null;

const STATUS_FLOW = ['Pending', 'Preparing', 'Ready', 'Completed'];
const STEP_LABELS = {
  Pending: { title: 'Order Received', desc: 'We sent your order to the kitchen.' },
  Preparing: { title: 'Being Prepared', desc: 'The stall is cooking your food.' },
  Ready: { title: 'Ready for Pickup', desc: 'Your food is ready! Head to the counter.' },
  Completed: { title: 'Completed', desc: 'Enjoy your meal — see you again soon!' },
};

function statusIndex(s) {
  const idx = STATUS_FLOW.indexOf(s);
  return idx === -1 ? -1 : idx;
}

function renderTimeline(currentStatus) {
  const cur = statusIndex(currentStatus);
  const isCancelled = currentStatus === 'Cancelled';
  let html = '';
  STATUS_FLOW.forEach((status, i) => {
    let cls = 'pending';
    if (isCancelled) {
      cls = 'pending';
    } else if (i < cur) {
      cls = 'completed';
    } else if (i === cur) {
      cls = 'active';
    }
    const label = STEP_LABELS[status];
    html += `
      <div class="timeline-step ${cls}">
        <div class="step-bullet${i === cur ? ' pulse-bullet' : ''}">${i < cur || (i === cur && !isCancelled) ? (i < cur ? '✓' : '') : ''}</div>
        <div class="step-content">
          <h4>${label.title}</h4>
          <p>${label.desc}</p>
        </div>
      </div>
    `;
  });
  if (isCancelled) {
    html += `
      <div class="timeline-step pending" style="border-color:rgba(239,68,68,.4);">
        <div class="step-bullet" style="background:var(--danger); border-color:var(--danger);">✕</div>
        <div class="step-content">
          <h4 style="color:#fca5a5;">Cancelled</h4>
          <p>This order was cancelled. Please contact the stall if you have questions.</p>
        </div>
      </div>
    `;
  }
  return html;
}

async function fetchOrderStatus(orderId) {
  const content = document.getElementById('tracking-content');
  try {
    const res = await apiFetch('/orders/' + orderId);
    const order = (res && res.data) || res;
    const currentStatus = order.Status || order.status;
    const orderIdVal = order.OrderId || order.orderId;
    const stallName = order.StallName || order.stallName;
    const total = order.TotalAmount || order.totalAmount;
    const items = (order.Items || order.items) || [];
    const eta = (() => {
      if (currentStatus === 'Pending') return '~15 min';
      if (currentStatus === 'Preparing') return '~8 min';
      if (currentStatus === 'Ready') return 'Now';
      if (currentStatus === 'Completed') return 'Done';
      return '—';
    })();

    content.innerHTML = `
      <div class="order-info-row">
        <div>
          <span class="order-id-label">Order #</span>
          <strong>${escapeHtml(String(orderIdVal))}</strong>
          <span style="color:var(--text-dimmed); margin-left:10px;">· ${escapeHtml(stallName || '')}</span>
        </div>
        <span class="eta-badge">${escapeHtml(eta)}</span>
      </div>

      <div class="tracking-timeline">
        ${renderTimeline(currentStatus)}
      </div>

      <div style="margin-top:24px; border-top:1px solid var(--border-subtle); padding-top:16px;">
        <h3 style="font-size:1rem; margin-bottom:8px;">Items</h3>
        ${items.length === 0 ? '<p style="color:var(--text-dimmed); font-size:0.85rem;">No items.</p>' : ''}
        ${items.map((it) => `
          <div style="display:flex; justify-content:space-between; padding:6px 0; font-size:0.88rem;">
            <span>${escapeHtml(it.MenuItemName || it.MenuItemName || '')} × ${it.Quantity || it.quantity}</span>
            <span>${formatPrice(it.LineTotal || it.lineTotal || ((it.UnitPrice||it.unitPrice) * (it.Quantity||it.quantity)))}</span>
          </div>
        `).join('')}
        <div style="display:flex; justify-content:space-between; padding:12px 0 0; border-top:1px solid var(--border-subtle); margin-top:8px; font-weight:700;">
          <span>Total</span>
          <span>${formatPrice(total)}</span>
        </div>
      </div>
    `;

    // Stop polling when terminal
    if (currentStatus === 'Completed' || currentStatus === 'Cancelled') {
      stopPolling();
      if (currentStatus === 'Completed') {
        showNotice('Order completed — enjoy!', 'success');
      }
    }
  } catch (err) {
    content.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message || 'Failed to load order')}</p>`;
    stopPolling();
  }
}

function stopPolling() {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get('orderId');
  if (!orderId) {
    document.getElementById('tracking-content').innerHTML = '<p style="color:var(--danger);">No order provided. Visit from <a href="/order-history.html" style="color:var(--accent);">My Orders</a>.</p>';
    return;
  }
  currentOrderId = orderId;
  fetchOrderStatus(orderId);
  // 5-second HTTP polling
  pollHandle = setInterval(() => fetchOrderStatus(orderId), 5000);
});

// Stop polling on page unload
window.addEventListener('beforeunload', stopPolling);
