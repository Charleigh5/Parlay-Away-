import React, { useEffect, useState } from 'react';

interface GaugeProps {
  value: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

const Gauge: React.FC<GaugeProps> = ({ value, size = 120, strokeWidth = 12 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate the value change
    const animation = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(animation);
  }, [value]);

  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // We only want a semi-circle, so we use half the circumference
  const arcLength = circumference * 0.75;
  const offset = arcLength - displayValue * arcLength;

  const percentage = Math.round(value * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[135deg]">
        <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.8 }} />
                <stop offset="100%" style={{ stopColor: 'hsl(191, 97%, 60%)', stopOpacity: 1 }} />
            </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="hsl(var(--secondary))"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={arcLength}
          strokeLinecap="round"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#gaugeGradient)"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={arcLength}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: 'hsl(var(--foreground))' }}>{percentage}<span className="text-xl text-gray-400">%</span></span>
      </div>
    </div>
  );
};

export default Gauge;
