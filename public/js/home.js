// public/js/home.js — Renders the "top sellers" grid on the home page.
// Team Frontend: pulls real data from /menu-items + /stalls to show featured
// dishes and routes to the correct stall-detail page.
(async function () {
  const grid = document.getElementById('top-sellers-grid');
  if (!grid) return;

  // Track which item renders a click-through
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('[data-stall-id]');
    if (card) {
      window.location.href = `/stall-detail.html?stallId=${card.getAttribute('data-stall-id')}`;
    }
  });

  function renderFallback(msg) {
    grid.innerHTML = `
      <div class="food-card top-seller-card">
        <div class="food-header"><span class="cuisine-tag">Coming soon</span></div>
        <h3>Our top sellers will appear here</h3>
        <p>${msg ? escapeHtml(msg) : 'The Member 2 menu API is being wired up.'}</p>
      </div>
    `;
  }

  function categoryEmoji(cat) {
    if (cat === 'Drink') return '🥤';
    if (cat === 'Dessert') return '🍮';
    if (cat === 'Side') return '🥗';
    if (cat === 'Snack') return '🥪';
    return '🍜';
  }

  try {
    // Pull all stalls + menu items in parallel (both public endpoints).
    const [stallsRes, itemsRes] = await Promise.all([
      apiFetch('/stalls').catch(() => null),
      apiFetch('/menu-items').catch(() => null),
    ]);

    const stalls = (stallsRes && (stallsRes.data || stallsRes)) || [];
    const items = (itemsRes && (itemsRes.data || itemsRes)) || [];

    if (!items.length) {
      renderFallback('No menu items available yet.');
      return;
    }

    // Sort by LikeCount (desc) so the "trending" list is meaningful.
    const sorted = items
      .slice()
      .sort((a, b) => (b.LikeCount || 0) - (a.LikeCount || 0))
      .slice(0, 6);

    grid.innerHTML = sorted
      .map((item) => {
        const name = escapeHtml(item.Name || 'Unnamed dish');
        const desc = escapeHtml(item.Description || '');
        const price = formatPrice(item.Price || 0);
        const category = escapeHtml(item.Category || 'Main');
        const emoji = categoryEmoji(item.Category);
        const stallId = item.StallId;
        const cuisineNames = item.CuisineNames
          ? `<span class="cuisine-tag" style="margin-left:6px;">${escapeHtml(item.CuisineNames)}</span>`
          : '';
        const likes = item.LikeCount || 0;
        return `
          <div class="food-card top-seller-card" data-stall-id="${stallId}" style="cursor:pointer;">
            <div class="food-header">
              <span class="cuisine-tag">${category} ${cuisineNames}</span>
              ${likes > 0 ? `<span class="trending-like"><i class="fa-solid fa-fire"></i> ${likes} like${likes === 1 ? '' : 's'}</span>` : ''}
            </div>
            <h3>${emoji} &nbsp;${name}</h3>
            <p>${desc}</p>
            <div class="card-footer-action">
              <span class="item-price">${price}</span>
              <a href="/stall-detail.html?stallId=${stallId}" class="btn btn-primary btn-small">View Stall</a>
            </div>
          </div>
        `;
      })
      .join('');

    // Count unique active stalls in the side-stat bar (best-effort)
    try {
      const liveStat = document.querySelector('.mockup-stats div:first-child span');
      if (liveStat && stalls.length) {
        liveStat.textContent = stalls.filter((s) => s.Status === 'Active').length + '+';
      }
    } catch (_) { /* ignore */ }
  } catch (err) {
    renderFallback(err.message);
  }
})();
