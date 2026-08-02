// public/js/vendor-menu.js — Manage menu items for a vendor's stall.
(async function () {
  if (!requireRole('Vendor')) return;

  const grid = document.getElementById('itemGrid');
  const stallNameEl = document.getElementById('stallName');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const availableFilter = document.getElementById('availableFilter');
  const modal = document.getElementById('itemModal');
  const form = document.getElementById('itemForm');
  const addBtn = document.getElementById('addBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalTitle = document.getElementById('modalTitle');
  const cuisineList = document.getElementById('cuisineList');

  const me = getCurrentUser();
  let stall = null;
  let allItems = [];
  let allCuisines = [];

  // ----- Find vendor's stall -----
  try {
    const res = await apiFetch('/stalls');
    const stalls = res.data || res || [];
    stall = stalls.find((s) => s.OwnerId === me.userId) || null;
    if (!stall) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-store"></i><p>No stall assigned to your account.</p></div>';
      return;
    }
    stallNameEl.textContent = `Managing menu for ${stall.Name}.`;
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
    return;
  }

  // ----- Load cuisines -----
  try {
    const cRes = await apiFetch('/cuisines');
    allCuisines = cRes.data || cRes || [];
    cuisineList.innerHTML = allCuisines.map((c) => `
      <label style="display:flex;align-items:center;gap:8px;padding:6px;background:rgba(0,0,0,.2);border-radius:8px;cursor:pointer;">
        <input type="checkbox" value="${c.CuisineId}" style="width:auto;margin:0;accent-color:var(--accent);" />
        <span>${escapeHtml(c.Name)}</span>
      </label>
    `).join('');
  } catch (_) { /* ignore */ }

  // ----- Render items -----
  function render() {
    const q = (searchInput.value || '').trim().toLowerCase();
    const cat = categoryFilter.value;
    const avail = availableFilter.value;

    let list = allItems.slice();
    if (q) list = list.filter((it) => (it.Name || '').toLowerCase().includes(q));
    if (cat) list = list.filter((it) => it.Category === cat);
    if (avail === 'available') list = list.filter((it) => it.IsAvailable);
    if (avail === 'unavailable') list = list.filter((it) => !it.IsAvailable);

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fa-solid fa-utensils"></i>
          <p>No menu items match. Try clearing filters or add a new item!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = list.map((it) => {
      const cuisineNames = it.CuisineNames
        ? String(it.CuisineNames).split(',').map((s) => s.trim()).filter(Boolean).slice(0, 3).map((n) =>
            `<span class="cuisine-tag">${escapeHtml(n)}</span>`
          ).join(' ')
        : '';
      return `
        <div class="item-card">
          <div class="item-category">${escapeHtml(it.Category)}</div>
          <div class="item-name">${escapeHtml(it.Name)}</div>
          <div class="item-price">${formatPrice(it.Price)}</div>
          <p class="item-desc">${escapeHtml(it.Description || 'No description.')}</p>
          <div class="cuisine-tags">${cuisineNames}</div>
          <div class="item-footer">
            <label style="display:flex;align-items:center;gap:8px;font-size:.82rem;color:var(--muted);">
              <input type="checkbox" data-toggle-id="${it.MenuItemId}" ${it.IsAvailable ? 'checked' : ''} style="width:auto;margin:0;accent-color:var(--accent);" />
              Available
            </label>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-small" data-edit-id="${it.MenuItemId}">Edit</button>
              <button class="btn btn-danger btn-small" data-delete-id="${it.MenuItemId}">Delete</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function loadItems() {
    try {
      const res = await apiFetch(`/menu-items?stallId=${stall.StallId}`);
      allItems = res.data || res || [];
      render();
    } catch (err) {
      grid.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  // ----- Modal helpers -----
  function openModal(item) {
    form.reset();
    modalTitle.textContent = item ? 'Edit Menu Item' : 'Add Menu Item';
    document.getElementById('menuItemId').value = item ? item.MenuItemId : '';
    document.getElementById('itemName').value = item ? item.Name : '';
    document.getElementById('itemDescription').value = item ? (item.Description || '') : '';
    document.getElementById('itemPrice').value = item ? item.Price : '';
    document.getElementById('itemCategory').value = item ? item.Category : 'Main';
    document.getElementById('itemIsAvailable').checked = item ? !!item.IsAvailable : true;

    // Reset cuisines
    Array.from(cuisineList.querySelectorAll('input')).forEach((cb) => (cb.checked = false));
    if (item && item.CuisineNames) {
      const names = String(item.CuisineNames).split(',').map((s) => s.trim()).filter(Boolean);
      Array.from(cuisineList.querySelectorAll('input')).forEach((cb) => {
        if (names.includes(cb.nextElementSibling.textContent.trim())) cb.checked = true;
      });
    }

    modal.classList.add('open');
  }
  function closeModal() { modal.classList.remove('open'); }

  addBtn.addEventListener('click', () => openModal(null));
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('menuItemId').value;
    const payload = {
      stallId: stall.StallId,
      name: document.getElementById('itemName').value.trim(),
      description: document.getElementById('itemDescription').value.trim(),
      price: Number(document.getElementById('itemPrice').value),
      category: document.getElementById('itemCategory').value,
      isAvailable: document.getElementById('itemIsAvailable').checked,
      cuisineIds: Array.from(cuisineList.querySelectorAll('input:checked')).map((cb) => Number(cb.value)),
    };

    if (!payload.name || !payload.price || !payload.category) {
      showNotice('Name, price, and category are required.', 'error');
      return;
    }
    if (payload.price <= 0) {
      showNotice('Price must be positive.', 'error');
      return;
    }

    try {
      const saveBtn = document.getElementById('saveBtn');
      saveBtn.disabled = true;
      if (id) {
        await apiFetch(`/menu-items/${id}`, { method: 'PUT', body: payload });
        showNotice('Menu item updated.', 'success');
      } else {
        await apiFetch('/menu-items', { method: 'POST', body: payload });
        showNotice('Menu item created.', 'success');
      }
      closeModal();
      await loadItems();
    } catch (err) {
      showNotice('Save failed: ' + err.message, 'error');
    } finally {
      document.getElementById('saveBtn').disabled = false;
    }
  });

  // ----- Card click handlers (event delegation) -----
  grid.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-id]');
    const delBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const id = Number(editBtn.getAttribute('data-edit-id'));
      const item = allItems.find((it) => it.MenuItemId === id);
      if (item) openModal(item);
      return;
    }
    if (delBtn) {
      const id = Number(delBtn.getAttribute('data-delete-id'));
      if (!confirm('Delete this menu item? This cannot be undone.')) return;
      try {
        await apiFetch(`/menu-items/${id}`, { method: 'DELETE' });
        showNotice('Menu item deleted.', 'success');
        await loadItems();
      } catch (err) {
        showNotice('Delete failed: ' + err.message, 'error');
      }
      return;
    }
    const toggle = e.target.closest('[data-toggle-id]');
    if (toggle) {
      const id = Number(toggle.getAttribute('data-toggle-id'));
      const item = allItems.find((it) => it.MenuItemId === id);
      if (!item) return;
      try {
        await apiFetch(`/menu-items/${id}`, {
          method: 'PUT',
          body: {
            stallId: stall.StallId,
            name: item.Name,
            description: item.Description || '',
            price: Number(item.Price),
            category: item.Category,
            isAvailable: toggle.checked,
            cuisineIds: [],
          },
        });
        item.IsAvailable = toggle.checked ? 1 : 0;
        showNotice(`Item is now ${toggle.checked ? 'available' : 'unavailable'}.`, 'info');
      } catch (err) {
        toggle.checked = !toggle.checked;
        showNotice('Update failed: ' + err.message, 'error');
      }
    }
  });

  // ----- Filters -----
  searchInput.addEventListener('input', render);
  categoryFilter.addEventListener('change', render);
  availableFilter.addEventListener('change', render);

  await loadItems();
})();
