/* =========================================
   UTILITY FUNCTIONS (SECURITY & DATA)
========================================= */
// Enkripsi/Dekripsi Base64 sederhana (Bukan kriptografi kuat, hanya menyembunyikan plain text)
const simpleEncrypt = (text) => btoa(text);
const simpleDecrypt = (hash) => {
    try {
        return atob(hash);
    } catch (e) {
        return '';
    }
};

/* =========================================
   DOM ELEMENTS & VARIABLES
========================================= */
// Modal Auth
const authBackdrop = document.getElementById('authBackdrop');
const btnCloseAuth = document.getElementById('btnCloseAuth');
const btnShowRegister = document.getElementById('btnShowRegister');
const btnShowLogin = document.getElementById('btnShowLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const btnLogin = document.getElementById('btnLogin');
const btnRegister = document.getElementById('btnRegister');

// Header
const headerActions = document.getElementById('headerActions');

// Dashboard & Kalkulator
const dashboardCard = document.getElementById('dashboardCard');
const totalIncomeEl = document.getElementById('totalIncome');
const totalExpenseEl = document.getElementById('totalExpense');
const netBalanceEl = document.getElementById('netBalance');
const transactionListEl = document.getElementById('transactionList');
const addTransactionBtn = document.getElementById('addTransaction');
const clearTransactionsBtn = document.getElementById('clearTransactions');

// Variabel Data Global (Memisahkan data global dan data user saat ini)
let allTransactions = JSON.parse(localStorage.getItem('smartlearnTx')) || [];
let userTransactions = [];

/* =========================================
   MODAL & AUTHENTICATION UI
========================================= */
function bindOpenLoginButtons() {
    // Tombol desktop (di #headerActions)
    const btnOpenLoginDesktop = document.getElementById('btnOpenLogin');
    if (btnOpenLoginDesktop) {
        btnOpenLoginDesktop.addEventListener('click', () => {
            authBackdrop.classList.add('active');
            showLogin();
        });
    }

    // Tombol mobile (di #nav)
    const btnOpenLoginMobile = document.getElementById('btnOpenLoginMobile');
    if (btnOpenLoginMobile) {
        btnOpenLoginMobile.addEventListener('click', () => {
            authBackdrop.classList.add('active');
            showLogin();
            // Tutup menu mobile
            document.getElementById('hamburger').classList.remove('active');
            document.getElementById('nav').classList.remove('active');
        });
    }
}

// Penanganan tutup modal
btnCloseAuth.addEventListener('click', () => authBackdrop.classList.remove('active'));
authBackdrop.addEventListener('click', (e) => {
    if (e.target === authBackdrop) authBackdrop.classList.remove('active');
});

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

/* =========================================
   REGISTER LOGIC (Menggunakan enkripsi)
========================================= */
btnRegister.addEventListener('click', (e) => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!username || !password) {
        alert('Isi semua field untuk registrasi.');
        return;
    }

    const existing = localStorage.getItem('smartlearnUser_' + username);
    if (existing) {
        alert('Nama pengguna sudah terdaftar. Silakan pilih nama lain.');
        return;
    }

    // SIMPAN PASSWORD YANG DIENKRIPSI
    localStorage.setItem('smartlearnUser_' + username, simpleEncrypt(password));
    alert('Registrasi berhasil. Silakan masuk.');
    showLogin();
});

/* =========================================
   LOGIN LOGIC (Menggunakan dekripsi)
========================================= */
btnLogin.addEventListener('click', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
        alert('Isi username dan password.');
        return;
    }

    const storedHash = localStorage.getItem('smartlearnUser_' + username);
    const stored = simpleDecrypt(storedHash);

    // CEK PASSWORD YANG SUDAH DI-DEKRIPSI
    if (storedHash && stored === password) {
        // success
        localStorage.setItem('smartlearnAuth', username);
        authBackdrop.classList.remove('active');
        renderHeaderForUser(username);
        showDashboardForAuth();
        loadTransactions();
        alert('Login berhasil. Selamat datang, ' + username + '!');
        
        // Bersihkan formulir
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    } else {
        alert('Username atau password salah.');
    }
});

/* =========================================
   LOGOUT LOGIC
========================================= */
function logoutUser() {
    localStorage.removeItem('smartlearnAuth');
    renderHeaderGuest();
    hideDashboardForAuth();
    // Kosongkan userTransactions dan render ulang
    userTransactions = [];
    renderTotals();
    renderTransactions();
    // Kembali ke beranda
    document.getElementById('beranda').scrollIntoView({ behavior: 'smooth' });
}

/* =========================================
   HEADER RENDER
========================================= */
function renderHeaderForUser(username) {
    headerActions.innerHTML = '';
    
    // Tombol Logout untuk desktop
    const btnLogout = document.createElement('button');
    btnLogout.textContent = 'Logout';
    btnLogout.addEventListener('click', logoutUser);
    
    // Badge Pengguna
    const userBadge = document.createElement('div');
    userBadge.className = 'user-badge';
    userBadge.textContent = username;

    headerActions.appendChild(userBadge);
    headerActions.appendChild(btnLogout);

    // Sembunyikan tombol login/daftar di menu mobile saat sudah login
    const btnLoginMobile = document.getElementById('btnOpenLoginMobile');
    if (btnLoginMobile) {
         btnLoginMobile.style.display = 'none';
    }
}

