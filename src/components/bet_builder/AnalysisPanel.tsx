import React from 'react';
import { RankedPlayerProp } from '../../types';
import { 
    calculateParlayOdds, 
    calculateCompoundedWinProbability, 
    calculateParlayEVFromTrueProbs,
    formatAmericanOdds 
} from '../../utils';
import { DollarSignIcon } from '../icons/DollarSignIcon';
import { TrendingUpIcon } from '../icons/TrendingUpIcon';
import { TrendingDownIcon } from '../icons/TrendingDownIcon';
import { PercentIcon } from '../icons/PercentIcon';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import InfoTooltip from './InfoTooltip';

interface AnalysisPanelProps {
    legs: RankedPlayerProp[];
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ legs }) => {
    if (legs.length === 0) {
        return (
            <div className="p-4 border-t border-gray-700/50">
                <p className="text-center text-sm text-gray-500">Analysis will appear here.</p>
            </div>
        );
    }
    
    const totalOdds = calculateParlayOdds(legs);
    const winProbability = calculateCompoundedWinProbability(legs);
    const totalEV = calculateParlayEVFromTrueProbs(legs);

    const isPositiveEV = totalEV > 0;
    const sportsbookEdge = isPositiveEV ? 0 : Math.abs(totalEV);

    return (
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Parlay Analysis</h3>

            <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2 rounded-lg bg-gray-800/70">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Total Odds
                        <InfoTooltip info="The combined American odds for all legs in the parlay." />
                    </div>
                    <p className="text-xl font-bold font-mono text-cyan-300">{formatAmericanOdds(totalOdds)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-800/70">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Win Chance
                        <InfoTooltip info="The compounded 'true' probability of all legs winning, based on the AI's projections. Formula: P(A) * P(B) * ..." />
                    </div>
                    <p className="text-xl font-bold font-mono text-gray-200">{winProbability.toFixed(2)}%</p>
                </div>
                <div className={`p-2 rounded-lg border ${isPositiveEV ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                     <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Total EV
                        <InfoTooltip info="The total Expected Value of the parlay. A positive value indicates a profitable bet in the long run." />
                    </div>
                    <p className={`text-xl font-bold font-mono ${isPositiveEV ? 'text-green-400' : 'text-red-400'}`}>{totalEV.toFixed(2)}%</p>
                </div>
            </div>

            {!isPositiveEV && legs.length > 0 && (
                <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 flex items-start gap-3 animate-fade-in">
                    <AlertTriangleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-300">Negative EV Warning</h4>
                        <p className="text-sm text-red-400">
                            This parlay has a negative expected value. The sportsbook has an estimated edge of <span className="font-bold">{sportsbookEdge.toFixed(2)}%</span> on this bet.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisPanel;