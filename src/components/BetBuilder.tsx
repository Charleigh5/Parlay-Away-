import React, { useState, useMemo, useCallback } from 'react';
import { RankedPlayerProp } from '../types';
import { getAllEligiblePlayers } from '../services/propDiscoveryService';
import { batchAnalyzeProps } from '../services/betAnalysisService';
import { exportToCsv, formatAmericanOdds } from '../utils';
import { SparklesIcon } from './icons/SparklesIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
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
                throw new Error(`No players found for ${propType} with market odds <= ${maxOdds}.`);
            }

            const rankedResults = await batchAnalyzeProps(
                initialFilter,
                games,
                propType,
                0, // Threshold isn't as relevant here, we check EV directly
                'Over', // Position doesn't matter for batch analysis, we'll get both
                (p) => setProgress(p)
            );

            // Post-analysis filter for EV
            const finalLegs = rankedResults.filter(leg => leg.ev >= minEv);
            if (finalLegs.length === 0) {
                setError(`Analysis complete. No legs found with EV >= ${minEv}%. Try different filters.`);
            }
            setPotentialLegs(finalLegs);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, [propType, week, maxOdds, minEv]);

    const addLegToParlay = (leg: RankedPlayerProp) => {
        setParlayLegs(prev => [...prev, leg]);
        setPotentialLegs(prev => prev.filter(p => p.player.name !== leg.player.name));
    };

    const removeLegFromParlay = (leg: RankedPlayerProp) => {
        setParlayLegs(prev => prev.filter(p => p.player.name !== leg.player.name));
        // Add it back to potential legs if it still meets criteria
        if(leg.ev >= minEv) {
            setPotentialLegs(prev => [...prev, leg].sort((a, b) => b.rankScore - a.rankScore));
        }
    };
    
    const getEvColor = (ev: number) => {
        if (ev > 0) return 'text-green-400';
        if (ev < 0) return 'text-red-400';
        return 'text-gray-300';
    };

    const selectClass = "w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 text-sm";
    const inputClass = "w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 text-sm";


    return (
        <div className="flex flex-1 flex-col lg:flex-row h-full overflow-hidden">
            {/* Left Panel: Leg Finder */}
            <div className="w-full lg:w-2/5 xl:w-1/3 flex flex-col border-r border-gray-700/50 bg-gray-900/30">
                <header className="p-4 border-b border-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-100">"Safe Harbor" Parlay Builder</h2>
                    <p className="text-sm text-gray-400 mt-1">Find and stack high-probability, +EV legs.</p>
                </header>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="week" className="block text-xs font-medium text-gray-400 mb-1">Week</label>
                            <select id="week" value={week} onChange={e => setWeek(parseInt(e.target.value, 10))} className={selectClass}>
                                {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="propType" className="block text-xs font-medium text-gray-400 mb-1">Prop Type</label>
                            <select id="propType" value={propType} onChange={e => setPropType(e.target.value)} className={selectClass}>
                                {PROP_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="maxOdds" className="block text-xs font-medium text-gray-400 mb-1">Max Odds</label>
                            <input type="number" id="maxOdds" value={maxOdds} onChange={e => setMaxOdds(parseInt(e.target.value, 10))} className={inputClass} placeholder="e.g., -150" />
                        </div>
                        <div>
                            <label htmlFor="minEv" className="block text-xs font-medium text-gray-400 mb-1">Min EV (%)</label>
                            <input type="number" id="minEv" value={minEv} onChange={e => setMinEv(parseFloat(e.target.value))} className={inputClass} placeholder="e.g., 1" />
                        </div>
                    </div>
                    <button onClick={handleFindLegs} disabled={isLoading} className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600">
                        <SparklesIcon className="h-5 w-5" />
                        {isLoading ? 'Analyzing Market...' : 'Find Value Legs'}
                    </button>
                    {isLoading && (
                        <div className="w-full bg-gray-700 rounded-full h-1.5">
                            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${progress * 100}%`, transition: 'width 0.3s' }}></div>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {error && <p className="text-center text-yellow-400 text-sm p-4 bg-yellow-500/10 rounded-md">{error}</p>}
                    {!isLoading && !error && potentialLegs.length === 0 && (
                        <div className="text-center text-gray-500 pt-10">
                            <p>Potential legs will appear here once you search.</p>
                        </div>
                    )}
                    {potentialLegs.map(leg => (
                        <div key={leg.player.name + leg.position} className="p-3 rounded-lg bg-gray-800/60 border border-gray-700/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-200">{leg.player.name} <span className="font-normal text-gray-400">({leg.player.position})</span></p>
                                    <p className="text-sm text-cyan-300">{`${leg.position} ${leg.marketLine} ${leg.propType}`}</p>
                                </div>
                                <button onClick={() => addLegToParlay(leg)} className="p-1.5 rounded-md text-gray-400 hover:bg-cyan-500/20 hover:text-cyan-300">
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-700/50 grid grid-cols-3 text-center text-xs">
                                <div>
                                    <p className="text-gray-400">Odds</p>
                                    <p className="font-mono font-semibold">{formatAmericanOdds(leg.marketOdds)}</p>
                                </div>
                                 <div>
                                    <p className="text-gray-400">True Prob.</p>
                                    <p className="font-mono font-semibold">{(leg.trueProbability * 100).toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-gray-400">EV</p>
                                    <p className={`font-mono font-semibold ${getEvColor(leg.ev)}`}>{leg.ev.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Parlay & Analysis */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-gray-700/50">
                    <h2 className="text-xl font-bold text-gray-100">Current Parlay</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {parlayLegs.length === 0 && (
                        <div className="text-center text-gray-500 pt-16 border-2 border-dashed border-gray-700 rounded-lg p-8">
                            <p>Add legs from the left panel to build your parlay.</p>
                        </div>
                    )}
                    {parlayLegs.map(leg => (
                         <div key={leg.player.name + leg.position} className="p-3 rounded-lg bg-gray-800/60 flex justify-between items-center animate-fade-in">
                            <div>
                                <p className="font-semibold text-gray-200">{leg.player.name}</p>
                                <p className="text-sm text-cyan-300">{`${leg.position} ${leg.marketLine} ${leg.propType}`} <span className="text-gray-400 font-mono">({formatAmericanOdds(leg.marketOdds)})</span></p>
                            </div>
                            <button onClick={() => removeLegFromParlay(leg)} className="p-1.5 rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400">
                                <Trash2Icon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
                </div>
                
                <AnalysisPanel legs={parlayLegs} />
            </div>
        </div>
    );
};

export default BetBuilder;