function renderHeaderGuest() {
    // Re-render tombol desktop
    headerActions.innerHTML = '<button id="btnOpenLogin" class="primary">Masuk / Daftar</button>';
    bindOpenLoginButtons(); 

    // Tampilkan tombol login/daftar di menu mobile saat guest
    const btnLoginMobile = document.getElementById('btnOpenLoginMobile');
    if (btnLoginMobile) {
         btnLoginMobile.style.display = 'block';
    }
}

/* =========================================
   DASHBOARD VISIBILITY
========================================= */
function showDashboardForAuth() {
    dashboardCard.style.display = 'block';
    // Fokus ke dashboard setelah login
    document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
}
function hideDashboardForAuth() {
    dashboardCard.style.display = 'none';
}

/* =========================================
   TRANSACTION CORE LOGIC
========================================= */
function formatRupiah(num) {
    return Number(num).toLocaleString('id-ID');
}

// Menggunakan userTransactions (Data yang sudah difilter)
function renderTotals() {
    const income = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    totalIncomeEl.textContent = formatRupiah(income);
    totalExpenseEl.textContent = formatRupiah(expense);
    netBalanceEl.textContent = formatRupiah(income - expense);
}

// Menggunakan userTransactions (Data yang sudah difilter)
function renderTransactions() {
    transactionListEl.innerHTML = '';
    // Menampilkan yang terbaru di atas
    userTransactions.slice().reverse().forEach((t, idx) => {
        const li = document.createElement('li');
        const typeBadge = t.type === 'income' ? 
            `<span style="color:#28a745; font-weight:700;">+</span>` : 
            `<span style="color:#ff6b6b; font-weight:700;">-</span>`;
            
        li.innerHTML = `<div><strong>${t.desc}</strong><div class="small">${new Date(t.date).toLocaleDateString()}</div></div><div>${typeBadge} ${formatRupiah(t.amount)}</div>`;
        transactionListEl.appendChild(li);
    });
}

function saveTransactions() {
    // Simpan SEMUA transaksi kembali ke localStorage
    localStorage.setItem('smartlearnTx', JSON.stringify(allTransactions));
}

function loadTransactions() {
    // 1. Muat semua data dari local storage
    allTransactions = JSON.parse(localStorage.getItem('smartlearnTx')) || [];
    
    // 2. Filter hanya data pengguna yang sedang login
    const authUser = localStorage.getItem('smartlearnAuth');
    if (authUser) {
        userTransactions = allTransactions.filter(t => t.user === authUser);
    } else {
        userTransactions = [];
    }

    // 3. Render
    renderTotals();
    renderTransactions();
}

/* =========================================
   ADD & CLEAR TRANSACTION
========================================= */
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
    
    // Tambahkan ke array global
    allTransactions.push(tx);
    saveTransactions();
    loadTransactions(); // Muat ulang, filter, dan render data yang benar
    
    document.getElementById('calcDesc').value = '';
    document.getElementById('calcAmount').value = '';
});

/* clear transactions (for current user only) */
clearTransactionsBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!confirm('Hapus semua transaksi Anda? Tindakan ini tidak bisa dibatalkan.')) return;
    
    const authUser = localStorage.getItem('smartlearnAuth');
    if (!authUser) { alert('Silakan masuk dulu.'); return; }
    
    // Filter transaksi global, hanya menyisakan yang BUKAN milik pengguna saat ini
    allTransactions = allTransactions.filter(t => t.user !== authUser);
    saveTransactions();
    loadTransactions();
});

/* =========================================
   INITIALIZATION & UI SETUP
========================================= */
(function init() {
    // Sembunyikan dashboard secara default untuk tamu
    const authUser = localStorage.getItem('smartlearnAuth');
    
    if (authUser) {
        renderHeaderForUser(authUser);
        showDashboardForAuth();
    } else {
        renderHeaderGuest();
        hideDashboardForAuth();
    }
    
    loadTransactions();
    bindOpenLoginButtons(); // Ikat tombol login/daftar

    // Tab behaviour for materi section
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // video play (simple modal) - Memastikan semua tombol video berfungsi
    document.querySelectorAll('.play-video').forEach(b => {
        b.addEventListener('click', () => {
            const src = b.dataset.video;
            const modal = document.createElement('div');
            modal.className = 'video-modal active';
            // Tambahkan autoplay
            // Menggunakan YouTube embed URL dengan parameter autoplay=1
            modal.innerHTML = `<div class="video-box"><button id="closeVideo">×</button><iframe src="${src.split('?')[0]}?${src.split('?')[1] || ''}&autoplay=1" frameborder="0" allowfullscreen></iframe></div>`;
            document.body.appendChild(modal);
            modal.querySelector('#closeVideo').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        });
    });

})();

/* =========================================
   DOM LOADED LISTENERS (Hamburger Menu)
========================================= */
document.addEventListener('DOMContentLoaded', () => {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    if (hamburger && nav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Tutup menu saat link diklik (termasuk tombol login/daftar di mobile)
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }

    // Scroll listener untuk header efek
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
});
