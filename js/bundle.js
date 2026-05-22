// ========================================
// CashMe — All-in-One Bundle
// ========================================

(function () {
  'use strict';

  // ============ UTILS ============
  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const INCOME_CATEGORIES = [
    { id: 'gaji', label: 'Gaji', icon: '💰', color: '#10B981' },
    { id: 'bonus', label: 'Bonus', icon: '💸', color: '#06B6D4' },
    { id: 'investasi', label: 'Investasi', icon: '📈', color: '#8B5CF6' },
    { id: 'hadiah', label: 'Hadiah', icon: '🎁', color: '#F59E0B' },
    { id: 'penjualan', label: 'Penjualan', icon: '📦', color: '#EC4899' },
    { id: 'freelance', label: 'Freelance', icon: '💼', color: '#3B82F6' },
    { id: 'lainnya_masuk', label: 'Lainnya', icon: '🔄', color: '#6B7280' },
  ];

  const EXPENSE_CATEGORIES = [
    { id: 'makan', label: 'Makan & Minum', icon: '🍔', color: '#EF4444' },
    { id: 'transportasi', label: 'Transportasi', icon: '🚗', color: '#F97316' },
    { id: 'belanja', label: 'Belanja', icon: '🛒', color: '#EC4899' },
    { id: 'tagihan', label: 'Tagihan', icon: '💡', color: '#F59E0B' },
    { id: 'hiburan', label: 'Hiburan', icon: '🎮', color: '#8B5CF6' },
    { id: 'kesehatan', label: 'Kesehatan', icon: '🏥', color: '#10B981' },
    { id: 'pendidikan', label: 'Pendidikan', icon: '📚', color: '#3B82F6' },
    { id: 'lainnya_keluar', label: 'Lainnya', icon: '🔄', color: '#6B7280' },
  ];

  function formatRupiah(amount) {
    return 'Rp ' + Math.abs(amount).toLocaleString('id-ID');
  }

  function formatDate(dateStr) {
    var d = new Date(dateStr);
    return d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  function getTodayISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function getCategoryById(id) {
    return INCOME_CATEGORIES.concat(EXPENSE_CATEGORIES).find(function (c) { return c.id === id; }) || null;
  }

  function debounce(fn, delay) {
    var timer;
    return function () {
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(null, args); }, delay || 300);
    };
  }

  // ============ STORAGE ============
  var STORAGE_KEY = 'cashme_transactions';

  function getTransactions() {
    try { var d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }

  function saveTransactions(txs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
  }

  function addTransaction(data) {
    var txs = getTransactions();
    var tx = {
      id: generateId(), type: data.type, category: data.category,
      amount: Math.abs(Number(data.amount)), description: data.description || '',
      date: data.date, createdAt: new Date().toISOString()
    };
    txs.unshift(tx);
    saveTransactions(txs);
    return tx;
  }

  function updateTransaction(id, data) {
    var txs = getTransactions();
    var idx = txs.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return null;
    txs[idx] = Object.assign({}, txs[idx], data, {
      amount: data.amount ? Math.abs(Number(data.amount)) : txs[idx].amount,
      updatedAt: new Date().toISOString()
    });
    saveTransactions(txs);
    return txs[idx];
  }

  function deleteTransaction(id) {
    var txs = getTransactions();
    var filtered = txs.filter(function (t) { return t.id !== id; });
    if (filtered.length === txs.length) return false;
    saveTransactions(filtered);
    return true;
  }

  function getStats(month, year) {
    var txs = getTransactions();
    var income = 0, expense = 0;
    txs.forEach(function (tx) {
      var d = new Date(tx.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        if (tx.type === 'income') income += tx.amount; else expense += tx.amount;
      }
    });
    return { income: income, expense: expense, balance: income - expense };
  }

  function getTotalBalance() {
    var bal = 0;
    getTransactions().forEach(function (tx) {
      bal += tx.type === 'income' ? tx.amount : -tx.amount;
    });
    return bal;
  }

  function getExpenseByCategory(month, year) {
    var result = {};
    getTransactions().forEach(function (tx) {
      if (tx.type !== 'expense') return;
      var d = new Date(tx.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      result[tx.category] = (result[tx.category] || 0) + tx.amount;
    });
    return result;
  }

  function getMonthlyTrend(n) {
    n = n || 6;
    var txs = getTransactions(), result = [], now = new Date();
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var m = d.getMonth(), y = d.getFullYear(), inc = 0, exp = 0;
      txs.forEach(function (tx) {
        var td = new Date(tx.date);
        if (td.getMonth() === m && td.getFullYear() === y) {
          if (tx.type === 'income') inc += tx.amount; else exp += tx.amount;
        }
      });
      result.push({ month: m, year: y, income: inc, expense: exp });
    }
    return result;
  }

  function downloadCSV() {
    var txs = getTransactions();
    if (!txs.length) return false;
    var lines = ['Tanggal,Tipe,Kategori,Jumlah,Keterangan'];
    txs.forEach(function (tx) {
      lines.push([tx.date, tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', tx.category, tx.amount, '"' + (tx.description || '').replace(/"/g, '""') + '"'].join(','));
    });
    var blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cashme_' + getTodayISO() + '.csv';
    a.click();
    return true;
  }

  // ============ CHARTS ============
  var donutChart = null, barChart = null;

  function renderDonutChart(expData) {
    var canvas = document.getElementById('chart-donut');
    if (!canvas) return;
    var entries = Object.entries(expData);
    var emptyEl = canvas.closest('.chart-card').querySelector('.chart-empty');

    if (!entries.length) {
      if (donutChart) { donutChart.destroy(); donutChart = null; }
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    entries.sort(function (a, b) { return b[1] - a[1]; });
    var labels = [], data = [], colors = [];
    entries.forEach(function (e) {
      var cat = getCategoryById(e[0]);
      labels.push(cat ? cat.icon + ' ' + cat.label : e[0]);
      data.push(e[1]);
      colors.push(cat ? cat.color : '#6B7280');
    });

    if (donutChart) {
      donutChart.data.labels = labels;
      donutChart.data.datasets[0].data = data;
      donutChart.data.datasets[0].backgroundColor = colors;
      donutChart.update(); return;
    }

    donutChart = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(), padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8, callbacks: { label: function (ctx) { var t = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0); return ' Rp ' + ctx.parsed.toLocaleString('id-ID') + ' (' + ((ctx.parsed / t) * 100).toFixed(1) + '%)'; } } }
        }
      }
    });
  }

  function renderBarChart(trendData) {
    var canvas = document.getElementById('chart-bar');
    if (!canvas) return;
    var labels = trendData.map(function (d) { return MONTH_NAMES[d.month].substring(0, 3); });
    var incD = trendData.map(function (d) { return d.income; });
    var expD = trendData.map(function (d) { return d.expense; });

    if (barChart) {
      barChart.data.labels = labels;
      barChart.data.datasets[0].data = incD;
      barChart.data.datasets[1].data = expD;
      barChart.update(); return;
    }

    barChart = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          { label: 'Pemasukan', data: incD, backgroundColor: 'rgba(16,185,129,0.7)', borderColor: '#10B981', borderWidth: 1, borderRadius: 6 },
          { label: 'Pengeluaran', data: expD, backgroundColor: 'rgba(239,68,68,0.7)', borderColor: '#EF4444', borderWidth: 1, borderRadius: 6 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { family: 'Inter', size: 12 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(148,163,184,0.1)' }, ticks: { color: '#94A3B8', font: { family: 'Inter', size: 11 }, callback: function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1) + 'jt' : v >= 1e3 ? (v / 1e3).toFixed(0) + 'rb' : v; } } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(), padding: 16, usePointStyle: true, font: { family: 'Inter', size: 12 } } },
          tooltip: { backgroundColor: 'rgba(15,23,42,0.9)', padding: 12, cornerRadius: 8 }
        }
      }
    });
  }

  // ============ UI STATE ============
  var currentFilter = { type: 'all', search: '', month: new Date().getMonth(), year: new Date().getFullYear() };
  var editingId = null;

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  // ============ TOAST ============
  function showToast(message, type) {
    type = type || 'info';
    var container = $('#toast-container');
    if (!container) return;
    var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + message + '</span>';
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 300); }, 3000);
  }

  // ============ RENDER ============
  function renderDashboard() {
    var stats = getStats(currentFilter.month, currentFilter.year);
    var totalBalance = getTotalBalance();
    var balEl = $('#card-balance .card-value');
    var incEl = $('#card-income .card-value');
    var expEl = $('#card-expense .card-value');
    if (balEl) { balEl.textContent = formatRupiah(totalBalance); balEl.classList.toggle('negative', totalBalance < 0); }
    if (incEl) incEl.textContent = formatRupiah(stats.income);
    if (expEl) expEl.textContent = formatRupiah(stats.expense);
    var ml = $('#current-month-label');
    if (ml) ml.textContent = MONTH_NAMES[currentFilter.month] + ' ' + currentFilter.year;
  }

  function renderTransactionList() {
    var container = $('#transaction-list');
    if (!container) return;
    var txs = getTransactions().filter(function (tx) {
      var d = new Date(tx.date);
      return d.getMonth() === currentFilter.month && d.getFullYear() === currentFilter.year;
    });
    if (currentFilter.type !== 'all') txs = txs.filter(function (tx) { return tx.type === currentFilter.type; });
    if (currentFilter.search) {
      var q = currentFilter.search.toLowerCase();
      txs = txs.filter(function (tx) {
        var cat = getCategoryById(tx.category);
        return (tx.description || '').toLowerCase().indexOf(q) !== -1 || (cat ? cat.label : '').toLowerCase().indexOf(q) !== -1;
      });
    }
    txs.sort(function (a, b) { return new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt); });

    if (!txs.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p class="empty-title">Belum ada transaksi</p><p class="empty-subtitle">Tap tombol + untuk mulai mencatat</p></div>';
      var cnt = $('#tx-count'); if (cnt) cnt.textContent = '0 transaksi';
      return;
    }

    var grouped = {};
    txs.forEach(function (tx) { if (!grouped[tx.date]) grouped[tx.date] = []; grouped[tx.date].push(tx); });
    var html = '';
    Object.keys(grouped).forEach(function (date) {
      html += '<div class="tx-date-group"><div class="tx-date-header">' + formatDate(date) + '</div>';
      grouped[date].forEach(function (tx) {
        var cat = getCategoryById(tx.category);
        var isInc = tx.type === 'income';
        html += '<div class="tx-item" data-id="' + tx.id + '">' +
          '<div class="tx-icon" style="background:' + (cat ? cat.color + '20' : '#6B728020') + ';color:' + (cat ? cat.color : '#6B7280') + '">' + (cat ? cat.icon : '💱') + '</div>' +
          '<div class="tx-info"><div class="tx-category">' + (cat ? cat.label : tx.category) + '</div><div class="tx-description">' + (tx.description || '-') + '</div></div>' +
          '<div class="tx-amount ' + (isInc ? 'income' : 'expense') + '">' + (isInc ? '+' : '-') + formatRupiah(tx.amount) + '</div>' +
          '<div class="tx-actions">' +
          '<button class="btn-tx-edit" data-id="' + tx.id + '" title="Edit"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>' +
          '<button class="btn-tx-delete" data-id="' + tx.id + '" title="Hapus"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' +
          '</div></div>';
      });
      html += '</div>';
    });
    container.innerHTML = html;
    var cnt = $('#tx-count'); if (cnt) cnt.textContent = txs.length + ' transaksi';
  }

  function renderCharts() {
    renderDonutChart(getExpenseByCategory(currentFilter.month, currentFilter.year));
    renderBarChart(getMonthlyTrend(6));
  }

  function refreshAll() {
    renderDashboard();
    renderTransactionList();
    renderCharts();
  }

  // ============ MODAL ============
  function updateCategoryOptions(type) {
    var sel = document.querySelector('[name="category"]');
    if (!sel) return;
    var cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    sel.innerHTML = cats.map(function (c) { return '<option value="' + c.id + '">' + c.icon + ' ' + c.label + '</option>'; }).join('');
  }

  function openModal(txId) {
    var modal = $('#modal-transaction');
    var form = $('#form-transaction');
    var title = $('#modal-title');
    if (!modal || !form) return;
    editingId = txId || null;
    form.reset();

    if (txId) {
      title.textContent = 'Edit Transaksi';
      var tx = getTransactions().find(function (t) { return t.id === txId; });
      if (!tx) return;
      form.querySelector('[name="type"]').value = tx.type;
      updateCategoryOptions(tx.type);
      form.querySelector('[name="category"]').value = tx.category;
      form.querySelector('[name="amount"]').value = tx.amount;
      form.querySelector('[name="description"]').value = tx.description || '';
      form.querySelector('[name="date"]').value = tx.date;
    } else {
      title.textContent = 'Tambah Transaksi';
      form.querySelector('[name="date"]').value = getTodayISO();
      form.querySelector('[name="type"]').value = 'expense';
      updateCategoryOptions('expense');
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    var modal = $('#modal-transaction');
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
    editingId = null;
  }

  // ============ THEME ============
  function initTheme() {
    var saved = localStorage.getItem('cashme_theme');
    var isDark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeIcon(isDark);
  }

  function toggleTheme() {
    var isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('cashme_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
  }

  function updateThemeIcon(isDark) {
    var btn = document.getElementById('btn-theme');
    if (!btn) return;
    btn.innerHTML = isDark
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  // ============ GOOGLE DRIVE SYNC ============
  var GOOGLE_CLIENT_ID = '104814767416-nrpt75vo49jb2pl9db9i0ra0frvalt5t.apps.googleusercontent.com';
  var DRIVE_FILE_NAME = 'cashme_data.json';
  var tokenClient = null;
  var accessToken = null;

  function initGoogleAuth() {
    if (typeof google === 'undefined' || !google.accounts) {
      setTimeout(initGoogleAuth, 500); // Retry if GSI not loaded yet
      return;
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      callback: function () { } // Will be overridden dynamically
    });
  }

  function ensureGoogleLogin(callback) {
    if (accessToken) {
      callback();
    } else {
      if (!tokenClient) {
        showToast('Google API belum siap', 'error');
        return;
      }
      tokenClient.callback = function (resp) {
        if (resp.error) { showToast('Login dibatalkan', 'error'); return; }
        accessToken = resp.access_token;
        callback();
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  }

  async function findDriveFile() {
    var res = await fetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)&q=name="' + DRIVE_FILE_NAME + '"', { headers: { Authorization: 'Bearer ' + accessToken } });
    var data = await res.json();
    return (data.files && data.files.length > 0) ? data.files[0].id : null;
  }

  function uploadToDrive() {
    ensureGoogleLogin(async function () {
      showToast('Sedang menyimpan ke awan...', 'info');
      try {
        var fileId = await findDriveFile();
        var txs = getTransactions();
        var fileContent = JSON.stringify(txs);
        var metadata = { name: DRIVE_FILE_NAME };
        
        if (!fileId) metadata.parents = ['appDataFolder'];

        var boundary = '-------314159265358979323846';
        var delimiter = "\r\n--" + boundary + "\r\n";
        var close_delim = "\r\n--" + boundary + "--";

        var body = delimiter +
          'Content-Type: application/json\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          fileContent +
          close_delim;

        var url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        var method = 'POST';
        if (fileId) {
          url = 'https://www.googleapis.com/upload/drive/v3/files/' + fileId + '?uploadType=multipart';
          method = 'PATCH';
        }

        var res = await fetch(url, {
          method: method,
          headers: {
            'Authorization': 'Bearer ' + accessToken,
            'Content-Type': 'multipart/related; boundary=' + boundary
          },
          body: body
        });

        if (res.ok) showToast('Berhasil disimpan ke Cloud! ☁️', 'success');
        else {
          var err = await res.text();
          console.error(err);
          showToast('Gagal upload ke Cloud (Lihat Konsol)', 'error');
        }
      } catch (e) {
        console.error(e);
        showToast('Terjadi kesalahan sinkronisasi', 'error');
      }
    });
  }

  function downloadFromDrive() {
    ensureGoogleLogin(async function () {
      showToast('Sedang memuat dari awan...', 'info');
      try {
        var fileId = await findDriveFile();
        if (!fileId) { showToast('Belum ada data di Cloud', 'warning'); return; }

        var res = await fetch('https://www.googleapis.com/drive/v3/files/' + fileId + '?alt=media', { headers: { Authorization: 'Bearer ' + accessToken } });
        if (res.ok) {
          var data = await res.json();
          saveTransactions(data);
          refreshAll();
          showToast('Berhasil memuat dari Cloud! ☁️', 'success');
        } else showToast('Gagal memuat dari Cloud', 'error');
      } catch (e) {
        console.error(e);
        showToast('Terjadi kesalahan sinkronisasi', 'error');
      }
    });
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initGoogleAuth();

    // Theme toggle
    var themeBtn = document.getElementById('btn-theme');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

    // FAB add
    var fabBtn = document.getElementById('btn-add');
    if (fabBtn) fabBtn.addEventListener('click', function () { openModal(); });

    // Modal close
    var closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Modal backdrop
    var modal = document.getElementById('modal-transaction');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    // Type change
    var typeSelect = document.querySelector('[name="type"]');
    if (typeSelect) typeSelect.addEventListener('change', function (e) { updateCategoryOptions(e.target.value); });

    // Form submit
    var form = document.getElementById('form-transaction');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        type: form.querySelector('[name="type"]').value,
        category: form.querySelector('[name="category"]').value,
        amount: form.querySelector('[name="amount"]').value,
        description: form.querySelector('[name="description"]').value,
        date: form.querySelector('[name="date"]').value
      };
      if (!data.amount || Number(data.amount) <= 0) { showToast('Jumlah harus lebih dari 0', 'error'); return; }
      if (editingId) { updateTransaction(editingId, data); showToast('Transaksi diperbarui', 'success'); }
      else { addTransaction(data); showToast('Transaksi ditambahkan', 'success'); }
      closeModal();
      refreshAll();
    });

    // Month navigation
    var prevBtn = document.getElementById('btn-prev-month');
    var nextBtn = document.getElementById('btn-next-month');
    if (prevBtn) prevBtn.addEventListener('click', function () {
      currentFilter.month--;
      if (currentFilter.month < 0) { currentFilter.month = 11; currentFilter.year--; }
      refreshAll();
    });
    if (nextBtn) nextBtn.addEventListener('click', function () {
      currentFilter.month++;
      if (currentFilter.month > 11) { currentFilter.month = 0; currentFilter.year++; }
      refreshAll();
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter.type = btn.dataset.filter;
        renderTransactionList();
      });
    });

    // Search
    var searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.addEventListener('input', debounce(function (e) {
      currentFilter.search = e.target.value;
      renderTransactionList();
    }, 250));

    // Transaction edit/delete
    var txList = document.getElementById('transaction-list');
    if (txList) txList.addEventListener('click', function (e) {
      var editBtn = e.target.closest('.btn-tx-edit');
      var delBtn = e.target.closest('.btn-tx-delete');
      if (editBtn) openModal(editBtn.dataset.id);
      else if (delBtn) {
        var cDialog = document.getElementById('confirm-dialog');
        if (cDialog) {
          cDialog.classList.add('active');
          document.body.style.overflow = 'hidden';
          var yesBtn = document.getElementById('confirm-yes');
          var noBtn = document.getElementById('confirm-no');
          function onYes() { deleteTransaction(delBtn.dataset.id); showToast('Transaksi dihapus', 'info'); cDialog.classList.remove('active'); document.body.style.overflow = ''; refreshAll(); cleanup(); }
          function onNo() { cDialog.classList.remove('active'); document.body.style.overflow = ''; cleanup(); }
          function cleanup() { yesBtn.removeEventListener('click', onYes); noBtn.removeEventListener('click', onNo); }
          yesBtn.addEventListener('click', onYes);
          noBtn.addEventListener('click', onNo);
        }
      }
    });

    // Export CSV
    var expBtn = document.getElementById('btn-export');
    if (expBtn) expBtn.addEventListener('click', function () {
      if (downloadCSV()) showToast('Data di-export ke CSV', 'success');
      else showToast('Tidak ada data', 'warning');
    });

    // Keyboard
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeModal();
      if (e.key === 'n' && e.ctrlKey) { e.preventDefault(); openModal(); }
    });

    // Confirm backdrop
    var cDialog = document.getElementById('confirm-dialog');
    if (cDialog) cDialog.addEventListener('click', function (e) {
      if (e.target === cDialog) { cDialog.classList.remove('active'); document.body.style.overflow = ''; }
    });

    // Sync Modal
    var syncBtn = document.getElementById('btn-sync');
    var syncModal = document.getElementById('sync-modal');
    if (syncBtn && syncModal) {
      syncBtn.addEventListener('click', function () { syncModal.classList.add('active'); document.body.style.overflow = 'hidden'; });
      document.getElementById('btn-sync-cancel').addEventListener('click', function () { syncModal.classList.remove('active'); document.body.style.overflow = ''; });
      syncModal.addEventListener('click', function (e) { if (e.target === syncModal) { syncModal.classList.remove('active'); document.body.style.overflow = ''; } });
      document.getElementById('btn-sync-upload').addEventListener('click', function () { syncModal.classList.remove('active'); document.body.style.overflow = ''; uploadToDrive(); });
      document.getElementById('btn-sync-download').addEventListener('click', function () { syncModal.classList.remove('active'); document.body.style.overflow = ''; downloadFromDrive(); });
    }

    // Initial render
    refreshAll();

    // Animate
    document.querySelectorAll('.animate-in').forEach(function (el, i) {
      el.style.animationDelay = (i * 0.08) + 's';
    });
  });

})();
