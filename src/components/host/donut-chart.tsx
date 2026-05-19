interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
}

/** SVG donut chart đơn giản */
export function DonutChart({ data, size = 180 }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="grid place-items-center h-44 text-sm text-ink-500">
        Chưa có dữ liệu
      </div>
    );
  }

  const radius = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const stroke = 24;

  let cumulative = 0;
  const segments = data.map((d) => {
    const fraction = d.value / total;
    const startAngle = (cumulative / total) * 360 - 90;
    const endAngle = ((cumulative + d.value) / total) * 360 - 90;
    cumulative += d.value;

    const start = polarToCartesian(cx, cy, radius, startAngle);
    const end = polarToCartesian(cx, cy, radius, endAngle);
    const largeArc = fraction > 0.5 ? 1 : 0;
    return {
      label: d.label,
      value: d.value,
      color: d.color,
      pct: fraction * 100,
      d: `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((s, i) => (
          <path
            key={i}
            d={s.d}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
        ))}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="#222"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="10"
          fill="#717171"
        >
          tổng
        </text>
      </svg>
      <ul className="space-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-ink-700">{s.label}</span>
            <span className="font-semibold text-ink-900 ml-auto">
              {s.value} ({s.pct.toFixed(0)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 0) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
