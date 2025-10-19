
import React, { useState, useMemo } from 'react';
import { Player, RankedPlayerProp } from '../types';
import { getAllEligiblePlayers } from '../services/propDiscoveryService';
import { batchAnalyzeProps } from '../services/betAnalysisService';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';
import { exportToCsv, formatAmericanOdds } from '../utils';
import DeepAnalysisDrilldown from './DeepAnalysisDrilldown';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';

const PROP_TYPES = Array.from(new Set(
  // Fix: Added optional chaining to safely handle players who might not have props.
  MOCK_GAMES_SOURCE.flatMap(g => g.players.flatMap(p => p.props?.map(prop => prop.propType) || []))
));

const WEEKS = Array.from({ length: 18 }, (_, i) => i + 1);

const PropTypeRankingTool: React.FC = () => {
    const [propType, setPropType] = useState<string>(PROP_TYPES[0] || 'Passing Yards');
    const [threshold, setThreshold] = useState<number>(270.5);
    const [position, setPosition] = useState<'Over' | 'Under'>('Over');
    const [week, setWeek] = useState<number>(1);
    
    const [results, setResults] = useState<RankedPlayerProp[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    
    // State for new filters
    const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('All');
    const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('All');
    const [selectedOpponentFilter, setSelectedOpponentFilter] = useState<string>('All');

    const handleRank = async () => {
        setIsLoading(true);
        setError(null);
        setResults([]);
        setProgress(0);
        setExpandedRow(null);
        // Reset filters on new search
        setSelectedPositionFilter('All');
        setSelectedTeamFilter('All');
        setSelectedOpponentFilter('All');
        
        try {
            const { eligiblePlayers, games } = await getAllEligiblePlayers(propType, week);
            if (eligiblePlayers.length === 0) {
                throw new Error(`No players with an active market for ${propType} found for Week ${week}.`);
            }
            
            const rankedResults = await batchAnalyzeProps(
                eligiblePlayers,
                games,
                propType,
                threshold,
                position,
                (p) => setProgress(p)
            );
            
            setResults(rankedResults);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const filterOptions = useMemo<{ positions: string[], teams: string[], opponents: string[] }>(() => {
        if (results.length === 0) {
            return { positions: [], teams: [], opponents: [] };
        }
        const positions = new Set<string>();
        const teams = new Set<string>();
        const opponents = new Set<string>();

        results.forEach(row => {
            positions.add(row.player.position);
            teams.add(row.player.team);
            opponents.add(row.opponent.id);
        });

        return {
            positions: ['All', ...Array.from(positions).sort()],
            teams: ['All', ...Array.from(teams).sort()],
            opponents: ['All', ...Array.from(opponents).sort()],
        };
    }, [results]);

    const filteredResults = useMemo(() => {
        return results.filter(row => {
            const positionMatch = selectedPositionFilter === 'All' || row.player.position === selectedPositionFilter;
            const teamMatch = selectedTeamFilter === 'All' || row.player.team === selectedTeamFilter;
            const opponentMatch = selectedOpponentFilter === 'All' || row.opponent.id === selectedOpponentFilter;
            return positionMatch && teamMatch && opponentMatch;
        });
    }, [results, selectedPositionFilter, selectedTeamFilter, selectedOpponentFilter]);
    
    const toggleRow = (playerName: string) => {
        setExpandedRow(prev => prev === playerName ? null : playerName);
    }
    
    const getEvColor = (ev: number) => {
        if (ev > 5) return 'text-green-400';
        if (ev > 0) return 'text-green-500';
        if (ev < -5) return 'text-red-400';
        if (ev < 0) return 'text-red-500';
        return 'text-gray-300';
    };

    const selectClass = "w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500";

    return (
        <div className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 space-y-6 overflow-y-auto">
            <header className="text-center">
                <h2 className="text-3xl font-bold text-gray-100">Prop Ranker</h2>
                <p className="mt-2 text-gray-400 max-w-2xl mx-auto">
                    Batch analyze every player for a given prop type against a custom threshold. The AI ranks each opportunity by synthesizing statistical projections, matchup data, and market value.
                </p>
            </header>
            
            <div className="p-4 rounded-lg bg-gray-900/50 border border-gray-700/50 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div>
                        <label htmlFor="week" className="block text-sm font-medium text-gray-400 mb-1">Week</label>
                        <select id="week" value={week} onChange={e => setWeek(parseInt(e.target.value, 10))} className={selectClass}>
                            {WEEKS.map(w => <option key={w} value={w}>Week {w}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="propType" className="block text-sm font-medium text-gray-400 mb-1">Prop Type</label>
                        <select id="propType" value={propType} onChange={e => setPropType(e.target.value)} className={selectClass}>
                            {PROP_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="threshold" className="block text-sm font-medium text-gray-400 mb-1">Threshold</label>
                        <input type="number" step="0.5" id="threshold" value={threshold} onChange={e => setThreshold(parseFloat(e.target.value))} className="w-full h-10 bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Position</label>
                        <div className="flex h-10 gap-2 bg-gray-800 border border-gray-600 rounded-md p-1">
                            <button onClick={() => setPosition('Over')} className={`w-full px-4 py-1 rounded-md text-sm font-semibold transition-colors ${position === 'Over' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Over</button>
                            <button onClick={() => setPosition('Under')} className={`w-full px-4 py-1 rounded-md text-sm font-semibold transition-colors ${position === 'Under' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Under</button>
                        </div>
                    </div>
                    <button onClick={handleRank} disabled={isLoading} className="w-full h-10 flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        {isLoading ? 'Analyzing...' : 'Rank Opportunities'}
                    </button>
                </div>
                {results.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50 animate-fade-in">
                        <div>
                            <label htmlFor="positionFilter" className="block text-sm font-medium text-gray-400 mb-1">Filter by Position</label>
                            <select id="positionFilter" value={selectedPositionFilter} onChange={e => setSelectedPositionFilter(e.target.value)} className={selectClass}>
                                {filterOptions.positions.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="teamFilter" className="block text-sm font-medium text-gray-400 mb-1">Filter by Team</label>
                            <select id="teamFilter" value={selectedTeamFilter} onChange={e => setSelectedTeamFilter(e.target.value)} className={selectClass}>
                                {filterOptions.teams.map(team => <option key={team} value={team}>{team}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="opponentFilter" className="block text-sm font-medium text-gray-400 mb-1">Filter by Opponent</label>
                            <select id="opponentFilter" value={selectedOpponentFilter} onChange={e => setSelectedOpponentFilter(e.target.value)} className={selectClass}>
                                {filterOptions.opponents.map(opp => <option key={opp} value={opp}>{opp}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
            
            {isLoading && (
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${progress * 100}%`, transition: 'width 0.3s ease-in-out' }}></div>
                </div>
            )}
            
            {error && <p className="text-red-400 text-center">{error}</p>}
            
            {results.length > 0 && (
                <div className="overflow-x-auto animate-fade-in">
                    <div className="flex justify-end mb-2">
                         <button onClick={() => exportToCsv(filteredResults, propType, threshold)} className="flex items-center gap-2 px-3 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors">
                            <ArrowDownIcon className="h-3.5 w-3.5" />
                            Export CSV
                        </button>
                    </div>
                    {filteredResults.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-700 rounded-lg">
                            No results match the current filter criteria.
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-700">
                            <thead className="bg-gray-800/50">
                                 <tr>
                                    <th scope="col" className="w-12"></th>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6">Player</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Market</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden md:table-cell">True Prob.</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">EV</th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300 hidden sm:table-cell">Confidence</th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-left text-sm font-semibold text-gray-300">Rank Score</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredResults.map(row => (
                                    <React.Fragment key={row.player.name}>
                                        <tr onClick={() => toggleRow(row.player.name)} className="cursor-pointer hover:bg-gray-800/40">
                                            <td className="pl-4"><ChevronDownIcon className={`h-4 w-4 text-gray-500 transition-transform ${expandedRow === row.player.name ? 'rotate-180' : ''}`} /></td>
                                            <td className="py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="font-medium text-gray-200">{row.player.name} <span className="text-gray-400">({row.player.position})</span></div>
                                                <div className="text-gray-500">vs {row.opponent.id}</div>
                                            </td>
                                            <td className="px-3 py-4 text-sm font-mono text-cyan-300">{row.marketLine} ({formatAmericanOdds(row.marketOdds)})</td>
                                            <td className="px-3 py-4 text-sm font-mono hidden md:table-cell">
                                                <div><span className="text-gray-300">{(row.trueProbability * 100).toFixed(1)}%</span></div>
                                                <div><span className="text-gray-500 text-xs">{(row.impliedProbability * 100).toFixed(1)}% Implied</span></div>
                                            </td>
                                            <td className={`px-3 py-4 text-sm font-mono font-semibold ${getEvColor(row.ev)}`}>{row.ev.toFixed(2)}%</td>
                                            <td className="px-3 py-4 text-sm hidden sm:table-cell">
                                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${row.confidence * 100}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="relative py-4 pl-3 pr-4 text-sm font-mono font-bold text-lg text-yellow-400 sm:pr-6">{row.rankScore.toFixed(2)}</td>
                                        </tr>
                                        {expandedRow === row.player.name && (
                                            <tr>
                                                <td colSpan={7} className="p-0">
                                                    <div className="p-4 bg-gray-950/50">
                                                        <DeepAnalysisDrilldown analysisResult={row.deepAnalysisResult} isLoading={false} error={null} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default PropTypeRankingTool;