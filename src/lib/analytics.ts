import {
  formatMonthLabel,
  getDaysInMonth,
  getLastNMonthKeys,
  shiftMonthKey,
} from './format';
import {
  getCategoryMeta,
  getPaymentMethodLabel,
  type MonthlyBudget,
  type PaymentMethod,
  type Transaction,
  type TransactionType,
} from '../types/finance';

export interface MonthlySummary {
  monthKey: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  savingsRate: number;
  transactionCount: number;
  incomeCount: number;
  expenseCount: number;
  averageDailyExpense: number;
  prevMonthIncome: number;
  prevMonthExpense: number;
  incomeDeltaPct: number | null;
  expenseDeltaPct: number | null;
  budgetLimit: number;
  budgetRemaining: number;
  budgetUsedPct: number;
}

export interface MonthlySeriesPoint {
  monthKey: string;
  labelShort: string;
  labelFull: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

export interface DailySeriesPoint {
  day: number;
  dateStr: string;
  income: number;
  expense: number;
  net: number;
  cumulativeNet: number;
}

export interface CategorySlice {
  categoryId: string;
  label: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
}

export interface PaymentChannelStat {
  methodId: PaymentMethod;
  label: string;
  total: number;
  count: number;
  percentage: number;
}

export function resolveMonthBudgetLimit(
  monthKey: string,
  budgets: MonthlyBudget[],
  defaultMonthlyBudget: number
): number {
  const specific = budgets.find((b) => b.monthKey === monthKey);
  if (specific) return specific.limitAmount;
  return defaultMonthlyBudget > 0 ? defaultMonthlyBudget : 0;
}

export function computeMonthlySummary(
  transactions: Transaction[],
  monthKey: string,
  budgetLimit: number
): MonthlySummary {
  const monthTxs = transactions.filter((t) => t.monthKey === monthKey);
  const prevKey = shiftMonthKey(monthKey, -1);
  const prevTxs = transactions.filter((t) => t.monthKey === prevKey);

  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const tx of monthTxs) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
      incomeCount += 1;
    } else {
      totalExpense += tx.amount;
      expenseCount += 1;
    }
  }

  let prevMonthIncome = 0;
  let prevMonthExpense = 0;
  for (const tx of prevTxs) {
    if (tx.type === 'income') prevMonthIncome += tx.amount;
    else prevMonthExpense += tx.amount;
  }

  const netBalance = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
  const days = getDaysInMonth(monthKey);
  const averageDailyExpense = days > 0 ? totalExpense / days : 0;

  const incomeDeltaPct =
    prevMonthIncome > 0 ? ((totalIncome - prevMonthIncome) / prevMonthIncome) * 100 : null;
  const expenseDeltaPct =
    prevMonthExpense > 0 ? ((totalExpense - prevMonthExpense) / prevMonthExpense) * 100 : null;

  const budgetRemaining = budgetLimit > 0 ? budgetLimit - totalExpense : 0;
  const budgetUsedPct = budgetLimit > 0 ? (totalExpense / budgetLimit) * 100 : 0;

  return {
    monthKey,
    totalIncome,
    totalExpense,
    netBalance,
    savingsRate,
    transactionCount: monthTxs.length,
    incomeCount,
    expenseCount,
    averageDailyExpense,
    prevMonthIncome,
    prevMonthExpense,
    incomeDeltaPct,
    expenseDeltaPct,
    budgetLimit,
    budgetRemaining,
    budgetUsedPct,
  };
}

export function computeMultiMonthSeries(
  transactions: Transaction[],
  anchorMonthKey: string,
  monthCount = 6
): MonthlySeriesPoint[] {
  const keys = getLastNMonthKeys(anchorMonthKey, monthCount);
  const map = new Map<string, { income: number; expense: number; count: number }>();
  for (const k of keys) {
    map.set(k, { income: 0, expense: 0, count: 0 });
  }

  for (const tx of transactions) {
    const bucket = map.get(tx.monthKey);
    if (!bucket) continue;
    if (tx.type === 'income') bucket.income += tx.amount;
    else bucket.expense += tx.amount;
    bucket.count += 1;
  }

  return keys.map((k) => {
    const bucket = map.get(k)!;
    return {
      monthKey: k,
      labelShort: formatMonthLabel(k, 'short'),
      labelFull: formatMonthLabel(k, 'full'),
      income: bucket.income,
      expense: bucket.expense,
      net: bucket.income - bucket.expense,
      count: bucket.count,
    };
  });
}

