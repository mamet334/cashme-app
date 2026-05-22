// ========================================
// CashMe — Utility Functions
// ========================================

/**
 * Format angka ke format Rupiah Indonesia
 * @param {number} amount
 * @returns {string} contoh: "Rp 1.500.000"
 */
export function formatRupiah(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('id-ID');
  return `Rp ${formatted}`;
}

/**
 * Format tanggal ke format Indonesia
 * @param {string} dateStr — ISO date string (YYYY-MM-DD)
 * @returns {string} contoh: "22 Mei 2026"
 */
export function formatDate(dateStr) {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format tanggal singkat
 * @param {string} dateStr
 * @returns {string} contoh: "22 Mei"
 */
export function formatDateShort(dateStr) {
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const d = new Date(dateStr);
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

/**
 * Generate unique ID
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

/**
 * Get today's date as YYYY-MM-DD
 * @returns {string}
 */
export function getTodayISO() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get current month & year
 * @returns {{ month: number, year: number }}
 */
export function getCurrentMonthYear() {
  const d = new Date();
  return { month: d.getMonth(), year: d.getFullYear() };
}

/**
 * Nama bulan Indonesia
 */
export const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

/**
 * Kategori Pemasukan
 */
export const INCOME_CATEGORIES = [
  { id: 'gaji', label: 'Gaji', icon: '💰', color: '#10B981' },
  { id: 'bonus', label: 'Bonus', icon: '💸', color: '#06B6D4' },
  { id: 'investasi', label: 'Investasi', icon: '📈', color: '#8B5CF6' },
  { id: 'hadiah', label: 'Hadiah', icon: '🎁', color: '#F59E0B' },
  { id: 'penjualan', label: 'Penjualan', icon: '📦', color: '#EC4899' },
  { id: 'freelance', label: 'Freelance', icon: '💼', color: '#3B82F6' },
  { id: 'lainnya_masuk', label: 'Lainnya', icon: '🔄', color: '#6B7280' },
];

/**
 * Kategori Pengeluaran
 */
export const EXPENSE_CATEGORIES = [
  { id: 'makan', label: 'Makan & Minum', icon: '🍔', color: '#EF4444' },
  { id: 'transportasi', label: 'Transportasi', icon: '🚗', color: '#F97316' },
  { id: 'belanja', label: 'Belanja', icon: '🛒', color: '#EC4899' },
  { id: 'tagihan', label: 'Tagihan', icon: '💡', color: '#F59E0B' },
  { id: 'hiburan', label: 'Hiburan', icon: '🎮', color: '#8B5CF6' },
  { id: 'kesehatan', label: 'Kesehatan', icon: '🏥', color: '#10B981' },
  { id: 'pendidikan', label: 'Pendidikan', icon: '📚', color: '#3B82F6' },
  { id: 'lainnya_keluar', label: 'Lainnya', icon: '🔄', color: '#6B7280' },
];

/**
 * Get category object by ID
 * @param {string} categoryId
 * @returns {object|null}
 */
export function getCategoryById(categoryId) {
  return [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].find(c => c.id === categoryId) || null;
}

/**
 * Debounce function
 * @param {Function} fn
 * @param {number} delay
 * @returns {Function}
 */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
