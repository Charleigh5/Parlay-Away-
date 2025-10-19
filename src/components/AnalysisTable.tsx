import React from 'react';
import { AnalyzedBetLeg, ParlayCorrelationAnalysis } from '../types';
import { formatAmericanOdds, calculateParlayOdds, calculateParlayEV, calculateParlayConfidence } from '../utils';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { LinkIcon } from './icons/LinkIcon';

interface AnalysisTableProps {
  legs: AnalyzedBetLeg[];
  correlation: ParlayCorrelationAnalysis | null;
  onBack: () => void;
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ legs, correlation, onBack }) => {
  const parlayOdds = calculateParlayOdds(legs);
  const parlayEV = calculateParlayEV(legs);
  const parlayConfidence = calculateParlayConfidence(legs);

  const getEvColor = (ev: number) => {
    if (ev > 2) return 'text-green-400';
    if (ev > 0) return 'text-green-500';
    if (ev < -2) return 'text-red-400';
    if (ev < 0) return 'text-red-500';
    return 'text-gray-300';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6 animate-fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-100">Parlay Analysis</h2>
          <p className="text-gray-400">{legs.length}-Leg Parlay</p>
        </div>
        <button
          onClick={onBack}
          className="rounded-md bg-gray-700/50 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
        >
          Back to Canvas
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4 flex items-center gap-4">
          <DollarSignIcon className="h-8 w-8 text-cyan-400" />
          <div>
            <p className="text-sm text-gray-400">Total Odds</p>
            <p className="text-2xl font-bold font-mono text-gray-100">{formatAmericanOdds(parlayOdds)}</p>
          </div>
        </div>
        <div className={`rounded-lg bg-gray-800/50 border border-gray-700/50 p-4 flex items-center gap-4 ${parlayEV > 0 ? 'border-green-500/30' : 'border-red-500/30'}`}>
          {parlayEV > 0 ? <TrendingUpIcon className="h-8 w-8 text-green-400" /> : <TrendingDownIcon className="h-8 w-8 text-red-400" />}
          <div>
            <p className="text-sm text-gray-400">Total EV</p>
            <p className={`text-2xl font-bold font-mono ${getEvColor(parlayEV)}`}>{parlayEV.toFixed(2)}%</p>
          </div>
        </div>
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4 flex items-center gap-4">
          <ShieldCheckIcon className="h-8 w-8 text-yellow-400" />
          <div>
            <p className="text-sm text-gray-400">Confidence</p>
            <p className="text-2xl font-bold font-mono text-gray-100">{(parlayConfidence * 100).toFixed(1)}%</p>
          </div>
        </div>
         <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4 flex items-center gap-4">
          <LinkIcon className="h-8 w-8 text-purple-400" />
          <div>
            <p className="text-sm text-gray-400">Correlation Score</p>
            <p className="text-2xl font-bold font-mono text-gray-100">{correlation?.overallScore.toFixed(2) ?? 'N/A'}</p>
          </div>
        </div>
      </div>

      {correlation && (
        <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-2">Correlation Summary</h3>
            <p className="text-sm text-gray-300 italic">{correlation.summary}</p>
        </div>
      )}

      {/* Legs Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full align-middle">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800/50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Leg</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Market Odds</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">True Odds</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">EV</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {legs.map((leg, index) => (
                <tr key={index} className="hover:bg-gray-800/40">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                    <div className="font-medium text-gray-200">{leg.player}</div>
                    <div className="text-gray-400">{`${leg.position} ${leg.line} ${leg.propType}`}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-cyan-300">{formatAmericanOdds(leg.marketOdds)}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm font-mono text-gray-300">{formatAmericanOdds(leg.analysis.quantitative.vigRemovedOdds)}</td>
                  <td className={`whitespace-nowrap px-3 py-4 text-sm font-mono font-semibold ${getEvColor(leg.analysis.quantitative.expectedValue)}`}>
                    {leg.analysis.quantitative.expectedValue.toFixed(2)}%
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                        <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTable;