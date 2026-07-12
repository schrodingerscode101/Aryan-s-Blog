document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const status = document.getElementById('login-status');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.style.color = '#4a4a46';
    status.textContent = 'Logging in...';

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      window.location.href = '/admin/dashboard.html';
    } catch (err) {
      status.style.color = '#7A1F2B';
      status.textContent = err.message;
    }
  });
});
