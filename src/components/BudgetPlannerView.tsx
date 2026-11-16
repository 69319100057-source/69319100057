import { SlidersHorizontal } from 'lucide-react';
import { formatMonthLabel, formatTHB, getCurrentMonthKey, getDaysInMonth } from '../lib/format';
import type { CategorySlice, MonthlySummary, PaymentChannelStat } from '../lib/analytics';

interface BudgetPlannerViewProps {
  monthKey: string;
  summary: MonthlySummary;
  expenseSlices: CategorySlice[];
  paymentChannels: PaymentChannelStat[];
  defaultMonthlyBudget: number;
  onOpenBudgetModal: () => void;
}

export function BudgetPlannerView({
  monthKey,
  summary,
  expenseSlices,
  paymentChannels,
  defaultMonthlyBudget,
  onOpenBudgetModal,
}: BudgetPlannerViewProps) {
  const daysInMonth = getDaysInMonth(monthKey);
  const currentMonthKey = getCurrentMonthKey();
  const todayDay = new Date().getDate();
  const remainingDays =
    monthKey === currentMonthKey
      ? Math.max(1, daysInMonth - todayDay + 1)
      : monthKey > currentMonthKey
        ? daysInMonth
        : 1;

  const hasBudget = summary.budgetLimit > 0;
  const pct = Math.min(100, summary.budgetUsedPct);
  const safeDailyBudget =
    hasBudget && summary.budgetRemaining > 0 ? summary.budgetRemaining / remainingDays : 0;

  const statusText = !hasBudget
    ? 'ยังไม่ได้ตั้งค่างบประมาณ'
    : summary.budgetUsedPct > 100
      ? 'เกินงบประมาณที่ตั้งไว้'
      : summary.budgetUsedPct >= 80
        ? 'ใกล้ถึงเพดานงบประมาณ'
        : 'อยู่ในเกณฑ์ปกติ';

  const statusColor = !hasBudget
    ? 'text-slate-600'
    : summary.budgetUsedPct > 100
      ? 'text-rose-700'
      : summary.budgetUsedPct >= 80
        ? 'text-amber-700'
        : 'text-emerald-700';

  const barColor =
    summary.budgetUsedPct > 100
      ? 'bg-rose-600'
      : summary.budgetUsedPct >= 80
        ? 'bg-amber-500'
        : 'bg-teal-700';

  return (
    <div className="space-y-6">
      {/* Main Budget Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <p className="text-xs font-medium text-slate-500">
              แผนควบคุมรายจ่ายประจำเดือน
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
              {formatMonthLabel(monthKey, 'full')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onOpenBudgetModal}
            className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap shrink-0 rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {hasBudget ? 'ปรับแก้เพดานงบประมาณ' : 'กำหนดงบประมาณเดือนนี้'}
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">งบประมาณรายจ่ายเดือนนี้</p>
            <p className="mt-1 font-mono text-xl font-semibold text-slate-900 tabular-nums">
              {hasBudget ? formatTHB(summary.budgetLimit) : 'ยังไม่กำหนด'}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              ค่าเริ่มต้นทุกเดือน: {defaultMonthlyBudget > 0 ? formatTHB(defaultMonthlyBudget) : 'ไม่ระบุ'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">ใช้ไปแล้ว</p>
            <p className="mt-1 font-mono text-xl font-semibold text-rose-700 tabular-nums">
              {formatTHB(summary.totalExpense)}
            </p>
            <p className={`mt-1 text-xs font-medium ${statusColor}`}>{statusText}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">งบคงเหลือ</p>
            <p
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                !hasBudget
                  ? 'text-slate-400'
                  : summary.budgetRemaining < 0
                    ? 'text-rose-700'
                    : 'text-emerald-700'
              }`}
            >
              {hasBudget ? formatTHB(summary.budgetRemaining, { showSign: true }) : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              เฉลี่ยใช้จ่ายจริง {formatTHB(summary.averageDailyExpense)} / วัน
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">ใช้งบได้เฉลี่ยต่อวัน (ที่เหลือ)</p>
            <p className="mt-1 font-mono text-xl font-semibold text-teal-800 tabular-nums">
              {hasBudget ? formatTHB(safeDailyBudget) : '—'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              คำนวณจาก {remainingDays} วันที่เหลือของเดือน
            </p>
          </div>
        </div>

        {hasBudget && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">สัดส่วนการใช้งบประมาณ</span>
              <span className="font-mono font-semibold text-slate-900 tabular-nums">
                {summary.budgetUsedPct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Breakdown by Category and Payment Method */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-slate-900">
            หมวดหมู่ที่ใช้จ่ายสูงสุดในเดือนนี้
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            เรียงตามยอดรายจ่ายรวมจากมากไปน้อย
          </p>

          {expenseSlices.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              ยังไม่มีรายการรายจ่ายในเดือนนี้
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {expenseSlices.map((item) => (
                <div key={item.categoryId} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">
                      {item.label} <span className="text-slate-400">· {item.count} ครั้ง</span>
                    </span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatTHB(item.total)}{' '}
                      <span className="text-slate-400">({item.percentage.toFixed(1)}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, item.percentage)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-display text-base font-semibold text-slate-900">
            ช่องทางการใช้จ่ายในเดือนนี้
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            สรุปยอดรายจ่ายแยกตามบัญชีหรือช่องทางชำระเงิน
          </p>

          {paymentChannels.length === 0 ? (
            <p className="py-10 text-center text-xs text-slate-500">
              ยังไม่มีรายการรายจ่ายในเดือนนี้
            </p>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {paymentChannels.map((ch) => (
                <div key={ch.methodId} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <p className="font-medium text-slate-800">{ch.label}</p>
                    <p className="mt-0.5 text-slate-400">{ch.count} รายการ</p>
                  </div>
                  <div className="text-right tabular-nums">
                    <p className="font-mono font-semibold text-slate-900">{formatTHB(ch.total)}</p>
                    <p className="mt-0.5 font-mono text-slate-400">{ch.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
