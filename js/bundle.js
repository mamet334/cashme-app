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
    return (amount < 0 ? '-Rp ' : 'Rp ') + Math.abs(amount).toLocaleString('id-ID');
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

  function getCustomCategories() {
    try { var d = localStorage.getItem('cashme_categories'); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }

  function getAllCategories() {
    return INCOME_CATEGORIES.concat(EXPENSE_CATEGORIES).concat(getCustomCategories());
  }

  function getCategoryById(id) {
    return getAllCategories().find(function (c) { return c.id === id; }) || null;
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
  var STORAGE_WALLETS = 'cashme_wallets';
  var STORAGE_BUDGET = 'cashme_budget';
  var STORAGE_STREAK = 'cashme_streak';
  var STORAGE_GOALS = 'cashme_goals';

  function getStreak() {
    try { var d = localStorage.getItem(STORAGE_STREAK); return d ? JSON.parse(d) : { count: 0, lastDate: null }; }
    catch (e) { return { count: 0, lastDate: null }; }
  }
  function saveStreak(s) { localStorage.setItem(STORAGE_STREAK, JSON.stringify(s)); }

  function updateStreak() {
    var s = getStreak();
    var today = getTodayISO();
    if (s.lastDate === today) return false;

    if (!s.lastDate) {
      s.count = 1;
    } else {
      var last = new Date(s.lastDate);
      var now = new Date(today);
      var diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
      if (diff === 1) s.count++;
      else if (diff > 1) s.count = 1;
    }
    s.lastDate = today;
    saveStreak(s);
    return true;
  }

  function getMonthlyBudget() {
    return Number(localStorage.getItem(STORAGE_BUDGET)) || 0;
  }
  function saveMonthlyBudget(val) {
    localStorage.setItem(STORAGE_BUDGET, val);
  }

  function getWallets() {
    try { var d = localStorage.getItem(STORAGE_WALLETS); return d ? JSON.parse(d) : [{ id: 'default', name: 'Dompet Utama' }]; }
    catch (e) { return [{ id: 'default', name: 'Dompet Utama' }]; }
  }
  
  function saveWallets(w) {
    localStorage.setItem(STORAGE_WALLETS, JSON.stringify(w));
  }
  
  function getGoals() {
    try { var d = localStorage.getItem('cashme_goals'); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }
  function saveGoals(goals) { localStorage.setItem('cashme_goals', JSON.stringify(goals)); }

  function getSubscriptions() {
    try { var d = localStorage.getItem('cashme_subs'); return d ? JSON.parse(d) : []; }
    catch (e) { return []; }
  }
  function saveSubscriptions(subs) { localStorage.setItem('cashme_subs', JSON.stringify(subs)); }

  function getTransactions() {
    try { 
      var d = localStorage.getItem(STORAGE_KEY); 
      var txs = d ? JSON.parse(d) : []; 
      // MIGRATION: Add default walletId to old transactions
      var migrated = false;
      txs.forEach(function(tx) {
        if (!tx.walletId) { tx.walletId = 'default'; migrated = true; }
      });
      if (migrated) saveTransactions(txs);
      return txs;
    }
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
      date: data.date, walletId: data.walletId || 'default', createdAt: new Date().toISOString()
    };
    txs.unshift(tx);
    saveTransactions(txs);
    
    // Gamification & Motivasi
    if (tx.date === getTodayISO()) {
      var streakUp = updateStreak();
      if (streakUp) {
        var s = getStreak();
        if (s.count >= 3) setTimeout(function() { showToast('Luar biasa! Streak ' + s.count + ' hari! 🔥', 'success'); }, 1500);
      }
    }
    if (tx.type === 'expense') {
      var limit = getMonthlyBudget();
      var txDate = new Date(tx.date);
      var stats = getStats(txDate.getMonth(), txDate.getFullYear());
      
      if (limit > 0 && stats.expense > limit) {
        setTimeout(function() { showToast('⚠️ AWAS! Anda telah melewati batas pengeluaran bulan ini!', 'error'); }, 2000);
      } else if (limit > 0 && stats.expense >= limit * 0.9) {
        setTimeout(function() { showToast('Hati-hati! Pengeluaran Anda hampir mencapai batas bulan ini.', 'warning'); }, 2000);
      }

      if (tx.amount <= 20000) {
        setTimeout(function() { showToast('Pengeluaran kecil yang bagus! Hemat! 👏', 'info'); }, 1000);
      } else if (tx.amount > 500000) {
        setTimeout(function() { showToast('Wow, lumayan besar! Hati-hati boros ya 💸', 'warning'); }, 1000);
      }
    }
    
    return tx;
  }

  function checkSubscriptions() {
    var subs = getSubscriptions();
    var changed = false;
    var today = new Date();
    
    subs.forEach(function(sub) {
      var lastPaid = sub.lastPaid ? new Date(sub.lastPaid) : new Date(0);
      if (today.getFullYear() > lastPaid.getFullYear() || (today.getFullYear() === lastPaid.getFullYear() && today.getMonth() > lastPaid.getMonth())) {
        if (today.getDate() >= sub.date) {
          setTimeout(function() { 
            showToast('🚨 Tagihan rutin "' + sub.name + '" jatuh tempo! Klik di sini untuk mencatat.', 'warning', function() {
              openModal();
              var form = document.getElementById('form-transaction');
              if (form) {
                form.querySelector('[name="type"]').value = 'expense';
                updateCategoryOptions('expense');
                form.querySelector('[name="category"]').value = 'Tagihan';
                form.querySelector('[name="amount"]').value = sub.amount;
                form.querySelector('[name="description"]').value = sub.name + ' (Rutin)';
              }
            }); 
          }, 1000);
          sub.lastPaid = getTodayISO();
          changed = true;
        }
      }
    });
    
    if (changed) {
      saveSubscriptions(subs);
      refreshAll();
    }
  }

  function updateTransaction(id, data) {
    var txs = getTransactions();
    var idx = txs.findIndex(function (t) { return t.id === id; });
    if (idx === -1) return null;
    txs[idx] = Object.assign({}, txs[idx], data, {
      amount: data.amount ? Math.abs(Number(data.amount)) : txs[idx].amount,
      walletId: data.walletId || txs[idx].walletId || 'default',
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

  function getWalletBalance(walletId) {
    var bal = 0;
    getTransactions().forEach(function (tx) {
      if (tx.walletId === walletId || (!tx.walletId && walletId === 'default')) {
        bal += tx.type === 'income' ? tx.amount : -tx.amount;
      }
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
    var wallets = getWallets();
    if (!txs.length) return false;
    var lines = ['Tanggal,Tipe,Kategori,Dompet,Jumlah,Keterangan'];
    txs.forEach(function (tx) {
      var w = wallets.find(function(w) { return w.id === (tx.walletId || 'default'); });
      var wName = w ? w.name : 'Dompet Utama';
      lines.push([tx.date, tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran', tx.category, wName, tx.amount, '"' + (tx.description || '').replace(/"/g, '""') + '"'].join(','));
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
  function showToast(message, type, onClick) {
    type = type || 'info';
    var container = $('#toast-container');
    if (!container) return;
    var icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (icons[type] || icons.info) + '</span><span class="toast-message">' + message + '</span>';
    
    if (onClick) {
      toast.style.cursor = 'pointer';
      toast.title = 'Klik untuk aksi';
      toast.addEventListener('click', function() {
        onClick();
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
      });
    }
    
    container.appendChild(toast);
    requestAnimationFrame(function () { toast.classList.add('show'); });
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 300); }, onClick ? 10000 : 3000);
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

  function renderWallets() {
    var container = $('#wallets-container');
    if (!container) return;
    var wallets = getWallets();
    var html = '';
    wallets.forEach(function(w) {
      var bal = getWalletBalance(w.id);
      html += '<div class="stat-card" style="min-width: 140px; padding: 12px; flex: 0 0 auto;">' +
        '<div class="card-header" style="margin-bottom: 4px;"><div class="card-icon" style="font-size: 1rem; padding: 4px;">💳</div><span class="card-label" style="font-size: 0.75rem;">' + w.name + '</span></div>' +
        '<div class="card-value ' + (bal < 0 ? 'negative' : '') + '" style="font-size: 1rem;">' + formatRupiah(bal) + '</div>' +
        '</div>';
    });
    container.innerHTML = html;
  }

  function renderBudget() {
    var budget = getMonthlyBudget();
    var spentEl = $('#budget-spent');
    var limitEl = $('#budget-limit');
    var barEl = $('#budget-progress-bar');
    if (!spentEl || !limitEl || !barEl) return;

    var stats = getStats(currentFilter.month, currentFilter.year);
    var expense = stats.expense;

    if (budget === 0) {
      spentEl.textContent = formatRupiah(expense);
      limitEl.textContent = 'Batas belum diatur';
      barEl.style.width = '0%';
    } else {
      spentEl.textContent = formatRupiah(expense);
      limitEl.textContent = 'dari ' + formatRupiah(budget);
      var pct = Math.min((expense / budget) * 100, 100);
      barEl.style.width = pct + '%';
      if (pct < 70) barEl.style.background = '#10B981';
      else if (pct < 90) barEl.style.background = '#F59E0B';
      else barEl.style.background = '#EF4444';
    }
  }

  function renderGoals() {
    var cont = $('#goals-list');
    if (!cont) return;
    var goals = getGoals();
    if (!goals.length) {
      cont.innerHTML = '<div style="font-size:0.85rem; color:var(--text-muted); padding: 12px 0;">Belum ada target impian.</div>';
      return;
    }
    
    var html = '';
    goals.forEach(function(g) {
      var percent = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
      html += '<div class="stat-card" style="min-width: 200px; cursor: pointer; padding: 14px; position: relative;" onclick="window.addFundToGoal(\'' + g.id + '\')">' +
                '<button style="position:absolute; top:8px; right:8px; background:none; border:none; color:var(--expense); cursor:pointer; font-size:1.1rem; z-index:5;" title="Hapus Impian" onclick="event.stopPropagation(); window.deleteGoal(\'' + g.id + '\')">🗑️</button>' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">' +
                  '<span style="font-weight:600; font-size:0.9rem; padding-right:32px;">' + g.name + '</span>' +
                  '<span style="font-size:0.8rem; color:var(--text-muted);">' + percent + '%</span>' +
                '</div>' +
                '<div style="font-size:1.1rem; font-weight:700; margin-bottom:8px; color:var(--income);">' + formatRupiah(g.current) + '</div>' +
                '<div style="width:100%; height:6px; background:var(--bg-secondary); border-radius:3px; overflow:hidden;">' +
                  '<div style="height:100%; width:' + percent + '%; background:var(--accent); border-radius:3px; transition:width 0.5s ease;"></div>' +
                '</div>' +
                '<div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px; text-align:right;">Target: ' + formatRupiah(g.target) + '</div>' +
              '</div>';
    });
    cont.innerHTML = html;
  }

  function renderSubscriptions() {
    var subs = getSubscriptions();
    var cont = document.getElementById('subs-container');
    if (!cont) return;
    if (subs.length === 0) {
      cont.innerHTML = '';
      return;
    }
    
    var html = '<div style="font-size:0.8rem; font-weight:600; color:var(--text-muted); margin-top:8px;">Daftar Tagihan Rutin (' + subs.length + '):</div>';
    subs.forEach(function(s) {
      html += '<div class="stat-card" style="display:flex; justify-content:space-between; align-items:center; padding:12px; margin-top:0; cursor:pointer;" onclick="window.paySubscription(\'' + s.id + '\')" title="Klik untuk bayar">' +
                '<div style="display:flex; flex-direction:column; gap:4px;">' +
                  '<span style="font-weight:600; font-size:0.9rem;">' + s.name + '</span>' +
                  '<span style="color:var(--text-muted); font-size:0.75rem;">Jatuh tempo tgl ' + s.date + '</span>' +
                '</div>' +
                '<div style="display:flex; align-items:center; gap:12px;">' +
                  '<span style="color:var(--expense); font-weight:700; font-size:0.95rem;">' + formatRupiah(s.amount) + '</span>' +
                  '<button style="background:var(--bg-secondary); border:none; color:var(--text-muted); cursor:pointer; font-size:1rem; border-radius: 8px; width: 32px; height: 32px; display:flex; align-items:center; justify-content:center; transition:0.2s;" onclick="event.stopPropagation(); window.deleteSubscription(\'' + s.id + '\')" title="Hapus Tagihan">🗑️</button>' +
                '</div>' +
              '</div>';
    });
    cont.innerHTML = html;
  }

  function renderCharts() {
    renderDonutChart(getExpenseByCategory(currentFilter.month, currentFilter.year));
    renderBarChart(getMonthlyTrend(6));
  }

  function renderStreak() {
    var s = getStreak();
    var badge = $('#streak-badge');
    if (!badge) return;
    
    if (s.lastDate) {
      var diff = Math.floor((new Date(getTodayISO()) - new Date(s.lastDate)) / (1000 * 60 * 60 * 24));
      if (diff > 1) { s.count = 0; saveStreak(s); }
    }

    if (s.count > 0) {
      badge.style.display = 'block';
      badge.textContent = '🔥 ' + s.count + ' Hari';
    } else {
      badge.style.display = 'none';
    }
  }

  var autoUploadTimer;
  function autoUploadToDrive() {
    if (!accessToken) return;
    clearTimeout(autoUploadTimer);
    autoUploadTimer = setTimeout(function() {
      if (typeof uploadToDrive === 'function') uploadToDrive(true);
    }, 5000);
  }

  function refreshAll() {
    renderDashboard();
    renderBudget();
    renderWallets();
    renderGoals();
    renderSubscriptions();
    renderTransactionList();
    renderCharts();
    renderStreak();
    autoUploadToDrive();
  }

  // ============ MODAL ============
  function updateCategoryOptions(type) {
    var sel = document.querySelector('[name="category"]');
    if (!sel) return;
    var builtin = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    var custom = getCustomCategories().filter(function(c) { return c.type === type; });
    var cats = builtin.concat(custom);
    sel.innerHTML = cats.map(function (c) { return '<option value="' + c.id + '">' + c.icon + ' ' + c.label + '</option>'; }).join('');
  }

  // ============ CUSTOM PROMPT ============
  function customPrompt(title, message, defaultValue, callback) {
    var modal = document.getElementById('modal-prompt');
    var titleEl = document.getElementById('prompt-title');
    var msgEl = document.getElementById('prompt-message');
    var inputEl = document.getElementById('prompt-input');
    var btnOk = document.getElementById('prompt-ok');
    var btnCancel = document.getElementById('prompt-cancel');
    
    if (!modal) {
      var res = prompt(message, defaultValue || '');
      if (callback) callback(res);
      return;
    }
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    inputEl.value = defaultValue || '';
    modal.classList.add('active');
    
    // Auto focus
    setTimeout(function() { inputEl.focus(); }, 100);
    
    function cleanup() {
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
      modal.classList.remove('active');
    }
    
    function onOk() {
      var val = inputEl.value;
      cleanup();
      if (callback) callback(val);
    }
    function onCancel() {
      cleanup();
      if (callback) callback(null);
    }
    
    // Allow enter key
    inputEl.onkeydown = function(e) {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };
    
    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
  }

  // ============ CUSTOM CONFIRM ============
  function customConfirm(title, message, callback) {
    var modal = document.getElementById('modal-confirm');
    var titleEl = document.getElementById('confirm-title');
    var msgEl = document.getElementById('confirm-message');
    var btnOk = document.getElementById('confirm-ok');
    var btnCancel = document.getElementById('confirm-cancel');
    
    if (!modal) {
      if (callback) callback(confirm(message));
      return;
    }
    
    titleEl.textContent = title;
    msgEl.textContent = message;
    modal.classList.add('active');
    
    function cleanup() {
      btnOk.removeEventListener('click', onOk);
      btnCancel.removeEventListener('click', onCancel);
      modal.classList.remove('active');
    }
    
    function onOk() {
      cleanup();
      if (callback) callback(true);
    }
    function onCancel() {
      cleanup();
      if (callback) callback(false);
    }
    
    btnOk.addEventListener('click', onOk);
    btnCancel.addEventListener('click', onCancel);
  }

  function updateWalletOptions() {
    var sel = document.querySelector('[name="walletId"]');
    if (!sel) return;
    var wallets = getWallets();
    sel.innerHTML = wallets.map(function(w) { return '<option value="' + w.id + '">💳 ' + w.name + '</option>'; }).join('');
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
      updateWalletOptions();
      form.querySelector('[name="category"]').value = tx.category;
      if (form.querySelector('[name="walletId"]')) form.querySelector('[name="walletId"]').value = tx.walletId || 'default';
      form.querySelector('[name="amount"]').value = tx.amount;
      form.querySelector('[name="description"]').value = tx.description || '';
      form.querySelector('[name="date"]').value = tx.date;
    } else {
      title.textContent = 'Tambah Transaksi';
      form.querySelector('[name="date"]').value = getTodayISO();
      form.querySelector('[name="type"]').value = 'expense';
      updateCategoryOptions('expense');
      updateWalletOptions();
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

  function uploadToDrive(silent) {
    ensureGoogleLogin(async function () {
      if (!silent) showToast('Sedang menyimpan ke awan...', 'info');
      try {
        var fileId = await findDriveFile();
        
        var dataToSave = {
          transactions: getTransactions(),
          wallets: getWallets(),
          budget: getMonthlyBudget(),
          budget: getMonthlyBudget(),
          streak: getStreak(),
          goals: getGoals(),
          subs: getSubscriptions()
        };
        var fileContent = JSON.stringify(dataToSave);
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

        if (res.ok) {
           if (!silent) showToast('Berhasil disimpan ke Cloud! ☁️', 'success');
        } else {
           if (!silent) showToast('Gagal upload ke Cloud (Lihat Konsol)', 'error');
           console.error(await res.text());
        }
      } catch (e) {
        console.error(e);
        if (!silent) showToast('Terjadi kesalahan sinkronisasi', 'error');
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
          // Mendukung format lama dan baru
          if (Array.isArray(data)) {
            saveTransactions(data);
          } else {
            if (data.transactions) saveTransactions(data.transactions);
            if (data.wallets) saveWallets(data.wallets);
            if (data.budget !== undefined) saveMonthlyBudget(data.budget);
            if (data.budget !== undefined) saveMonthlyBudget(data.budget);
            if (data.streak) saveStreak(data.streak);
            if (data.goals) saveGoals(data.goals);
            if (data.subs) saveSubscriptions(data.subs);
          }
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

    // Add Wallet
    var addWalletBtn = document.getElementById('btn-add-wallet');
    if (addWalletBtn) addWalletBtn.addEventListener('click', function() {
      customPrompt('Tambah Dompet', 'Masukkan nama dompet baru (misal: BCA, Gopay):', '', function(name) {
        if (name && name.trim()) {
          var wallets = getWallets();
          wallets.push({ id: 'w_' + generateId(), name: name.trim() });
          saveWallets(wallets);
          refreshAll();
          showToast('Dompet ditambahkan', 'success');
        }
      });
    });

    // Add Goal
    var addGoalBtn = document.getElementById('btn-add-goal');
    if (addGoalBtn) addGoalBtn.addEventListener('click', function() {
      customPrompt('Target Impian', 'Nama Target Impian (misal: Liburan, Beli Motor):', '', function(name) {
        if (!name) return;
        customPrompt('Target Dana', 'Berapa target dana yang dikumpulkan? (angka saja):', '', function(target) {
          if (!target || isNaN(Number(target))) return showToast('Nominal target tidak valid', 'error');
          
          var goals = getGoals();
          goals.push({ id: 'g_' + generateId(), name: name.trim(), target: Number(target), current: 0 });
          saveGoals(goals);
          refreshAll();
          showToast('Target Impian ditambahkan!', 'success');
        });
      });
    });

    window.addFundToGoal = function(goalId) {
      var goals = getGoals();
      var gIdx = goals.findIndex(function(g) { return g.id === goalId; });
      if (gIdx === -1) return;
      
      var g = goals[gIdx];
      customPrompt('Nabung', 'Berapa uang yang ingin disisihkan ke target "' + g.name + '" saat ini?', '', function(amt) {
        if (!amt || isNaN(Number(amt)) || Number(amt) <= 0) return;
        
        var numAmt = Number(amt);
        addTransaction({
          type: 'expense',
          category: 'Lainnya',
          amount: numAmt,
          description: 'Tabungan: ' + g.name,
          date: getTodayISO(),
          walletId: 'default'
        });
        
        g.current += numAmt;
        goals[gIdx] = g;
        saveGoals(goals);
        refreshAll();
        showToast('Dana berhasil disisihkan ke Tabungan!', 'success');
      });
    };

    window.deleteGoal = function(goalId) {
      customConfirm('Hapus Impian?', 'Peringatan: Impian Anda tidak akan terkabul bila ini dihapus! Tetap hapus?', function(yes) {
        if (yes) {
          var goals = getGoals();
          goals = goals.filter(function(g) { return g.id !== goalId; });
          saveGoals(goals);
          refreshAll();
          showToast('Impian telah dihapus...', 'warning');
        }
      });
    };

    window.deleteSubscription = function(subId) {
      customConfirm('Hapus Tagihan?', 'Yakin ingin menghapus jadwal tagihan rutin ini?', function(yes) {
        if (yes) {
          var subs = getSubscriptions();
          subs = subs.filter(function(s) { return s.id !== subId; });
          saveSubscriptions(subs);
          refreshAll();
          showToast('Tagihan rutin dihapus', 'info');
        }
      });
    };

    window.paySubscription = function(subId) {
      var subs = getSubscriptions();
      var sub = subs.find(function(s) { return s.id === subId; });
      if (!sub) return;
      
      openModal();
      var form = document.getElementById('form-transaction');
      if (form) {
        form.querySelector('[name="type"]').value = 'expense';
        updateCategoryOptions('expense');
        form.querySelector('[name="category"]').value = 'Tagihan';
        form.querySelector('[name="amount"]').value = sub.amount;
        form.querySelector('[name="description"]').value = sub.name + ' (Rutin)';
      }
    };

    // Set Budget
    var btnSetBudget = document.getElementById('btn-set-budget');
    if (btnSetBudget) btnSetBudget.addEventListener('click', function() {
      var curr = getMonthlyBudget();
      customPrompt('Atur Batas', 'Masukkan batas maksimal pengeluaran bulan ini (angka saja):', curr === 0 ? '' : curr, function(val) {
        if (val !== null) {
          var num = Number(val);
          if (!isNaN(num) && num >= 0) {
            saveMonthlyBudget(num);
            refreshAll();
            showToast('Batas pengeluaran diatur', 'success');
          } else {
            showToast('Angka tidak valid', 'error');
          }
        }
      });
    });

    // Add Subscription
    var btnAddSub = document.getElementById('btn-add-sub');
    if (btnAddSub) btnAddSub.addEventListener('click', function() {
      customPrompt('Tagihan Rutin', 'Nama tagihan rutin (misal: Netflix, Listrik):', '', function(name) {
        if (!name) return;
        customPrompt('Nominal Tagihan', 'Nominal tagihan setiap bulannya:', '', function(amt) {
          if (!amt || isNaN(Number(amt))) return showToast('Nominal tidak valid', 'error');
          customPrompt('Jadwal Tagihan', 'Tanggal berapa jatuh temponya setiap bulan? (1-31):', '', function(date) {
            if (!date || isNaN(Number(date)) || Number(date) < 1 || Number(date) > 31) return showToast('Tanggal tidak valid', 'error');
            
            var subs = getSubscriptions();
            subs.push({
              id: 's_' + generateId(),
              name: name.trim(),
              amount: Number(amt),
              date: Number(date),
              category: 'Tagihan',
              lastPaid: null
            });
            saveSubscriptions(subs);
            showToast('Tagihan rutin berhasil dijadwalkan!', 'success');
          });
        });
      });
    });

    // Modal close
    var closeBtn = document.getElementById('modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Modal backdrop
    var modal = document.getElementById('modal-transaction');
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    // Type change
    var typeSelect = document.querySelector('[name="type"]');
    if (typeSelect) typeSelect.addEventListener('change', function (e) { updateCategoryOptions(e.target.value); });

    // Smart Input (AI Parser)
    var smartInput = document.getElementById('smart-input');
    var form = document.getElementById('form-transaction');
    if (smartInput && form) {
      smartInput.addEventListener('input', function(e) {
        var text = e.target.value.trim();
        if (!text) return;
        
        var amountMatch = text.match(/\d+[\.,]?\d*/g);
        var amount = 0;
        if (amountMatch) {
          var numbers = amountMatch.map(function(n) { return Number(n.replace(/[\.,]/g, '')); });
          amount = Math.max.apply(null, numbers);
        }
        
        var desc = text.replace(amount, '').trim().replace(/^[\W_]+|[\W_]+$/g, '').trim();
        
        var typeSelect = form.querySelector('[name="type"]');
        var catSelect = form.querySelector('[name="category"]');
        var amtInput = form.querySelector('[name="amount"]');
        var descInput = form.querySelector('[name="description"]');
        
        if (amount > 0) amtInput.value = amount;
        if (desc) descInput.value = desc;
        
        typeSelect.value = 'expense';
        updateCategoryOptions('expense');
        var lowerDesc = desc.toLowerCase();
        var guessedCat = 'Lainnya';
        if (lowerDesc.match(/makan|minum|kopi|coffee|food|grabfood|gofood|snack|roti|rokok|sbux|starbucks/)) guessedCat = 'Makan & Minum';
        else if (lowerDesc.match(/gojek|grab|bensin|parkir|tol|krl|mrt|bus|tiket/)) guessedCat = 'Transportasi';
        else if (lowerDesc.match(/belanja|supermarket|minimarket|indomaret|alfamart|baju|sepatu|tokopedia|shopee/)) guessedCat = 'Belanja';
        else if (lowerDesc.match(/tagihan|listrik|air|internet|wifi|kos|kontrakan|netflix|spotify/)) guessedCat = 'Tagihan';
        else if (lowerDesc.match(/nonton|bioskop|game|main|liburan/)) guessedCat = 'Hiburan';
        else if (lowerDesc.match(/obat|dokter|rs|klinik|apotek|vitamin/)) guessedCat = 'Kesehatan';
        else if (lowerDesc.match(/spp|buku|kursus|sekolah/)) guessedCat = 'Pendidikan';
        
        catSelect.value = guessedCat;
      });
    }

    // Form submit
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        type: form.querySelector('[name="type"]').value,
        category: form.querySelector('[name="category"]').value,
        amount: form.querySelector('[name="amount"]').value,
        description: form.querySelector('[name="description"]').value,
        date: form.querySelector('[name="date"]').value,
        walletId: form.querySelector('[name="walletId"]') ? form.querySelector('[name="walletId"]').value : 'default'
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
        customConfirm('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini?', function(yes) {
          if (yes) {
            deleteTransaction(delBtn.dataset.id);
            showToast('Transaksi dihapus', 'info');
            refreshAll();
          }
        });
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

    // ============ PIN LOCK ============
    var pinScreen = document.getElementById('pin-screen');
    var pinDots = document.querySelectorAll('.pin-dot');
    var pinTitle = document.getElementById('pin-title');
    var pinSubtitle = document.getElementById('pin-subtitle');
    var btnForgotPin = document.getElementById('btn-forgot-pin');
    
    var savedPin = localStorage.getItem('cashme_pin');
    var isSettingUp = false;
    var currentInput = '';
    var setupFirstPin = '';
    
    if (savedPin) {
      pinScreen.classList.add('active');
    } else {
      pinScreen.classList.remove('active');
    }
    
    function updatePinDots() {
      pinDots.forEach(function(dot, i) {
        if (i < currentInput.length) dot.classList.add('filled');
        else dot.classList.remove('filled', 'error');
      });
    }
    
    function shakeDots() {
      pinDots.forEach(function(dot) {
        dot.classList.add('error');
        setTimeout(function() { dot.classList.remove('error'); }, 400);
      });
      currentInput = '';
      setTimeout(updatePinDots, 400);
    }
    
    document.querySelectorAll('.numpad-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        if (this.id === 'btn-pin-clear') {
          currentInput = '';
          updatePinDots();
          return;
        }
        if (this.id === 'btn-pin-del') {
          currentInput = currentInput.slice(0, -1);
          updatePinDots();
          return;
        }
        
        var val = this.dataset.val;
        if (val && currentInput.length < 6) {
          currentInput += val;
          updatePinDots();
          
          if (currentInput.length === 6) {
            setTimeout(function() {
              if (isSettingUp) {
                if (!setupFirstPin) {
                  setupFirstPin = currentInput;
                  currentInput = '';
                  updatePinDots();
                  pinTitle.textContent = 'Konfirmasi PIN';
                  pinSubtitle.textContent = 'Masukkan kembali PIN Anda';
                } else {
                  if (currentInput === setupFirstPin) {
                    customPrompt('Pertanyaan Keamanan', 'Ketik kata rahasia (contoh: nama hewan peliharaan) untuk pemulihan jika Anda lupa PIN:', '', function(ans) {
                      if (ans && ans.trim()) {
                        localStorage.setItem('cashme_pin', currentInput);
                        localStorage.setItem('cashme_pin_sec', ans.trim().toLowerCase());
                        showToast('PIN & Kata Rahasia berhasil diatur!', 'success');
                        pinScreen.classList.remove('active');
                        savedPin = currentInput;
                      } else {
                        showToast('Kata rahasia wajib diisi!', 'error');
                        setupFirstPin = '';
                        shakeDots();
                        pinTitle.textContent = 'Atur PIN Baru';
                        pinSubtitle.textContent = 'Buat 6 digit PIN untuk keamanan';
                      }
                    });
                  } else {
                    showToast('PIN tidak cocok, coba lagi', 'error');
                    setupFirstPin = '';
                    shakeDots();
                    pinTitle.textContent = 'Atur PIN Baru';
                    pinSubtitle.textContent = 'Buat 6 digit PIN untuk keamanan';
                  }
                }
              } else {
                if (currentInput === savedPin) {
                  pinScreen.classList.remove('active');
                  showToast('Akses Diberikan', 'success');
                  currentInput = '';
                  updatePinDots();
                } else {
                  shakeDots();
                }
              }
            }, 100);
          }
        }
      });
    });
    
    if (btnForgotPin) {
      btnForgotPin.addEventListener('click', function() {
        var secAns = localStorage.getItem('cashme_pin_sec');
        if (secAns) {
          customPrompt('Pemulihan PIN', 'Masukkan kata rahasia keamanan Anda:', '', function(ans) {
            if (ans && ans.trim().toLowerCase() === secAns) {
              localStorage.removeItem('cashme_pin');
              localStorage.removeItem('cashme_pin_sec');
              savedPin = null;
              pinScreen.classList.remove('active');
              showToast('Kunci PIN berhasil dibuka & dihapus!', 'success');
            } else if (ans !== null) {
              showToast('Kata rahasia salah!', 'error');
            }
          });
        } else {
          customConfirm('Reset PIN?', 'Anda belum mengatur kata rahasia. Yakin ingin mereset PIN?', function(yes) {
            if (yes) {
              localStorage.removeItem('cashme_pin');
              savedPin = null;
              pinScreen.classList.remove('active');
              showToast('PIN berhasil di-reset', 'info');
            }
          });
        }
      });
    }

    // Fungsi global agar bisa dipanggil dari HTML
    window.setupPinLock = function() {
      isSettingUp = true;
      setupFirstPin = '';
      currentInput = '';
      updatePinDots();
      pinScreen.classList.add('active');
      pinTitle.textContent = 'Atur PIN Baru';
      pinSubtitle.textContent = 'Buat 6 digit PIN untuk keamanan';
    };

    // Initial render
    refreshAll();
    checkSubscriptions();

    // Animate
    document.querySelectorAll('.animate-in').forEach(function (el, i) {
      el.style.animationDelay = (i * 0.08) + 's';
    });
  });

})();
