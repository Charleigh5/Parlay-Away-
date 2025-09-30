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

    const calculateGameLogStats = (gameLog: number[], line: number, position: 'Over' | 'Under') => {
      if (!gameLog || gameLog.length === 0) {
          return null;
      }
      const count = gameLog.filter(stat => position === 'Over' ? stat > line : stat < line).length;
      return `${position} in ${count} of last ${gameLog.length} games`;
    };
    
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
                            const gameLogStats = leg.propDetails?.historicalContext?.gameLog
                                ? calculateGameLogStats(leg.propDetails.historicalContext.gameLog, leg.line, leg.position)
                                : null;

                            return (
                                <div key={index} className="bg-gray-800/70 p-3 rounded-lg flex items-center justify-between gap-2 animate-fade-in">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-200">{leg.player}</p>
                                            {leg.playerDetails && (
                                                 <span className="text-xs font-mono bg-gray-700 text-cyan-300 px-1.5 py-0.5 rounded">
                                                    {leg.playerDetails.position} &bull; {leg.playerDetails.team}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">{`${leg.propType} ${leg.position} ${leg.line}`}</p>
                                        {leg.propDetails?.historicalContext && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                Season Avg: {leg.propDetails.historicalContext.seasonAvg.toFixed(1)} | Last 5 Avg: {leg.propDetails.historicalContext.last5Avg.toFixed(1)}
                                            </p>
                                        )}
                                        {gameLogStats && (
                                            <p className="text-xs text-cyan-300/80 mt-1 font-mono bg-cyan-900/20 inline-block px-2 py-0.5 rounded">
                                                <TargetIcon className="inline h-3 w-3 mr-1" />
                                                {gameLogStats}
                                            </p>
                                        )}
                                    </div>
                                    <div className="font-mono text-cyan-400 text-lg">{formatAmericanOdds(leg.marketOdds)}</div>
                                     <button onClick={() => handleRemoveLeg(index)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                        <Trash2Icon className="h-4 w-4" />
                                    </button>
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
                     <select value={selectedPlayerName} onChange={e => setSelectedPlayerName(e.target.value)} className="form-select" disabled={!selectedGameId || !hasAvailablePlayers}>
                         <option value="">{selectedGameId && !hasAvailablePlayers ? 'No props available' : 'Select Player'}</option>
                         {availablePlayers.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                     </select>
                     <select value={selectedPropType} onChange={e => setSelectedPropType(e.target.value)} className="form-select" disabled={!selectedPlayerName}>
                         <option value="">Select Prop</option>
                         {availableProps.map(p => <option key={p.propType} value={p.propType}>{p.propType}</option>)}
                     </select>
                 </div>
                 
                {opponentInfo && (
                    <div className="my-3 grid grid-cols-3 gap-3 animate-fade-in">
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
                            <div className={`mt-1 text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${rankCategory.bgColor} ${rankCategory.color}`}>
                                {rankCategory.text}
                            </div>
                        </div>
                    </div>
                )}


                {availableLines.length > 0 && (
                    <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-2 border-t border-b border-gray-700/50 py-3">
                        <h4 className="text-sm font-semibold text-gray-400 px-1">Select Line:</h4>
                        {availableLines.map((line, index) => {
                            const isSelected = selectedLineIndex === index.toString();
                            const isClosestToAverage = index === closestLineIndex && referenceAverage !== null;
                            const overOddsHistory = generateHistoricalOdds(line.overOdds);
                            const underOddsHistory = generateHistoricalOdds(line.underOdds);

                            let averageIndicator: React.ReactNode = null;
                            if (referenceAverage) {
                                const isLineAboveAvg = line.line > referenceAverage.value;
                                const indicatorColor = isLineAboveAvg ? 'text-red-400' : 'text-green-400';
                                const indicatorSymbol = isLineAboveAvg ? '▲' : '▼';
                                averageIndicator = (
                                    <span className={`text-xs font-mono ml-2 ${indicatorColor}`}>
                                        {indicatorSymbol} vs {referenceAverage.type} Avg ({referenceAverage.value.toFixed(1)})
                                    </span>
                                );
                            }
                            
                            const containerClasses = ['p-2', 'rounded-lg', 'border', 'cursor-pointer', 'transition-all', 'relative'];
                            if (isSelected) {
                                containerClasses.push('bg-cyan-500/10', 'border-cyan-500', 'ring-2', 'ring-cyan-500/50');
                            } else if (isClosestToAverage) {
                                containerClasses.push('bg-yellow-500/10', 'border-yellow-500/80');
                            } else {
                                containerClasses.push('bg-gray-800/50', 'border-gray-700', 'hover:border-gray-600');
                            }

                            return (
                                <div 
                                    key={index}
                                    onClick={() => setSelectedLineIndex(index.toString())}
                                    className={containerClasses.join(' ')}
                                >
                                    {isClosestToAverage && (
                                        <div className="absolute -top-2.5 -right-2.5 text-yellow-300 bg-gray-800 rounded-full p-1 leading-none border border-yellow-500/50" title={`Closest line to ${referenceAverage?.type} average of ${referenceAverage?.value.toFixed(1)}`}>
                                            <TargetIcon className="h-4 w-4" />
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-gray-200 flex items-center flex-wrap">
                                            <span>{line.line}</span>
                                            {averageIndicator}
                                        </div>
                                        <div className="flex gap-4 font-mono text-xs">
                                            <span>Over: {formatAmericanOdds(line.overOdds)}</span>
                                            <span>Under: {formatAmericanOdds(line.underOdds)}</span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-gray-700/50">
                                        <div>
                                            <OddsLineChart data={overOddsHistory} />
                                        </div>
                                        <div>
                                            <OddsLineChart data={underOddsHistory} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                 <div className="flex items-center gap-3 mb-4">
                    <div className="flex rounded-md bg-gray-700 border border-gray-600">
                        <button onClick={() => setSelectedPosition('Over')} className={`px-4 py-2 text-sm font-semibold rounded-l-md transition-colors ${selectedPosition === 'Over' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Over</button>
                        <button onClick={() => setSelectedPosition('Under')} className={`px-4 py-2 text-sm font-semibold rounded-r-md transition-colors ${selectedPosition === 'Under' ? 'bg-cyan-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Under</button>
                    </div>
                    <div className="text-gray-400 text-sm">Odds: <span className="font-mono font-semibold text-lg text-cyan-300">{currentOdds ? formatAmericanOdds(currentOdds) : '...'}</span></div>
                    <button onClick={handleAddLeg} disabled={isAddLegDisabled} className="ml-auto flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <PlusIcon className="h-5 w-5" />
                        Add Leg
                    </button>
                </div>
                 <div className="border-t border-gray-700 pt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-2 items-center">
                        <div>
                            <span className="text-gray-400">Parlay Odds: </span>
                            <span className="font-mono text-2xl font-bold text-yellow-300">{parlayOdds ? formatAmericanOdds(parlayOdds) : '-'}</span>
                        </div>
                        <button onClick={handleSaveParlay} disabled={legs.length === 0} className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-700 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed">
                            <SaveIcon className="h-5 w-5" />
                            Save Parlay
                        </button>
                    </div>
                    <button
                        onClick={() => onAnalyze(legs)}
                        disabled={legs.length < 2}
                        title={legs.length < 2 ? "A parlay requires at least 2 legs for analysis." : "Analyze the constructed parlay"}
                        className="flex w-full sm:flex-1 items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                         <SendIcon className="h-5 w-5" />
                         Analyze Bet
                     </button>
                 </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
                .form-select {
                    -webkit-appearance: none;
                    -moz-appearance: none;
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
                    background-position: right 0.5rem center;
                    background-repeat: no-repeat;
                    background-size: 1.5em 1.5em;
                    padding-right: 2.5rem;
                    width: 100%;
                    border-radius: 0.375rem;
                    border: 1px solid rgb(75 85 99);
                    background-color: rgb(55 65 81);
                    padding: 0.75rem 1rem;
                    color: rgb(229 231 235);
                }
                .form-select:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .form-select:focus {
                     outline: 2px solid transparent;
                     outline-offset: 2px;
                     border-color: rgb(34 211 238);
                     box-shadow: 0 0 0 1px rgb(34 211 238);
                }
            `}</style>
        </div>
    );
};

export default BetBuilder;