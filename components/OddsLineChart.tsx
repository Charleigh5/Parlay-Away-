import React, { useState, useMemo } from 'react';
import { formatAmericanOdds } from '../utils';

// Helper to get day label for tooltip
const getDayLabel = (index: number, dataLength: number) => {
    const daysAgo = dataLength - 1 - index;
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "1d ago";
    return `${daysAgo}d ago`;
};

export const OddsLineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; index: number } | null>(null);
  const width = 200;
  const height = 60;
  const paddingTop = 10;
  const paddingBottom = 15;
  const paddingX = 5;

  const points = useMemo(() => {
    if (data.length === 0) return [];
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const valueRange = maxVal - minVal;

    return data.map((d, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * (width - paddingX * 2) + paddingX : width / 2;
      const y = height - (((d - minVal) / (valueRange || 1)) * (height - paddingTop - paddingBottom) + paddingBottom);
      return { x, y, value: d };
    });
  }, [data]);

  const path = points.map(p => `${p.x},${p.y}`).join(' ');
  
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width; // Convert to SVG coordinate space

    let closestPointIndex = -1;
    let minDistance = Infinity;

    points.forEach((point, index) => {
        const distance = Math.abs(point.x - svgX);
        if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = index;
        }
    });

    if (closestPointIndex !== -1) {
        const p = points[closestPointIndex];
        setTooltip({ x: p.x, y: p.y, value: p.value, index: closestPointIndex });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  if (points.length === 0) return null;

  return (
    <div className="relative">
      {tooltip && (
        <div 
          className="absolute z-10 p-2 text-xs font-semibold text-gray-200 bg-gray-950 border border-gray-700 rounded-md shadow-lg pointer-events-none"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
            <div className="font-mono text-cyan-400">{formatAmericanOdds(tooltip.value)}</div>
            <div className="text-gray-500 text-center">{getDayLabel(tooltip.index, data.length)}</div>
        </div>
      )}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto cursor-crosshair text-cyan-500"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#sparkline-gradient)"
          points={`${points[0].x},${height} ${path} ${points[points.length - 1].x},${height}`}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={path}
        />
        {tooltip ? (
            <circle cx={tooltip.x} cy={tooltip.y} r="3" fill="currentColor" className="text-cyan-300" stroke="rgba(107, 222, 237, 0.3)" strokeWidth="2" />
        ) : (
            <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="2.5" fill="currentColor" className="text-cyan-400" />
        )}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 font-mono" style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px` }}>
        <span>{formatAmericanOdds(Math.min(...data))}</span>
        <span>{formatAmericanOdds(Math.max(...data))}</span>
      </div>
    </div>
  );
};
