const authBackdrop = document.getElementById('authBackdrop');
const btnOpenLogin = document.getElementById('btnOpenLogin');
const btnCloseAuth = document.getElementById('btnCloseAuth');
const btnShowRegister = document.getElementById('btnShowRegister');
const btnShowLogin = document.getElementById('btnShowLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');

const headerActions = document.getElementById('headerActions');

const dashboardCard = document.getElementById('dashboardCard');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const transactionListEl = document.getElementById('transactionList');
const addTransactionBtn = document.getElementById('addTransaction');
const clearTransactionsBtn = document.getElementById('clearTransactions');

let transactions = JSON.parse(localStorage.getItem('smartlearnTx')) || [];

/* show/hide modal */
btnOpenLogin.addEventListener('click', () => {
  authBackdrop.classList.add('active');
  showLogin();
});
btnCloseAuth.addEventListener('click', () => authBackdrop.classList.remove('active'));
authBackdrop.addEventListener('click', (e) => { if (e.target === authBackdrop) authBackdrop.classList.remove('active'); });

function showRegister() {
  loginForm.style.display = 'none';
  registerForm.style.display = 'block';
}
function showLogin() {
  loginForm.style.display = 'block';
  registerForm.style.display = 'none';
}
btnShowRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
btnShowLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

/* register */
btnRegister.addEventListener('click', (e) => {
  e.preventDefault();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  if (!username || !password) {
    alert('Isi semua field untuk registrasi.');
    return;
  }
  // simple check: if username exists -> fail
  const existing = localStorage.getItem('smartlearnUser_' + username);
  if (existing) {
    alert('Nama pengguna sudah terdaftar. Silakan pilih nama lain.');
    return;
  }
  localStorage.setItem('smartlearnUser_' + username, password);
  alert('Registrasi berhasil. Silakan masuk.');
  showLogin();
});

/* login */
btnLogin.addEventListener('click', (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  if (!username || !password) {
    alert('Isi username dan password.');
    return;
  }
  const stored = localStorage.getItem('smartlearnUser_' + username);
  if (stored && stored === password) {
    // success
    localStorage.setItem('smartlearnAuth', username);
    authBackdrop.classList.remove('active');
    renderHeaderForUser(username);
    showDashboardForAuth();
    loadTransactions();
    alert('Login berhasil. Selamat datang, ' + username + '!');
  } else {
    alert('Username atau password salah.');
  }
});

/* logout */
function logoutUser() {
  localStorage.removeItem('smartlearnAuth');
  renderHeaderGuest();
  hideDashboardForAuth();
}

/* header render */
function renderHeaderForUser(username) {
  headerActions.innerHTML = '';
  const userBadge = document.createElement('div');
  userBadge.className = 'user-badge';
  userBadge.textContent = username;
  const btnLogout = document.createElement('button');
  btnLogout.textContent = 'Logout';
  btnLogout.addEventListener('click', logoutUser);
  headerActions.appendChild(userBadge);
  headerActions.appendChild(btnLogout);
}

function renderHeaderGuest() {
  headerActions.innerHTML = '<button id="btnOpenLogin" class="primary">Masuk / Daftar</button>';
  // re-bind
  document.getElementById('btnOpenLogin').addEventListener('click', () => {
    authBackdrop.classList.add('active');
    showLogin();
  });
}

/* dashboard visibility */
function showDashboardForAuth() {
  dashboardCard.style.display = 'block';
  // scroll to dashboard
  location.hash = '#dashboard';
}
function hideDashboardForAuth() {
  dashboardCard.style.display = 'none';
}

/* transaction logic */
function formatRupiah(num) {
  return Number(num).toLocaleString('id-ID');
}

function renderTotals() {
  const income = transactions.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense = transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  totalIncomeEl.textContent = formatRupiah(income);
  totalExpenseEl.textContent = formatRupiah(expense);
  netBalanceEl.textContent = formatRupiah(income - expense);
}

function renderTransactions() {
  transactionListEl.innerHTML = '';
  transactions.slice().reverse().forEach((t, idx) => {
    const li = document.createElement('li');
    li.innerHTML = `<div><strong>${t.desc}</strong><div class="small">${new Date(t.date).toLocaleString()}</div></div><div>${t.type==='income'?'+':'-'} ${formatRupiah(t.amount)}</div>`;
    transactionListEl.appendChild(li);
  });
}

function saveTransactions() {
  localStorage.setItem('smartlearnTx', JSON.stringify(transactions));
}

function loadTransactions() {
  transactions = JSON.parse(localStorage.getItem('smartlearnTx')) || [];
  renderTotals();
  renderTransactions();
}

/* add transaction */
addTransactionBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const desc = document.getElementById('calcDesc').value.trim();
  const amount = Number(document.getElementById('calcAmount').value);
  const type = document.getElementById('calcType').value;
  const authUser = localStorage.getItem('smartlearnAuth');
  if (!authUser) {
    alert('Silakan masuk terlebih dahulu untuk mencatat transaksi.');
    authBackdrop.classList.add('active');
    return;
  }
  if (!desc || !amount || amount <= 0) {
    alert('Isi deskripsi dan nominal transaksi yang valid.');
    return;
  }
  const tx = { desc, amount, type, date: new Date().toISOString(), user: authUser };
  transactions.push(tx);
  saveTransactions();
  loadTransactions();
  document.getElementById('calcDesc').value = '';
  document.getElementById('calcAmount').value = '';
});

/* clear transactions (for current user only) */
clearTransactionsBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (!confirm('Hapus semua transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
  // remove all transactions for current user
  const authUser = localStorage.getItem('smartlearnAuth');
  if (!authUser) { alert('Silakan masuk dulu.'); return; }
  transactions = transactions.filter(t => t.user !== authUser);
  saveTransactions();
  loadTransactions();
});

/* initial auth check */
(function init() {
  // hide dashboard by default for guests
  const authUser = localStorage.getItem('smartlearnAuth');
  if (authUser) {
    renderHeaderForUser(authUser);
    showDashboardForAuth();
  } else {
    renderHeaderGuest();
    hideDashboardForAuth();
  }
  loadTransactions();

  // tab behaviour for materi section
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
      document.getElementById(btn.dataset.target).classList.add('active');
    });
  });

  // video play (simple modal)
  document.querySelectorAll('.play-video').forEach(b=>{
    b.addEventListener('click', ()=> {
      const src = b.dataset.video;
      const modal = document.createElement('div');
      modal.className = 'video-modal active';
      modal.innerHTML = `<div class="video-box"><button id="closeVideo">×</button><iframe src="${src}" frameborder="0" allowfullscreen></iframe></div>`;
      document.body.appendChild(modal);
      modal.querySelector('#closeVideo').addEventListener('click', ()=> modal.remove());
      modal.addEventListener('click', (e)=> { if (e.target === modal) modal.remove(); });
    });
  });

})();