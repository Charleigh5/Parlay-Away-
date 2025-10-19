import React from 'react';
import { AnalyzedBetLeg, ParlayCorrelationAnalysis } from '../types/index';

interface CorrelationHeatmapProps {
  legs: AnalyzedBetLeg[];
  correlation: ParlayCorrelationAnalysis;
}

const getCorrelationColor = (relationship: 'Positive' | 'Negative' | 'Neutral') => {
    switch (relationship) {
        case 'Positive': return 'bg-green-500/60 hover:bg-green-500/80';
        case 'Negative': return 'bg-red-500/60 hover:bg-red-500/80';
        default: return 'bg-gray-600/60 hover:bg-gray-600/80';
    }
};

const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ legs, correlation }) => {
  if (legs.length < 2) return null;

  const getLegLabel = (leg: AnalyzedBetLeg) => `${leg.player.split(' ').pop()} ${leg.position[0]}${leg.line}`;

  return (
    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Correlation Heatmap</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border-separate border-spacing-1">
          <thead>
            <tr>
              <th className="p-1"></th>
              {legs.map((leg, i) => (
                <th key={i} className="p-1 font-semibold text-gray-400 writing-mode-vertical-rl transform -rotate-45 whitespace-nowrap">
                  {getLegLabel(leg)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {legs.map((rowLeg, i) => (
              <tr key={i}>
                <th className="p-1 text-left font-semibold text-gray-400 whitespace-nowrap">{getLegLabel(rowLeg)}</th>
                {legs.map((colLeg, j) => {
                  if (i === j) {
                    return <td key={j} className="p-3 rounded-md bg-gray-700"></td>;
                  }
                  const corr = correlation.analysis.find(
                    c => (c.leg1Index === i && c.leg2Index === j) || (c.leg1Index === j && c.leg2Index === i)
                  );
                  const colorClass = corr ? getCorrelationColor(corr.relationship) : 'bg-gray-600/50';
                  
                  return (
                    <td key={j} className={`p-3 rounded-md transition-colors text-center text-white font-bold group relative ${colorClass}`}>
                      {corr?.relationship[0]}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 w-48 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="font-semibold text-center">{corr?.relationship} Correlation</p>
                        <p className="mt-1 text-gray-400">{corr?.explanation}</p>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorrelationHeatmap;