
import React, { useState } from 'react';
import { ParlayNode, ParlayCorrelationAnalysis, CorrelationEdge } from '../types';

interface ConnectionLinesProps {
  nodes: ParlayNode[];
  correlationAnalysis: ParlayCorrelationAnalysis | null;
}

const getEdgeStyle = (edge: CorrelationEdge) => {
    const absRho = Math.abs(edge.rho);
    let strokeWidth = 2;
    if (absRho >= 0.7) {
        strokeWidth = 4.5;
    } else if (absRho >= 0.3) {
        strokeWidth = 3;
    }

    switch (edge.relationship) {
        case 'Positive':
            return { stroke: 'rgba(74, 222, 128, 0.7)', strokeDasharray: 'none', strokeWidth };
        case 'Negative':
            return { stroke: 'rgba(248, 113, 113, 0.7)', strokeDasharray: '6 6', strokeWidth };
        default:
            return { stroke: 'rgba(107, 114, 128, 0.5)', strokeDasharray: '2 4', strokeWidth };
    }
};

const getStrength = (rho: number): 'Weak' | 'Moderate' | 'Strong' => {
    const absRho = Math.abs(rho);
    if (absRho >= 0.7) return 'Strong';
    if (absRho >= 0.3) return 'Moderate';
    return 'Weak';
};


const ConnectionLines: React.FC<ConnectionLinesProps> = ({ nodes, correlationAnalysis }) => {
  const [hoveredEdge, setHoveredEdge] = useState<{ edge: CorrelationEdge; x: number; y: number } | null>(null);

  if (!correlationAnalysis || nodes.length < 2) {
    return null;
  }

  return (
    <>
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        {correlationAnalysis.analysis.map((detail, index) => {
            const node1 = nodes[detail.leg1Index];
            const node2 = nodes[detail.leg2Index];

            if (!node1 || !node2) return null;

            const style = getEdgeStyle(detail);
            const x1 = node1.position.x + 112; // center of node (width 224 / 2 -> 112)
            const y1 = node1.position.y + 46;  // vertical center of node (approx)
            const x2 = node2.position.x + 112;
            const y2 = node2.position.y + 46;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
            <g 
                key={index}
                className="pointer-events-auto"
                onMouseEnter={() => setHoveredEdge({ edge: detail, x: midX, y: midY })}
                onMouseLeave={() => setHoveredEdge(null)}
            >
                {/* Invisible wider line for easier hover detection */}
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth="16" />
                <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={style.stroke}
                strokeWidth={style.strokeWidth}
                strokeDasharray={style.strokeDasharray}
                className="transition-all duration-200"
                />
            </g>
            );
        })}
        </svg>

        {hoveredEdge && (
            <div
                className="absolute z-10 w-64 p-3 text-xs text-gray-200 bg-gray-950/80 backdrop-blur-sm border border-gray-700 rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/2 animate-fade-in-fast"
                style={{
                    left: `${hoveredEdge.x}px`,
                    top: `${hoveredEdge.y}px`,
                }}
            >
                <div className="flex justify-between items-baseline mb-2">
                    <p className="font-bold text-sm text-gray-100">{getStrength(hoveredEdge.edge.rho)} {hoveredEdge.edge.relationship}</p>
                    <p className="font-mono text-cyan-300">Rho: {hoveredEdge.edge.rho.toFixed(2)}</p>
                </div>
                <p className="text-gray-400">{hoveredEdge.edge.explanation}</p>
            </div>
        )}
    </>
  );
};

export default ConnectionLines;