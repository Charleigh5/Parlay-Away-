import React from 'react';

interface MicroPerformanceChartProps {
  gameLog: number[];
  selectedLine: number;
}

const MicroPerformanceChart: React.FC<MicroPerformanceChartProps> = ({ gameLog, selectedLine }) => {
    const last5 = gameLog.slice(-5);
    const barWidth = 4;
    const barSpacing = 2;
    const width = (barWidth + barSpacing) * last5.length - barSpacing;
    const height = 16;
    
    const yMax = Math.max(...last5, selectedLine) * 1.1;

    const yScale = (value: number) => {
        if (yMax === 0) return height;
        return height - ((value / yMax) * height);
    };

    return (
        <div className="flex items-center gap-2 group relative">
            <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-label={`Micro chart of last 5 games vs line ${selectedLine}`}>
                {/* Bars */}
                {last5.map((value, index) => {
                    const isOver = value > selectedLine;
                    const barHeight = Math.max(1, height - yScale(value));
                    return (
                        <rect
                            key={index}
                            x={index * (barWidth + barSpacing)}
                            y={height - barHeight}
                            width={barWidth}
                            height={barHeight}
                            rx="1"
                            className={isOver ? 'fill-green-500/80' : 'fill-cyan-500/80'}
                        />
                    );
                })}
                 {/* Dashed line */}
                <line x1="0" x2={width} y1={yScale(selectedLine)} y2={yScale(selectedLine)} strokeDasharray="1.5 1.5" className="stroke-yellow-400/80" strokeWidth="0.75" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 w-max bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <p className="font-semibold text-center mb-1">Last 5 Games vs Line ({selectedLine})</p>
                <div className="flex gap-1.5 justify-center">
                    {last5.map((val, i) => (
                        <span key={i} className={`font-mono ${val > selectedLine ? 'text-green-400' : 'text-cyan-400'}`}>{val.toFixed(0)}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MicroPerformanceChart;