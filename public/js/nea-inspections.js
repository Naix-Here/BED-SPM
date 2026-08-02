// public/js/nea-inspections.js — NEA Inspection log page.

let allStalls = [];

function gradeTag(g) {
  const map = { A: 'tag-success', B: 'tag-info', C: 'tag-warning', D: 'tag-danger' };
  return `<span class="tag ${map[g] || 'tag-info'}">${escapeHtml(g)}</span>`;
}

async function loadStalls() {
  const sel = document.getElementById('i-stall');
  const filter = document.getElementById('filter-stall');
  try {
    const res = await apiFetch('/stalls');
    allStalls = (res && res.data) || [];
    const opts = allStalls.map((s) => `<option value="${s.StallId}">${escapeHtml(s.Name)}</option>`).join('');
    sel.innerHTML = allStalls.length ? opts : '<option>No stalls</option>';
    filter.innerHTML = '<option value="">All stalls</option>' + opts;
  } catch (err) {
    sel.innerHTML = `<option>${escapeHtml(err.message)}</option>`;
  }
}

async function loadInspections() {
  const tbody = document.getElementById('insp-tbody');
  const stallFilter = document.getElementById('filter-stall').value;
  const query = stallFilter ? `?stallId=${stallFilter}` : '';
  try {
    const res = await apiFetch('/inspections' + query);
    const items = (res && res.data) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-dimmed); padding:30px;">No inspections recorded yet.</td></tr>';
      return;
    }
    tbody.innerHTML = items.map((i) => {
      const canDelete = isLoggedIn() && getCurrentUser().role === 'NEAOfficer';
      return `
        <tr>
          <td>${escapeHtml(i.StallName || '')}</td>
          <td>${formatDate(i.InspectionDate)}</td>
          <td>${Number(i.Score).toFixed(1)}</td>
          <td>${gradeTag(i.GradeIssued)}</td>
          <td>${escapeHtml(i.OfficerName || '')}</td>
          <td style="max-width:280px; color:var(--text-dimmed);">${escapeHtml((i.Remarks || '').slice(0, 80))}${(i.Remarks || '').length > 80 ? '…' : ''}</td>
          <td>
            <div class="overflow-actions">
              ${canDelete ? `<button class="btn btn-danger btn-small" data-del="${i.InspectionId}"><i class="fa-solid fa-trash"></i></button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Wire delete buttons
    document.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this inspection? This cannot be undone.')) return;
        const id = parseInt(btn.dataset.del);
        try {
          await apiFetch(`/inspections/${id}`, { method: 'DELETE' });
          showNotice('Inspection deleted', 'success');
          loadInspections();
        } catch (err) {
          showNotice(err.message || 'Failed to delete', 'error');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="color:var(--danger); text-align:center;">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function submitInspection(e) {
  e.preventDefault();
  const stallId = parseInt(document.getElementById('i-stall').value);
  const inspectionDate = document.getElementById('i-date').value;
  const score = parseFloat(document.getElementById('i-score').value);
  const gradeIssued = document.getElementById('i-grade').value;
  const remarks = document.getElementById('i-remarks').value.trim();

  if (!stallId || !inspectionDate || isNaN(score)) {
    showNotice('Please complete all required fields', 'error');
    return;
  }

  try {
    await apiFetch('/inspections', {
      method: 'POST',
      body: JSON.stringify({ stallId, inspectionDate, score, gradeIssued, remarks }),
    });
    showNotice('Inspection saved', 'success');
    e.target.reset();
    loadInspections();
  } catch (err) {
    showNotice(err.message || 'Failed to save', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!requireRole('NEAOfficer')) return;
  renderNavbar('inspections');
  document.getElementById('insp-form').addEventListener('submit', submitInspection);
  document.getElementById('filter-stall').addEventListener('change', loadInspections);
  loadStalls();
  loadInspections();
});
