// public/js/stall-detail.js — Single stall view with menu, promotions, feedback.
(async function () {
  const params = new URLSearchParams(window.location.search);
  const stallId = params.get('stallId');

  if (!stallId) {
    document.querySelector('main').innerHTML =
      '<div class="page-shell"><p>No stall selected. <a href="/stalls.html" class="text-link">Browse stalls</a>.</p></div>';
    return;
  }

  const $ = (id) => document.getElementById(id);

  const headerEl = $('stallHeader');
  const nameEl = $('stallName');
  const descEl = $('stallDescription');
  const hawkerEl = $('stallHawkerCentre');
  const cuisineWrap = $('stallCuisines');
  const tagsWrap = $('stallTags');
  const menuGrid = $('menuGrid');
  const feedbackLink = $('feedbackLink');
  const joinQueueBtn = $('joinQueueBtn');
  const promoSection = $('promoSection');
  const promoGrid = $('promoGrid');
  const feedbackSection = $('feedbackSection');
  const feedbackList = $('feedbackList');

  feedbackLink.href = `/feedback.html?stallId=${encodeURIComponent(stallId)}`;

  // ----- Helpers -----
  function gradeColor(grade) {
    switch (grade) {
      case 'A': return 'tag-success';
      case 'B': return 'tag-warning';
      case 'C': return 'tag-warning';
      case 'D': return 'tag-danger';
      default: return 'tag-info';
    }
  }

  function categoryColor(category) {
    switch (category) {
      case 'Main': return 'orange';
      case 'Drink': return 'yellow';
      case 'Dessert': return 'red';
      case 'Side': return 'yellow';
      case 'Snack': return 'orange';
      default: return 'orange';
    }
  }

  function categoryEmoji(category) {
    switch (category) {
      case 'Main': return '🍜';
      case 'Drink': return '🥤';
      case 'Dessert': return '🍮';
      case 'Side': return '🥗';
      case 'Snack': return '🥪';
      default: return '🍽️';
    }
  }

  // ----- Load stall -----
  let stall = null;
  try {
    const res = await apiFetch(`/stalls/${encodeURIComponent(stallId)}`);
    stall = res.data || res;
  } catch (err) {
    document.querySelector('main').innerHTML =
      `<div class="page-shell"><p>${escapeHtml(err.message)} &nbsp; <a class="text-link" href="/stalls.html">Back to stalls</a></p></div>`;
    return;
  }

  // Render header
  document.title = `${stall.Name} — SHCMS`;
  nameEl.textContent = stall.Name;
  descEl.textContent = stall.Description || 'A welcoming hawker stall.';
  hawkerEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> &nbsp;${escapeHtml(stall.HawkerCentreName || 'Hawker Centre')} &middot; ${escapeHtml(stall.UnitNumber || '')}`;

  // Hero image: only set background-image for safe http(s) URLs;
  // otherwise the CSS fallback gradient shows through.
  const heroImg = document.getElementById('stallHeroImage');
  if (heroImg) {
    const raw = typeof stall.ImageUrl === 'string' ? stall.ImageUrl : '';
    const safe = /^https?:\/\//i.test(raw) ? raw : '';
    if (safe) {
      heroImg.style.backgroundImage = `url('${safe}')`;
      heroImg.classList.remove('stall-hero-image--fallback');
    } else {
      heroImg.classList.add('stall-hero-image--fallback');
    }
  }

  // Cuisines
  const cuisines = (stall.Cuisines || []).map((c) => c.Name);
  cuisineWrap.innerHTML = cuisines.length
    ? cuisines.map((c) => `<span class="cuisine-tag">${escapeHtml(c)}</span>`).join(' ')
    : '';

  // Tags: hygiene grade + status
  const grade = stall.CurrentHygieneGrade;
  let tagsHtml = '';
  if (grade) {
    tagsHtml += `<span class="tag ${gradeColor(grade)}">Hygiene Grade ${escapeHtml(grade)}</span> `;
  } else {
    tagsHtml += `<span class="tag tag-info">No recent grade</span> `;
  }
  tagsHtml += `<span class="tag ${stall.Status === 'Active' ? 'tag-success' : 'tag-warning'}">${escapeHtml(stall.Status)}</span>`;
  tagsWrap.innerHTML = tagsHtml;

  // Owner
  if (stall.OwnerName) {
    descEl.textContent = `${stall.Description || 'A welcoming hawker stall.'} Run by ${stall.OwnerName}.`;
  }

  // Show join-queue only for customers
  if (isLoggedIn() && hasRole('Customer')) {
    joinQueueBtn.style.display = '';
  }

  // ----- Load menu -----
  try {
    const menuRes = await apiFetch(`/stalls/${encodeURIComponent(stallId)}/menu`);
    const items = menuRes.data || menuRes || [];
    if (!items.length) {
      menuGrid.innerHTML = '<div class="dish-card"><div class="dish-content">No menu items yet.</div></div>';
    } else {
      menuGrid.innerHTML = items.map((it) => {
        const emoji = categoryEmoji(it.Category);
        const cuisineNames = it.CuisineNames ? ` <span class="cuisine-tag" style="margin-left:6px;">${escapeHtml(it.CuisineNames)}</span>` : '';
        const likeCount = it.LikeCount || 0;
        return `
          <div class="dish-card">
            <div class="dish-image ${categoryColor(it.Category)}">${emoji}</div>
            <div class="dish-content">
              <h3>${escapeHtml(it.Name)}</h3>
              <p>${escapeHtml(it.Description || '')}</p>
              ${cuisineNames}
              <div class="dish-footer">
                <strong>${formatPrice(it.Price)}</strong>
                <div style="display:flex;gap:6px;align-items:center;">
                  <button class="btn btn-secondary btn-small" data-like-id="${it.MenuItemId}" title="Like this dish">
                    <i class="fa-regular fa-heart"></i> &nbsp;<span data-like-count="${it.MenuItemId}">${likeCount}</span>
                  </button>
                  <button class="btn btn-primary btn-small" data-add-id="${it.MenuItemId}" ${it.IsAvailable ? '' : 'disabled'}>
                    ${it.IsAvailable ? 'Add to Cart' : 'Sold Out'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Mark which items the current user has already liked, so the heart shows as solid.
      if (isLoggedIn() && hasRole('Customer')) {
        try {
          // Only the current customer's likes — not everyone's — so the heart
          // reflects what THIS user has actually liked.
          const myId = getCurrentUser().userId;
          const likedRes = await apiFetch(`/likes?customerId=${encodeURIComponent(myId)}`);
          const likedRows = (likedRes && likedRes.data) || [];
          const likedSet = new Set(likedRows.map((r) => Number(r.MenuItemId)));
          menuGrid.querySelectorAll('[data-like-id]').forEach((btn) => {
            const id = Number(btn.getAttribute('data-like-id'));
            const icon = btn.querySelector('i');
            if (icon && likedSet.has(id)) {
              icon.classList.remove('fa-regular');
              icon.classList.add('fa-solid');
              btn.classList.add('liked');
            }
          });
        } catch (_) { /* ignore */ }
      }

      // Wire add-to-cart
      menuGrid.addEventListener('click', async (e) => {
        const addBtn = e.target.closest('[data-add-id]');
        if (addBtn) {
          const menuItemId = addBtn.getAttribute('data-add-id');
          await addToCart(menuItemId);
        }
        const likeBtn = e.target.closest('[data-like-id]');
        if (likeBtn) {
          const menuItemId = likeBtn.getAttribute('data-like-id');
          await toggleLike(menuItemId, likeBtn);
        }
      });
    }
  } catch (err) {
    menuGrid.innerHTML = `<div class="dish-card"><div class="dish-content">Failed to load menu: ${escapeHtml(err.message)}</div></div>`;
  }

  // ----- Promotions (best-effort) -----
  try {
    const promoRes = await apiFetch(`/promotions?stallId=${encodeURIComponent(stallId)}`).catch(() => null);
    if (promoRes && promoRes.data) {
      const promos = promoRes.data;
      if (promos.length) {
        promoSection.style.display = '';
        promoGrid.style.display = '';
        promoGrid.innerHTML = promos.map((p) => {
          let valueText = '';
          if (p.DiscountType === 'Percentage') valueText = `${p.DiscountValue}%`;
          else if (p.DiscountType === 'Fixed') valueText = formatPrice(p.DiscountValue);
          else if (p.DiscountType === 'Points') valueText = `${p.DiscountValue}pts`;
          else if (p.DiscountType === 'Delivery') valueText = 'Free';
          return `
            <div class="voucher-card">
              <div class="voucher-value">${escapeHtml(valueText)}<small>${escapeHtml((p.DiscountType || '').toUpperCase())}</small></div>
              <div>
                <h2>${escapeHtml(p.Title)}</h2>
                <p>${escapeHtml(p.Description || '')}</p>
                <small>Valid ${formatDate(p.StartDate)} – ${formatDate(p.EndDate)}</small>
              </div>
              <div><span class="voucher-tag">PROMO</span></div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (_) { /* ignore */ }

  // ----- Recent feedback (best-effort) -----
  try {
    const fbRes = await apiFetch(`/feedback?stallId=${encodeURIComponent(stallId)}`).catch(() => null);
    if (fbRes && fbRes.data && fbRes.data.length) {
      const items = fbRes.data.slice(0, 5);
      feedbackSection.style.display = '';
      feedbackList.innerHTML = items.map((f) => {
        const stars = '★'.repeat(f.Rating || 0) + '☆'.repeat(5 - (f.Rating || 0));
        return `
          <div class="panel" style="margin-bottom:10px;">
            <div style="color:#eab308;font-size:.9rem;margin-bottom:4px;">${stars}</div>
            <p style="margin:0;">${escapeHtml(f.Comment || '—')}</p>
            <small style="color:var(--text-dimmed);">${escapeHtml(f.CustomerName || 'Customer')} &middot; ${formatDate(f.CreatedAt)}</small>
          </div>
        `;
      }).join('');
    }
  } catch (_) { /* ignore */ }

  // ----- Actions: add to cart / join queue / like -----
  async function addToCart(menuItemId) {
    if (!isLoggedIn()) {
      showNotice('Please log in to add items to your cart.', 'info');
      setTimeout(() => (window.location.href = '/login.html'), 800);
      return;
    }
    if (!hasRole('Customer')) {
      showNotice('Only customers can add items to a cart.', 'error');
      return;
    }
    try {
      // Find an existing active cart for this stall, or create one.
      // GET /cart returns the caller's carts; filter by stallId.
      let cartId = null;
      const listRes = await apiFetch('/cart');
      const carts = (listRes && listRes.data) || [];
      const existing = carts.find(
        (c) => Number(c.StallId) === Number(stallId) && c.Status === 'Active'
      );
      if (existing) {
        cartId = existing.CartId;
      } else {
        const createRes = await apiFetch('/cart', {
          method: 'POST',
          body: { stallId: Number(stallId) },
        });
        cartId = (createRes && createRes.data && createRes.data.CartId) || null;
      }
      if (!cartId) throw new Error('Could not create a cart.');
      await apiFetch('/cart-items', {
        method: 'POST',
        body: { cartId, menuItemId: Number(menuItemId), quantity: 1 },
      });
      showNotice('Added to cart!', 'success');
      // Keep the navbar cart badge in sync
      if (typeof refreshCartBadge === 'function') refreshCartBadge();
    } catch (err) {
      showNotice('Could not add to cart: ' + err.message, 'error');
    }
  }

  async function toggleLike(menuItemId, btn) {
    if (!isLoggedIn()) {
      showNotice('Please log in to like dishes.', 'info');
      return;
    }
    if (!hasRole('Customer')) {
      showNotice('Only customers can like dishes.', 'error');
      return;
    }
    const isCurrentlyLiked = btn.classList.contains('liked');
    const icon = btn.querySelector('i');
    const span = btn.querySelector(`[data-like-count="${menuItemId}"]`);
    try {
      if (isCurrentlyLiked) {
        // Find the existing like id for this customer + menu item, then DELETE it.
        const likedRes = await apiFetch(`/likes?customerId=${encodeURIComponent(getCurrentUser().userId)}&menuItemId=${encodeURIComponent(menuItemId)}`);
        const likedRows = (likedRes && likedRes.data) || [];
        const likeRow = likedRows.find(
          (r) => Number(r.MenuItemId) === Number(menuItemId) && Number(r.CustomerId) === Number(getCurrentUser().userId)
        );
        if (!likeRow) throw new Error('Like not found.');
        await apiFetch(`/likes/${likeRow.LikeId}`, { method: 'DELETE' });
        if (icon) {
          icon.classList.remove('fa-solid');
          icon.classList.add('fa-regular');
        }
        btn.classList.remove('liked');
        if (span) span.textContent = Math.max(0, Number(span.textContent || 0) - 1);
        showNotice('Removed your like.', 'success');
      } else {
        const res = await apiFetch('/likes', {
          method: 'POST',
          body: { menuItemId: Number(menuItemId) },
        });
        const data = res.data || res;
        if (icon) {
          icon.classList.remove('fa-regular');
          icon.classList.add('fa-solid');
        }
        btn.classList.add('liked');
        if (span && data && typeof data.LikeCount === 'number') {
          span.textContent = data.LikeCount;
        } else if (span) {
          span.textContent = Number(span.textContent || 0) + 1;
        }
        showNotice('Thanks for the like!', 'success');
      }
    } catch (err) {
      showNotice('Could not update like: ' + err.message, 'error');
    }
  }

  if (joinQueueBtn) {
    joinQueueBtn.addEventListener('click', async () => {
      try {
        await apiFetch('/queue', {
          method: 'POST',
          body: { stallId: Number(stallId) },
        });
        showNotice('You\'re in the queue!', 'success');
      } catch (err) {
        showNotice('Could not join queue: ' + err.message, 'error');
      }
    });
  }
})();
