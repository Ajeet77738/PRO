// Add your Supabase credentials here
const SUPABASE_URL = 'https://ofixhravfmtuuthpavcw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9maXhocmF2Zm10dXV0aHBhdmN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3OTQ2MDEsImV4cCI6MjEwNDM3MDYwMX0.7qYlmuSXOjcZeYgr4COHl0SAucherfxaOjnsmv8Smno';

// Set your private admin credentials here
const ADMIN_USER = 'admin';
const ADMIN_PASS = 'anandpal';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const refreshBtn = document.getElementById('refresh-btn');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const tableBody = document.getElementById('responses-table-body');
  const statYes = document.getElementById('stat-yes');
  const statMaybe = document.getElementById('stat-maybe');
  const statNo = document.getElementById('stat-no');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatTimestamp(isoStr) {
    try {
      const d = new Date(isoStr);
      return isNaN(d.getTime()) ? escapeHtml(isoStr) : d.toLocaleString();
    } catch {
      return escapeHtml(isoStr);
    }
  }

  function checkSession() {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      showDashboard();
    } else {
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
      const { data, error } = await supabaseClient
        .from('responses')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;

      let yes = 0, maybe = 0, no = 0;
      data.forEach(item => {
        if (item.choice === 'yes') yes++;
        else if (item.choice === 'maybe') maybe++;
        else if (item.choice === 'no') no++;
      });

      statYes.textContent = yes;
      statMaybe.textContent = maybe;
      statNo.textContent = no;

      tableBody.innerHTML = '';
      if (!data || data.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: var(--text-muted);">No responses recorded yet.</td></tr>';
        return;
      }

      data.forEach(item => {
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
      console.error(err);
      tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center; color: red;">Failed to fetch responses.</td></tr>';
    }
  }

  // Clear all responses handler
  clearAllBtn.addEventListener('click', async () => {
    const confirmDelete = window.confirm('Are you sure you want to delete ALL responses? This cannot be undone.');
    if (!confirmDelete) return;

    try {
      // Deletes all rows where id is greater than 0
      const { error } = await supabaseClient
        .from('responses')
        .delete()
        .gt('id', 0);

      if (error) throw error;

      alert('All responses have been cleared.');
      loadResponses();
    } catch (err) {
      console.error(err);
      alert('Failed to clear responses. Ensure you executed the DELETE policy in Supabase SQL Editor.');
    }
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loginError.classList.add('hidden');
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value;

    if (u === ADMIN_USER && p === ADMIN_PASS) {
      sessionStorage.setItem('isAdmin', 'true');
      showDashboard();
    } else {
      loginError.textContent = 'Invalid username or password';
      loginError.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('isAdmin');
    showLogin();
  });

  refreshBtn.addEventListener('click', loadResponses);
  checkSession();
});
      data.forEach(item => {
        const tr = document.createElement('tr');
        const badgeClass = item.choice === 'yes' ? 'badge-yes' : item.choice === 'maybe' ? 'badge-maybe' : 'badge-no';
        const msgText = item.message ? escapeHtml(item.message) : '<span style="color:#94a3b8; font-style:italic;">No note</span>';

        tr.innerHTML = `
          <td>${escapeHtml(String(item.id))}</td>
          <td><span class="badge ${badgeClass}">${escapeHtml(item.choice)}</span></td>
          <td style="max-width: 260px; word-break: break-word;">${msgText}</td>
          <td>${formatTimestamp(item.created_at)}</td>
        `;
        tableBody.appendChild(tr);
      });

