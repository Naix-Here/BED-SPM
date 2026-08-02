// public/js/vendor-rentals.js — Rental agreement listing/CRUD.
(async function () {
  if (!requireAuth()) return;

  const list = document.getElementById('rentalList');
  const subtitle = document.getElementById('subtitle');
  const addBtn = document.getElementById('addBtn');
  const modal = document.getElementById('agreementModal');
  const form = document.getElementById('agreementForm');
  const cancelBtn = document.getElementById('cancelBtn');
  const modalTitle = document.getElementById('modalTitle');
  const stallSelect = document.getElementById('stallId');

  const me = getCurrentUser();
  const canManage = me && me.role === 'Operator';
  if (canManage) addBtn.style.display = '';

  function statusTag(s) {
    if (s === 'Active') return '<span class="tag tag-success">Active</span>';
    if (s === 'Expired') return '<span class="tag tag-warning">Expired</span>';
    if (s === 'Terminated') return '<span class="tag tag-danger">Terminated</span>';
    if (s === 'Renewed') return '<span class="tag tag-info">Renewed</span>';
    return `<span class="tag tag-info">${escapeHtml(s)}</span>`;
  }

  function render(agreements) {
    if (!agreements.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-file-contract"></i><p>No rental agreements on file.</p></div>';
      return;
    }
    list.innerHTML = agreements.map((a) => {
      const editDelete = canManage
        ? `<div class="overflow-actions">
             <button class="btn btn-secondary btn-small" data-edit-id="${a.RentalAgreementId}">Edit</button>
             <button class="btn btn-danger btn-small" data-delete-id="${a.RentalAgreementId}">Delete</button>
           </div>`
        : '';
      return `
        <div class="agreement-card">
          <div class="row">
            <div>
              <h3>${escapeHtml(a.StallName || 'Stall')} &middot; ${escapeHtml(a.HawkerCentreName || '')}</h3>
              <small style="color:var(--muted);">#${a.RentalAgreementId}</small>
            </div>
            ${statusTag(a.Status)}
          </div>
          <div class="details">
            <div><span>Monthly rent</span><strong>${formatPrice(a.MonthlyRent)}</strong></div>
            <div><span>Start date</span><strong>${formatDate(a.StartDate)}</strong></div>
            <div><span>End date</span><strong>${a.EndDate ? formatDate(a.EndDate) : 'Ongoing'}</strong></div>
            <div><span>Created</span><strong>${formatDate(a.CreatedAt)}</strong></div>
          </div>
          ${a.Terms ? `<p style="font-size:.85rem;color:var(--muted);margin:0 0 8px;">${escapeHtml(a.Terms)}</p>` : ''}
          ${editDelete}
        </div>
      `;
    }).join('');
  }

  async function load() {
    try {
      const res = await apiFetch('/rental-agreements');
      const agreements = res.data || res || [];
      subtitle.textContent = canManage
        ? `Managing ${agreements.length} agreement${agreements.length === 1 ? '' : 's'} across all stalls.`
        : `Showing ${agreements.length} agreement${agreements.length === 1 ? '' : 's'} for your stall(s).`;
      render(agreements);
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><p>${escapeHtml(err.message)}</p></div>`;
    }
  }

  // ----- Modal helpers -----
  async function loadStallsIntoSelect() {
    try {
      const res = await apiFetch('/stalls');
      const stalls = res.data || res || [];
      stallSelect.innerHTML = '<option value="">Select a stall…</option>' + stalls.map((s) => (
        `<option value="${s.StallId}">${escapeHtml(s.Name)} (${escapeHtml(s.HawkerCentreName || '')})</option>`
      )).join('');
    } catch (_) { /* ignore */ }
  }

  function openModal(item) {
    form.reset();
    modalTitle.textContent = item ? 'Edit Rental Agreement' : 'New Rental Agreement';
    document.getElementById('agreementId').value = item ? item.RentalAgreementId : '';
    document.getElementById('stallId').value = item ? item.StallId : '';
    document.getElementById('monthlyRent').value = item ? item.MonthlyRent : '';
    document.getElementById('status').value = item ? item.Status : 'Active';
    document.getElementById('startDate').value = item && item.StartDate ? String(item.StartDate).substring(0, 10) : '';
    document.getElementById('endDate').value = item && item.EndDate ? String(item.EndDate).substring(0, 10) : '';
    document.getElementById('terms').value = item ? (item.Terms || '') : '';
    modal.classList.add('open');
  }
  function closeModal() { modal.classList.remove('open'); }

  addBtn.addEventListener('click', async () => {
    await loadStallsIntoSelect();
    openModal(null);
  });
  cancelBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('agreementId').value;
    const payload = {
      stallId: Number(document.getElementById('stallId').value),
      monthlyRent: Number(document.getElementById('monthlyRent').value),
      startDate: document.getElementById('startDate').value,
      endDate: document.getElementById('endDate').value || null,
      status: document.getElementById('status').value,
      terms: document.getElementById('terms').value.trim() || null,
    };
    if (!payload.stallId || !payload.startDate || payload.monthlyRent <= 0) {
      showNotice('Stall, start date, and a positive monthly rent are required.', 'error');
      return;
    }
    if (payload.endDate && new Date(payload.endDate) <= new Date(payload.startDate)) {
      showNotice('End date must be after start date.', 'error');
      return;
    }
    try {
      document.getElementById('saveBtn').disabled = true;
      if (id) {
        await apiFetch(`/rental-agreements/${id}`, { method: 'PUT', body: payload });
        showNotice('Rental agreement updated.', 'success');
      } else {
        await apiFetch('/rental-agreements', { method: 'POST', body: payload });
        showNotice('Rental agreement created.', 'success');
      }
      closeModal();
      await load();
    } catch (err) {
      showNotice('Save failed: ' + err.message, 'error');
    } finally {
      document.getElementById('saveBtn').disabled = false;
    }
  });

  // ----- Card click delegation -----
  list.addEventListener('click', async (e) => {
    const editBtn = e.target.closest('[data-edit-id]');
    const delBtn = e.target.closest('[data-delete-id]');
    if (editBtn) {
      const id = Number(editBtn.getAttribute('data-edit-id'));
      try {
        const res = await apiFetch(`/rental-agreements/${id}`);
        const a = res.data || res;
        await loadStallsIntoSelect();
        openModal(a);
      } catch (err) {
        showNotice('Could not load: ' + err.message, 'error');
      }
      return;
    }
    if (delBtn) {
      const id = Number(delBtn.getAttribute('data-delete-id'));
      if (!confirm('Delete this rental agreement? This cannot be undone.')) return;
      try {
        await apiFetch(`/rental-agreements/${id}`, { method: 'DELETE' });
        showNotice('Rental agreement deleted.', 'success');
        await load();
      } catch (err) {
        showNotice('Delete failed: ' + err.message, 'error');
      }
    }
  });

  await load();
})();
