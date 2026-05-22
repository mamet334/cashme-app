// ========================================
// CashMe — Chart Module (Chart.js wrapper)
// ========================================

import { getCategoryById, MONTH_NAMES } from './utils.js';

let donutChart = null;
let barChart = null;

/**
 * Render Donut Chart — Distribusi pengeluaran per kategori
 * @param {object} expenseByCategory — { categoryId: amount }
 */
export function renderDonutChart(expenseByCategory) {
  const canvas = document.getElementById('chart-donut');
  if (!canvas) return;

  const entries = Object.entries(expenseByCategory);
  
  if (entries.length === 0) {
    if (donutChart) { donutChart.destroy(); donutChart = null; }
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.closest('.chart-card').querySelector('.chart-empty')?.classList.remove('hidden');
    return;
  }

  canvas.closest('.chart-card').querySelector('.chart-empty')?.classList.add('hidden');

  const labels = [];
  const data = [];
  const colors = [];

  entries
    .sort((a, b) => b[1] - a[1])
    .forEach(([catId, amount]) => {
      const cat = getCategoryById(catId);
      labels.push(cat ? `${cat.icon} ${cat.label}` : catId);
      data.push(amount);
      colors.push(cat ? cat.color : '#6B7280');
    });

  if (donutChart) {
    donutChart.data.labels = labels;
    donutChart.data.datasets[0].data = data;
    donutChart.data.datasets[0].backgroundColor = colors;
    donutChart.update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  donutChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((context.parsed / total) * 100).toFixed(1);
              return ` Rp ${context.parsed.toLocaleString('id-ID')} (${pct}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Render Bar Chart — Trend pemasukan vs pengeluaran per bulan
 * @param {Array<{ month, year, income, expense }>} trendData
 */
export function renderBarChart(trendData) {
  const canvas = document.getElementById('chart-bar');
  if (!canvas) return;

  const labels = trendData.map(d => MONTH_NAMES[d.month].substring(0, 3));
  const incomeData = trendData.map(d => d.income);
  const expenseData = trendData.map(d => d.expense);

  if (barChart) {
    barChart.data.labels = labels;
    barChart.data.datasets[0].data = incomeData;
    barChart.data.datasets[1].data = expenseData;
    barChart.update('none');
    return;
  }

  const ctx = canvas.getContext('2d');
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Pemasukan',
          data: incomeData,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Pengeluaran',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.7)',
          borderColor: '#EF4444',
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            font: { family: 'Inter', size: 12 }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.1)',
          },
          ticks: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
            font: { family: 'Inter', size: 11 },
            callback: function(value) {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`;
              return value;
            }
          }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            padding: 16,
            usePointStyle: true,
            pointStyleWidth: 10,
            font: { family: 'Inter', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return ` ${context.dataset.label}: Rp ${context.parsed.y.toLocaleString('id-ID')}`;
            }
          }
        }
      }
    }
  });
}

/**
 * Destroy all charts (for cleanup)
 */
export function destroyCharts() {
  if (donutChart) { donutChart.destroy(); donutChart = null; }
  if (barChart) { barChart.destroy(); barChart = null; }
}
