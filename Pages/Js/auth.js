const API = '/api';
const message = document.createElement('p');
message.className = 'auth-message';

function showMessage(text, error = true) {
  message.textContent = text; message.style.color = error ? '#fca5a5' : '#86efac';
  document.querySelector('.auth-card').append(message);
}

function friendlyFetchError(error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Cannot reach the HawkerHub server. Run "npm start", then open http://localhost:3000/Login.html (do not open the HTML file directly).';
  }
  return error.message || 'Unable to complete the request.';
}

if (location.protocol === 'file:') {
  document.addEventListener('DOMContentLoaded', () => {
    showMessage('This page must be opened through the server. Run "npm start" and use http://localhost:3000/Login.html.');
  });
}

document.querySelector('#login-form')?.addEventListener('submit', async event => {
  event.preventDefault(); message.remove();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  try {
    const response = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const body = await response.json();
    if (!response.ok) throw new Error(body.error);
    sessionStorage.setItem('hawkerhubToken', body.token);
    sessionStorage.setItem('hawkerhubUser', JSON.stringify(body.user));
    if (body.user.role === 'patron') location.href = 'Patron/Dashboard.html';
    else { showMessage(`Signed in as ${body.user.role.replace('_', ' ')}. Patron pages are restricted to patrons.`, false); }
  } catch (error) { showMessage(friendlyFetchError(error)); }
});

document.querySelector('#register-form')?.addEventListener('submit', async event => {
  event.preventDefault(); message.remove();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.confirmPassword) return showMessage('Passwords do not match.');
  try {
    const response = await fetch(`${API}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const body = await response.json(); if (!response.ok) throw new Error(body.error);
    showMessage(body.message, false); form.reset();
  } catch (error) { showMessage(friendlyFetchError(error)); }
});
