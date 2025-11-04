import React, { useMemo } from 'react';
import { RankedPlayerProp } from '../../types';
import { analyzeParlayValue, formatAmericanOdds, kellyForParlay } from '../../utils';
import { DollarSignIcon } from '@/components/icons/DollarSignIcon';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { CalculatorIcon } from '@/components/icons/CalculatorIcon';
import InfoTooltip from './InfoTooltip';

interface AnalysisPanelProps {
    legs: RankedPlayerProp[];
}

const getRiskColor = (riskLevel: 'low' | 'medium' | 'high' | 'extreme') => {
    switch (riskLevel) {
        case 'low': return 'text-green-400';
        case 'medium': return 'text-yellow-400';
        case 'high': return 'text-orange-400';
        case 'extreme': return 'text-red-400';
        default: return 'text-gray-300';
    }
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ legs }) => {
    const analysis = useMemo(() => {
        if (legs.length === 0) return null;
        const legData = legs.map(leg => ({
            odds: leg.marketOdds,
            estimatedWinProb: leg.trueProbability
        }));
        return analyzeParlayValue(legData);
    }, [legs]);
    
    const kellyStake = useMemo(() => {
        if (legs.length === 0 || !analysis) return 0;
        const BANKROLL = 1000; // Assume for demo
        return kellyForParlay(analysis.combinedProbability, analysis.parlayOdds, BANKROLL, legs.length);
    }, [legs, analysis]);


    if (!analysis) {
        return (
            <div className="p-4 border-t border-gray-700/50">
                <p className="text-center text-sm text-gray-500">Analysis will appear here.</p>
            </div>
        );
    }

    const { combinedProbability, parlayOdds, expectedValue, riskLevel, recommendedMaxLegs, shouldBet } = analysis;

    return (
        <div className="p-4 border-t border-gray-700/50 bg-gray-900/50 space-y-4">
            <h3 className="text-lg font-semibold text-gray-200">Parlay Analysis</h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-2 rounded-lg bg-gray-800/70">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Total Odds
                    </div>
                    <p className="text-xl font-bold font-mono text-cyan-300">{formatAmericanOdds(parlayOdds)}</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-800/70">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Win Chance
                    </div>
                    <p className="text-xl font-bold font-mono text-gray-200">{(combinedProbability * 100).toFixed(2)}%</p>
                </div>
                <div className={`p-2 rounded-lg border ${expectedValue > 0 ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
                     <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Total EV
                    </div>
                    <p className={`text-xl font-bold font-mono ${expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>{expectedValue.toFixed(2)}%</p>
                </div>
                <div className="p-2 rounded-lg bg-gray-800/70">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-400">
                        Risk Level
                    </div>
                    <p className={`text-xl font-bold capitalize ${getRiskColor(riskLevel)}`}>{riskLevel}</p>
                </div>
            </div>

            <div className="p-3 rounded-lg bg-gray-800/70 grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <CalculatorIcon className="h-5 w-5 text-yellow-400 shrink-0" />
                    <div>
                        <div className="flex items-center gap-1 text-gray-400">
                            Kelly Stake
                            <InfoTooltip info="Recommended stake as a % of bankroll based on the Kelly Criterion, adjusted for parlay risk. Assumes a $1,000 bankroll for this demo." />
                        </div>
                        <p className="font-semibold text-gray-200">${kellyStake.toFixed(2)}</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <AlertTriangleIcon className="h-5 w-5 text-orange-400 shrink-0" />
                    <div>
                        <div className="flex items-center gap-1 text-gray-400">
                            Max Legs
                            <InfoTooltip info="The recommended maximum number of legs to maintain at least a 20% win probability, based on the average probability of your current selections." />
                        </div>
                        <p className="font-semibold text-gray-200">{recommendedMaxLegs} Legs</p>
                    </div>
                </div>
            </div>

            {!shouldBet && legs.length > 0 && (
                <div className="p-3 rounded-lg bg-red-900/50 border border-red-500/50 flex items-start gap-3 animate-fade-in">
                    <AlertTriangleIcon className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-300">Negative EV or High Risk</h4>
                        <p className="text-sm text-red-400">
                            This parlay is not recommended as it either has a negative expected value or the win probability is too low (&lt;15%).
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalysisPanel;
