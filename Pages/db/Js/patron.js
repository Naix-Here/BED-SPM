const token = sessionStorage.getItem('hawkerhubToken');
const headers = () => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const money = number => `$${Number(number).toFixed(2)}`;
async function api(path, options = {}) {
  const response = await fetch(`/api${path}`, { ...options, headers: { ...headers(), ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || 'Request failed.');
  return body;
}
function initials(name) { return name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function notice(text) { const box = document.querySelector('#page-notice'); if (box) { box.textContent = text; box.hidden = false; } else alert(text); }
async function refreshHeader() {
  const { user } = await api('/auth/me');
  if (user.role !== 'patron') { location.href = '../Vendor/Dashboard.html'; return false; }
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
  document.querySelectorAll('[data-user-initials]').forEach(el => el.textContent = initials(user.name));
  const cart = await api('/patron/cart');
  document.querySelectorAll('[data-cart-count]').forEach(el => el.textContent = cart.reduce((sum, item) => sum + item.quantity, 0));
  return true;
}
async function logout() { try { await api('/auth/logout', { method: 'POST' }); } finally { sessionStorage.clear(); location.href = '../Home-Page.html'; } }
function cartMarkup(cart) { return cart.map(item => `<div class="cart-item"><div class="mini-food ${item.colour}">${item.emoji}</div><div class="item-details"><h3>${item.name}</h3><p>${item.stall}</p><strong>${money(item.price)}</strong></div><div class="quantity"><button data-change="${item.productId}" data-quantity="${item.quantity - 1}">−</button><span>${item.quantity}</span><button data-change="${item.productId}" data-quantity="${item.quantity + 1}">+</button></div></div>`).join(''); }
function summary(cart, packaging = false) { const subtotal = cart.reduce((sum, x) => sum + x.price * x.quantity, 0), delivery = cart.length ? 1.5 : 0, service = cart.length ? .5 : 0, pack = packaging ? .3 : 0; return { subtotal, delivery, service, pack, total: subtotal + delivery + service + pack }; }
async function loadDashboard() {
  const products = await api('/patron/products'); const grid = document.querySelector('#dish-grid'); if (!grid) return;
  grid.innerHTML = products.map(p => `<article class="dish-card"><div class="dish-image ${p.Colour}">${p.Emoji}</div><div class="dish-content"><span class="stall-label">${p.StallName}</span><h3>${p.ProductName}</h3><p>${p.Description}</p><div class="dish-footer"><strong>${money(p.Price)}</strong><button class="btn btn-secondary btn-small" data-product="${p.ProductId}">Add to cart</button></div></div></article>`).join('');
  grid.onclick = async e => { const id = e.target.dataset.product; if (!id) return; try { await api('/patron/cart', { method: 'POST', body: JSON.stringify({ productId: id }) }); await refreshHeader(); notice('Added to your cart.'); } catch (error) { notice(error.message); } };
}
async function loadCart() {
  const cart = await api('/patron/cart'); const list = document.querySelector('#cart-items'), totals = document.querySelector('#cart-summary'); if (!list) return;
  list.innerHTML = cart.length ? cartMarkup(cart) : '<p>Your cart is empty. <a class="text-link" href="Dashboard.html">Browse dishes</a></p>';
  const s = summary(cart); totals.innerHTML = `<h2>Order summary</h2><div class="summary-row"><span>Subtotal</span><strong>${money(s.subtotal)}</strong></div><div class="summary-row"><span>Delivery</span><strong>${money(s.delivery)}</strong></div><div class="summary-row"><span>Service fee</span><strong>${money(s.service)}</strong></div><div class="summary-row total"><span>Total</span><strong>${money(s.total)}</strong></div>${cart.length ? '<a class="btn btn-primary btn-full" href="Checkout.html">Proceed to checkout</a>' : ''}`;
  list.onclick = async e => { const id = e.target.dataset.change; if (!id) return; await api(`/patron/cart/${id}`, { method: 'PATCH', body: JSON.stringify({ quantity: Number(e.target.dataset.quantity) }) }); await refreshHeader(); loadCart(); };
}
async function loadCheckout() {
  const cart = await api('/patron/cart'); if (!cart.length) { location.href = 'Cart.html'; return; }
  const render = () => { const s = summary(cart, document.querySelector('#eco-packaging').checked); document.querySelector('#checkout-summary').innerHTML = `<h2>Order total</h2><div class="summary-row"><span>Food, delivery & service</span><strong>${money(s.subtotal+s.delivery+s.service)}</strong></div><div class="summary-row"><span>Packaging</span><strong>${money(s.pack)}</strong></div><div class="summary-row total"><span>Total</span><strong>${money(s.total)}</strong></div><button class="btn btn-primary btn-full" id="place-order">Place order · ${money(s.total)}</button>`; document.querySelector('#place-order').onclick = placeOrder; }; 
  async function placeOrder() { try { const address = document.querySelector('#delivery-address').value; const result = await api('/patron/orders', { method: 'POST', body: JSON.stringify({ address, ecoPackaging: document.querySelector('#eco-packaging').checked }) }); location.href = `OrderHistory.html?placed=${result.orderId}`; } catch (error) { notice(error.message); } }
  document.querySelector('#eco-packaging').onchange = render; render();
}
async function loadOrders() { const orders = await api('/patron/orders'); const list = document.querySelector('#order-list'); if (!list) return; list.innerHTML = orders.length ? orders.map(o => `<article class="order-card"><div class="order-icon">🍽️</div><div><h3>Order #${o.OrderId}</h3><p>${o.Items} · ${new Date(o.OrderDate).toLocaleDateString()}</p></div><div class="order-price"><strong>${money(o.TotalAmount)}</strong><span class="status-badge ${o.Status === 'Delivered' ? 'complete' : 'preparing'}">${o.Status}</span></div></article>`).join('') : '<p>No orders yet.</p>'; if (new URLSearchParams(location.search).has('placed')) notice('Your order has been placed successfully.'); }
document.addEventListener('DOMContentLoaded', async () => {
  if (!token) return location.href = '../Login.html';
  try {
    if (!await refreshHeader()) return;
    // Only initialise the feature rendered by the current page.  In particular,
    // the checkout loader redirects an empty cart to Cart.html and must not run
    // when the patron has just landed on the dashboard.
    if (document.querySelector('#dish-grid')) await loadDashboard();
    if (document.querySelector('#cart-items')) await loadCart();
    if (document.querySelector('#checkout-summary')) await loadCheckout();
    if (document.querySelector('#order-list')) await loadOrders();
    document.querySelectorAll('[data-logout]').forEach(x => x.onclick = logout);
  } catch (error) {
    sessionStorage.clear();
    location.href = '../Login.html';
  }
});
