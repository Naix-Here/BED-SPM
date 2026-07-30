const signupToken = new URLSearchParams(location.search).get('token');
const card = document.querySelector('.auth-card');

function showMessage(text) {
  card.querySelector('.auth-message')?.remove();
  const message = document.createElement('p');
  message.className = 'auth-message';
  message.textContent = text;
  message.style.color = '#fca5a5';
  card.append(message);
}

if (!signupToken) {
  showMessage('This role selection link is invalid. Please sign in with Google again.');
  document.querySelectorAll('[data-role]').forEach(button => { button.disabled = true; });
}

document.querySelectorAll('[data-role]').forEach(button => {
  button.addEventListener('click', async () => {
    const buttons = [...document.querySelectorAll('[data-role]')];
    buttons.forEach(item => { item.disabled = true; });
    try {
      const response = await fetch('/api/auth/google/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: signupToken, role: button.dataset.role })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Unable to create your account.');
      sessionStorage.setItem('hawkerhubToken', body.token);
      sessionStorage.setItem('hawkerhubUser', JSON.stringify(body.user));
      location.replace(body.destination);
    } catch (error) {
      showMessage(error.message || 'Unable to create your account.');
      buttons.forEach(item => { item.disabled = false; });
    }
  });
});
