import React from 'react';
import { ParlayNode, ParlayCorrelationAnalysis } from '../types';

interface ConnectionLinesProps {
  nodes: ParlayNode[];
  correlationAnalysis: ParlayCorrelationAnalysis | null;
}

const getRelationshipStyle = (relationship: 'Positive' | 'Negative' | 'Neutral') => {
  switch (relationship) {
    case 'Positive':
      return { stroke: 'rgba(74, 222, 128, 0.6)', strokeDasharray: 'none' }; // Green
    case 'Negative':
      return { stroke: 'rgba(248, 113, 113, 0.6)', strokeDasharray: '4 4' }; // Red
    default:
      return { stroke: 'rgba(107, 114, 128, 0.4)', strokeDasharray: '2 3' }; // Gray
  }
};

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ nodes, correlationAnalysis }) => {
  if (!correlationAnalysis || nodes.length < 2) {
    return null;
  }

  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      <defs>
        <marker id="arrow-positive" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(74, 222, 128, 0.6)" />
        </marker>
      </defs>
      {correlationAnalysis.analysis.map((detail, index) => {
        const node1 = nodes[detail.leg1Index];
        const node2 = nodes[detail.leg2Index];

        if (!node1 || !node2) return null;

        const style = getRelationshipStyle(detail.relationship);
        const x1 = node1.position.x + 112; // center of node (width 224 / 2)
        const y1 = node1.position.y + 46;  // vertical center of node (approx)
        const x2 = node2.position.x + 112;
        const y2 = node2.position.y + 46;

        return (
          <g key={index}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={style.stroke}
              strokeWidth="2"
              strokeDasharray={style.strokeDasharray}
            />
             <title>{`Correlation: ${detail.relationship}\n${detail.explanation}`}</title>
          </g>
        );
      })}
    </svg>
  );
};

export default ConnectionLines;
