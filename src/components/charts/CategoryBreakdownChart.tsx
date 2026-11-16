import { useState } from 'react';
import { formatTHB } from '../../lib/format';
import type { CategorySlice } from '../../lib/analytics';
import type { TransactionType } from '../../types/finance';

interface CategoryBreakdownChartProps {
  expenseSlices: CategorySlice[];
  incomeSlices: CategorySlice[];
  activeType: TransactionType;
  onChangeType: (type: TransactionType) => void;
  selectedCategoryId?: string | null;
  onSelectCategory?: (categoryId: string | null) => void;
}

export function CategoryBreakdownChart({
  expenseSlices,
  incomeSlices,
  activeType,
  onChangeType,
  selectedCategoryId,
  onSelectCategory,
}: CategoryBreakdownChartProps) {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const slices = activeType === 'expense' ? expenseSlices : incomeSlices;
  const total = slices.reduce((sum, s) => sum + s.total, 0);

  const size = 196;
  const strokeWidth = 26;
  const center = size / 2;
  const radius = center - strokeWidth / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const activeSlice = slices.find((s) => s.categoryId === (hoveredCat ?? selectedCategoryId));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => onChangeType('expense')}
            className={`cursor-pointer whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeType === 'expense'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สัดส่วนรายจ่าย
          </button>
          <button
            type="button"
            onClick={() => onChangeType('income')}
            className={`cursor-pointer whitespace-nowrap shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeType === 'income'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            สัดส่วนรายรับ
          </button>
        </div>

        {selectedCategoryId && onSelectCategory && (
          <button
            type="button"
            onClick={() => onSelectCategory(null)}
            className="cursor-pointer whitespace-nowrap shrink-0 text-xs font-medium text-teal-700 hover:text-teal-900 hover:underline"
          >
            ล้างตัวกรองหมวดหมู่
          </button>
        )}
      </div>

      {slices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm font-medium text-slate-700">
            ยังไม่มีข้อมูล{activeType === 'expense' ? 'รายจ่าย' : 'รายรับ'}ในเดือนนี้
          </p>
          <p className="mt-1 text-xs text-slate-500">
            บันทึกรายการใหม่เพื่อดูสัดส่วนตามหมวดหมู่
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[210px_1fr]">
          {/* Donut Chart */}
          <div className="relative mx-auto flex items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#F1F5F9"
                strokeWidth={strokeWidth}
              />
              {slices.map((slice) => {
                const segLength = total > 0 ? (slice.total / total) * circumference : 0;
                const dashArray = `${Math.max(0, segLength - 2)} ${circumference}`;
                const dashOffset = -cumulativeOffset;
                cumulativeOffset += segLength;

                const isHighlighted =
                  hoveredCat === slice.categoryId || selectedCategoryId === slice.categoryId;

                return (
                  <circle
                    key={slice.categoryId}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={isHighlighted ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={dashArray}
                    strokeDashoffset={dashOffset}
                    className="cursor-pointer transition-all duration-150"
                    opacity={
                      hoveredCat && hoveredCat !== slice.categoryId
                        ? 0.45
                        : selectedCategoryId && selectedCategoryId !== slice.categoryId
                          ? 0.45
                          : 1
                    }
                    onMouseEnter={() => setHoveredCat(slice.categoryId)}
                    onMouseLeave={() => setHoveredCat(null)}
                    onClick={() =>
                      onSelectCategory?.(
                        selectedCategoryId === slice.categoryId ? null : slice.categoryId
                      )
                    }
                  />
                );
              })}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <span className="max-w-[120px] truncate text-[11px] font-medium text-slate-500">
                {activeSlice ? activeSlice.label : activeType === 'expense' ? 'รายจ่ายรวม' : 'รายรับรวม'}
              </span>
              <span className="mt-0.5 font-mono text-sm font-semibold text-slate-900 tabular-nums">
                {formatTHB(activeSlice ? activeSlice.total : total, { compact: total >= 1_000_000 })}
              </span>
              {activeSlice && (
                <span className="mt-0.5 font-mono text-[11px] text-slate-500 tabular-nums">
                  {activeSlice.percentage.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Ranked Category List */}
          <div className="space-y-2.5">
            {slices.map((slice) => {
              const isSelected = selectedCategoryId === slice.categoryId;
              return (
                <button
                  key={slice.categoryId}
                  type="button"
                  onMouseEnter={() => setHoveredCat(slice.categoryId)}
                  onMouseLeave={() => setHoveredCat(null)}
                  onClick={() =>
                    onSelectCategory?.(isSelected ? null : slice.categoryId)
                  }
                  className={`block w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-teal-600 bg-teal-50/60'
                      : 'border-slate-100 bg-slate-50/50 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2 font-medium text-slate-800">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-xs"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate">{slice.label}</span>
                      <span className="shrink-0 text-slate-400">· {slice.count} รายการ</span>
                    </span>
                    <span className="shrink-0 font-mono font-semibold text-slate-900 tabular-nums">
                      {formatTHB(slice.total)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/70">
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${Math.min(100, Math.max(2, slice.percentage))}%`,
                          backgroundColor: slice.color,
                        }}
                      />
                    </div>
                    <span className="w-11 text-right font-mono text-[11px] text-slate-500 tabular-nums">
                      {slice.percentage.toFixed(1)}%
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
