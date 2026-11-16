import { useState } from 'react';
import { formatDateThai, formatTHB } from '../../lib/format';
import type { DailySeriesPoint } from '../../lib/analytics';

interface DailyCashflowChartProps {
  data: DailySeriesPoint[];
}

export function DailyCashflowChart({ data }: DailyCashflowChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const width = 760;
  const height = 240;
  const padLeft = 64;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 36;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxDaily = Math.max(
    500,
    ...data.flatMap((d) => [d.income, d.expense, Math.abs(d.cumulativeNet)])
  );
  const niceMax = Math.ceil((maxDaily * 1.15) / 500) * 500;
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  const colW = innerW / Math.max(1, data.length);
  const barW = Math.max(3, Math.min(9, colW * 0.34));

  const yPos = (val: number) => {
    const clamped = Math.max(0, val);
    return padTop + innerH - (clamped / niceMax) * innerH;
  };

  const linePoints = data
    .map((d, idx) => {
      const cx = padLeft + colW * idx + colW / 2;
      const cy = yPos(Math.max(0, d.cumulativeNet));
      return `${cx},${cy}`;
    })
    .join(' ');

  const areaPoints =
    data.length > 0
      ? `${padLeft + colW / 2},${padTop + innerH} ${linePoints} ${
          padLeft + colW * (data.length - 1) + colW / 2
        },${padTop + innerH}`
      : '';

  const activePoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="relative w-full">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-5 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
            รายรับรายวัน
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-rose-600" />
            รายจ่ายรายวัน
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 bg-teal-700" />
            กระแสเงินสดสะสม
          </span>
        </div>
        <span className="text-xs text-slate-500">เลื่อนเมาส์เพื่อดูรายวัน</span>
      </div>

      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-auto w-full min-w-[520px] select-none"
          role="img"
          aria-label="กราฟกระแสเงินสดรายวันภายในเดือน"
        >
          <defs>
            <linearGradient id="cumAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F766E" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0F766E" stopOpacity="0.01" />
            </linearGradient>
          </defs>

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

          {areaPoints && (
            <polygon points={areaPoints} fill="url(#cumAreaGrad)" className="pointer-events-none" />
          )}

          {linePoints && (
            <polyline
              fill="none"
              stroke="#0F766E"
              strokeWidth={1.75}
              strokeLinejoin="round"
              points={linePoints}
              className="pointer-events-none"
            />
          )}

          {data.map((d, idx) => {
            const colX = padLeft + colW * idx;
            const centerX = colX + colW / 2;
            const isHovered = hoveredIdx === idx;
            const incH = (d.income / niceMax) * innerH;
            const expH = (d.expense / niceMax) * innerH;
            const showLabel = d.day === 1 || d.day % 5 === 0 || d.day === data.length;

            return (
              <g
                key={d.day}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <rect
                  x={colX}
                  y={padTop}
                  width={colW}
                  height={innerH}
                  fill={isHovered ? '#F1F5F9' : 'transparent'}
                  opacity={0.7}
                />

                {d.income > 0 && (
                  <rect
                    x={centerX - barW - 1}
                    y={padTop + innerH - incH}
                    width={barW}
                    height={Math.max(2, incH)}
                    rx={2}
                    fill="#16A34A"
                    opacity={isHovered ? 1 : 0.85}
                  />
                )}

                {d.expense > 0 && (
                  <rect
                    x={centerX + 1}
                    y={padTop + innerH - expH}
                    width={barW}
                    height={Math.max(2, expH)}
                    rx={2}
                    fill="#DC2626"
                    opacity={isHovered ? 1 : 0.85}
                  />
                )}

                {showLabel && (
                  <text
                    x={centerX}
                    y={height - 12}
                    textAnchor="middle"
                    className="fill-slate-400 font-mono text-[10px] tabular-nums"
                  >
                    {d.day}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {activePoint && hoveredIdx !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-sm"
            style={{
              left: `${Math.min(Math.max(((hoveredIdx + 0.5) / data.length) * 100, 16), 74)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="mb-1.5 font-semibold text-slate-900">
              {formatDateThai(activePoint.dateStr)}
            </div>
            <div className="space-y-1 tabular-nums">
              <div className="flex justify-between">
                <span className="text-slate-500">รายรับวันนี้</span>
                <span className="font-mono font-medium text-emerald-700">
                  {formatTHB(activePoint.income)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">รายจ่ายวันนี้</span>
                <span className="font-mono font-medium text-rose-700">
                  {formatTHB(activePoint.expense)}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-1">
                <span className="text-slate-600">สะสมถึงวันนี้</span>
                <span
                  className={`font-mono font-semibold ${
                    activePoint.cumulativeNet >= 0 ? 'text-teal-800' : 'text-rose-700'
                  }`}
                >
                  {formatTHB(activePoint.cumulativeNet, { showSign: true })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
