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

    // Fungsi untuk menampilkan/menyembunyikan form login/register
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
        // memastikan output adalah string dengan pemisah ribuan
        return Number(num).toLocaleString('id-ID');
    }

    // Header Render untuk pengguna yang sudah login
    function renderHeaderForUser(username) {
        headerActions.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; font-weight:600;">
                <i class="fas fa-user-circle" style="font-size:20px; color:var(--primary)"></i> 
                Hai, ${username}!
                <button id="btnLogout" class="primary" style="background:var(--danger)">Keluar</button>
            </div>
        `;
        // Re-bind listener untuk tombol Logout
        document.getElementById('btnLogout').addEventListener('click', logoutUser);
    }

    // Header Render untuk tamu/guest
    function renderHeaderGuest() {
        headerActions.innerHTML = '<button id="btnOpenLogin" class="primary">Masuk / Daftar</button>';
        
        // Re-bind listener untuk tombol Masuk/Daftar yang baru dibuat
        const btnOpenLogin = document.getElementById('btnOpenLogin'); // Ambil elemen yang baru
        btnOpenLogin.addEventListener('click', () => {
            authBackdrop.classList.add('active');
            showLogin();
        });
    }

    // Dashboard Visibility
    function showDashboardForAuth() {
        // Asumsikan dashboardCard.style.display di CSS adalah 'none' secara default
        dashboardCard.style.display = 'block';
        // Hanya pindah hash jika belum di dashboard
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
        
        // Filter transaksi hanya untuk pengguna yang sedang login
        const userTransactions = transactions.filter(t => t.user === authUser);

        const income = userTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = userTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        totalIncomeEl.textContent = formatRupiah(income);
        totalExpenseEl.textContent = formatRupiah(expense);
        
        const netBalance = income - expense;
        netBalanceEl.textContent = formatRupiah(netBalance);
        // Tambahkan styling untuk saldo negatif/positif (tambahan)
        netBalanceEl.closest('.dashboard-card').style.backgroundColor = netBalance < 0 ? '#ffeaea' : '#eafaff';
    }

    function renderTransactions() {
        const authUser = localStorage.getItem('smartlearnAuth');
        if (!authUser) { 
            transactionListEl.innerHTML = '';
            return;
        }
        
        const userTransactions = transactions.filter(t => t.user === authUser);

        transactionListEl.innerHTML = '';
        // Tampilkan 10 transaksi terakhir
        userTransactions.slice().reverse().slice(0, 10).forEach((t) => {
            const li = document.createElement('li');
            // Menambahkan kelas untuk membedakan Pemasukan/Pengeluaran (untuk styling CSS)
            li.className = t.type === 'income' ? 'income-item' : 'expense-item'; 
            li.innerHTML = `
                <div>
                    <strong>${t.desc}</strong>
                    <div class="small">${new Date(t.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'})}</div>
                </div>
                <div>
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
        document.getElementById('calcType').value = 'income'; // Reset ke Pemasukan
    });

    // Event Handler: Hapus Transaksi
    clearTransactionsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const authUser = localStorage.getItem('smartlearnAuth');
        if (!authUser) { alert('Silakan masuk dulu.'); return; }
        
        if (!confirm('Hapus SEMUA transaksi Anda? Tindakan ini tidak bisa dibatalkan.')) return;
        
        // Filter: Hanya simpan transaksi yang BUKAN milik pengguna saat ini
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
        
        const existing = localStorage.getItem('smartlearnUser_' + username);
        if (existing) {
            alert('Nama pengguna sudah terdaftar. Silakan pilih nama lain.');
            return;
        }
        
        // Simpan username dan password (sebagai teks biasa, karena ini DEMO)
        localStorage.setItem('smartlearnUser_' + username, password);
        alert('Registrasi berhasil. Silakan masuk.');
        
        // Bersihkan input dan tampilkan login
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
            // Success
            localStorage.setItem('smartlearnAuth', username); // Simpan status auth
            authBackdrop.classList.remove('active');
            
            // Render UI
            renderHeaderForUser(username);
            showDashboardForAuth();
            loadTransactions();
            
            // Bersihkan input
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';

            // alert('Login berhasil. Selamat datang, ' + username + '!'); // Dihapus untuk pengalaman yang lebih halus
        } else {
            alert('Username atau password salah.');
        }
    });

    // Event Handler: Logout
    function logoutUser() {
        localStorage.removeItem('smartlearnAuth');
        // Kosongkan data transaksi lokal milik pengguna saat ini
        const authUser = localStorage.getItem('smartlearnAuth'); // Ini akan kosong
        transactions = transactions.filter(t => t.user !== authUser);
        saveTransactions();
        
        renderHeaderGuest();
        hideDashboardForAuth();
        
        alert('Anda telah berhasil keluar.');
        
        // Opsional: Muat ulang halaman untuk reset total state UI, atau cukup panggil loadTransactions() jika ingin totalnya 0
        // window.location.reload(); 
        
        // Hanya render ulang untuk menampilkan 0 di dashboard
        loadTransactions(); 
    }


    // =======================================================
    // --- 5. INITIALIZATION (INIT) & EVENT LISTENERS UI ---
    // =======================================================
    
    // --- A. Modal & Form Toggles ---
    // (Listener untuk btnOpenLogin sudah dipindahkan ke renderHeaderGuest/renderHeaderForUser)

    btnCloseAuth.addEventListener('click', () => authBackdrop.classList.remove('active'));
    authBackdrop.addEventListener('click', (e) => { 
        // Tutup modal jika klik di luar form (di backdrop)
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
            // Menampilkan konten yang sesuai dengan data-target
            document.getElementById(btn.dataset.target).style.display = 'block';
        });
    });

    // Inisialisasi tampilan tab pertama (pastikan hanya yang aktif yang terlihat)
    const initialTab = document.querySelector('.tab-nav button.active');
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    if(initialTab) {
        document.getElementById(initialTab.dataset.target).style.display = 'block';
    }


    // --- D. Video Player (Sederhana) ---
    // Logika Pemutar Video sudah baik dengan modal dinamis
    document.querySelectorAll('.play-video').forEach(b => {
        b.addEventListener('click', () => {
            const src = b.dataset.video;
            const modal = document.createElement('div');
            modal.className = 'video-modal';
            modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; justify-content:center; align-items:center; z-index:9999;';
            modal.innerHTML = `
                <div style="position:relative; width:90%; max-width:800px; aspect-ratio:16/9; margin: 20px;">
                    <button id="closeVideo" aria-label="Tutup Video" style="position:absolute; top:-30px; right:0; background:white; border:none; color:black; font-size:24px; cursor:pointer; padding:5px 10px; border-radius:50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">×</button>
                    <iframe src="${src}&autoplay=1" title="Materi Video SmartLearn" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%; height:100%; border-radius:8px;"></iframe>
                </div>`;
            document.body.appendChild(modal);
            modal.querySelector('#closeVideo').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { 
                 // Pastikan klik di backdrop atau tombol tutup modal
                if (e.target === modal || e.target.id === 'closeVideo') {
                    // Agar video berhenti ketika modal ditutup, set src iframe menjadi kosong sebelum remove
                    const iframe = modal.querySelector('iframe');
                    iframe.src = '';
                    modal.remove();
                }
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
    loadTransactions(); // Memuat data awal
});
