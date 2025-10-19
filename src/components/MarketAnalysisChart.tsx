import React, { useState, useMemo } from 'react';
import { MarketAnalysis } from '../types';

const MarketAnalysisChart: React.FC<{ marketAnalysis: MarketAnalysis }> = ({ marketAnalysis }) => {
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        line: number;
        overEV: number;
        underEV: number;
    } | null>(null);

    const width = 300;
    const height = 150;
    const padding = { top: 15, right: 10, bottom: 25, left: 35 };

    const { points, xMap, yMap, minLine, maxLine, minEV, maxEV, zeroY } = useMemo(() => {
        const lines = marketAnalysis.lines;
        if (lines.length === 0) return { points: { over: [], under: [] }, xMap: (l:number)=>0, yMap: (ev:number)=>0, minLine:0, maxLine:0, minEV:0, maxEV:0, zeroY:0 };

        const allEVs = lines.flatMap(l => [l.overEV, l.underEV]);
        let minEV = Math.min(...allEVs);
        let maxEV = Math.max(...allEVs);
        
        const evRange = maxEV - minEV;
        minEV -= evRange * 0.1;
        maxEV += evRange * 0.1;

        const lineValues = lines.map(l => l.line);
        const minLine = Math.min(...lineValues);
        const maxLine = Math.max(...lineValues);
        
        const xMap = (line: number) => {
             if (maxLine === minLine) return padding.left + (width - padding.left - padding.right) / 2;
             return padding.left + ((line - minLine) / (maxLine - minLine)) * (width - padding.left - padding.right);
        }

        const yMap = (ev: number) => {
            if (maxEV === minEV) return padding.top + (height - padding.top - padding.bottom) / 2;
            return height - padding.bottom - ((ev - minEV) / (maxEV - minEV)) * (height - padding.top - padding.bottom);
        }

        const zeroY = yMap(0);

        const overPoints = lines.map(l => ({ x: xMap(l.line), y: yMap(l.overEV) }));
        const underPoints = lines.map(l => ({ x: xMap(l.line), y: yMap(l.underEV) }));
        
        return { 
            points: { over: overPoints, under: underPoints },
            xMap, 
            yMap,
            minLine,
            maxLine,
            minEV,
            maxEV,
            zeroY
        };
    }, [marketAnalysis, height, padding, width]);


    const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        const svg = event.currentTarget;
        const rect = svg.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const svgX = (mouseX / rect.width) * width;

        let closestLineIndex = -1;
        let minDistance = Infinity;

        marketAnalysis.lines.forEach((line, index) => {
            const distance = Math.abs(xMap(line.line) - svgX);
            if (distance < minDistance) {
                minDistance = distance;
                closestLineIndex = index;
            }
        });

        if (closestLineIndex !== -1) {
            const line = marketAnalysis.lines[closestLineIndex];
            const y = (yMap(line.overEV) + yMap(line.underEV)) / 2;
            setTooltip({
                x: xMap(line.line),
                y: y,
                line: line.line,
                overEV: line.overEV,
                underEV: line.underEV,
            });
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const pathOver = points.over.map(p => `${p.x},${p.y}`).join(' ');
    const pathUnder = points.under.map(p => `${p.x},${p.y}`).join(' ');

    const optimalBet = marketAnalysis.optimalBet;

    return (
        <div className="relative">
            {tooltip && (
                <div 
                  className="absolute z-10 p-2 text-xs font-semibold text-gray-200 bg-gray-950/80 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg pointer-events-none"
                  style={{
                    left: `${tooltip.x}px`,
                    top: `${tooltip.y}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                    <div className="font-bold text-center mb-1">Line: {tooltip.line}</div>
                    <div className="font-mono text-green-400">Over: {tooltip.overEV.toFixed(1)}% EV</div>
                    <div className="font-mono text-red-400">Under: {tooltip.underEV.toFixed(1)}% EV</div>
                </div>
            )}
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <g className="text-gray-500 text-[9px]">
                    <text x={padding.left - 4} y={padding.top + 4} textAnchor="end">{Math.ceil(maxEV)}%</text>
                    <text x={padding.left - 4} y={height - padding.bottom} textAnchor="end">{Math.floor(minEV)}%</text>
                    <line x1={padding.left} x2={width - padding.right} y1={zeroY} y2={zeroY} stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                    <text x={padding.left - 4} y={zeroY + 3} textAnchor="end">0%</text>
                </g>
                
                 <g className="text-gray-500 text-[9px]">
                    <text x={padding.left} y={height - padding.bottom + 12} textAnchor="middle">{minLine}</text>
                    <text x={width - padding.right} y={height - padding.bottom + 12} textAnchor="middle">{maxLine}</text>
                    <text x={width / 2} y={height - padding.bottom + 12} textAnchor="middle">Line</text>
                 </g>

                <polyline fill="none" stroke="#f87171" strokeWidth="1.5" points={pathUnder} />
                <polyline fill="none" stroke="#4ade80" strokeWidth="1.5" points={pathOver} />
                
                {optimalBet && (
                    <g>
                        <circle cx={xMap(optimalBet.line)} cy={yMap(optimalBet.ev)} r="4" className="fill-yellow-400" />
                        <circle cx={xMap(optimalBet.line)} cy={yMap(optimalBet.ev)} r="7" className="fill-yellow-400/30" >
                            <animate attributeName="r" from="7" to="12" dur="1.5s" begin="0s" repeatCount="indefinite" />
                            <animate attributeName="opacity" from="0.3" to="0" dur="1.5s" begin="0s" repeatCount="indefinite" />
                        </circle>
                    </g>
                )}
                
                {tooltip && (
                    <line
                        x1={tooltip.x}
                        y1={padding.top}
                        x2={tooltip.x}
                        y2={height - padding.bottom}
                        stroke="currentColor"
                        className="text-cyan-400/50"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                    />
                )}
            </svg>
             <div className="flex justify-center items-center gap-4 text-xs mt-1 text-gray-400">
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-green-500"></div> Over EV</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-red-500"></div> Under EV</span>
                <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> Optimal</span>
            </div>
        </div>
    );
};

export default MarketAnalysisChart;