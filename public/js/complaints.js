// public/js/complaints.js — Complaint submission page.

let allStalls = [];

async function loadStalls() {
  const sel = document.getElementById('c-stall');
  try {
    const res = await apiFetch('/stalls');
    allStalls = (res && res.data) || [];
    if (!allStalls.length) {
      sel.innerHTML = '<option>No stalls available</option>';
      return;
    }
    sel.innerHTML = allStalls.map((s) => `<option value="${s.StallId}">${escapeHtml(s.Name)}</option>`).join('');
  } catch (err) {
    sel.innerHTML = `<option>${escapeHtml(err.message)}</option>`;
  }
}

function statusTag(status) {
  let cls = 'tag-info';
  if (status === 'Open') cls = 'tag-warning';
  else if (status === 'Investigating') cls = 'tag-info';
  else if (status === 'Resolved') cls = 'tag-success';
  return `<span class="tag ${cls}">${escapeHtml(status)}</span>`;
}

async function loadComplaints() {
  const list = document.getElementById('complaints-list');
  list.innerHTML = '<p style="color:var(--text-dimmed);">Loading…</p>';
  try {
    const res = await apiFetch('/complaints/mine');
    const items = (res && res.data) || [];
    if (!items.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-check-circle"></i><p>You have not filed any complaints.</p></div>';
      return;
    }
    list.innerHTML = items.map((c) => `
      <div class="complaint-ticket" style="background:rgba(255,255,255,.02); border:1px solid var(--border-subtle); padding:16px; border-radius:14px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
          <h4 style="font-size:1rem; margin:0;">${escapeHtml(c.Subject)}</h4>
          ${statusTag(c.Status)}
        </div>
        <p style="color:var(--text-dimmed); margin:0 0 6px;">${escapeHtml(c.StallName || '')} · ${formatDate(c.CreatedAt)}</p>
        <p style="margin:0; line-height:1.5;">${escapeHtml(c.Description)}</p>
      </div>
    `).join('');
  } catch (err) {
    list.innerHTML = `<p style="color:var(--danger);">${escapeHtml(err.message)}</p>`;
  }
}

async function submitComplaint() {
  if (!isLoggedIn() || getCurrentUser().role !== 'Customer') {
    showNotice('Please log in as a customer to submit a complaint', 'error');
    return;
  }
  const stallId = parseInt(document.getElementById('c-stall').value);
  const subject = document.getElementById('c-subject').value.trim();
  const description = document.getElementById('c-description').value.trim();
  if (!stallId || !subject || !description) {
    showNotice('Please fill in all fields', 'error');
    return;
  }
  try {
    await apiFetch('/complaints', {
      method: 'POST',
      body: JSON.stringify({ stallId, subject, description }),
    });
    showNotice('Complaint submitted', 'success');
    document.getElementById('c-subject').value = '';
    document.getElementById('c-description').value = '';
    loadComplaints();
  } catch (err) {
    showNotice(err.message || 'Failed to submit', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar('engagement');
  document.getElementById('submit-btn').addEventListener('click', submitComplaint);
  loadStalls();
  loadComplaints();
});
