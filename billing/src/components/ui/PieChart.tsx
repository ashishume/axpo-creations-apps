
interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  className?: string;
  showLegend?: boolean;
  title?: string;
}

export function PieChart({ data, size = 200, className = "", showLegend = true, title }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  if (total === 0) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        {title && (
          <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            {title}
          </h3>
        )}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: size,
            height: size,
            background: "var(--table-row-alt)",
          }}
        >
          <span style={{ color: "var(--text-secondary)" }}>No data</span>
        </div>
      </div>
    );
  }

  // Calculate pie slices
  let currentAngle = 0;
  const slices = data.filter(d => d.value > 0).map((d) => {
    const percentage = (d.value / total) * 100;
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    return {
      ...d,
      percentage,
      startAngle,
      endAngle: currentAngle,
    };
  });

  // Generate SVG path for each slice
  const getSlicePath = (startAngle: number, endAngle: number, radius: number) => {
    const start = polarToCartesian(radius, radius, radius - 10, endAngle - 90);
    const end = polarToCartesian(radius, radius, radius - 10, startAngle - 90);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      `M ${radius} ${radius}`,
      `L ${start.x} ${start.y}`,
      `A ${radius - 10} ${radius - 10} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      "Z",
    ].join(" ");
  };

  const polarToCartesian = (cx: number, cy: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleInRadians),
      y: cy + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
      )}
      
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, idx) => (
          <path
            key={idx}
            d={getSlicePath(slice.startAngle, slice.endAngle, size / 2)}
            fill={slice.color}
            className="transition-all duration-300 hover:opacity-80"
            style={{ cursor: "pointer" }}
          >
            <title>{`${slice.label}: ${formatCurrency(slice.value)} (${slice.percentage.toFixed(1)}%)`}</title>
          </path>
        ))}
        {/* Center circle for donut effect */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 4}
          fill="var(--bg-card)"
        />
        {/* Total in center */}
        <text
          x={size / 2}
          y={size / 2 - 5}
          textAnchor="middle"
          fontSize="12"
          fill="var(--text-secondary)"
        >
          Total
        </text>
        <text
          x={size / 2}
          y={size / 2 + 15}
          textAnchor="middle"
          fontSize="14"
          fontWeight="bold"
          fill="var(--text-primary)"
        >
          {formatCurrencyShort(total)}
        </text>
      </svg>

      {showLegend && (
        <div className="mt-4 space-y-2">
          {slices.map((slice, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: slice.color }}
              />
              <span style={{ color: "var(--text-primary)" }}>{slice.label}</span>
              <span style={{ color: "var(--text-secondary)" }}>
                ({slice.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCurrencyShort(value: number): string {
  if (value >= 10000000) {
    return `₹${(value / 10000000).toFixed(1)}Cr`;
  }
  if (value >= 100000) {
    return `₹${(value / 100000).toFixed(1)}L`;
  }
  if (value >= 1000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }
  return `₹${value.toFixed(0)}`;
}
