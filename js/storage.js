// ========================================
// CashMe — Storage Module (localStorage)
// ========================================

import { generateId, getCurrentMonthYear } from './utils.js';

const STORAGE_KEY = 'cashme_transactions';

/**
 * Get all transactions from localStorage
 * @returns {Array}
 */
export function getTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error reading transactions:', e);
    return [];
  }
}

/**
 * Save transactions array to localStorage
 * @param {Array} transactions
 */
function saveTransactions(transactions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Error saving transactions:', e);
  }
}

/**
 * Add a new transaction
 * @param {object} data — { type, category, amount, description, date }
 * @returns {object} the new transaction with id & createdAt
 */
export function addTransaction(data) {
  const transactions = getTransactions();
  const newTx = {
    id: generateId(),
    type: data.type,           // 'income' | 'expense'
    category: data.category,   // category id
    amount: Math.abs(Number(data.amount)),
    description: data.description || '',
    date: data.date,           // YYYY-MM-DD
    createdAt: new Date().toISOString(),
  };
  transactions.unshift(newTx);
  saveTransactions(transactions);
  return newTx;
}

/**
 * Update an existing transaction
 * @param {string} id
 * @param {object} data — partial update
 * @returns {object|null}
 */
export function updateTransaction(id, data) {
  const transactions = getTransactions();
  const idx = transactions.findIndex(tx => tx.id === id);
  if (idx === -1) return null;

  transactions[idx] = {
    ...transactions[idx],
    ...data,
    amount: data.amount ? Math.abs(Number(data.amount)) : transactions[idx].amount,
    updatedAt: new Date().toISOString(),
  };
  saveTransactions(transactions);
  return transactions[idx];
}

/**
 * Delete a transaction by ID
 * @param {string} id
 * @returns {boolean}
 */
export function deleteTransaction(id) {
  const transactions = getTransactions();
  const filtered = transactions.filter(tx => tx.id !== id);
  if (filtered.length === transactions.length) return false;
  saveTransactions(filtered);
  return true;
}

/**
 * Get statistics for a given month/year
 * @param {number} month — 0-indexed
 * @param {number} year
 * @returns {{ income: number, expense: number, balance: number, transactions: Array }}
 */
export function getStats(month, year) {
  const transactions = getTransactions();
  const filtered = transactions.filter(tx => {
    const d = new Date(tx.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  let income = 0;
  let expense = 0;

  filtered.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });

  return {
    income,
    expense,
    balance: income - expense,
    transactions: filtered,
  };
}

/**
 * Get all-time balance
 * @returns {number}
 */
export function getTotalBalance() {
  const transactions = getTransactions();
  let balance = 0;
  transactions.forEach(tx => {
    if (tx.type === 'income') balance += tx.amount;
    else balance -= tx.amount;
  });
  return balance;
}

/**
 * Get expense breakdown by category for a given month/year
 * @param {number} month — 0-indexed
 * @param {number} year
 * @returns {object} { categoryId: totalAmount }
 */
export function getExpenseByCategory(month, year) {
  const transactions = getTransactions();
  const result = {};

  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;
    result[tx.category] = (result[tx.category] || 0) + tx.amount;
  });

  return result;
}

/**
 * Get income breakdown by category for a given month/year
 * @param {number} month — 0-indexed
 * @param {number} year
 * @returns {object}
 */
export function getIncomeByCategory(month, year) {
  const transactions = getTransactions();
  const result = {};

  transactions.forEach(tx => {
    if (tx.type !== 'income') return;
    const d = new Date(tx.date);
    if (d.getMonth() !== month || d.getFullYear() !== year) return;
    result[tx.category] = (result[tx.category] || 0) + tx.amount;
  });

  return result;
}

/**
 * Get monthly totals for the last N months
 * @param {number} n
 * @returns {Array<{ month, year, income, expense }>}
 */
export function getMonthlyTrend(n = 6) {
  const transactions = getTransactions();
  const result = [];
  const now = new Date();

  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();

    let income = 0;
    let expense = 0;

    transactions.forEach(tx => {
      const td = new Date(tx.date);
      if (td.getMonth() === month && td.getFullYear() === year) {
        if (tx.type === 'income') income += tx.amount;
        else expense += tx.amount;
      }
    });

    result.push({ month, year, income, expense });
  }

  return result;
}

/**
 * Export transactions to CSV string
 * @returns {string}
 */
export function exportToCSV() {
  const transactions = getTransactions();
  if (transactions.length === 0) return '';

  const headers = ['Tanggal', 'Tipe', 'Kategori', 'Jumlah', 'Keterangan'];
  const rows = transactions.map(tx => [
    tx.date,
    tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
    tx.category,
    tx.amount,
    `"${(tx.description || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV() {
  const csv = exportToCSV();
  if (!csv) return false;

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cashme_transaksi_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
