import { useState } from 'react';
import { formatTHB } from '../../lib/format';
import type { MonthlySeriesPoint } from '../../lib/analytics';

interface MonthlyComparisonChartProps {
  data: MonthlySeriesPoint[];
  selectedMonthKey: string;
  onSelectMonth: (monthKey: string) => void;
}

export function MonthlyComparisonChart({
  data,
  selectedMonthKey,
  onSelectMonth,
}: MonthlyComparisonChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 760;
  const height = 280;
  const padLeft = 64;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 42;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(
    1000,
    ...data.flatMap((d) => [d.income, d.expense, Math.abs(d.net)])
  );
  const niceMax = Math.ceil((maxVal * 1.15) / 1000) * 1000;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const groupWidth = innerW / Math.max(1, data.length);
  const barWidth = Math.min(26, Math.max(10, groupWidth * 0.26));
  const barGap = 4;

  const yPos = (val: number) => {
    const clamped = Math.max(0, val);
    return padTop + innerH - (clamped / niceMax) * innerH;
  };

  const netLinePoints = data
    .map((d, idx) => {
      const cx = padLeft + groupWidth * idx + groupWidth / 2;
      const cy = yPos(Math.max(0, d.net));
      return `${cx},${cy}`;
    })
    .join(' ');

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
            รายรับ
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-600" />
            รายจ่าย
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-teal-700" />
            คงเหลือสุทธิ (บวก)
          </span>
        </div>
        <span className="text-xs text-slate-500">
          คลิกแท่งเดือนเพื่อสลับดูสรุปรายเดือน
        </span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[520px] select-none"
          role="img"
          aria-label="กราฟเปรียบเทียบรายรับและรายจ่ายรายเดือน"
        >
          {/* Horizontal Grid Lines */}
          {ticks.map((t) => {
            const val = niceMax * t;
            const y = padTop + innerH - t * innerH;
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeDasharray={t === 0 ? undefined : '3 3'}
                />
                <text
                  x={padLeft - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 font-mono text-[11px] tabular-nums"
                >
                  {formatTHB(val, { compact: true })}
                </text>
              </g>
            );
          })}

          {/* Month Bars */}
          {data.map((d, idx) => {
            const groupX = padLeft + groupWidth * idx;
            const centerX = groupX + groupWidth / 2;
            const isSelected = d.monthKey === selectedMonthKey;
            const isHovered = hoveredIdx === idx;

            const incomeH = (d.income / niceMax) * innerH;
            const expenseH = (d.expense / niceMax) * innerH;
            const incomeX = centerX - barWidth - barGap / 2;
            const expenseX = centerX + barGap / 2;

            return (
              <g
                key={d.monthKey}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => onSelectMonth(d.monthKey)}
              >
                <rect
                  x={groupX + 2}
                  y={padTop}
                  width={Math.max(1, groupWidth - 4)}
                  height={innerH}
                  rx={6}
                  fill={isHovered || isSelected ? '#F1F5F9' : 'transparent'}
                  opacity={isHovered ? 0.9 : isSelected ? 0.55 : 0}
                />

                {/* Income Bar */}
                <rect
                  x={incomeX}
                  y={padTop + innerH - incomeH}
                  width={barWidth}
                  height={Math.max(d.income > 0 ? 2 : 0, incomeH)}
                  rx={3}
                  fill="#16A34A"
                  opacity={isHovered || isSelected ? 1 : 0.85}
                />

                {/* Expense Bar */}
                <rect
                  x={expenseX}
                  y={padTop + innerH - expenseH}
                  width={barWidth}
                  height={Math.max(d.expense > 0 ? 2 : 0, expenseH)}
                  rx={3}
                  fill="#DC2626"
                  opacity={isHovered || isSelected ? 1 : 0.85}
                />

                {/* X-Axis Label */}
                <text
                  x={centerX}
                  y={height - 14}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isSelected ? 'fill-teal-800 font-semibold' : 'fill-slate-500'
                  }`}
                >
                  {d.labelShort}
                </text>
              </g>
            );
          })}

          {/* Net Savings Line */}
          {data.length > 1 && (
            <polyline
              fill="none"
              stroke="#0F766E"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={netLinePoints}
              className="pointer-events-none"
            />
          )}

          {data.map((d, idx) => {
            const cx = padLeft + groupWidth * idx + groupWidth / 2;
            const cy = yPos(Math.max(0, d.net));
            const isActive = hoveredIdx === idx || d.monthKey === selectedMonthKey;
            return (
              <circle
                key={`pt-${d.monthKey}`}
                cx={cx}
                cy={cy}
                r={isActive ? 4.5 : 3}
                fill="#FFFFFF"
                stroke="#0F766E"
                strokeWidth={2}
                className="pointer-events-none"
              />
            );
          })}
        </svg>

        {activePoint && hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
            style={{
              left: `${Math.min(Math.max(((hoveredIdx + 0.5) / data.length) * 100, 14), 72)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="mb-1.5 font-semibold text-slate-900">
              {activePoint.labelFull}
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">รายรับ</span>
                <span className="font-mono font-medium text-emerald-700">
                  {formatTHB(activePoint.income)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">รายจ่าย</span>
                <span className="font-mono font-medium text-rose-700">
                  {formatTHB(activePoint.expense)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1">
                <span className="text-slate-600">สุทธิ</span>
                <span
                  className={`font-mono font-semibold ${
                    activePoint.net >= 0 ? 'text-teal-800' : 'text-rose-700'
                  }`}
                >
                  {formatTHB(activePoint.net, { showSign: true })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
