// ========================================
// CashMe — UI Module
// ========================================

import {
  formatRupiah, formatDate, formatDateShort, getCategoryById,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, MONTH_NAMES, getTodayISO, debounce
} from './utils.js';
import {
  getTransactions, addTransaction, updateTransaction, deleteTransaction,
  getStats, getTotalBalance, getExpenseByCategory, getIncomeByCategory, getMonthlyTrend, downloadCSV
} from './storage.js';
import { renderDonutChart, renderBarChart } from './chart.js';

// ---- State ----
let currentFilter = {
  type: 'all',       // 'all' | 'income' | 'expense'
  search: '',
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
};
let editingId = null;

// ---- DOM Refs ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ---- Initialize ----
export function initUI() {
  renderDashboard();
  renderTransactionList();
  renderCharts();
  setupEventListeners();
  setupMonthSelector();
  animateCountUp();
}

// ========================================
// Dashboard Cards
// ========================================
function renderDashboard() {
  const stats = getStats(currentFilter.month, currentFilter.year);
  const totalBalance = getTotalBalance();

  // Update card values
  const balanceEl = $('#card-balance .card-value');
  const incomeEl = $('#card-income .card-value');
  const expenseEl = $('#card-expense .card-value');

  if (balanceEl) {
    balanceEl.dataset.target = totalBalance;
    balanceEl.textContent = formatRupiah(totalBalance);
    balanceEl.classList.toggle('negative', totalBalance < 0);
  }
  if (incomeEl) {
    incomeEl.dataset.target = stats.income;
    incomeEl.textContent = formatRupiah(stats.income);
  }
  if (expenseEl) {
    expenseEl.dataset.target = stats.expense;
    expenseEl.textContent = formatRupiah(stats.expense);
  }

  // Update month label
  const monthLabel = $('#current-month-label');
  if (monthLabel) {
    monthLabel.textContent = `${MONTH_NAMES[currentFilter.month]} ${currentFilter.year}`;
  }
}

// ========================================
// Transaction List
// ========================================
function renderTransactionList() {
  const container = $('#transaction-list');
  if (!container) return;

  let transactions = getTransactions();

  // Filter by month/year
  transactions = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === currentFilter.month && d.getFullYear() === currentFilter.year;
  });

  // Filter by type
  if (currentFilter.type !== 'all') {
    transactions = transactions.filter(tx => tx.type === currentFilter.type);
  }

  // Filter by search
  if (currentFilter.search) {
    const q = currentFilter.search.toLowerCase();
    transactions = transactions.filter(tx =>
      tx.description.toLowerCase().includes(q) ||
      (getCategoryById(tx.category)?.label || '').toLowerCase().includes(q)
    );
  }

  // Sort by date desc then createdAt desc
  transactions.sort((a, b) => {
    const dateCompare = new Date(b.date) - new Date(a.date);
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  if (transactions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-title">Belum ada transaksi</p>
        <p class="empty-subtitle">Tap tombol + untuk mulai mencatat</p>
      </div>
    `;
    return;
  }

  // Group by date
  const grouped = {};
  transactions.forEach(tx => {
    if (!grouped[tx.date]) grouped[tx.date] = [];
    grouped[tx.date].push(tx);
  });

  let html = '';
  Object.entries(grouped).forEach(([date, txs]) => {
    html += `<div class="tx-date-group">
      <div class="tx-date-header">${formatDate(date)}</div>`;
    
    txs.forEach(tx => {
      const cat = getCategoryById(tx.category);
      const isIncome = tx.type === 'income';
      html += `
        <div class="tx-item" data-id="${tx.id}">
          <div class="tx-icon" style="background: ${cat ? cat.color + '20' : '#6B728020'}; color: ${cat ? cat.color : '#6B7280'}">
            ${cat ? cat.icon : '💱'}
          </div>
          <div class="tx-info">
            <div class="tx-category">${cat ? cat.label : tx.category}</div>
            <div class="tx-description">${tx.description || '-'}</div>
          </div>
          <div class="tx-amount ${isIncome ? 'income' : 'expense'}">
            ${isIncome ? '+' : '-'}${formatRupiah(tx.amount)}
          </div>
          <div class="tx-actions">
            <button class="btn-tx-edit" data-id="${tx.id}" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="btn-tx-delete" data-id="${tx.id}" title="Hapus">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  container.innerHTML = html;

  // Transaction count
  const countEl = $('#tx-count');
  if (countEl) countEl.textContent = `${transactions.length} transaksi`;
}

// ========================================
// Charts
// ========================================
function renderCharts() {
  const expenseData = getExpenseByCategory(currentFilter.month, currentFilter.year);
  const trendData = getMonthlyTrend(6);
  renderDonutChart(expenseData);
  renderBarChart(trendData);
}

// ========================================
// Modal — Add/Edit Transaction
// ========================================
function openModal(txId = null) {
  const modal = $('#modal-transaction');
  const form = $('#form-transaction');
  const title = $('#modal-title');

  if (!modal || !form) return;

  editingId = txId;
  form.reset();

  if (txId) {
    // Edit mode
    title.textContent = 'Edit Transaksi';
    const tx = getTransactions().find(t => t.id === txId);
    if (!tx) return;

    form.querySelector('[name="type"]').value = tx.type;
    updateCategoryOptions(tx.type);
    form.querySelector('[name="category"]').value = tx.category;
    form.querySelector('[name="amount"]').value = tx.amount;
    form.querySelector('[name="description"]').value = tx.description || '';
    form.querySelector('[name="date"]').value = tx.date;
  } else {
    // New mode
    title.textContent = 'Tambah Transaksi';
    form.querySelector('[name="date"]').value = getTodayISO();
    form.querySelector('[name="type"]').value = 'expense';
    updateCategoryOptions('expense');
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Focus first input after animation
  setTimeout(() => {
    form.querySelector('[name="amount"]').focus();
  }, 300);
}

function closeModal() {
  const modal = $('#modal-transaction');
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
  editingId = null;
}

function updateCategoryOptions(type) {
  const select = $('[name="category"]');
  if (!select) return;

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  select.innerHTML = categories.map(c =>
    `<option value="${c.id}">${c.icon} ${c.label}</option>`
  ).join('');
}

function handleFormSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    type: form.querySelector('[name="type"]').value,
    category: form.querySelector('[name="category"]').value,
    amount: form.querySelector('[name="amount"]').value,
    description: form.querySelector('[name="description"]').value,
    date: form.querySelector('[name="date"]').value,
  };

  if (!data.amount || Number(data.amount) <= 0) {
    showToast('Jumlah harus lebih dari 0', 'error');
    return;
  }

  if (editingId) {
    updateTransaction(editingId, data);
    showToast('Transaksi berhasil diperbarui', 'success');
  } else {
    addTransaction(data);
    showToast('Transaksi berhasil ditambahkan', 'success');
  }

  closeModal();
  refreshAll();
}

function handleDelete(id) {
  if (!id) return;
  
  // Show confirm dialog
  const confirmEl = $('#confirm-dialog');
  if (confirmEl) {
    confirmEl.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const confirmBtn = $('#confirm-yes');
    const cancelBtn = $('#confirm-no');
    
    const onConfirm = () => {
      deleteTransaction(id);
      showToast('Transaksi dihapus', 'info');
      confirmEl.classList.remove('active');
      document.body.style.overflow = '';
      refreshAll();
      cleanup();
    };
    
    const onCancel = () => {
      confirmEl.classList.remove('active');
      document.body.style.overflow = '';
      cleanup();
    };
    
    const cleanup = () => {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
    };
    
    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
  }
}

// ========================================
// Toast Notification
// ========================================
export function showToast(message, type = 'info') {
  const container = $('#toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'));

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// Month Selector
// ========================================
function setupMonthSelector() {
  const prevBtn = $('#btn-prev-month');
  const nextBtn = $('#btn-next-month');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentFilter.month--;
      if (currentFilter.month < 0) {
        currentFilter.month = 11;
        currentFilter.year--;
      }
      refreshAll();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentFilter.month++;
      if (currentFilter.month > 11) {
        currentFilter.month = 0;
        currentFilter.year++;
      }
      refreshAll();
    });
  }
}

