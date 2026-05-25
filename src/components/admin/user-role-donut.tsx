'use client';

interface Segment {
  label: string;
  value: number;
  color: string;
}

interface UserRoleDonutProps {
  segments: Segment[];
}

export function UserRoleDonut({ segments }: UserRoleDonutProps) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const size = 140;
  const stroke = 28;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulative = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const offset = cumulative;
    cumulative += pct;
    return { ...seg, pct, offset };
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={stroke}
              strokeDasharray={`${arc.pct * circumference} ${circumference}`}
              strokeDashoffset={-arc.offset * circumference}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-navy-900">{total}</span>
          <span className="text-[10px] text-ink-500">tổng</span>
        </div>
      </div>
      <ul className="space-y-2">
        {segments.map((seg) => (
          <li key={seg.label} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-ink-700">{seg.label}</span>
            <span className="font-semibold text-ink-900 ml-auto tabular-nums">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
