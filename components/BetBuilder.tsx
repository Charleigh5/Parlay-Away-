import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp } from '../types';
import { calculateParlayOdds, formatAmericanOdds, generateHistoricalOdds } from '../utils';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { OddsLineChart } from './OddsLineChart';
import { SaveIcon } from './icons/SaveIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { SearchIcon } from './icons/SearchIcon';
import { fetchNFLEvents } from '../services/sportsDataService';
import { TargetIcon } from './icons/TargetIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { DEFENSIVE_STATS, TEAM_ABBREVIATION_TO_NAME, TEAM_NAME_TO_ABBREVIATION } from '../data/mockDefensiveStats';
import { BarChartIcon } from './icons/BarChartIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';


interface BetBuilderProps {
  onAnalyze: (legs: ExtractedBetLeg[]) => void;
  onBack: () => void;
}

interface SavedParlay {
  id: string;
  name: string;
  odds: number;
  legs: ExtractedBetLeg[];
  createdAt: string;
}

interface EnrichedLeg extends ExtractedBetLeg {
    playerDetails?: Player;
    propDetails?: PlayerProp;
}

const getConciseStatLabel = (propType: string): string => {
    switch (propType) {
        case 'Passing Yards': return 'Pass Yds Allowed';
        case 'Passing Touchdowns': return 'Pass TDs Allowed';
        case 'Rushing Yards': return 'Rush Yds Allowed';
        case 'Receiving Yards': return 'Rec Yds Allowed';
        case 'Receptions': return 'Receptions Allowed';
        default: return `${propType} Allowed`;
    }
};

