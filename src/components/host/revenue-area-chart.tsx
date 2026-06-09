'use client';

import { useEffect, useRef, useState } from 'react';

import { formatVNDShort } from '@/lib/format';

interface DataPoint {
  label: string;
  value: number;
  fullDate?: string;
}

interface RevenueChartProps {
  data: DataPoint[];
  height?: number;
}

const PERIOD_OPTIONS = [
  { key: '7d', label: '7 ngày' },
  { key: '14d', label: '14 ngày' },
  { key: '30d', label: '30 ngày' },
] as const;

type PeriodKey = (typeof PERIOD_OPTIONS)[number]['key'];

function sliceByPeriod(data: DataPoint[], period: PeriodKey): DataPoint[] {
  const n = period === '7d' ? 7 : period === '14d' ? 14 : 30;
  return data.slice(-n);
}

function sumValues(points: DataPoint[]): number {
  return points.reduce((s, d) => s + d.value, 0);
}

export function RevenueAreaChart({ data, height = 280 }: RevenueChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [period, setPeriod] = useState<PeriodKey>('14d');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setWidth(Math.round(w));
    });
    ro.observe(el);
    setWidth(el.clientWidth || 600);
    return () => ro.disconnect();
  }, []);

  const visible = sliceByPeriod(data, period);
  const total = sumValues(visible);

  if (data.length === 0) {
    return (
      <div ref={containerRef} className="space-y-4">
        <PeriodTabs active={period} onChange={setPeriod} />
        <div
          className="grid place-items-center text-sm text-ink-500 rounded-xl bg-cream-50 border border-dashed border-ink-200"
          style={{ height: height - 48 }}
        >
          Chưa có dữ liệu doanh thu
        </div>
      </div>
    );
  }

  const max = Math.max(...visible.map((d) => d.value), 1);
  const padTop = 36;
  const padBottom = 34;
  const padLeft = 50;
  const padRight = 16;
  const chartH = height - padTop - padBottom;
  const chartW = width - padLeft - padRight;
  const barGap = Math.max(2, Math.round(chartW * 0.008));
  const barW = Math.max(
    10,
    (chartW - barGap * (visible.length - 1)) / visible.length,
  );
  const totalBarsW = barW * visible.length + barGap * (visible.length - 1);
  const offsetX = padLeft + (chartW - totalBarsW) / 2;

  const gridSteps = [0, 0.25, 0.5, 0.75, 1];
  const labelStep = visible.length > 16 ? Math.ceil(visible.length / 10) : 1;

  const hovered = hoverIdx !== null ? visible[hoverIdx] : null;

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Header row: period tabs + summary */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <PeriodTabs active={period} onChange={setPeriod} />
        <div className="text-right">
          {hovered ? (
            <div className="animate-in fade-in duration-150">
              <p className="font-display text-2xl font-semibold text-navy-900">
                {formatVNDShort(hovered.value)}
              </p>
              <p className="text-[11px] text-ink-500">
                {hovered.fullDate ?? hovered.label}
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-2xl font-semibold text-navy-900">
                {formatVNDShort(total)}
              </p>
              <p className="text-[11px] text-ink-500">
                tổng {PERIOD_OPTIONS.find((o) => o.key === period)?.label}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="select-none">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="revBar" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#466690" />
              <stop offset="100%" stopColor="#1b365d" />
            </linearGradient>
            <linearGradient id="revBarHover" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#6885a8" />
              <stop offset="100%" stopColor="#355077" />
            </linearGradient>
            <linearGradient id="revBarGold" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d4ad58" />
              <stop offset="100%" stopColor="#b08a48" />
            </linearGradient>
            <filter id="barShadow">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#1b365d" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* Y-axis grid */}
          {gridSteps.map((p) => {
            const y = padTop + chartH - p * chartH;
            return (
              <g key={p}>
                <line
                  x1={padLeft}
                  x2={width - padRight}
                  y1={y}
                  y2={y}
                  stroke="#ebe3d3"
                  strokeWidth="1"
                  strokeDasharray={p === 0 ? 'none' : '4 3'}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  fontSize="10"
                  fill="#b0b0b0"
                  textAnchor="end"
                  fontFamily="system-ui"
                >
                  {formatVNDShort(max * p)}
                </text>
              </g>
            );
          })}

          {/* Bars with hover zones */}
          {visible.map((d, i) => {
            const barH = Math.max(2, (d.value / max) * chartH);
            const x = offsetX + i * (barW + barGap);
            const y = padTop + chartH - barH;
            const isHovered = hoverIdx === i;
            const isLast = i === visible.length - 1;
            const r = Math.min(5, barW / 3);

            let fill = 'url(#revBar)';
            if (isHovered) fill = 'url(#revBarHover)';
            if (isLast && !isHovered) fill = 'url(#revBarGold)';

            return (
              <g key={i}>
                {/* Invisible wider hit area */}
                <rect
                  x={x - barGap / 2}
                  y={padTop}
                  width={barW + barGap}
                  height={chartH + padBottom}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                  style={{ cursor: 'pointer' }}
                />

                {/* Hover column highlight */}
                {isHovered && (
                  <rect
                    x={x - 2}
                    y={padTop}
                    width={barW + 4}
                    height={chartH}
                    fill="#f5f1ea"
                    rx="4"
                  />
                )}

                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={fill}
                  rx={r}
                  ry={r}
                  opacity={hoverIdx !== null && !isHovered ? 0.45 : 1}
                  filter={isHovered ? 'url(#barShadow)' : undefined}
                  style={{
                    transition: 'opacity 150ms ease, y 200ms ease, height 200ms ease',
                  }}
                />

                {/* Value label — show on hover or always for hovered bar */}
                {d.value > 0 && (isHovered || (hoverIdx === null && barH > 12)) && (
                  <text
                    x={x + barW / 2}
                    y={y - 8}
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    fill={isHovered ? '#1b365d' : isLast ? '#8b6c39' : '#466690'}
                    opacity={isHovered ? 1 : 0.8}
                    style={{ transition: 'opacity 150ms ease' }}
                  >
                    {formatVNDShort(d.value)}
                  </text>
                )}

                {/* X-axis label */}
                {i % labelStep === 0 && (
                  <text
                    x={x + barW / 2}
                    y={height - 10}
                    fontSize="10"
                    textAnchor="middle"
                    fill={isHovered ? '#1b365d' : '#717171'}
                    fontWeight={isHovered ? '600' : '400'}
                    style={{ transition: 'fill 150ms ease' }}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function PeriodTabs({
  active,
  onChange,
}: {
  active: PeriodKey;
  onChange: (v: PeriodKey) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg bg-cream-100 p-0.5">
      {PERIOD_OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={
            'rounded-md px-3 py-1.5 text-xs font-medium transition-all ' +
            (active === o.key
              ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
              : 'text-ink-500 hover:text-ink-900')
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
