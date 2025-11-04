import React, { useState, useMemo, useCallback } from 'react';
import { RankedPlayerProp } from '../types';
import { getAllEligiblePlayers } from '../services/propDiscoveryService';
import { batchAnalyzeProps } from '../services/betAnalysisService';
import { exportToCsv, formatAmericanOdds } from '../utils';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import { PlusIcon } from '@/components/icons/PlusIcon';
import { Trash2Icon } from '@/components/icons/Trash2Icon';
import AnalysisPanel from './bet_builder/AnalysisPanel';

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);
const PROP_TYPES = [
    'Passing Yards', 'Rushing Yards', 'Receiving Yards', 'Passing Touchdowns', 'Receptions'
];

const BetBuilder: React.FC = () => {
    // Filter State
    const [week, setWeek] = useState<number>(1);
    const [propType, setPropType] = useState<string>('Passing Yards');
    const [maxOdds, setMaxOdds] = useState<number>(-150);
    const [minEv, setMinEv] = useState<number>(1);

    // Data & UI State
    const [potentialLegs, setPotentialLegs] = useState<RankedPlayerProp[]>([]);
    const [parlayLegs, setParlayLegs] = useState<RankedPlayerProp[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFindLegs = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setPotentialLegs([]);
        setProgress(0);
        
        try {
            const { eligiblePlayers, games } = await getAllEligiblePlayers(propType, week);
            
            const initialFilter = eligiblePlayers.filter(p => {
                 const marketProp = p.props.find(prop => prop.propType === propType);
                 if (!marketProp) return false;
                 // Check both over and under odds against the maxOdds threshold
                 return marketProp.lines.some(l => l.overOdds <= maxOdds || l.underOdds <= maxOdds);
            });

            if (initialFilter.length === 0) {
                throw new Error(`No players found for ${propType} at odds of ${formatAmericanOdds(maxOdds)} or lower.`);
            }
            
            // Analyze both Over and Under positions to find the best EV for each player
            const overResults = await batchAnalyzeProps(initialFilter, games, propType, 0, 'Over', (p) => setProgress(p / 2));
            const underResults = await batchAnalyzeProps(initialFilter, games, propType, 0, 'Under', (p) => setProgress(0.5 + p / 2));
            
            // For each player, pick the position (Over/Under) with the higher rank score
            const bestEvLegs = new Map<string, RankedPlayerProp>();
            [...overResults, ...underResults].forEach(leg => {
                if (!bestEvLegs.has(leg.player.name) || leg.rankScore > bestEvLegs.get(leg.player.name)!.rankScore) {
                    bestEvLegs.set(leg.player.name, leg);
                }
            });

            const finalLegs = Array.from(bestEvLegs.values())
                .filter(leg => leg.ev >= minEv)
                .sort((a, b) => b.rankScore - a.rankScore);

            if (finalLegs.length === 0) {
                setError(`No +EV legs found meeting the criteria. Try adjusting filters.`);
            }

            setPotentialLegs(finalLegs);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [propType, week, maxOdds, minEv]);

    const addLegToParlay = (leg: RankedPlayerProp) => {
        if (!parlayLegs.some(pLeg => pLeg.player.name === leg.player.name && pLeg.propType === leg.propType)) {
            setParlayLegs(prev => [...prev, leg]);
        }
    };
    
    const removeLegFromParlay = (leg: RankedPlayerProp) => {
        setParlayLegs(prev => prev.filter(pLeg => !(pLeg.player.name === leg.player.name && pLeg.propType === leg.propType)));
    };
    
    const getEvColor = (ev: number) => {
        if (ev > 5) return 'text-green-400';
        if (ev > 0) return 'text-green-500';
        return 'text-gray-300';
    };

    const isLegInParlay = (leg: RankedPlayerProp) => parlayLegs.some(pLeg => pLeg.player.name === leg.player.name && pLeg.propType === leg.propType);

    const controlClass = "w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 h-10";

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
            <header className="text-center">
                <h2 className="text-3xl font-bold text-gray-100">AI Bet Builder</h2>
                <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
                    Define your criteria and let the AI find the highest value props to build your parlay.
                </p>
            </header>
            
            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="week" className="block text-sm font-medium text-gray-400 mb-1">Week</label>
                        <select id="week" value={week} onChange={e => setWeek(parseInt(e.target.value))} className={controlClass}>
                            {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="propType" className="block text-sm font-medium text-gray-400 mb-1">Prop Type</label>
                        <select id="propType" value={propType} onChange={e => setPropType(e.target.value)} className={controlClass}>
                            {PROP_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="maxOdds" className="block text-sm font-medium text-gray-400 mb-1">Max Odds</label>
                        <input type="number" step="5" id="maxOdds" value={maxOdds} onChange={e => setMaxOdds(parseInt(e.target.value, 10))} className={controlClass} />
                    </div>
                     <div>
                        <label htmlFor="minEv" className="block text-sm font-medium text-gray-400 mb-1">Min. EV (%)</label>
                        <input type="number" step="0.5" id="minEv" value={minEv} onChange={e => setMinEv(parseFloat(e.target.value))} className={controlClass} />
                    </div>
                    <button onClick={handleFindLegs} disabled={isLoading} className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <SparklesIcon className="h-5 w-5" />
                        {isLoading ? 'Searching...' : 'Find Legs'}
                    </button>
                </div>
            </div>
            
            {isLoading && (
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            )}
            
            {error && <p className="text-red-400 text-center">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Potential Legs */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-300">Potential Legs ({potentialLegs.length})</h3>
                    <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
                        {potentialLegs.map((leg) => (
                            <div key={`${leg.player.name}-${leg.position}`} className="p-3 rounded-md bg-gray-800/50 flex justify-between items-center gap-2">
                                <div>
                                    <p className="font-semibold text-gray-200">{leg.player.name}</p>
                                    <p className="text-sm text-cyan-300">{`${leg.position} ${leg.marketLine} ${leg.propType}`}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-semibold ${getEvColor(leg.ev)}`}>{leg.ev.toFixed(2)}% EV</p>
                                    <p className="text-sm font-mono text-gray-400">{formatAmericanOdds(leg.marketOdds)}</p>
                                </div>
                                <button onClick={() => addLegToParlay(leg)} disabled={isLegInParlay(leg)} className="p-2 rounded-md bg-gray-700 hover:bg-cyan-500/20 text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <PlusIcon className="h-5 w-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Parlay Legs */}
                <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-300">Your Parlay ({parlayLegs.length})</h3>
                    <div className="min-h-[100px] max-h-[400px] overflow-y-auto space-y-2 pr-2">
                         {parlayLegs.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                                Add legs to your parlay.
                            </div>
                        ) : parlayLegs.map((leg) => (
                             <div key={`${leg.player.name}-${leg.position}`} className="p-3 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex justify-between items-center gap-2">
                                <div>
                                    <p className="font-semibold text-gray-200">{leg.player.name}</p>
                                    <p className="text-sm text-cyan-300">{`${leg.position} ${leg.marketLine} ${leg.propType}`}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-mono font-semibold ${getEvColor(leg.ev)}`}>{leg.ev.toFixed(2)}% EV</p>
                                    <p className="text-sm font-mono text-gray-400">{formatAmericanOdds(leg.marketOdds)}</p>
                                </div>
                                <button onClick={() => removeLegFromParlay(leg)} className="p-2 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400">
                                    <Trash2Icon className="h-5 w-5"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <AnalysisPanel legs={parlayLegs} />

        </div>
    );
};

export default BetBuilder;
