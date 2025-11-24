document.addEventListener('DOMContentLoaded', function() {
    // =======================================================
    // --- 1. DEKLARASI VARIABEL UTAMA ---
    // =======================================================

    // Auth & Modal
    const authBackdrop = document.getElementById('authBackdrop');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const headerActions = document.getElementById('headerActions');

    const btnCloseAuth = document.getElementById('btnCloseAuth');
    const btnShowRegister = document.getElementById('btnShowRegister');
    const btnShowLogin = document.getElementById('btnShowLogin');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegister = document.getElementById('btnRegister');

    // Dashboard & Transaksi
    const dashboardCard = document.getElementById('dashboardCard');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const netBalanceEl = document.getElementById('netBalance');
    const transactionListEl = document.getElementById('transactionList');
    const addTransactionBtn = document.getElementById('addTransaction');
    const clearTransactionsBtn = document.getElementById('clearTransactions');

    // Navigasi & UI
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    // Data Lokal
    let transactions = JSON.parse(localStorage.getItem('smartlearnTx')) || [];

    // =======================================================
    // --- 2. FUNGSI UTILITAS & HELPERS ---
    // =======================================================

    function showRegister() {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    }
    function showLogin() {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    }

    // Format Rupiah
    function formatRupiah(num) {
        return Number(num).toLocaleString('id-ID');
    }

    // Header Render untuk pengguna yang sudah login
    function renderHeaderForUser(username) {
        headerActions.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; font-weight:600;">
                <i class="fas fa-user-circle" style="font-size:20px; color:var(--primary)"></i> 
                Hai, ${username}!
                <button id="btnLogout" class="primary" style="background:#ff6b6b">Keluar</button>
            </div>
        `;
        // Re-bind listener untuk tombol Logout
        document.getElementById('btnLogout').addEventListener('click', logoutUser);
    }

    // Header Render untuk tamu/guest
    function renderHeaderGuest() {
        headerActions.innerHTML = '<button id="btnOpenLogin" class="primary">Masuk / Daftar</button>';
        
        // KRITIS: Re-bind listener untuk tombol Masuk/Daftar yang baru dibuat
        const btnOpenLogin = document.getElementById('btnOpenLogin'); 
        btnOpenLogin.addEventListener('click', () => {
            authBackdrop.classList.add('active');
            showLogin();
        });
    }

    // Dashboard Visibility
    function showDashboardForAuth() {
        dashboardCard.style.display = 'block';
        if (location.hash !== '#dashboard') {
             location.hash = '#dashboard';
        }
    }
    function hideDashboardForAuth() {
        dashboardCard.style.display = 'none';
    }

    // =======================================================
    // --- 3. TRANSAKSI & DASHBOARD LOGIC ---
    // =======================================================

    function renderTotals() {
        const authUser = localStorage.getItem('smartlearnAuth');
        if (!authUser) return;
        
        const userTransactions = transactions.filter(t => t.user === authUser);

        const income = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        totalIncomeEl.textContent = formatRupiah(income);
        totalExpenseEl.textContent = formatRupiah(expense);
        
        const netBalance = income - expense;
        netBalanceEl.textContent = formatRupiah(netBalance);
        
        // Sesuaikan warna latar belakang dashboard saldo
        netBalanceEl.closest('.dashboard-card').style.backgroundColor = netBalance < 0 ? '#ffbaba' : 'var(--success)';
        netBalanceEl.closest('.dashboard-card').style.backgroundImage = netBalance < 0 ? 'none' : 'var(--gradient)'; // Kembalikan gradient jika positif
    }

    function renderTransactions() {
        const authUser = localStorage.getItem('smartlearnAuth');
        if (!authUser) { 
            transactionListEl.innerHTML = '';
            return;
        }
        
        const userTransactions = transactions.filter(t => t.user === authUser);

        transactionListEl.innerHTML = '';
        userTransactions.slice().reverse().slice(0, 10).forEach((t) => {
            const li = document.createElement('li');
            li.className = t.type === 'income' ? 'income-item' : 'expense-item'; 
            li.innerHTML = `
                <div>
                    <strong>${t.desc}</strong>
                    <div class="small">${new Date(t.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div style="font-weight:700; color: ${t.type === 'income' ? 'var(--primary)' : 'var(--accent)'}">
                    ${t.type === 'income' ? '+' : '-'} ${formatRupiah(t.amount)}
                </div>
            `;
            transactionListEl.appendChild(li);
        });
    }

    function saveTransactions() {
        localStorage.setItem('smartlearnTx', JSON.stringify(transactions));
    }

    function loadTransactions() {
        renderTotals();
        renderTransactions();
    }
    
    // Event Handler: Tambah Transaksi
    addTransactionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const desc = document.getElementById('calcDesc').value.trim();
        const amount = Number(document.getElementById('calcAmount').value);
        const type = document.getElementById('calcType').value;
        const authUser = localStorage.getItem('smartlearnAuth');

        if (!authUser) {
            alert('Silakan masuk terlebih dahulu untuk mencatat transaksi.');
            authBackdrop.classList.add('active');
            showLogin();
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
        
        // Clear input fields
        document.getElementById('calcDesc').value = '';
        document.getElementById('calcAmount').value = '';
        document.getElementById('calcType').value = 'income'; 
    });

    // Event Handler: Hapus Transaksi
    clearTransactionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const authUser = localStorage.getItem('smartlearnAuth');
        if (!authUser) { alert('Silakan masuk dulu.'); return; }
        
        if (!confirm('Hapus SEMUA transaksi Anda? Tindakan ini tidak bisa dibatalkan.')) return;
        
        transactions = transactions.filter(t => t.user !== authUser);
        saveTransactions();
        loadTransactions();
    });

    // =======================================================
    // --- 4. AUTHENTICATION LOGIC (LOCAL STORAGE) ---
    // =======================================================

    // Event Handler: Registrasi
    btnRegister.addEventListener('click', (e) => {
        e.preventDefault();
        const username = document.getElementById('regUsername').value.trim();
        const password = document.getElementById('regPassword').value;
        
        if (!username || !password) {
            alert('Isi semua field untuk registrasi.');
            return;
        }
        
        // Cek jika username sudah ada
        const existing = localStorage.getItem('smartlearnUser_' + username);
        if (existing) {
            alert('Nama pengguna sudah terdaftar. Silakan pilih nama lain.');
            return;
        }
        
        localStorage.setItem('smartlearnUser_' + username, password);
        alert('Registrasi berhasil. Silakan masuk.');
        
        document.getElementById('regUsername').value = '';
        document.getElementById('regPassword').value = '';
        showLogin();
    });

    // Event Handler: Login
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
            localStorage.setItem('smartlearnAuth', username);
            authBackdrop.classList.remove('active');
            
            renderHeaderForUser(username);
            showDashboardForAuth();
            loadTransactions();
            
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
        } else {
            alert('Username atau password salah.');
        }
    });

    // Event Handler: Logout
    function logoutUser() {
        const authUser = localStorage.getItem('smartlearnAuth');
        localStorage.removeItem('smartlearnAuth');
        
        // Hapus transaksi hanya milik user yang logout
        transactions = transactions.filter(t => t.user !== authUser);
        saveTransactions();
        
        renderHeaderGuest();
        hideDashboardForAuth();
        loadTransactions(); 
        alert('Anda telah berhasil keluar.');
    }


    // =======================================================
    // --- 5. INITIALIZATION (INIT) & EVENT LISTENERS UI ---
    // =======================================================
    
    // --- A. Modal & Form Toggles ---
    btnCloseAuth.addEventListener('click', () => authBackdrop.classList.remove('active'));
    authBackdrop.addEventListener('click', (e) => { 
        if (e.target === authBackdrop) authBackdrop.classList.remove('active'); 
    });
    btnShowRegister.addEventListener('click', (e) => { e.preventDefault(); showRegister(); });
    btnShowLogin.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });

    // --- B. Hamburger Menu ---
    if (hamburger && nav) {
        hamburger.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }

    // --- C. Materi Tabs ---
    document.querySelectorAll('.tab-nav button').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-nav button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
            // Menampilkan konten yang sesuai
            document.getElementById(btn.dataset.target).style.display = 'block';
        });
    });

    // Inisialisasi tampilan tab pertama
    const initialTab = document.querySelector('.tab-nav button');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    if(initialTab) {
        initialTab.classList.add('active');
        document.getElementById(initialTab.dataset.target).style.display = 'block';
    }


    // --- D. Video Player (Sederhana) ---
    document.querySelectorAll('.play-video').forEach(b => {
        b.addEventListener('click', () => {
            const src = b.dataset.video;
            const modal = document.createElement('div');
            
            // Menggunakan inline style Z-index sangat tinggi untuk memastikan modal video tampil di atas semua elemen
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:9999;';
            modal.innerHTML = `
                <div style="position:relative; width:90%; max-width:800px; aspect-ratio:16/9; margin: 20px;">
                    <button id="closeVideo" aria-label="Tutup Video" style="position:absolute; top:-30px; right:0; background:white; border:none; color:black; font-size:24px; cursor:pointer; padding:5px 10px; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">×</button>
                    <iframe src="${src}&autoplay=1" title="Materi Video SmartLearn" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border-radius:8px;"></iframe>
                </div>`;
            document.body.appendChild(modal);
            
            // Event listener untuk menutup modal
            const closeHandler = () => {
                // Hentikan video saat modal ditutup
                const iframe = modal.querySelector('iframe');
                if (iframe) iframe.src = '';
                modal.remove();
            };

            modal.querySelector('#closeVideo').addEventListener('click', closeHandler);
            modal.addEventListener('click', (e) => { 
                if (e.target === modal) closeHandler();
            });
        });
    });


    // --- E. Initial Auth Check & Render ---
    const authUser = localStorage.getItem('smartlearnAuth');
    if (authUser) {
        renderHeaderForUser(authUser);
        showDashboardForAuth();
    } else {
        renderHeaderGuest(); // Ini akan membuat dan mengaitkan listener ke tombol Masuk/Daftar
        hideDashboardForAuth();
    }
    loadTransactions(); 
});