export function computeDailyCashflowSeries(
  transactions: Transaction[],
  monthKey: string
): DailySeriesPoint[] {
  const days = getDaysInMonth(monthKey);
  const byDay = Array.from({ length: days }, (_, idx) => ({
    day: idx + 1,
    dateStr: `${monthKey}-${String(idx + 1).padStart(2, '0')}`,
    income: 0,
    expense: 0,
  }));

  for (const tx of transactions) {
    if (tx.monthKey !== monthKey) continue;
    const dayNum = Number(tx.date.slice(8, 10));
    if (dayNum >= 1 && dayNum <= days) {
      if (tx.type === 'income') byDay[dayNum - 1].income += tx.amount;
      else byDay[dayNum - 1].expense += tx.amount;
    }
  }

  let running = 0;
  return byDay.map((d) => {
    const net = d.income - d.expense;
    running += net;
    return {
      ...d,
      net,
      cumulativeNet: running,
    };
  });
}

export function computeCategoryBreakdown(
  transactions: Transaction[],
  monthKey: string,
  type: TransactionType
): CategorySlice[] {
  const filtered = transactions.filter((t) => t.monthKey === monthKey && t.type === type);
  const totals = new Map<string, { total: number; count: number }>();

  let grandTotal = 0;
  for (const tx of filtered) {
    grandTotal += tx.amount;
    const prev = totals.get(tx.category) ?? { total: 0, count: 0 };
    prev.total += tx.amount;
    prev.count += 1;
    totals.set(tx.category, prev);
  }

  const slices: CategorySlice[] = [];
  for (const [categoryId, stats] of totals.entries()) {
    const meta = getCategoryMeta(categoryId);
    slices.push({
      categoryId,
      label: meta.label,
      color: meta.color,
      total: stats.total,
      count: stats.count,
      percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
    });
  }

  slices.sort((a, b) => b.total - a.total);
  return slices;
}

export function computePaymentMethodBreakdown(
  transactions: Transaction[],
  monthKey: string,
  type: TransactionType
): PaymentChannelStat[] {
  const filtered = transactions.filter((t) => t.monthKey === monthKey && t.type === type);
  const totals = new Map<PaymentMethod, { total: number; count: number }>();

  let grandTotal = 0;
  for (const tx of filtered) {
    grandTotal += tx.amount;
    const prev = totals.get(tx.paymentMethod) ?? { total: 0, count: 0 };
    prev.total += tx.amount;
    prev.count += 1;
    totals.set(tx.paymentMethod, prev);
  }

  const list: PaymentChannelStat[] = [];
  for (const [methodId, stats] of totals.entries()) {
    list.push({
      methodId,
      label: getPaymentMethodLabel(methodId),
      total: stats.total,
      count: stats.count,
      percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0,
    });
  }

  list.sort((a, b) => b.total - a.total);
  return list;
}

export function exportTransactionsToCsv(transactions: Transaction[], filename: string): void {
  const headers = ['วันที่', 'เดือน', 'ประเภท', 'ชื่อรายการ', 'หมวดหมู่', 'ช่องทางชำระเงิน', 'จำนวนเงิน (บาท)', 'หมายเหตุ'];
  const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

  const rows = transactions.map((tx) => [
    tx.date,
    tx.monthKey,
    tx.type === 'income' ? 'รายรับ' : 'รายจ่าย',
    tx.title,
    getCategoryMeta(tx.category).label,
    getPaymentMethodLabel(tx.paymentMethod),
    tx.amount.toFixed(2),
    tx.note,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map((cell) => escapeCell(String(cell))).join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
