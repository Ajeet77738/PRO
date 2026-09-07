document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const refreshBtn = document.getElementById('refresh-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const tableBody = document.getElementById('responses-table-body');
  const statYes = document.getElementById('stat-yes');
  const statMaybe = document.getElementById('stat-maybe');
  const statNo = document.getElementById('stat-no');

  // Strict DOM text-escaping to prevent XSS
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Format UTC timestamps cleanly
  function formatTimestamp(isoStr) {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return escapeHtml(isoStr);
      return d.toLocaleString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return escapeHtml(isoStr);
    }
  }

  async function checkAuth() {
    try {
      const res = await fetch('/api/admin/me');
      const data = await res.json();
      if (data.authenticated) {
        showDashboard();
      } else {
        showLogin();
      }
    } catch {
      showLogin();
    }
  }

  function showLogin() {
    dashboardSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
  }

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    loadResponses();
  }

  async function loadResponses() {
    try {
      const res = await fetch('/api/admin/responses');
      if (res.status === 401) {
        showLogin();
        return;
      }

      const data = await res.json();
      if (!data.ok) return;

      statYes.textContent = data.stats.yes;
      statMaybe.textContent = data.stats.maybe;
      statNo.textContent = data.stats.no;

      tableBody.innerHTML = '';
      if (!data.responses || data.responses.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No responses recorded yet.</td></tr>';
        return;
      }

      data.responses.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.choice === 'yes' ? 'badge-yes' : item.choice === 'maybe' ? 'badge-maybe' : 'badge-no';

        tr.innerHTML = `
          <td>${escapeHtml(String(item.id))}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(item.choice)}</span></td>
          <td>${formatTimestamp(item.created_at)}</td>
        `;
        tableBody.appendChild(tr);
      });
    } catch (err) {
      console.error('Failed to load responses:', err);
    }
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        showDashboard();
      } else {
        loginError.textContent = data.error || 'Invalid credentials';
        loginError.classList.remove('hidden');
      }
    } catch {
      loginError.textContent = 'Connection error. Please try again.';
      loginError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      showLogin();
    }
  });

  refreshBtn.addEventListener('click', loadResponses);
  checkAuth();
});

