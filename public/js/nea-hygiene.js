// public/js/nea-hygiene.js — Hygiene grade history page.

let allStalls = [];
let selectedStallId = null;

function gradeColor(g) {
  return { A: '#22c55e', B: '#60a5fa', C: '#fb923c', D: '#ef4444' }[g] || '#94a3b8';
}

function gradeTag(g) {
  const cls = { A: 'tag-success', B: 'tag-info', C: 'tag-warning', D: 'tag-danger' }[g] || 'tag-info';
  return `<span class="tag ${cls}">${escapeHtml(g)}</span>`;
}

async function loadStalls() {
  const sel = document.getElementById('hg-stall');
  try {
    const res = await apiFetch('/stalls');
    allStalls = (res && res.data) || [];
    if (!allStalls.length) {
      sel.innerHTML = '<option>No stalls</option>';
      return;
    }
    sel.innerHTML = allStalls.map((s) => `<option value="${s.StallId}">${escapeHtml(s.Name)}</option>`).join('');
    selectedStallId = parseInt(sel.value);
    loadHistory();
  } catch (err) {
    sel.innerHTML = `<option>${escapeHtml(err.message)}</option>`;
  }
}

async function loadHistory() {
  const tbody = document.getElementById('hg-tbody');
  const sel = document.getElementById('hg-stall');
  selectedStallId = parseInt(sel.value);
  if (!selectedStallId) return;

  // Current grade (use stall model's currentHygieneGrade if available, else pull from history)
  try {
    const stallRes = await apiFetch(`/stalls/${selectedStallId}`);
    const stall = (stallRes && stallRes.data) || null;
    if (stall && stall.CurrentHygieneGrade) {
      document.getElementById('current-grade-letter').textContent = stall.CurrentHygieneGrade;
      document.getElementById('current-grade-letter').style.color = gradeColor(stall.CurrentHygieneGrade);
      document.getElementById('current-grade-meta').textContent = 'Active and within validity period.';
    } else {
      document.getElementById('current-grade-letter').textContent = '—';
      document.getElementById('current-grade-letter').style.color = '#94a3b8';
      document.getElementById('current-grade-meta').textContent = 'No active grade.';
    }
  } catch (e) {
    document.getElementById('current-grade-letter').textContent = '—';
    document.getElementById('current-grade-meta').textContent = 'No active grade.';
  }

  // Show issue form only for NEA officers
  const issueForm = document.getElementById('issue-form');
  if (isLoggedIn() && getCurrentUser().role === 'NEAOfficer') {
    issueForm.style.display = 'block';
    const today = new Date().toISOString().slice(0, 10);
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (!document.getElementById('ng-issued').value) document.getElementById('ng-issued').value = today;
    if (!document.getElementById('ng-expiry').value) document.getElementById('ng-expiry').value = oneYearLater;
  } else {
    issueForm.style.display = 'none';
  }

  try {
    const res = await apiFetch(`/hygiene-grades/stall/${selectedStallId}`);
    const items = (res && res.data) || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-dimmed); padding:30px;">No grades recorded for this stall yet.</td></tr>';
      return;
    }
    const canDelete = isLoggedIn() && getCurrentUser().role === 'NEAOfficer';
    tbody.innerHTML = items.map((g) => `
      <tr>
        <td>${formatDate(g.IssuedDate)}</td>
        <td>${formatDate(g.ExpiryDate)}</td>
        <td>${gradeTag(g.Grade)}</td>
        <td>${g.InspectionId ? '#' + g.InspectionId + (g.InspectionScore ? ' · ' + Number(g.InspectionScore).toFixed(1) : '') : '—'}</td>
        <td>
          ${canDelete ? `<button class="btn btn-danger btn-small" data-del="${g.HygieneGradeId}"><i class="fa-solid fa-trash"></i></button>` : ''}
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('[data-del]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this grade record?')) return;
        try {
          await apiFetch(`/hygiene-grades/${btn.dataset.del}`, { method: 'DELETE' });
          showNotice('Grade deleted', 'success');
          loadHistory();
        } catch (err) {
          showNotice(err.message || 'Failed to delete', 'error');
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="color:var(--danger); text-align:center;">${escapeHtml(err.message)}</td></tr>`;
  }
}

async function issueGrade() {
  if (!isLoggedIn() || getCurrentUser().role !== 'NEAOfficer') {
    showNotice('Only NEA officers can issue grades', 'error');
    return;
  }
  if (!selectedStallId) {
    showNotice('Please select a stall first', 'error');
    return;
  }
  const grade = document.getElementById('ng-grade').value;
  const issuedDate = document.getElementById('ng-issued').value;
  const expiryDate = document.getElementById('ng-expiry').value;
  if (!issuedDate || !expiryDate) {
    showNotice('Both dates are required', 'error');
    return;
  }
  try {
    await apiFetch('/hygiene-grades', {
      method: 'POST',
      body: JSON.stringify({ stallId: selectedStallId, grade, issuedDate, expiryDate }),
    });
    showNotice('Grade issued successfully', 'success');
    loadHistory();
  } catch (err) {
    showNotice(err.message || 'Failed to issue grade', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    showNotice('Please log in to view hygiene grades', 'error');
    setTimeout(() => (window.location.href = '/login.html'), 1500);
    return;
  }
  renderNavbar('hygiene');
  document.getElementById('hg-stall').addEventListener('change', loadHistory);
  document.getElementById('issue-grade-btn').addEventListener('click', issueGrade);
  loadStalls();
});
