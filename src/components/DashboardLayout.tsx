import {
  AlertCircle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Menu,
  Plus,
  SlidersHorizontal,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  computeCategoryBreakdown,
  computeDailyCashflowSeries,
  computeMonthlySummary,
  computeMultiMonthSeries,
  computePaymentMethodBreakdown,
  resolveMonthBudgetLimit,
} from '../lib/analytics';
import { FIREBASE_PROJECT_ID } from '../lib/firebase';
import {
  formatMonthLabel,
  formatTHB,
  getCurrentMonthKey,
  shiftMonthKey,
} from '../lib/format';
import {
  createTransaction,
  deleteTransaction,
  subscribeToBudgets,
  subscribeToTransactions,
  updateDefaultMonthlyBudget,
  updateTransaction,
  upsertMonthlyBudget,
} from '../services/financeService';
import type {
  MonthlyBudget,
  Transaction,
  TransactionInput,
  TransactionType,
} from '../types/finance';
import { BudgetModal } from './BudgetModal';
import { BudgetPlannerView } from './BudgetPlannerView';
import { TransactionModal } from './TransactionModal';
import { TransactionTable } from './TransactionTable';
import { CategoryBreakdownChart } from './charts/CategoryBreakdownChart';
import { DailyCashflowChart } from './charts/DailyCashflowChart';
import { MonthlyComparisonChart } from './charts/MonthlyComparisonChart';

type NavTab = 'overview' | 'ledger' | 'analytics' | 'budget';

