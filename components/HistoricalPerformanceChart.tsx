import React from 'react';

interface HistoricalPerformanceChartProps {
  gameLog: number[];
  selectedLine: number;
  seasonAvg: number | null;
  last5Avg: number | null;
}

const HistoricalPerformanceChart: React.FC<HistoricalPerformanceChartProps> = ({ gameLog, selectedLine, seasonAvg, last5Avg }) => {
    if (!gameLog || gameLog.length === 0) {
        return <div className="text-center text-xs text-gray-500 py-2">No game log data for chart.</div>;
    }
    
    const data = gameLog.slice(-7); // Ensure we only use last 7 games
    
    const width = 300;
    const height = 120;
    const paddingTop = 15;
    const paddingBottom = 20;
    const paddingX = 10;
    
    const allValues = [...data, selectedLine];
    if (seasonAvg) allValues.push(seasonAvg);
    if (last5Avg) allValues.push(last5Avg);
    
    const yMax = Math.max(...allValues) * 1.1; // Add 10% buffer
    
    const yScale = (value: number) => {
        if (yMax === 0) return height - paddingBottom;
        return height - paddingBottom - ((value / yMax) * (height - paddingTop - paddingBottom));
    };

    const barWidth = (width - paddingX * 2) / data.length * 0.7;
    const barSpacing = (width - paddingX * 2) / data.length * 0.3;

    return (
        <div className="mt-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Last 7 Games Performance</h4>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-label={`Chart of last 7 games performance for a prop with line ${selectedLine}`}>
                {/* Y-axis labels */}
                <text x={paddingX - 4} y={yScale(yMax * 0.9)} textAnchor="end" alignmentBaseline="middle" className="text-[8px] fill-gray-500">{Math.round(yMax * 0.9)}</text>
                <text x={paddingX - 4} y={yScale(0)} textAnchor="end" alignmentBaseline="middle" className="text-[8px] fill-gray-500">0</text>

                {/* Dashed lines for context */}
                {seasonAvg !== null && (
                    <g role="presentation">
                        <line x1={paddingX} x2={width - paddingX} y1={yScale(seasonAvg)} y2={yScale(seasonAvg)} className="stroke-purple-500/70" strokeWidth="1" strokeDasharray="2 2" />
                        <text x={width - paddingX + 2} y={yScale(seasonAvg)} alignmentBaseline="middle" className="text-[8px] fill-purple-400">SZN</text>
                    </g>
                )}
                {last5Avg !== null && (
                     <g role="presentation">
                        <line x1={paddingX} x2={width - paddingX} y1={yScale(last5Avg)} y2={yScale(last5Avg)} className="stroke-blue-500/70" strokeWidth="1" strokeDasharray="2 2" />
                        <text x={width - paddingX + 2} y={yScale(last5Avg)} alignmentBaseline="middle" className="text-[8px] fill-blue-400">L5</text>
                    </g>
                )}
                <g role="presentation">
                    <line x1={paddingX} x2={width - paddingX} y1={yScale(selectedLine)} y2={yScale(selectedLine)} className="stroke-yellow-400" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={width - paddingX + 2} y={yScale(selectedLine)} alignmentBaseline="middle" className="text-[8px] fill-yellow-300">Line</text>
                </g>

                {/* Bars */}
                {data.map((value, index) => {
                    const x = paddingX + index * (barWidth + barSpacing) + barSpacing / 2;
                    const y = yScale(value);
                    const barHeight = Math.max(0, height - paddingBottom - y);
                    const isOver = value > selectedLine;

                    return (
                        <g key={index} role="figure" aria-label={`Game ${data.length - index} ago: value ${value.toFixed(1)}, ${isOver ? 'over' : 'under'} the line.`}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                className={isOver ? 'fill-green-500/70' : 'fill-cyan-600/70'}
                            >
                                <title>Game {data.length - index} ago: {value.toFixed(1)}</title>
                            </rect>
                            <text x={x + barWidth / 2} y={y - 3} textAnchor="middle" className="text-[8px] font-bold fill-gray-200" aria-hidden="true">{value.toFixed(1)}</text>
                        </g>
                    );
                })}

                {/* X-axis labels */}
                {data.map((_, index) => {
                    const x = paddingX + index * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2;
                    return (
                        <text key={index} x={x} y={height - 5} textAnchor="middle" className="text-[8px] fill-gray-500" aria-hidden="true">
                           G-{data.length - index}
                        </text>
                    )
                })}
            </svg>
             <div className="flex justify-center items-center gap-4 text-xs mt-2 text-gray-400" aria-hidden="true">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500/70"></div> Over</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-cyan-600/70"></div> Under</span>
                <span className="flex items-center gap-1.5"><div className="w-3 h-px bg-yellow-400 border-yellow-400 border-t border-dashed"></div> Line</span>
            </div>
        </div>
    );
};

export default HistoricalPerformanceChart;
