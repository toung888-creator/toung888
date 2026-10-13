const STORAGE_KEY = 'expense-tracker-data';

const categoryIcons = {
  '飲食': '🍜',
  '交通': '🚌',
  '購物': '🛒',
  '娛樂': '🎮',
  '醫療': '💊',
  '教育': '📚',
  '住房': '🏠',
  '其他': '📦',
};

const categoryColors = {
  '飲食': '#3b82f6',
  '交通': '#60a5fa',
  '購物': '#2563eb',
  '娛樂': '#93c5fd',
  '醫療': '#1d4ed8',
  '教育': '#64748b',
  '住房': '#475569',
  '其他': '#94a3b8',
};

const form = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const emptyState = document.getElementById('emptyState');
const totalAmountEl = document.getElementById('totalAmount');
const expenseCountEl = document.getElementById('expenseCount');
const chartSection = document.getElementById('chartSection');
const pieChart = document.getElementById('pieChart');
const chartLegend = document.getElementById('chartLegend');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const toastOverlay = document.getElementById('toastOverlay');
const toastMessage = document.getElementById('toastMessage');
const toastCloseBtn = document.getElementById('toastCloseBtn');
const dateInput = document.getElementById('date');

let expenses = loadExpenses();

dateInput.value = todayString();

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const amount = parseFloat(document.getElementById('amount').value);
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const note = document.getElementById('note').value.trim();

  if (!amount || amount <= 0) return;

  const expense = {
    id: Date.now().toString(),
    amount,
    category,
    date,
    note,
  };

  expenses.unshift(expense);
  saveExpenses();
  render();
  form.reset();
  dateInput.value = todayString();
  document.getElementById('amount').focus();
});

expenseList.addEventListener('click', (e) => {
  const btn = e.target.closest('.btn-delete');
  if (!btn) return;

  const id = btn.dataset.id;
  expenses = expenses.filter((exp) => exp.id !== id);
  saveExpenses();
  render();
});

exportCsvBtn.addEventListener('click', exportCsv);

toastCloseBtn.addEventListener('click', hideToast);
toastOverlay.addEventListener('click', (e) => {
  if (e.target === toastOverlay) hideToast();
});

function loadExpenses() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveExpenses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}/${m}/${d}`;
}

function formatAmount(num) {
  return '$' + num.toLocaleString('zh-TW');
}

function escapeCsvField(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportCsv() {
  if (expenses.length === 0) return;

  const headers = ['日期', '類別', '金額', '備註'];
  const rows = expenses.map((exp) => [
    exp.date,
    exp.category,
    exp.amount,
    exp.note || '',
  ]);

  const csv =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map(escapeCsvField).join(','))
      .join('\r\n');

  const filename = `expenses-${todayString()}.csv`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);

  showExportToast(filename);
}

function showExportToast(filename) {
  toastMessage.textContent = `檔案「${filename}」已下載至您的電腦`;
  toastOverlay.classList.remove('hidden');
}

function hideToast() {
  toastOverlay.classList.add('hidden');
}

function getCategoryTotals() {
  const totals = {};
  expenses.forEach((exp) => {
    totals[exp.category] = (totals[exp.category] || 0) + exp.amount;
  });
  return Object.entries(totals)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(cx, cy, r, startAngle, endAngle) {
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

function renderChart(total) {
  const categories = getCategoryTotals();

  if (categories.length === 0) {
    chartSection.classList.add('hidden');
    return;
  }

  chartSection.classList.remove('hidden');

  const cx = 100;
  const cy = 100;
  const r = 90;
  let angle = 0;

  pieChart.innerHTML = categories
    .map(({ category, amount }) => {
      const sliceAngle = (amount / total) * 360;
      const path = describeSlice(cx, cy, r, angle, angle + sliceAngle);
      const color = categoryColors[category] || '#94a3b8';
      angle += sliceAngle;
      return `<path class="slice" d="${path}" fill="${color}" data-category="${category}"><title>${category}: ${formatAmount(amount)} (${((amount / total) * 100).toFixed(1)}%)</title></path>`;
    })
    .join('');

  chartLegend.innerHTML = categories
    .map(({ category, amount }) => {
      const percent = ((amount / total) * 100).toFixed(1);
      const color = categoryColors[category] || '#94a3b8';
      const icon = categoryIcons[category] || '📦';
      return `
        <li class="chart-legend-item">
          <span class="legend-color" style="background:${color}"></span>
          <span class="legend-label">${icon} ${category}</span>
          <span class="legend-value">${formatAmount(amount)}</span>
          <span class="legend-percent">${percent}%</span>
        </li>
      `;
    })
    .join('');
}

function render() {
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  totalAmountEl.textContent = formatAmount(total);
  expenseCountEl.textContent = `${expenses.length} 筆`;
  exportCsvBtn.disabled = expenses.length === 0;
  renderChart(total);

  expenseList.querySelectorAll('.expense-item').forEach((el) => el.remove());

  if (expenses.length === 0) {
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  expenses.forEach((exp) => {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.innerHTML = `
      <div class="expense-category-icon">${categoryIcons[exp.category] || '📦'}</div>
      <div class="expense-info">
        <div class="expense-info-top">
          <span class="expense-category">${exp.category}</span>
          <span class="expense-date">${formatDate(exp.date)}</span>
        </div>
        ${exp.note ? `<div class="expense-note">${escapeHtml(exp.note)}</div>` : ''}
      </div>
      <span class="expense-amount">${formatAmount(exp.amount)}</span>
      <button class="btn-delete" data-id="${exp.id}" title="刪除">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    `;
    expenseList.appendChild(item);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

render();
