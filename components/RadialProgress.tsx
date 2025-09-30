import React, { useEffect, useState } from 'react';

interface RadialProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

const RadialProgress: React.FC<RadialProgressProps> = ({ progress, size = 100, strokeWidth = 10 }) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    // Animate the progress value
    const animation = requestAnimationFrame(() => setDisplayProgress(progress));
    return () => cancelAnimationFrame(animation);
  }, [progress]);

  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - displayProgress * circumference;

  const percentage = Math.round(progress * 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="absolute top-0 left-0" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="text-gray-700"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <circle
          className="text-cyan-400"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      <div className="absolute top-0 left-0 flex h-full w-full items-center justify-center">
        <span className="text-2xl font-bold text-gray-100">{percentage}%</span>
      </div>
    </div>
  );
};

export default RadialProgress;