// ========================================
// Count-Up Animation
// ========================================
function animateCountUp() {
  $$('.card-value').forEach(el => {
    const target = parseInt(el.dataset.target || '0');
    const duration = 800;
    const start = performance.now();

    function update(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      el.textContent = formatRupiah(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = formatRupiah(target);
      }
    }

    requestAnimationFrame(update);
  });
}

// ========================================
// Refresh All
// ========================================
function refreshAll() {
  renderDashboard();
  renderTransactionList();
  renderCharts();
  animateCountUp();
}

// ========================================
// Event Listeners
// ========================================
function setupEventListeners() {
  // FAB — Add transaction
  const fabBtn = $('#btn-add');
  if (fabBtn) {
    fabBtn.addEventListener('click', () => openModal());
  }

  // Modal close
  const closeBtn = $('#modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Modal backdrop click
  const modal = $('#modal-transaction');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // Confirm dialog backdrop
  const confirmEl = $('#confirm-dialog');
  if (confirmEl) {
    confirmEl.addEventListener('click', (e) => {
      if (e.target === confirmEl) {
        confirmEl.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Form submit
  const form = $('#form-transaction');
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
  }

  // Type toggle in form
  const typeSelect = $('[name="type"]');
  if (typeSelect) {
    typeSelect.addEventListener('change', (e) => {
      updateCategoryOptions(e.target.value);
    });
  }

  // Filter buttons
  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter.type = btn.dataset.filter;
      renderTransactionList();
    });
  });

  // Search input
  const searchInput = $('#search-input');
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      currentFilter.search = e.target.value;
      renderTransactionList();
    }, 250));
  }

  // Transaction item clicks (edit & delete)
  const txList = $('#transaction-list');
  if (txList) {
    txList.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-tx-edit');
      const deleteBtn = e.target.closest('.btn-tx-delete');

      if (editBtn) {
        openModal(editBtn.dataset.id);
      } else if (deleteBtn) {
        handleDelete(deleteBtn.dataset.id);
      }
    });
  }

  // Export CSV
  const exportBtn = $('#btn-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const result = downloadCSV();
      if (result) {
        showToast('Data berhasil di-export ke CSV', 'success');
      } else {
        showToast('Tidak ada data untuk di-export', 'warning');
      }
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'n' && e.ctrlKey) {
      e.preventDefault();
      openModal();
    }
  });
}