export function DashboardLayout() {
  const { user, profile, signOutUser } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(getCurrentMonthKey());
  const [chartMonthsCount, setChartMonthsCount] = useState<6 | 12>(6);
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [ledgerScope, setLedgerScope] = useState<'month' | 'all'>('month');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [txModalOpen, setTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    setDataError(null);

    const unsubTx = subscribeToTransactions(
      user.uid,
      (list) => {
        setTransactions(list);
        setLoadingData(false);
      },
      (err) => {
        setDataError(err.message);
        setLoadingData(false);
      }
    );

    const unsubBudgets = subscribeToBudgets(
      user.uid,
      (list) => {
        setBudgets(list);
      },
      (err) => {
        setDataError(err.message);
      }
    );

    return () => {
      unsubTx();
      unsubBudgets();
    };
  }, [user]);

  const defaultMonthlyBudget = profile?.defaultMonthlyBudget ?? 0;

  const activeBudgetLimit = useMemo(
    () => resolveMonthBudgetLimit(selectedMonthKey, budgets, defaultMonthlyBudget),
    [selectedMonthKey, budgets, defaultMonthlyBudget]
  );

  const summary = useMemo(
    () => computeMonthlySummary(transactions, selectedMonthKey, activeBudgetLimit),
    [transactions, selectedMonthKey, activeBudgetLimit]
  );

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.monthKey === selectedMonthKey),
    [transactions, selectedMonthKey]
  );

  const multiMonthSeries = useMemo(
    () => computeMultiMonthSeries(transactions, selectedMonthKey, chartMonthsCount),
    [transactions, selectedMonthKey, chartMonthsCount]
  );

  const dailySeries = useMemo(
    () => computeDailyCashflowSeries(transactions, selectedMonthKey),
    [transactions, selectedMonthKey]
  );

  const expenseSlices = useMemo(
    () => computeCategoryBreakdown(transactions, selectedMonthKey, 'expense'),
    [transactions, selectedMonthKey]
  );

  const incomeSlices = useMemo(
    () => computeCategoryBreakdown(transactions, selectedMonthKey, 'income'),
    [transactions, selectedMonthKey]
  );

  const paymentChannels = useMemo(
    () => computePaymentMethodBreakdown(transactions, selectedMonthKey, 'expense'),
    [transactions, selectedMonthKey]
  );

  const handleSaveTransaction = async (input: TransactionInput, editingId?: string) => {
    if (!user) return;
    if (editingId) {
      await updateTransaction(user.uid, editingId, input);
    } else {
      await createTransaction(user.uid, input);
    }
    setSelectedMonthKey(input.date.slice(0, 7));
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!user) return;
    await deleteTransaction(user.uid, txId);
  };

  const handleSaveMonthBudget = async (monthKey: string, amount: number) => {
    if (!user) return;
    await upsertMonthlyBudget(user.uid, monthKey, amount);
  };

  const handleSaveDefaultBudget = async (amount: number) => {
    if (!user) return;
    await updateDefaultMonthlyBudget(user.uid, amount);
  };

  const openCreateModal = () => {
    setEditingTx(null);
    setTxModalOpen(true);
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTx(tx);
    setTxModalOpen(true);
  };

  const navItems: { id: NavTab; label: string; icon: typeof LayoutDashboard }[] = [
    { id: 'overview', label: 'ภาพรวมรายเดือน', icon: LayoutDashboard },
    { id: 'ledger', label: 'รายการทั้งหมด', icon: ListOrdered },
    { id: 'analytics', label: 'วิเคราะห์เชิงลึก', icon: BarChart3 },
    { id: 'budget', label: 'ตั้งค่างบประมาณ', icon: Wallet },
  ];

  const currentTabLabel = navItems.find((n) => n.id === activeTab)?.label ?? 'ภาพรวมรายเดือน';

  const formatDeltaText = (delta: number | null, prevAmount: number) => {
    if (delta === null) {
      return prevAmount === 0 ? 'ยังไม่มีข้อมูลเดือนก่อนหน้า' : 'เทียบเดือนก่อนหน้า';
    }
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}% เทียบเดือนก่อนหน้า`;
  };

  const userDisplayName = profile?.displayName || user?.displayName || user?.email?.split('@')[0] || 'ผู้ใช้งาน';
  const userEmail = profile?.email || user?.email || '';
  const userPhoto = profile?.photoURL || user?.photoURL || '';
  const userInitial = userDisplayName.slice(0, 1).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:grid lg:grid-cols-[260px_1fr]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col justify-between border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <span className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">
              KlangLedger
            </span>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="ปิดเมนู"
              className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 p-4" aria-label="เมนูหลัก">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-3 whitespace-nowrap rounded-lg px-3.5 py-2.5 text-left text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3">
            {userPhoto ? (
              <img
                src={userPhoto}
                alt={userDisplayName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-semibold text-white">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-900">{userDisplayName}</p>
              <p className="truncate text-[11px] text-slate-500">{userEmail}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="font-mono text-[11px] text-slate-400">
              {FIREBASE_PROJECT_ID}
            </span>
            <button
              type="button"
              onClick={signOutUser}
              className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-rose-700"
            >
              <LogOut className="h-3.5 w-3.5" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-col">
        {/* Top Bar Contract: Breadcrumb — Month Navigation — Primary Action */}
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 py-3.5 backdrop-blur-xs sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="เปิดเมนู"
              className="cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="hidden font-medium text-slate-400 sm:inline">KlangLedger</span>
              <span className="hidden text-slate-300 sm:inline">/</span>
              <h1 className="font-display font-semibold text-slate-900 whitespace-nowrap">
                {currentTabLabel}
              </h1>
            </div>
          </div>

          {/* Month Switcher */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMonthKey((m) => shiftMonthKey(m, -1))}
              aria-label="เดือนก่อนหน้า"
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <input
              type="month"
              aria-label="เลือกเดือน"
              value={selectedMonthKey}
              onChange={(e) => {
                if (e.target.value) setSelectedMonthKey(e.target.value);
              }}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-teal-700 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setSelectedMonthKey((m) => shiftMonthKey(m, 1))}
              aria-label="เดือนถัดไป"
              className="cursor-pointer rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {selectedMonthKey !== getCurrentMonthKey() && (
              <button
                type="button"
                onClick={() => setSelectedMonthKey(getCurrentMonthKey())}
                className="hidden cursor-pointer whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 sm:inline-block"
              >
                เดือนปัจจุบัน
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
          >
            <Plus className="h-4 w-4" />
            บันทึกรายการ
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 space-y-6 p-4 sm:p-6">
          {dataError && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <div>
                <p className="font-semibold">พบปัญหาในการเชื่อมต่อฐานข้อมูล Firestore</p>
                <p className="mt-1 break-all text-rose-700">{dataError}</p>
              </div>
            </div>
          )}

          {/* 4-Column Monthly Summary KPI Strip */}
          <section aria-label="สรุปตัวเลขประจำเดือน">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-semibold text-slate-900">
                สรุปประจำเดือน {formatMonthLabel(selectedMonthKey, 'full')}
              </h2>
              <span className="text-xs text-slate-500">
                ทั้งหมด {summary.transactionCount} รายการ · รายรับ {summary.incomeCount} · รายจ่าย{' '}
                {summary.expenseCount}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* KPI 1: Total Income */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">รายรับรวมประจำเดือน</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-emerald-700 tabular-nums">
                  {formatTHB(summary.totalIncome, { showSign: summary.totalIncome > 0 })}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDeltaText(summary.incomeDeltaPct, summary.prevMonthIncome)}
                </p>
              </div>

              {/* KPI 2: Total Expense */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">รายจ่ายรวมประจำเดือน</p>
                <p className="mt-2 font-mono text-2xl font-semibold text-rose-700 tabular-nums">
                  {formatTHB(summary.totalExpense > 0 ? -summary.totalExpense : 0, {
                    showSign: summary.totalExpense > 0,
                  })}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDeltaText(summary.expenseDeltaPct, summary.prevMonthExpense)}
                </p>
              </div>

              {/* KPI 3: Net Balance */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-medium text-slate-500">ยอดคงเหลือสุทธิ</p>
                <p
                  className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                    summary.netBalance > 0
                      ? 'text-teal-800'
                      : summary.netBalance < 0
                        ? 'text-rose-700'
                        : 'text-slate-900'
                  }`}
                >
                  {formatTHB(summary.netBalance, { showSign: summary.netBalance !== 0 })}
                </p>
                <p className="mt-2 font-mono text-xs text-slate-500 tabular-nums">
                  อัตราการออม {summary.totalIncome > 0 ? `${summary.savingsRate.toFixed(1)}%` : '—'}
                </p>
              </div>

              {/* KPI 4: Budget Status */}
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-slate-500">งบประมาณรายจ่าย</p>
                  <button
                    type="button"
                    onClick={() => setBudgetModalOpen(true)}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-teal-700 hover:underline"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    ตั้งค่า
                  </button>
                </div>

                {summary.budgetLimit > 0 ? (
                  <>
                    <p
                      className={`mt-2 font-mono text-2xl font-semibold tabular-nums ${
                        summary.budgetRemaining < 0 ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatTHB(summary.budgetRemaining)}
                    </p>
                    <div className="mt-2.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full ${
                            summary.budgetUsedPct > 100
                              ? 'bg-rose-600'
                              : summary.budgetUsedPct >= 80
                                ? 'bg-amber-500'
                                : 'bg-teal-700'
                          }`}
                          style={{ width: `${Math.min(100, summary.budgetUsedPct)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-slate-500 tabular-nums">
                        {summary.budgetUsedPct.toFixed(0)}%
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 font-mono text-xl font-semibold text-slate-400">
                      ยังไม่กำหนด
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      เฉลี่ย {formatTHB(summary.averageDailyExpense)} / วัน
                    </p>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
                {/* 6-Month Comparison Chart */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-7">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-display text-base font-semibold text-slate-900">
                        กราฟเปรียบเทียบรายรับ-รายจ่ายรายเดือน
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        ภาพรวม {chartMonthsCount} เดือนล่าสุดถึง {formatMonthLabel(selectedMonthKey, 'short')}
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setChartMonthsCount(6)}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium ${
                          chartMonthsCount === 6
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        6 เดือน
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMonthsCount(12)}
                        className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium ${
                          chartMonthsCount === 12
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        12 เดือน
                      </button>
                    </div>
                  </div>
                  <MonthlyComparisonChart
                    data={multiMonthSeries}
                    selectedMonthKey={selectedMonthKey}
                    onSelectMonth={(mk) => setSelectedMonthKey(mk)}
                  />
                </section>

                {/* Category Donut */}
                <section className="rounded-xl border border-slate-200 bg-white p-6 xl:col-span-5">
                  <div className="mb-4">
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      สัดส่วนตามหมวดหมู่
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      คลิกหมวดหมู่เพื่อกรองรายการด้านล่าง
                    </p>
                  </div>
                  <CategoryBreakdownChart
                    expenseSlices={expenseSlices}
                    incomeSlices={incomeSlices}
                    activeType={breakdownType}
                    onChangeType={setBreakdownType}
                    selectedCategoryId={selectedCategoryFilter}
                    onSelectCategory={setSelectedCategoryFilter}
                  />
                </section>
              </div>

              {/* Recent Transactions in Selected Month */}
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      รายการล่าสุดประจำเดือน {formatMonthLabel(selectedMonthKey, 'full')}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      แสดงรายการล่าสุดเรียงตามวันที่
                    </p>
                  </div>
                </div>

                <TransactionTable
                  transactions={monthTransactions}
                  monthKey={selectedMonthKey}
                  loading={loadingData}
                  externalCategoryFilter={selectedCategoryFilter}
                  onClearExternalCategory={() => setSelectedCategoryFilter(null)}
                  onAddNew={openCreateModal}
                  onEdit={openEditModal}
                  onDelete={handleDeleteTransaction}
                  compact
                  onViewAll={() => {
                    setLedgerScope('month');
                    setActiveTab('ledger');
                  }}
                />
              </section>
            </>
          )}

          {/* LEDGER TAB */}
          {activeTab === 'ledger' && (
            <section className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    {ledgerScope === 'month'
                      ? `สมุดรายการเดือน ${formatMonthLabel(selectedMonthKey, 'full')}`
                      : 'สมุดรายการทั้งหมดทุกเดือน'}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ค้นหา กรองข้อมูล แก้ไข ลบ และส่งออกไฟล์ CSV
                  </p>
                </div>

                <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setLedgerScope('month')}
                    className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                      ledgerScope === 'month'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    เฉพาะเดือนที่เลือก ({monthTransactions.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setLedgerScope('all')}
                    className={`cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium ${
                      ledgerScope === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ทุกเดือน ({transactions.length})
                  </button>
                </div>
              </div>

              <TransactionTable
                transactions={ledgerScope === 'month' ? monthTransactions : transactions}
                monthKey={ledgerScope === 'month' ? selectedMonthKey : 'all-months'}
                loading={loadingData}
                externalCategoryFilter={selectedCategoryFilter}
                onClearExternalCategory={() => setSelectedCategoryFilter(null)}
                onAddNew={openCreateModal}
                onEdit={openEditModal}
                onDelete={handleDeleteTransaction}
              />
            </section>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-display text-base font-semibold text-slate-900">
                      แนวโน้มรายรับ-รายจ่ายรายเดือน ({chartMonthsCount} เดือน)
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      วิเคราะห์ความสม่ำเสมอของรายได้และพฤติกรรมการใช้จ่ายข้ามเดือน
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setChartMonthsCount(6)}
                      className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium ${
                        chartMonthsCount === 6
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      6 เดือน
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartMonthsCount(12)}
                      className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium ${
                        chartMonthsCount === 12
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      12 เดือน
                    </button>
                  </div>
                </div>
                <MonthlyComparisonChart
                  data={multiMonthSeries}
                  selectedMonthKey={selectedMonthKey}
                  onSelectMonth={(mk) => setSelectedMonthKey(mk)}
                />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    กระแสเงินสดรายวัน — {formatMonthLabel(selectedMonthKey, 'full')}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    ติดตามยอดรายรับ-รายจ่ายรายวันและยอดเงินคงเหลือสะสมตลอดทั้งเดือน
                  </p>
                </div>
                <DailyCashflowChart data={dailySeries} />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4">
                  <h3 className="font-display text-base font-semibold text-slate-900">
                    วิเคราะห์โครงสร้างหมวดหมู่ — {formatMonthLabel(selectedMonthKey, 'full')}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    เปรียบเทียบสัดส่วนแต่ละหมวดหมู่ทั้งฝั่งรายจ่ายและรายรับ
                  </p>
                </div>
                <CategoryBreakdownChart
                  expenseSlices={expenseSlices}
                  incomeSlices={incomeSlices}
                  activeType={breakdownType}
                  onChangeType={setBreakdownType}
                  selectedCategoryId={selectedCategoryFilter}
                  onSelectCategory={(cat) => {
                    setSelectedCategoryFilter(cat);
                    if (cat) {
                      setLedgerScope('month');
                      setActiveTab('ledger');
                    }
                  }}
                />
              </section>
            </div>
          )}

          {/* BUDGET TAB */}
          {activeTab === 'budget' && (
            <BudgetPlannerView
              monthKey={selectedMonthKey}
              summary={summary}
              expenseSlices={expenseSlices}
              paymentChannels={paymentChannels}
              defaultMonthlyBudget={defaultMonthlyBudget}
              onOpenBudgetModal={() => setBudgetModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <TransactionModal
        open={txModalOpen}
        editingTransaction={editingTx}
        defaultMonthKey={selectedMonthKey}
        onClose={() => {
          setTxModalOpen(false);
          setEditingTx(null);
        }}
        onSubmit={handleSaveTransaction}
      />

      <BudgetModal
        open={budgetModalOpen}
        monthKey={selectedMonthKey}
        currentMonthLimit={activeBudgetLimit}
        defaultMonthlyBudget={defaultMonthlyBudget}
        onClose={() => setBudgetModalOpen(false)}
        onSaveMonthBudget={handleSaveMonthBudget}
        onSaveDefaultBudget={handleSaveDefaultBudget}
      />
    </div>
  );
}
