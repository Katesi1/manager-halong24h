import { formatVNDShort } from '@/lib/format';

interface BarChartProps {
  data: { label: string; value: number }[];
  /** Hiển thị value dạng money */
  asMoney?: boolean;
  height?: number;
  color?: string;
}

/** SVG bar chart đơn giản, không cần lib ngoài. */
export function BarChart({ data, asMoney = false, height = 220, color = 'var(--color-navy-700)' }: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className="grid place-items-center h-48 text-sm text-ink-500">
        Chưa có dữ liệu
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 100 ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1="0"
            x2="100"
            y1={height - p * (height - 30)}
            y2={height - p * (height - 30)}
            stroke="#ebebeb"
            strokeWidth="0.3"
          />
        ))}

        {data.map((d, i) => {
          const h = (d.value / max) * (height - 40);
          const x = i * barWidth + barWidth * 0.15;
          const w = barWidth * 0.7;
          const y = height - 30 - h;
          return (
            <g key={d.label}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={color}
                rx="1"
              />
              {/* Value on top */}
              {d.value > 0 && (
                <text
                  x={x + w / 2}
                  y={y - 3}
                  fontSize="3"
                  textAnchor="middle"
                  fill="#222"
                  fontWeight="600"
                >
                  {asMoney ? formatVNDShort(d.value) : d.value}
                </text>
              )}
              {/* X-axis label */}
              <text
                x={x + w / 2}
                y={height - 10}
                fontSize="3"
                textAnchor="middle"
                fill="#717171"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