const getRankCategory = (rank: number | null) => {
    if (rank === null) return { text: 'N/A', color: 'text-gray-400', bgColor: 'bg-gray-700/50', borderColor: 'border-gray-600' };
    if (rank <= 5) return { text: `Top 5`, color: 'text-green-300', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' };
    if (rank <= 10) return { text: `Top 10`, color: 'text-yellow-300', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' };
    if (rank >= 23) return { text: `Bottom 10`, color: 'text-red-300', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' };
    return { text: `Mid-tier`, color: 'text-gray-300', bgColor: 'bg-gray-700/50', borderColor: 'border-gray-600' };
};

interface DisplayableOpponentStat {
    opponentAbbr: string;
    value: number;
    unit: string;
    rank: number;
    label: string;
}

interface OpponentInfo {
    fullName: string;
    abbr: string;
    overallRank: number | null;
}


const SAVED_PARLAYS_LIST_KEY = 'synopticEdge_savedParlaysList';


const BetBuilder: React.FC<BetBuilderProps> = ({ onAnalyze, onBack }) => {
    const [legs, setLegs] = useState<ExtractedBetLeg[]>([]);
    const [savedParlays, setSavedParlays] = useState<SavedParlay[]>([]);
    const [expandedLegIndex, setExpandedLegIndex] = useState<number | null>(null);
    
    // State for live schedule data
    const [games, setGames] = useState<Game[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    // State for current leg selection
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGameId, setSelectedGameId] = useState<string>('');
    const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
    const [selectedPropType, setSelectedPropType] = useState<string>('');
    const [selectedLineIndex, setSelectedLineIndex] = useState<string>(''); // Store the index of the selected line
    const [selectedPosition, setSelectedPosition] = useState<'Over' | 'Under'>('Over');
    
    // State for opponent analysis
    const [opponentInfo, setOpponentInfo] = useState<OpponentInfo | null>(null);
    const [opponentStat, setOpponentStat] = useState<DisplayableOpponentStat | null>(null);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setScheduleLoading(true);
                setScheduleError(null);
                const fetchedGames = await fetchNFLEvents();
                 if (fetchedGames.length === 0) {
                   setScheduleError("Could not load the NFL schedule.");
                }
                setGames(fetchedGames);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred';
                setScheduleError(`Failed to load schedule: ${message}. Using fallback data.`);
            } finally {
                setScheduleLoading(false);
            }
        };
        loadSchedule();
    }, []);

    // Check for saved parlays on component mount
    useEffect(() => {
        const savedData = localStorage.getItem(SAVED_PARLAYS_LIST_KEY);
        if (savedData) {
            try {
                const parsedParlays = JSON.parse(savedData);
                if (Array.isArray(parsedParlays)) {
                    setSavedParlays(parsedParlays);
                }
            } catch (e) {
                console.error("Failed to load saved parlays:", e);
                setSavedParlays([]);
            }
        }
    }, []);
    
    const enrichedLegs = useMemo((): EnrichedLeg[] => {
        return legs.map(leg => {
            let playerDetails: Player | undefined;
            let propDetails: PlayerProp | undefined;

            for (const game of games) {
                const foundPlayer = game.players.find(p => p.name === leg.player);
                if (foundPlayer) {
                    playerDetails = foundPlayer;
                    propDetails = foundPlayer.props.find(p => p.propType === leg.propType);
                    break;
                }
            }
            return { ...leg, playerDetails, propDetails };
        });
    }, [legs, games]);

    const filteredGames = useMemo(() => {
        if (!searchTerm) {
            return games;
        }
        const lowercasedFilter = searchTerm.toLowerCase();
        return games.filter(game =>
            game.name.toLowerCase().includes(lowercasedFilter) ||
            game.players.some(player => player.name.toLowerCase().includes(lowercasedFilter))
        );
    }, [searchTerm, games]);

    // Memoized derived state for cascading dropdowns
    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId), [selectedGameId, games]);
    const availablePlayers = useMemo(() => selectedGame?.players || [], [selectedGame]);
    const hasAvailablePlayers = availablePlayers.length > 0;
    const selectedPlayer = useMemo(() => availablePlayers.find(p => p.name === selectedPlayerName), [availablePlayers, selectedPlayerName]);
    const availableProps = useMemo(() => selectedPlayer?.props || [], [selectedPlayer]);
    const selectedProp = useMemo(() => availableProps.find(p => p.propType === selectedPropType), [availableProps, selectedPropType]);
    const availableLines = useMemo(() => selectedProp?.lines || [], [selectedProp]);
    
    const selectedLineData = useMemo(() => {
        if (selectedLineIndex === '') return null;
        const index = parseInt(selectedLineIndex, 10);
        return availableLines[index] ?? null;
    }, [selectedLineIndex, availableLines]);
    
    const currentOdds = useMemo(() => {
        if (!selectedLineData) return null;
        return selectedPosition === 'Over' ? selectedLineData.overOdds : selectedLineData.underOdds;
    }, [selectedLineData, selectedPosition]);

    const parlayOdds = useMemo(() => calculateParlayOdds(legs), [legs]);
    
    const referenceAverage = useMemo(() => {
        if (!selectedProp?.historicalContext) return null;
        if (selectedProp.historicalContext.last5Avg > 0) {
            return { value: selectedProp.historicalContext.last5Avg, type: 'L5' };
        }
        if (selectedProp.historicalContext.seasonAvg > 0) {
            return { value: selectedProp.historicalContext.seasonAvg, type: 'SZN' };
        }
        return null;
    }, [selectedProp]);

    const closestLineIndex = useMemo(() => {
        if (!referenceAverage || !availableLines || availableLines.length === 0) return -1;
        
        return availableLines.reduce((closestIdx, currentLine, currentIdx, arr) => {
            const closestDiff = Math.abs(arr[closestIdx].line - referenceAverage.value);
            const currentDiff = Math.abs(currentLine.line - referenceAverage.value);
            return currentDiff < closestDiff ? currentIdx : closestIdx;
        }, 0);

    }, [availableLines, referenceAverage]);
    
    // Effect to reset dependent dropdowns when a parent dropdown changes
    useEffect(() => { 
        if(searchTerm && selectedGame){
            const lowercasedFilter = searchTerm.toLowerCase();
            const matchingPlayer = selectedGame.players.find(p => p.name.toLowerCase().includes(lowercasedFilter));
            if(matchingPlayer) {
                setSelectedPlayerName(matchingPlayer.name);
            } else {
                setSelectedPlayerName('');
            }
        } else {
           setSelectedPlayerName('');
        }
        setSelectedPropType(''); 
        setSelectedLineIndex(''); 
    }, [selectedGameId, searchTerm, selectedGame]);
    useEffect(() => { setSelectedPropType(''); setSelectedLineIndex(''); }, [selectedPlayerName]);
    useEffect(() => { setSelectedLineIndex(''); }, [selectedPropType]);

    // Effect to determine opponent and their overall defensive rank
    useEffect(() => {
        if (!selectedGame || !selectedPlayer) {
            setOpponentInfo(null);
            return;
        }

        const playerTeamFullName = TEAM_ABBREVIATION_TO_NAME[selectedPlayer.team];
        if (!playerTeamFullName) {
            setOpponentInfo(null);
            return;
        }

        const teams = selectedGame.name.split(' @ ');
        const opponentFullName = teams.find(t => t.trim() !== playerTeamFullName.trim());

        if (!opponentFullName) {
            setOpponentInfo(null);
            return;
        }

        const opponentAbbr = TEAM_NAME_TO_ABBREVIATION[opponentFullName] || 'OPP';
        const opponentDefensiveStats = DEFENSIVE_STATS[opponentFullName];
        const overallRank = opponentDefensiveStats?.overall?.rank ?? null;

        setOpponentInfo({
            fullName: opponentFullName,
            abbr: opponentAbbr,
            overallRank: overallRank,
        });
    }, [selectedGame, selectedPlayer]);

    // Effect to fetch and display specific opponent defensive stat
    useEffect(() => {
        if (!opponentInfo || !selectedPropType) {
            setOpponentStat(null);
            return;
        }

        const stat = DEFENSIVE_STATS[opponentInfo.fullName]?.[selectedPropType];

        if (stat && 'value' in stat) { // Type guard to ensure it's a DefensiveStat
            setOpponentStat({
                opponentAbbr: opponentInfo.abbr,
                value: stat.value,
                unit: stat.unit,
                rank: stat.rank,
                label: getConciseStatLabel(selectedPropType),
            });
        } else {
            setOpponentStat(null);
        }
    }, [opponentInfo, selectedPropType]);


    const resetCurrentSelection = () => {
        setSearchTerm('');
        setSelectedGameId('');
        setSelectedPlayerName('');
        setSelectedPropType('');
        setSelectedLineIndex('');
        setSelectedPosition('Over');
        setOpponentStat(null);
    };

    const handleAddLeg = () => {
        if (!selectedPlayer || !selectedProp || !selectedLineData || currentOdds === null) {
            alert('Please complete all selections for the leg.');
            return;
        }

        if (legs.length >= 20) {
            alert('Maximum of 20 legs per parlay.');
            return;
        }

        const newLeg: ExtractedBetLeg = {
            player: selectedPlayer.name,
            propType: selectedProp.propType,
            line: selectedLineData.line,
            position: selectedPosition,
            marketOdds: currentOdds,
        };

        setLegs([...legs, newLeg]);
        resetCurrentSelection();
    };

    const handleRemoveLeg = (indexToRemove: number) => {
        setLegs(legs.filter((_, index) => index !== indexToRemove));
    };

    const handleSaveParlay = () => {
        if (legs.length === 0) {
            alert("Cannot save an empty parlay.");
            return;
        }
        try {
            const newParlay: SavedParlay = {
                id: Date.now().toString(),
                name: `${legs.length}-Leg Parlay`,
                odds: parlayOdds,
                legs: legs,
                createdAt: new Date().toISOString(),
            };

            const updatedParlays = [...savedParlays, newParlay];
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
            setSavedParlays(updatedParlays);
            alert(`Parlay saved successfully!`);
        } catch (error) {
            console.error("Failed to save parlay:", error);
            alert("There was an error saving your parlay.");
        }
    };

    const handleLoadParlay = (parlayToLoad: SavedParlay) => {
        setLegs(parlayToLoad.legs);
        alert(`Loaded "${parlayToLoad.name}".`);
    };

    const handleDeleteParlay = (parlayIdToDelete: string) => {
        if (!window.confirm("Are you sure you want to delete this saved parlay?")) {
            return;
        }
        try {
            const updatedParlays = savedParlays.filter(p => p.id !== parlayIdToDelete);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
            setSavedParlays(updatedParlays);
            alert("Parlay deleted.");
        } catch (error) {
            console.error("Failed to delete parlay:", error);
            alert("There was an error deleting the parlay.");
        }
    };
    
    const isAddLegDisabled = !selectedGameId || !selectedPlayerName || !selectedPropType || selectedLineIndex === '';
    const opponentOverallRank = opponentInfo?.overallRank ?? null;
    const rankCategory = getRankCategory(opponentOverallRank);
    
    const historicalContext = selectedProp?.historicalContext;
    const gameLog = historicalContext?.gameLog ?? [];
    const maxGameLogStat = gameLog.length > 0 ? Math.max(...gameLog, selectedLineData?.line ?? 0) : 0;

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 p-4 border-b border-gray-700/50 flex items-center justify-between">
                 <div>
                     <h2 className="text-xl font-semibold text-gray-200">Bet Builder</h2>
                     <p className="text-sm text-gray-400">Construct a parlay and manage your saved bets.</p>
                </div>
                <button onClick={onBack} className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Bet Slip Area */}
                <div className="space-y-3">
                     {legs.length === 0 ? (
                        <div className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-700 rounded-lg">
                            <p>Your bet slip is empty.</p>
                            <p className="text-sm">Use the controls below to add your first leg.</p>
                        </div>
                    ) : (
                        enrichedLegs.map((leg, index) => {
                            const isExpanded = expandedLegIndex === index;
                            const historicalContext = leg.propDetails?.historicalContext;

                            let comparisonData = null;
                            if (isExpanded && historicalContext && (historicalContext.seasonAvg != null || historicalContext.last5Avg != null)) {
                                const { seasonAvg, last5Avg } = historicalContext;
                                const line = leg.line;
                                const maxValue = Math.max(seasonAvg ?? 0, last5Avg ?? 0, line) * 1.25;

                                comparisonData = {
                                    seasonAvg: seasonAvg,
                                    last5Avg: last5Avg,
                                    line: line,
                                    seasonAvgPercent: maxValue > 0 && seasonAvg != null ? (seasonAvg / maxValue) * 100 : 0,
                                    last5AvgPercent: maxValue > 0 && last5Avg != null ? (last5Avg / maxValue) * 100 : 0,
                                    linePercent: maxValue > 0 ? (line / maxValue) * 100 : 0,
                                };
                            }

                            return (
                                <div 
                                    key={index} 
                                    className={`bg-gray-800/70 p-3 rounded-lg animate-fade-in cursor-pointer transition-all duration-300 ${isExpanded ? 'ring-2 ring-cyan-500/50' : 'hover:bg-gray-800'}`}
                                    onClick={() => setExpandedLegIndex(isExpanded ? null : index)}
                                >
                                    <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                                        {/* Main Info */}
                                        <div className="col-span-2">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-200 truncate" title={leg.player}>{leg.player}</p>
                                                {leg.playerDetails && (
                                                    <span className="flex-shrink-0 text-xs font-mono bg-gray-700 text-cyan-300 px-1.5 py-0.5 rounded">
                                                        {leg.playerDetails.position} &bull; {leg.playerDetails.team}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 truncate" title={`${leg.propType} ${leg.position} ${leg.line}`}>
                                                {`${leg.propType} ${leg.position} ${leg.line}`}
                                            </p>
                                        </div>
                                
                                        {/* Controls */}
                                        <div className="flex justify-end items-center">
                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveLeg(index); }} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                                <Trash2Icon className="h-4 w-4" />
                                            </button>
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-400 ml-1 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                
                                        {/* Stats */}
                                        <div className="col-span-3 grid grid-cols-3 gap-2 text-center mt-2 border-t border-gray-700/50 pt-2">
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase">Odds</div>
                                                <div className="font-mono text-cyan-400 font-semibold">{formatAmericanOdds(leg.marketOdds)}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase">SZN Avg</div>
                                                <div className="font-mono text-gray-200">
                                                    {leg.propDetails?.historicalContext?.seasonAvg?.toFixed(1) ?? '-'}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-gray-500 uppercase">L5 Avg</div>
                                                <div className="font-mono text-gray-200">
                                                    {leg.propDetails?.historicalContext?.last5Avg?.toFixed(1) ?? '-'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && comparisonData && (
                                        <div className="mt-3 pt-3 border-t border-gray-700/50 space-y-3 animate-fade-in-slow">
                                            <h4 className="text-xs font-semibold text-gray-400 uppercase">Performance vs. Line ({comparisonData.line})</h4>
                                            
                                            {comparisonData.seasonAvg != null && (
                                                <div>
                                                    <div className="flex justify-between items-center text-xs mb-1">
                                                        <span className="text-gray-300">Season Avg.</span>
                                                        <span className={`font-mono font-semibold ${comparisonData.seasonAvg > comparisonData.line ? 'text-green-400' : 'text-red-400'}`}>
                                                            {comparisonData.seasonAvg.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="absolute h-full bg-cyan-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${comparisonData.seasonAvgPercent}%` }}
                                                        ></div>
                                                        <div
                                                            title={`Line: ${comparisonData.line}`}
                                                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-yellow-300"
                                                            style={{ left: `${comparisonData.linePercent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}

                                            {comparisonData.last5Avg != null && (
                                                <div>
                                                    <div className="flex justify-between items-center text-xs mb-1">
                                                        <span className="text-gray-300">Last 5 Avg.</span>
                                                        <span className={`font-mono font-semibold ${comparisonData.last5Avg > comparisonData.line ? 'text-green-400' : 'text-red-400'}`}>
                                                            {comparisonData.last5Avg.toFixed(1)}
                                                        </span>
                                                    </div>
                                                    <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div 
                                                            className="absolute h-full bg-cyan-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${comparisonData.last5AvgPercent}%` }}
                                                        ></div>
                                                        <div
                                                            title={`Line: ${comparisonData.line}`}
                                                            className="absolute top-0 bottom-0 border-l-2 border-dashed border-yellow-300"
                                                            style={{ left: `${comparisonData.linePercent}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Saved Parlays Section */}
                <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-300 mb-3">
                        <FolderOpenIcon className="h-5 w-5 text-cyan-400" />
                        Saved Parlays
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {savedParlays.length === 0 ? (
                            <div className="text-center text-gray-500 py-6">
                                <p>No saved parlays yet.</p>
                            </div>
                        ) : (
                            [...savedParlays].reverse().map(parlay => (
                                <div key={parlay.id} className="bg-gray-800/50 p-3 rounded-lg flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-200">{parlay.name} ({formatAmericanOdds(parlay.odds)})</p>
                                        <p className="text-xs text-gray-500">Saved on {new Date(parlay.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleLoadParlay(parlay)} className="px-3 py-1 text-xs font-semibold text-cyan-300 bg-cyan-500/10 rounded-md hover:bg-cyan-500/20 transition-colors">
                                            Load
                                        </button>
                                        <button onClick={() => handleDeleteParlay(parlay.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
                                            <Trash2Icon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Bet Builder Controls */}
            <div className="flex-shrink-0 p-4 border-t border-gray-700/50 bg-gray-900/50">
                {scheduleLoading && (
                    <div className="text-center text-gray-400 p-2">Loading NFL schedule...</div>
                )}
                {scheduleError && (
                    <div className="text-center text-yellow-400 bg-yellow-500/10 p-2 rounded-md mb-3 text-sm">{scheduleError}</div>
                )}
                 <div className="relative mb-3">
                     <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                     <input
                         type="text"
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                         placeholder="Search for game or player..."
                         className="w-full rounded-md border border-gray-600 bg-gray-700 py-2.5 pl-10 pr-4 text-gray-200 placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                         disabled={scheduleLoading}
                     />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                     <select value={selectedGameId} onChange={e => setSelectedGameId(e.target.value)} className="form-select" disabled={scheduleLoading || games.length === 0}>
                         <option value="">{scheduleLoading ? "Loading..." : "Select Game"}</option>
                         {filteredGames.map(game => <option key={game.id} value={game.id}>{game.name}</option>)}
                     </select>
                     <div className="relative">
                        <select
                            value={selectedPlayerName}
                            onChange={e => setSelectedPlayerName(e.target.value)}
                            className={`form-select ${selectedPlayer ? '!pr-20' : ''}`}
                            disabled={!selectedGameId || !hasAvailablePlayers}
                        >
                            <option value="">{selectedGameId && !hasAvailablePlayers ? 'No props available' : 'Select Player'}</option>
                            {availablePlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                        </select>
                        {selectedPlayer && (
                            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-xs font-mono bg-gray-600/80 text-gray-200 px-2 py-0.5 rounded-full pointer-events-none backdrop-blur-sm">
                                {selectedPlayer.position} &bull; {selectedPlayer.team}
                            </div>
                        )}
                    </div>
                     <select value={selectedPropType} onChange={e => setSelectedPropType(e.target.value)} className="form-select" disabled={!selectedPlayerName}>
                         <option value="">Select Prop</option>
                         {availableProps.map(p => <option key={p.propType} value={p.propType}>{p.propType}</option>)}
                     </select>
                 </div>
                 
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
                    {historicalContext && (
                        <div className="p-3 bg-gray-700/50 rounded-lg animate-fade-in border border-cyan-500/20">
                            <h4 className="flex items-center gap-2 text-sm font-semibold mb-3 text-gray-300">
                                <BarChartIcon className="h-5 w-5 text-cyan-400" />
                                Historical Performance: {selectedPlayer?.name}
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-center mb-3">
                                <div className="bg-gray-800/60 p-2 rounded-md">
                                    <div className="text-xs text-gray-400">Season Avg</div>
                                    <div className="text-lg font-bold text-gray-100">{historicalContext.seasonAvg.toFixed(1)}</div>
                                </div>
                                <div className="bg-gray-800/60 p-2 rounded-md">
                                    <div className="text-xs text-gray-400">Last 5 Avg</div>
                                    <div className="text-lg font-bold text-gray-100">{historicalContext.last5Avg.toFixed(1)}</div>
                                </div>
                            </div>
                            {selectedLineData && gameLog.length > 0 && (
                                <div className="mb-3">
                                    <h5 className="text-xs text-gray-400 px-1 mb-1 font-semibold">
                                        Hit Rate vs. Line ({selectedLineData.line})
                                    </h5>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        <div className="bg-gray-800/60 p-2 rounded-md">
                                            <div className="text-xs text-green-400 font-semibold">OVER HITS</div>
                                            <div className="text-base lg:text-lg font-bold text-gray-100">
                                                {gameLog.filter(s => s > selectedLineData.line).length}
                                                <span className="text-sm text-gray-400"> / {gameLog.length}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                ({((gameLog.filter(s => s > selectedLineData.line).length / gameLog.length) * 100).toFixed(0)}%)
                                            </div>
                                        </div>
                                        <div className="bg-gray-800/60 p-2 rounded-md">
                                            <div className="text-xs text-cyan-400 font-semibold">UNDER HITS</div>
                                            <div className="text-base lg:text-lg font-bold text-gray-100">
                                                {gameLog.filter(s => s < selectedLineData.line).length}
                                                <span className="text-sm text-gray-400"> / {gameLog.length}</span>
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                ({((gameLog.filter(s => s < selectedLineData.line).length / gameLog.length) * 100).toFixed(0)}%)
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-1">
                                <h5 className="text-xs text-gray-400 px-1">
                                    Recent Game Log {selectedLineData ? `(vs. Line ${selectedLineData.line})` : ''}
                                </h5>
                                {gameLog.length > 0 ? gameLog.map((stat, index) => {
                                    const isOver = selectedLineData ? stat > selectedLineData.line : false;
                                    const barWidth = maxGameLogStat > 0 ? (stat / maxGameLogStat) * 100 : 0;
                                    return (
                                        <div key={index} className="flex items-center gap-2 group p-1 hover:bg-gray-800/50 rounded-md">
                                            <div className="w-10 text-xs font-mono text-right text-gray-300">{stat.toFixed(1)}</div>
                                            <div className="flex-1 bg-gray-600/50 rounded-sm h-4 relative">
                                                <div
                                                    style={{ width: `${barWidth > 100 ? 100 : barWidth}%` }}
                                                    className={`h-full rounded-sm transition-all duration-300 ${isOver ? 'bg-green-500' : 'bg-cyan-600'}`}
                                                ></div>
                                                {selectedLineData && (
                                                     <div 
                                                        className="absolute top-0 bottom-0 border-l-2 border-dashed border-yellow-300"
                                                        style={{ left: `${(selectedLineData.line / maxGameLogStat) * 100}%` }}
                                                        title={`Line: ${selectedLineData.line}`}
                                                    ></div>
                                                )}
                                            </div>
                                            <div className={`w-10 text-xs font-semibold text-center opacity-0 group-hover:opacity-100 transition-opacity ${isOver ? 'text-green-400' : 'text-cyan-400'}`}>
                                                {selectedLineData ? (isOver ? 'Over' : 'Under') : ''}
                                            </div>
                                        </div>
                                    );
                                }) : <p className="text-xs text-gray-500 text-center py-2">No game log data available.</p>}
                            </div>
                        </div>
                    )}

                    {opponentInfo && (
                        <div className="grid grid-cols-3 gap-3 animate-fade-in">
                            <div className="col-span-2 p-3 bg-gray-700/50 rounded-lg text-sm border border-cyan-500/20">
                                <div className="flex items-center gap-2 font-semibold mb-2 text-gray-300">
                                    <ShieldIcon className="h-5 w-5 text-cyan-400" />
                                    <span>Opponent Profile (vs {opponentInfo.abbr})</span>
                                </div>
                                {opponentStat ? (
                                    <div className="grid grid-cols-2 gap-x-4">
                                        <span className="text-gray-400">{opponentStat.label}:</span>
                                        <span className="font-mono text-right text-white">{opponentStat.value.toFixed(1)} {opponentStat.unit}</span>
                                        <span className="text-gray-400">League Rank:</span>
                                        <span className="font-mono text-right text-white">#{opponentStat.rank}</span>
                                    </div>
                                ) : (
                                    <div className="text-center text-gray-500 py-4">
                                        <p>Select a prop to see specific defensive stats.</p>
                                    </div>
                                )}
                            </div>

                            <div className={`col-span-1 p-3 rounded-lg text-center flex flex-col justify-center items-center ${rankCategory.bgColor} border ${rankCategory.borderColor}`}>
                                 <div className="text-sm font-semibold text-gray-300 mb-1 flex items-center gap-2">
                                    <ShieldIcon className="h-4 w-4" />
                                    Overall Defense
                                </div>
                                 <div className={`text-3xl font-bold font-mono ${rankCategory.color}`}>
                                    {opponentOverallRank !== null ? `#${opponentOverallRank}` : 'N/A'}
                                </div>
                                <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full ${rankCategory.bgColor} border ${rankCategory.borderColor}`}>
                                     {rankCategory.text}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-4">
                     {availableLines.length > 0 && (
                         <div className="p-3 bg-gray-700/50 rounded-lg">
                             <label htmlFor="line-select" className="block text-sm font-medium text-gray-300 mb-2">Select Line & Position</label>
                              <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div className="relative">
                                    <select id="line-select" value={selectedLineIndex} onChange={e => setSelectedLineIndex(e.target.value)} className="form-select !pr-8">
                                        <option value="" disabled>Choose Line</option>
                                        {availableLines.map((l, index) => (
                                            <option key={`${l.line}-${index}`} value={index}>
                                                {l.line} (O: {formatAmericanOdds(l.overOdds)} / U: {formatAmericanOdds(l.underOdds)})
                                            </option>
                                        ))}
                                    </select>
                                    {referenceAverage && (
                                        <div
                                            onClick={() => setSelectedLineIndex(closestLineIndex.toString())}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full cursor-pointer hover:bg-yellow-500/30"
                                            title={`Closest line to ${referenceAverage.type} avg (${referenceAverage.value.toFixed(1)})`}
                                        >
                                            <TargetIcon className="h-3 w-3 mr-1" />
                                            Auto
                                        </div>
                                    )}
                                  </div>
                                 <div className="grid grid-cols-2 gap-1">
                                     <button onClick={() => setSelectedPosition('Over')} className={`toggle-button ${selectedPosition === 'Over' ? 'active' : ''}`}>
                                        Over {selectedLineData && <span className="odds">{formatAmericanOdds(selectedLineData.overOdds)}</span>}
                                    </button>
                                     <button onClick={() => setSelectedPosition('Under')} className={`toggle-button ${selectedPosition === 'Under' ? 'active' : ''}`}>
                                        Under {selectedLineData && <span className="odds">{formatAmericanOdds(selectedLineData.underOdds)}</span>}
                                    </button>
                                 </div>
                              </div>
                         </div>
                     )}
                     {currentOdds !== null && <OddsLineChart data={generateHistoricalOdds(currentOdds)} />}
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button onClick={handleAddLeg} disabled={isAddLegDisabled} className="col-span-1 md:col-span-1 flex items-center justify-center gap-2 action-button bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600">
                        <PlusIcon className="h-5 w-5" />
                        Add Leg
                    </button>
                    <div className="col-span-1 md:col-span-2 flex items-center justify-between rounded-lg bg-gray-800/60 p-3">
                        <div className="flex items-center gap-4">
                            <button onClick={handleSaveParlay} disabled={legs.length === 0} className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-cyan-400 disabled:opacity-50 transition-colors">
                                <SaveIcon className="h-4 w-4" /> Save
                            </button>
                            <div>
                                <span className="text-sm text-gray-400">Total Odds:</span>
                                <span className="ml-2 font-mono text-lg font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                            </div>
                        </div>
                        <button onClick={() => onAnalyze(legs)} disabled={legs.length === 0} className="action-button bg-green-500 hover:bg-green-600 disabled:bg-gray-600 h-full text-base px-6">
                            <SendIcon className="h-5 w-5" />
                            Analyze
                        </button>
                    </div>
                </div>

                 <style>{`
                     .form-select { appearance: none; background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"%3e%3cpolyline points="6 9 12 15 18 9"/%3e%3c/svg%3e'); background-position: right 0.5rem center; background-repeat: no-repeat; background-size: 1.5em 1.5em; padding-right: 2.5rem; }
                     .form-select:disabled { background-image: none; }
                     .action-button { padding: 0.625rem 1rem; border-radius: 0.375rem; font-weight: 600; color: white; transition: background-color 0.2s; }
                     .action-button:disabled { cursor: not-allowed; opacity: 0.6; }
                     .toggle-button { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 0.5rem; font-size: 0.875rem; font-weight: 600; text-align: center; border: 1px solid #4b5563; border-radius: 0.375rem; color: #d1d5db; transition: all 0.2s; }
                     .toggle-button:hover { background-color: #374151; }
                     .toggle-button.active { background-color: #0891b2; border-color: #06b6d4; color: white; }
                     .toggle-button .odds { display: block; font-size: 0.75rem; font-weight: 400; color: #9ca3af; }
                     .toggle-button.active .odds { color: #cffafe; }
                     @keyframes fade-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
                     .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                     @keyframes fade-in-slow { from { opacity: 0; } to { opacity: 1; } }
                     .animate-fade-in-slow { animation: fade-in-slow 0.4s ease-out forwards; }
                 `}</style>
            </div>
        </div>
    );
};

export default BetBuilder;
