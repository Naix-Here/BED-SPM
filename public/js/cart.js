// public/js/cart.js — Shopping cart page logic.

let sessionId = null;

function getOrCreateSessionId() {
  if (sessionId) return sessionId;
  const stored = localStorage.getItem('shcms_session_id');
  if (stored) {
    sessionId = stored;
    return sessionId;
  }
  const newId = 'sess-' + Math.random().toString(36).slice(2) + '-' + Date.now();
  localStorage.setItem('shcms_session_id', newId);
  sessionId = newId;
  return sessionId;
}

function getApiOpts() {
  const opts = { headers: {} };
  if (!isLoggedIn()) {
    opts.headers['x-session-id'] = getOrCreateSessionId();
  }
  return opts;
}

async function loadCart() {
  const listEl = document.getElementById('cart-items-list');
  const emptyEl = document.getElementById('empty-cart');
  listEl.innerHTML = '<p style="color:var(--text-dimmed);">Loading cart…</p>';

  try {
    const data = await apiFetch('/cart', getApiOpts());
    const carts = (data && data.data) || [];
    if (!carts.length) {
      listEl.innerHTML = '';
      emptyEl.style.display = 'block';
      updateSummary(0, 0);
      return;
    }
    emptyEl.style.display = 'none';

    // Combine all carts (in practice one customer might have one cart per stall)
    let allItems = [];
    let subtotal = 0;
    let addOns = 0;
    let html = '';
    for (const cart of carts) {
      const detail = await apiFetch(`/cart/${cart.CartId}`, getApiOpts());
      const full = (detail && detail.data) || {};
      if (!full.Items || !full.Items.length) continue;
      html += `<div style="margin-bottom:18px;"><h3 style="font-size:0.95rem; color:var(--accent);">${escapeHtml(full.StallName || '')}</h3>`;
      for (const it of full.Items) {
        const lineTotal = Number(it.Quantity) * Number(it.Price) + Number(it.AddOnCharge || 0);
        subtotal += Number(it.Quantity) * Number(it.Price);
        addOns += Number(it.AddOnCharge || 0);
        html += `
          <div class="cart-item" data-cartitem-id="${it.CartItemId}" data-cart-id="${full.CartId}">
            <div class="mini-food orange">🍜</div>
            <div class="item-details">
              <h3>${escapeHtml(it.MenuItemName || '')}</h3>
              <p>${formatPrice(it.Price)} × ${it.Quantity} = <strong>${formatPrice(lineTotal)}</strong></p>
              ${it.AddOns ? `<p><small>+ ${escapeHtml(it.AddOns)}</small></p>` : ''}
            </div>
            <div class="quantity">
              <button class="qty-dec" data-id="${it.CartItemId}" data-qty="${it.Quantity}">−</button>
              <span>${it.Quantity}</span>
              <button class="qty-inc" data-id="${it.CartItemId}" data-qty="${it.Quantity}">+</button>
              <button class="remove-item" data-id="${it.CartItemId}" style="background:none;border:none;color:var(--danger);cursor:pointer;margin-left:6px;">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `;
        allItems.push(it);
      }
      html += `</div>`;
    }
    listEl.innerHTML = html;
    updateSummary(subtotal, addOns);
    bindItemActions();
  } catch (err) {
    listEl.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
  // Keep the navbar cart badge in sync with the current cart contents
  if (typeof refreshCartBadge === 'function') refreshCartBadge();
}

function updateSummary(subtotal, addons) {
  document.getElementById('sum-subtotal').textContent = formatPrice(subtotal);
  document.getElementById('sum-addons').textContent = formatPrice(addons);
  const total = subtotal + addons;
  document.getElementById('sum-total').textContent = formatPrice(total);
}

function bindItemActions() {
  document.querySelectorAll('.qty-inc').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const newQty = parseInt(btn.dataset.qty) + 1;
      try {
        await apiFetch(`/cart-items/${id}`, {
          method: 'PUT',
          headers: { 'x-session-id': getOrCreateSessionId() },
          body: JSON.stringify({ quantity: newQty }),
        });
        loadCart();
      } catch (err) {
        showNotice(err.message || 'Failed to update item', 'error');
      }
    });
  });
  document.querySelectorAll('.qty-dec').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const newQty = Math.max(1, parseInt(btn.dataset.qty) - 1);
      try {
        await apiFetch(`/cart-items/${id}`, {
          method: 'PUT',
          headers: { 'x-session-id': getOrCreateSessionId() },
          body: JSON.stringify({ quantity: newQty }),
        });
        loadCart();
      } catch (err) {
        showNotice(err.message || 'Failed to update item', 'error');
      }
    });
  });
  document.querySelectorAll('.remove-item').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      try {
        await apiFetch(`/cart-items/${id}`, {
          method: 'DELETE',
          headers: { 'x-session-id': getOrCreateSessionId() },
        });
        showNotice('Item removed', 'success');
        loadCart();
      } catch (err) {
        showNotice(err.message || 'Failed to remove item', 'error');
      }
    });
  });
}

async function checkout() {
  const btn = document.getElementById('checkout-btn');
  const notice = document.getElementById('page-notice');
  notice.hidden = true;

  try {
    btn.disabled = true;
    btn.textContent = 'Placing order…';

    const carts = (await apiFetch('/cart', getApiOpts())).data || [];
    if (!carts.length) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> &nbsp; Checkout';
      showNotice('Your cart is empty', 'error');
      return;
    }
    const cartIds = carts.map((c) => c.CartId);

    const body = { cartIds };
    if (!isLoggedIn()) {
      const guestName = document.getElementById('guest-name')?.value.trim();
      if (guestName) body.guestName = guestName;
    }

    const result = await apiFetch('/cart/checkout', {
      method: 'POST',
      headers: { 'x-session-id': getOrCreateSessionId() },
      body: JSON.stringify(body),
    });
    const orders = (result && result.data && result.data.orders) || [];
    if (!orders.length) {
      showNotice('No orders were created', 'error');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> &nbsp; Checkout';
      return;
    }
    showNotice('Order placed! Redirecting…', 'success');
    setTimeout(() => {
      window.location.href = '/order-tracking.html?orderId=' + orders[0].OrderId;
    }, 800);
  } catch (err) {
    showNotice(err.message || 'Checkout failed', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-bag-shopping"></i> &nbsp; Checkout';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Show guest name field if not logged in
  if (!isLoggedIn()) {
    const wrap = document.getElementById('guest-name-wrap');
    if (wrap) wrap.style.display = 'block';
  }
  document.getElementById('checkout-btn').addEventListener('click', checkout);
  renderNavbar('cart');
  loadCart();
});
