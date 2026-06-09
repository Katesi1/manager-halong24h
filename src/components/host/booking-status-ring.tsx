'use client';

import { useState } from 'react';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface BookingStatusRingProps {
  segments: Segment[];
  total: number;
}

export function BookingStatusRing({ segments, total }: BookingStatusRingProps) {
  const filtered = segments.filter((s) => s.value > 0);
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);

  if (total === 0) {
    return (
      <div className="grid place-items-center h-52 text-sm text-ink-500 rounded-xl bg-cream-50 border border-dashed border-ink-200">
        Chưa có booking
      </div>
    );
  }

  const size = 180;
  const radius = 66;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 22;

  let cumulative = 0;
  const gapDeg = filtered.length > 1 ? 3 : 0;

  const arcs = filtered.map((s) => {
    const fraction = s.value / total;
    const startDeg = (cumulative / total) * 360 - 90 + gapDeg / 2;
    cumulative += s.value;
    const endDeg = (cumulative / total) * 360 - 90 - gapDeg / 2;
    const start = polar(cx, cy, radius, startDeg);
    const end = polar(cx, cy, radius, endDeg);
    const large = (endDeg - startDeg) > 180 ? 1 : 0;
    return {
      ...s,
      pct: Math.round(fraction * 100),
      d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`,
    };
  });

  const hoveredArc = hoverLabel ? arcs.find((a) => a.label === hoverLabel) : null;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          onMouseLeave={() => setHoverLabel(null)}
        >
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#f5f1ea"
            strokeWidth={stroke}
          />

          {/* Segments */}
          {arcs.map((a) => {
            const isHovered = hoverLabel === a.label;
            const isDimmed = hoverLabel !== null && !isHovered;
            return (
              <path
                key={a.label}
                d={a.d}
                fill="none"
                stroke={a.color}
                strokeWidth={isHovered ? stroke + 4 : stroke}
                strokeLinecap="round"
                opacity={isDimmed ? 0.3 : 1}
                onMouseEnter={() => setHoverLabel(a.label)}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 200ms ease, opacity 200ms ease',
                }}
              />
            );
          })}

          {/* Center text */}
          {hoveredArc ? (
            <>
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fontSize="28"
                fontWeight="700"
                fill={hoveredArc.color}
                fontFamily="var(--font-display)"
              >
                {hoveredArc.pct}%
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fontSize="10"
                fill="#717171"
              >
                {hoveredArc.label} ({hoveredArc.value})
              </text>
            </>
          ) : (
            <>
              <text
                x={cx}
                y={cy - 4}
                textAnchor="middle"
                fontSize="28"
                fontWeight="700"
                fill="#1b365d"
                fontFamily="var(--font-display)"
              >
                {total}
              </text>
              <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#717171"
                letterSpacing="0.15em"
                style={{ textTransform: 'uppercase' }}
              >
                booking
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2.5">
        {arcs.map((a) => {
          const isHovered = hoverLabel === a.label;
          return (
            <button
              key={a.label}
              onMouseEnter={() => setHoverLabel(a.label)}
              onMouseLeave={() => setHoverLabel(null)}
              className={
                'flex items-center gap-2 rounded-full px-2.5 py-1 text-xs transition-all ' +
                (isHovered
                  ? 'bg-cream-100 ring-1 ring-ink-200/60 shadow-sm'
                  : 'hover:bg-cream-50')
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: a.color }}
              />
              <span className={isHovered ? 'font-semibold text-ink-900' : 'text-ink-700'}>
                {a.label}
              </span>
              <span className="font-bold text-ink-900">{a.value}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
