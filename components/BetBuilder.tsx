
// FIX: Corrected a syntax error in the React import statement that was preventing the component from loading.
import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp } from '../types';
import { calculateParlayOdds, formatAmericanOdds, generateHistoricalOdds } from '../utils';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { SaveIcon } from './icons/SaveIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { SearchIcon } from './icons/SearchIcon';
import { fetchNFLEvents } from '../services/sportsDataService';
import { ShieldIcon } from './icons/ShieldIcon';
import { DEFENSIVE_STATS, TEAM_ABBREVIATION_TO_NAME, TEAM_NAME_TO_ABBREVIATION } from '../data/mockDefensiveStats';
import { MOCK_GAMES } from '../data/mockSportsData';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';
import { ADVANCED_STATS, AdvancedStat } from '../data/mockAdvancedStats';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { XIcon } from './icons/XIcon';
import { CrosshairIcon } from './icons/CrosshairIcon';
import { TrendingDownIcon } from './icons/TrendingDownIcon';
import { LineChartIcon } from './icons/LineChartIcon';
import { OddsLineChart } from './OddsLineChart';
import { ArrowDownCircleIcon } from './icons/ArrowDownCircleIcon';
import { ArrowUpCircleIcon } from './icons/ArrowUpCircleIcon';
import { StethoscopeIcon } from './icons/StethoscopeIcon';
import MicroPerformanceChart from './MicroPerformanceChart';


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

const getInjuryStatusStyle = (status: 'Healthy' | 'Questionable' | 'Probable' | 'Out') => {
    switch (status) {
        case 'Healthy':
            return { text: 'Healthy', color: 'text-green-300', bgColor: 'bg-green-500/10' };
        case 'Questionable':
            return { text: 'Questionable', color: 'text-yellow-300', bgColor: 'bg-yellow-500/10' };
        case 'Probable':
             return { text: 'Probable', color: 'text-blue-300', bgColor: 'bg-blue-500/10' };
        case 'Out':
             return { text: 'Out', color: 'text-red-300', bgColor: 'bg-red-500/10' };
    }
};

const RenderImpactText: React.FC<{ text: string; }> = ({ text }) => {
    const parts = text.split(/(KM_\d{2})/g);
    return (
        <span>
            {parts.map((part, i) => {
                if (/KM_\d{2}/.test(part)) {
                    return (
                        <span key={i} className="font-mono text-xs bg-gray-700 text-cyan-300 px-1.5 py-0.5 rounded-full ml-1">
                            {part}
                        </span>
                    );
                }
                return <React.Fragment key={i}>{part}</React.Fragment>;
            })}
        </span>
    );
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
    const [legs, setLegs] = useState<EnrichedLeg[]>([]);
    const [savedParlays, setSavedParlays] = useState<SavedParlay[]>([]);
    const [isParlayManagerOpen, setIsParlayManagerOpen] = useState(false);

    // State for live schedule data
    const [games, setGames] = useState<Game[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    // State for current leg selection
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
    const [selectedPropType, setSelectedPropType] = useState<string | null>(null);
    const [selectedLine, setSelectedLine] = useState<number | null>(null);
    const [selectedPosition, setSelectedPosition] = useState<'Over' | 'Under' | null>(null);
    const [marketOdds, setMarketOdds] = useState<number | null>(null);
    const [historicalOdds, setHistoricalOdds] = useState<number[] | null>(null);

    // Fetch schedule data on mount
    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setScheduleLoading(true);
                setScheduleError(null);
                const fetchedGames = await fetchNFLEvents();
                setGames(fetchedGames);
            } catch (error) {
                console.error("Failed to fetch NFL events:", error);
                setScheduleError("Could not load schedule. Using mock data.");
                setGames(MOCK_GAMES);
            } finally {
                setScheduleLoading(false);
            }
        };
        loadSchedule();
    }, []);

    // Load saved parlays from localStorage on mount
    useEffect(() => {
        try {
            const storedParlays = localStorage.getItem(SAVED_PARLAYS_LIST_KEY);
            if (storedParlays) {
                setSavedParlays(JSON.parse(storedParlays));
            }
        } catch (error) {
            console.error("Failed to load saved parlays from localStorage:", error);
        }
    }, []);
    
    // Generate historical odds when market odds are selected
    useEffect(() => {
        if (marketOdds !== null) {
            setHistoricalOdds(generateHistoricalOdds(marketOdds));
        } else {
            setHistoricalOdds(null);
        }
    }, [marketOdds]);

    const getLegContext = (leg: EnrichedLeg, allGames: Game[]) => {
        const playerTeamName = TEAM_ABBREVIATION_TO_NAME[leg.playerDetails?.team ?? ''];
        const game = allGames.find(g => g.players.some(p => p.name === leg.player));
        if (!game || !playerTeamName) return { opponentAbbr: null, matchupFavorability: null };

        const gameTeams = game.name.split(' @ ');
        const opponentTeamName = gameTeams.find(team => team !== playerTeamName);
        if (!opponentTeamName) return { opponentAbbr: null, matchupFavorability: null };

        const opponentAbbr = TEAM_NAME_TO_ABBREVIATION[opponentTeamName] || 'N/A';
        
        const opponentDefensiveStats = DEFENSIVE_STATS[opponentTeamName];
        if (!opponentDefensiveStats) return { opponentAbbr, matchupFavorability: null };

        let matchupFavorability: 'Favorable' | 'Tough' | null = null;
        
        const playerPosition = leg.playerDetails?.position;
        let positionalKey;
        if (['Receiving Yards', 'Receptions'].includes(leg.propType)) {
            if (playerPosition === 'TE') positionalKey = 'vsTE';
            else if (playerPosition === 'WR') positionalKey = 'vsWR'; 
        }
        const statKey = positionalKey && opponentDefensiveStats[positionalKey] ? positionalKey : leg.propType;
        const statData = opponentDefensiveStats[statKey];

        if (statData && 'value' in statData) {
            const isFavorable = (leg.position === 'Over' && leg.line < statData.value) || (leg.position === 'Under' && leg.line > statData.value);
            matchupFavorability = isFavorable ? 'Favorable' : 'Tough';
        }

        return { opponentAbbr, matchupFavorability };
    };

    const resetSelection = (keepPlayer = false) => {
        if (!keepPlayer) {
            setSelectedPlayerName(null);
        }
        setSelectedPropType(null);
        setSelectedLine(null);
        setSelectedPosition(null);
        setMarketOdds(null);
    };

    // Derived state for selected items
    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId), [games, selectedGameId]);
    const selectedPlayer = useMemo(() => selectedGame?.players.find(p => p.name === selectedPlayerName), [selectedGame, selectedPlayerName]);
    const selectedProp = useMemo(() => selectedPlayer?.props.find(p => p.propType === selectedPropType), [selectedPlayer, selectedPropType]);
    const selectedLineDetails = useMemo(() => selectedProp?.lines.find(l => l.line === selectedLine), [selectedProp, selectedLine]);

    const handleAddLeg = () => {
        if (!selectedPlayer || !selectedPropType || selectedLine === null || !selectedPosition || marketOdds === null) return;
        
        const newLeg: EnrichedLeg = {
            player: selectedPlayer.name,
            propType: selectedPropType,
            line: selectedLine,
            position: selectedPosition,
            marketOdds: marketOdds,
            playerDetails: selectedPlayer,
            propDetails: selectedProp
        };
        setLegs(prev => [...prev, newLeg]);
        resetSelection(true); // Keep player selected for easier multi-leg add
    };

    const handleRemoveLeg = (index: number) => {
        setLegs(prev => prev.filter((_, i) => i !== index));
    };

    const parlayOdds = useMemo(() => calculateParlayOdds(legs), [legs]);

    const filteredGames = useMemo(() => {
        if (!searchTerm) return games;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return games.filter(game =>
            game.name.toLowerCase().includes(lowerSearchTerm) ||
            game.players.some(player => player.name.toLowerCase().includes(lowerSearchTerm))
        );
    }, [games, searchTerm]);

    const opponentInfo = useMemo((): OpponentInfo | null => {
        if (!selectedGame || !selectedPlayer) return null;
        
        const gameTeams = selectedGame.name.split(' @ ');
        const playerTeamName = TEAM_ABBREVIATION_TO_NAME[selectedPlayer.team];
        const opponentTeamName = gameTeams.find(team => team !== playerTeamName);
        if (!opponentTeamName) return null;

        const opponentDefensiveStats = DEFENSIVE_STATS[opponentTeamName];
        const overallRank = opponentDefensiveStats ? opponentDefensiveStats.overall.rank : null;

        return {
            fullName: opponentTeamName,
            abbr: TEAM_NAME_TO_ABBREVIATION[opponentTeamName] || 'N/A',
            overallRank: overallRank,
        };
    }, [selectedGame, selectedPlayer]);

    const opponentStat = useMemo((): DisplayableOpponentStat | null => {
        if (!opponentInfo || !selectedPlayer || !selectedPropType) return null;
    
        const opponentDefensiveStats = DEFENSIVE_STATS[opponentInfo.fullName];
        if (!opponentDefensiveStats) return null;
    
        // Determine the positional key, e.g., 'vsTE', 'vsWR'
        let positionalKey;
        const playerPosition = selectedPlayer.position;
        if (['Receiving Yards', 'Receptions'].includes(selectedPropType)) {
             if (playerPosition === 'TE') positionalKey = 'vsTE';
             // A more complex system could determine WR1/WR2, but for now we'll use a general key
             else if (playerPosition === 'WR') positionalKey = 'vsWR'; 
        }
        
        const statKey = positionalKey && opponentDefensiveStats[positionalKey] ? positionalKey : selectedPropType;
        const statData = opponentDefensiveStats[statKey];

        if (statData && 'value' in statData && 'rank' in statData && 'unit' in statData) {
            return {
                opponentAbbr: opponentInfo.abbr,
                value: statData.value,
                rank: statData.rank,
                unit: statData.unit,
                label: positionalKey ? `Yards Allowed (${playerPosition})` : getConciseStatLabel(selectedPropType),
            };
        }
        return null;
    }, [opponentInfo, selectedPlayer, selectedPropType]);
    
    const advancedPlayerStats = useMemo((): AdvancedStat[] | null => {
        if (!selectedPlayerName || !selectedPropType) return null;
        return ADVANCED_STATS[selectedPlayerName]?.[selectedPropType] || null;
    }, [selectedPlayerName, selectedPropType]);

    const handleSaveParlay = () => {
        if (legs.length < 1) return;
        const defaultName = legs.length > 1 ? `My ${legs.length}-Leg Parlay` : `${legs[0].player} Prop`;
        const parlayName = prompt("Enter a name for this bet:", defaultName);
        if (parlayName && parlayName.trim()) {
            const newParlay: SavedParlay = {
                id: new Date().toISOString() + Math.random(),
                name: parlayName.trim(),
                odds: parlayOdds,
                legs: legs.map(({playerDetails, propDetails, ...leg}) => leg), // Strip enriched data
                createdAt: new Date().toISOString(),
            };
            const updatedParlays = [...savedParlays, newParlay];
            setSavedParlays(updatedParlays);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
        }
    };
    
    const handleDeleteParlay = (id: string) => {
        if (window.confirm("Are you sure you want to delete this parlay? This action cannot be undone.")) {
            const updatedParlays = savedParlays.filter(p => p.id !== id);
            setSavedParlays(updatedParlays);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
        }
    };
    
    const handleLoadParlay = (parlay: SavedParlay) => {
        const enrichedLegs: EnrichedLeg[] = parlay.legs.map(leg => {
            let playerDetails: Player | undefined;
            let propDetails: PlayerProp | undefined;

            const gameWithPlayer = games.find(g => g.players.some(p => p.name === leg.player));
            if (gameWithPlayer) {
                playerDetails = gameWithPlayer.players.find(p => p.name === leg.player);
                if (playerDetails) {
                    propDetails = playerDetails.props.find(p => p.propType === leg.propType);
                }
            }

            return { ...leg, playerDetails, propDetails };
        });
        setLegs(enrichedLegs);
        setIsParlayManagerOpen(false);
    };

    if (scheduleLoading) {
         return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <p className="mt-4 text-gray-300">Loading NFL Schedule...</p>
            </div>
         );
    }
    
    return (
        <div className="relative flex flex-1 flex-col h-full overflow-hidden">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                 <button onClick={onBack} className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                </button>
                <h2 className="text-xl font-semibold text-gray-200">Bet Builder</h2>
                <div></div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left: Selection Panel */}
                <div className="w-1/2 border-r border-gray-700/50 flex flex-col overflow-y-auto p-4">
                     {/* Game/Player Search */}
                    <div className="relative mb-4">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search games or players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full rounded-lg border border-gray-600 bg-gray-900 py-2 pl-10 pr-4 text-gray-200 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>
                    
                    {/* Game List */}
                    <div className="space-y-2">
                        {filteredGames.map(game => (
                            <div key={game.id} className={`rounded-lg transition-colors ${selectedGameId === game.id ? 'bg-gray-800' : 'bg-gray-900/50'}`}>
                                <button onClick={() => { setSelectedGameId(game.id); resetSelection(); }} className="w-full text-left p-3 font-semibold text-gray-300 hover:bg-gray-800/70 rounded-t-lg">
                                    {game.name}
                                </button>
                                {selectedGameId === game.id && (
                                    <div className="p-3 border-t border-gray-700 space-y-2">
                                        {game.players.map(player => {
                                            const lowerSearchTerm = searchTerm.trim().toLowerCase();
                                            const isPlayerMatch = lowerSearchTerm && player.name.toLowerCase().includes(lowerSearchTerm);

                                            return (
                                                <button
                                                    key={player.name}
                                                    onClick={() => {setSelectedPlayerName(player.name); resetSelection(true);}}
                                                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedPlayerName === player.name ? 'bg-cyan-500/10' : 'hover:bg-gray-700/50'}`}
                                                >
                                                    <span className="font-medium text-gray-200">
                                                        {isPlayerMatch ? (
                                                            <>
                                                                {player.name.split(new RegExp(`(${searchTerm.trim()})`, 'gi')).filter(Boolean).map((part, index) =>
                                                                    part.toLowerCase() === lowerSearchTerm ? (
                                                                        <span key={index} className="bg-yellow-500/20 text-yellow-300 rounded-sm px-0.5">{part}</span>
                                                                    ) : (
                                                                        part
                                                                    )
                                                                )}
                                                            </>
                                                        ) : (
                                                            player.name
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-gray-500 ml-2">{player.position} - {player.team}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Bet Slip & Context */}
                <div className="w-1/2 flex flex-col overflow-y-auto">
                    {/* Prop Selection Form */}
                    <div className="p-4 border-b border-gray-700/50 bg-gray-900/80 space-y-4">
                        {selectedPlayer && (
                            <div>
                                <h3 className="font-semibold text-lg text-gray-200 mb-2">Build Leg for {selectedPlayer.name}</h3>
                                
                                <div className="mb-3">
                                    <label className="text-sm font-medium text-gray-400 block mb-1">Select Prop</label>
                                    <select 
                                        value={selectedPropType || ''} 
                                        onChange={e => { setSelectedPropType(e.target.value); setSelectedLine(null); setSelectedPosition(null); }}
                                        className="w-full rounded-md border-gray-600 bg-gray-800 text-white focus:border-cyan-500 focus:ring-cyan-500"
                                    >
                                        <option value="" disabled>Choose a market</option>
                                        {selectedPlayer.props.map(p => <option key={p.propType} value={p.propType}>{p.propType}</option>)}
                                    </select>
                                </div>

                                {selectedProp && (
                                    <div className="p-3 rounded-md bg-gray-800/70">
                                        <label className="text-sm font-medium text-gray-400 block mb-2">Select Line & Position</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <select 
                                                value={selectedLine || ''} 
                                                onChange={e => { setSelectedLine(parseFloat(e.target.value)); setSelectedPosition(null); }}
                                                className="w-full rounded-md border-gray-600 bg-gray-700 text-white focus:border-cyan-500 focus:ring-cyan-500"
                                            >
                                                <option value="" disabled>Select line</option>
                                                {selectedProp.lines.map(l => <option key={l.line} value={l.line}>{l.line}</option>)}
                                            </select>
                                            
                                            {selectedLineDetails && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button 
                                                        onClick={() => { setSelectedPosition('Over'); setMarketOdds(selectedLineDetails.overOdds); }}
                                                        className={`p-2 rounded-md text-sm font-semibold transition-colors ${selectedPosition === 'Over' ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                                                    >
                                                        Over <span className="font-mono">{formatAmericanOdds(selectedLineDetails.overOdds)}</span>
                                                    </button>
                                                    <button 
                                                        onClick={() => { setSelectedPosition('Under'); setMarketOdds(selectedLineDetails.underOdds); }}
                                                        className={`p-2 rounded-md text-sm font-semibold transition-colors ${selectedPosition === 'Under' ? 'bg-cyan-500 text-white' : 'bg-gray-600 hover:bg-gray-500'}`}
                                                    >
                                                        Under <span className="font-mono">{formatAmericanOdds(selectedLineDetails.underOdds)}</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedProp && opponentInfo && (
                            <div className="space-y-3 p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                                    <CrosshairIcon className="h-4 w-4" />
                                    Contextual HUD
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedProp.historicalContext ? (
                                        <>
                                            <div className="text-center bg-gray-800/50 p-2 rounded-md">
                                                <p className="text-xs text-gray-400">Season Avg</p>
                                                <p className="font-mono text-lg font-semibold text-gray-200">{selectedProp.historicalContext.seasonAvg.toFixed(1)}</p>
                                            </div>
                                            <div className="text-center bg-gray-800/50 p-2 rounded-md">
                                                <p className="text-xs text-gray-400">Last 5 Avg</p>
                                                <p className="font-mono text-lg font-semibold text-gray-200">{selectedProp.historicalContext.last5Avg.toFixed(1)}</p>
                                            </div>
                                        </>
                                    ) : null}
                                </div>

                                {historicalOdds && marketOdds !== null && (
                                    <div className="pt-4 border-t border-gray-700/50">
                                        <h5 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                                            <LineChartIcon className="h-4 w-4" />
                                            7-Day Odds Movement
                                        </h5>
                                        <OddsLineChart data={historicalOdds} />
                                    </div>
                                )}

                                {selectedProp?.historicalContext?.gameLog && selectedLine !== null && (
                                    <div className="pt-4 border-t border-gray-700/50">
                                        <HistoricalPerformanceChart 
                                            gameLog={selectedProp.historicalContext.gameLog}
                                            selectedLine={selectedLine}
                                            seasonAvg={selectedProp.historicalContext.seasonAvg}
                                            last5Avg={selectedProp.historicalContext.last5Avg}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {advancedPlayerStats && (
                            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400 mb-3">
                                    <TrendingUpIcon className="h-4 w-4"/>
                                    Advanced Player Metrics
                                </h4>
                                <div className="space-y-2">
                                    {advancedPlayerStats.map(stat => (
                                        <div key={stat.abbreviation} className="text-xs group relative">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">{stat.name} ({stat.abbreviation})</span>
                                                <span className="font-mono text-gray-200">{stat.value.toFixed(2)}</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${stat.percentile}%`}}></div>
                                            </div>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                               <strong className="font-semibold text-cyan-400">{stat.name} ({stat.abbreviation})</strong>
                                               <p className="mt-1">{stat.description}</p>
                                               <p className="mt-1 text-gray-400">Rank: {stat.rank} | Percentile: {stat.percentile}th</p>
                                           </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedPlayer?.injuryStatus && (
                            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                                        <StethoscopeIcon className="h-4 w-4" />
                                        Injury Status
                                    </h4>
                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getInjuryStatusStyle(selectedPlayer.injuryStatus.status).bgColor} ${getInjuryStatusStyle(selectedPlayer.injuryStatus.status).color}`}>
                                        {selectedPlayer.injuryStatus.status}
                                    </div>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div>
                                        <strong className="text-gray-400 block">Recent News:</strong>
                                        <p className="text-gray-300">{selectedPlayer.injuryStatus.news}</p>
                                    </div>
                                    <div>
                                        <strong className="text-gray-400 block">Impact Analysis:</strong>
                                        <p className="text-gray-300">
                                            <RenderImpactText text={selectedPlayer.injuryStatus.impact} />
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedProp && opponentInfo && (
                            <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400">
                                        <ShieldIcon className="h-4 w-4" />
                                        Defensive Matchup
                                    </h4>
                                    <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRankCategory(opponentInfo.overallRank).bgColor} ${getRankCategory(opponentInfo.overallRank).color}`}>
                                        #{opponentInfo.overallRank || 'N/A'} Overall D
                                    </div>
                                </div>
                                
                                {(() => {
                                    if (!opponentStat) {
                                        return <p className="text-xs text-gray-500 text-center py-2">No specific defensive data for this prop.</p>;
                                    }

                                    if (selectedLine !== null && selectedPosition !== null) {
                                        const isFavorable = (selectedPosition === 'Over' && selectedLine < opponentStat.value) || (selectedPosition === 'Under' && selectedLine > opponentStat.value);
                                        
                                        const favorableStyle = {
                                            verdict: 'Favorable',
                                            icon: <ArrowDownCircleIcon className="h-5 w-5 text-green-300" />,
                                            textColor: 'text-green-300',
                                        };
                                        const toughStyle = {
                                            verdict: 'Tough',
                                            icon: <ArrowUpCircleIcon className="h-5 w-5 text-red-300" />,
                                            textColor: 'text-red-300',
                                        };

                                        const style = isFavorable ? favorableStyle : toughStyle;

                                        const line = selectedLine;
                                        const allowed = opponentStat.value;
                                        const buffer = Math.abs(line - allowed) * 0.2;
                                        const rangeMin = Math.min(line, allowed) - buffer;
                                        const rangeMax = Math.max(line, allowed) + buffer;
                                        const range = rangeMax - rangeMin;

                                        const linePosition = range > 0 ? ((line - rangeMin) / range) * 100 : 50;
                                        const allowedPosition = range > 0 ? ((allowed - rangeMin) / range) * 100 : 50;

                                        return (
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-400">Matchup Verdict:</span>
                                                    <div className={`flex items-center gap-1.5 font-semibold ${style.textColor}`}>
                                                        {style.icon}
                                                        {style.verdict}
                                                    </div>
                                                </div>

                                                <div className="relative h-6 pt-5" aria-label={`Comparison of selected line ${line} against opponent allowed average ${allowed.toFixed(1)}`}>
                                                    <div className={`h-2 rounded-full ${isFavorable ? 'bg-gradient-to-r from-green-500/20 to-red-500/20' : 'bg-gradient-to-r from-red-500/20 to-green-500/20'}`}></div>
                                                    
                                                    <div className="absolute top-0" style={{ left: `${linePosition}%`, transform: 'translateX(-50%)' }}>
                                                        <div className="w-px h-4 bg-yellow-300 mx-auto"></div>
                                                        <div className="text-xs font-bold text-yellow-300 text-center">{line}</div>
                                                        <div className="text-[10px] text-gray-400 text-center leading-tight">Line</div>
                                                    </div>

                                                    <div className="absolute top-0" style={{ left: `${allowedPosition}%`, transform: 'translateX(-50%)' }}>
                                                        <div className="w-px h-4 bg-cyan-300 mx-auto"></div>
                                                        <div className="text-xs font-bold text-cyan-300 text-center">{allowed.toFixed(1)}</div>
                                                        <div className="text-[10px] text-gray-400 text-center leading-tight">Allowed</div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-xs text-gray-400 pt-3 border-t border-gray-700/50">
                                                    <div className="flex justify-between">
                                                        <span>{opponentStat.label}:</span>
                                                        <span className="font-mono">{opponentStat.value.toFixed(1)} {opponentStat.unit}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>League Rank (vs {selectedPlayer?.position}):</span>
                                                        <span className={`font-mono font-semibold ${getRankCategory(opponentStat.rank).color}`}>{opponentStat.rank} / 32</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="text-xs text-gray-400 space-y-1">
                                            <div className="flex justify-between">
                                                <span>{opponentStat.label}:</span>
                                                <span className="font-mono">{opponentStat.value.toFixed(1)} {opponentStat.unit}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>League Rank (vs {selectedPlayer?.position}):</span>
                                                <span className={`font-mono font-semibold ${getRankCategory(opponentStat.rank).color}`}>{opponentStat.rank} / 32</span>
                                            </div>
                                            <p className="text-center pt-2 text-gray-500">Select a line and position to see favorability.</p>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                        <button
                            onClick={handleAddLeg}
                            disabled={!selectedPosition || !marketOdds}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                        >
                            <PlusIcon className="h-5 w-5" />
                            Add Leg to Bet Slip
                        </button>
                    </div>

                    {/* Bet Slip */}
                    <div className="flex-1 p-4 bg-gray-800/50">
                        <h3 className="text-lg font-semibold text-gray-200 mb-3">Bet Slip</h3>
                        {legs.length === 0 ? (
                            <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-700 rounded-lg h-full flex flex-col justify-center">
                                <p>Your bet slip is empty.</p>
                                <p className="text-xs mt-1">Select a player and prop to build your bet.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex-1 space-y-2 overflow-y-auto pr-2">
                                    {legs.map((leg, index) => {
                                        const context = getLegContext(leg, games);
                                        const propContext = leg.propDetails?.historicalContext;

                                        return (
                                            <div key={index} className="bg-gray-900/70 p-3 rounded-lg border border-gray-700/50">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-gray-200">{leg.player}</p>
                                                        <p className="text-sm text-gray-400">{leg.position} {leg.line} {leg.propType}</p>
                                                        <p className="text-xs text-gray-500 mt-1">vs {context.opponentAbbr || 'N/A'}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="font-mono font-semibold text-lg text-yellow-300">{formatAmericanOdds(leg.marketOdds)}</p>
                                                        <button onClick={() => handleRemoveLeg(index)} className="mt-1 text-red-400 hover:text-red-300">
                                                            <Trash2Icon className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                {propContext && (
                                                    <div className="border-t border-gray-700/50 mt-2 pt-2 flex items-center justify-between">
                                                        <MicroPerformanceChart gameLog={propContext.gameLog || []} selectedLine={leg.line} />
                                                        {context.matchupFavorability && (
                                                            <div className={`text-xs font-semibold px-2 py-0.5 rounded-full ${context.matchupFavorability === 'Favorable' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                                                {context.matchupFavorability} Matchup
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-700/50">
                                     <div className="flex justify-between items-center text-lg mb-3">
                                        <span className="font-semibold text-gray-300">Total Odds:</span>
                                        <span className="font-mono font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleSaveParlay}
                                            disabled={legs.length === 0}
                                            className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <SaveIcon className="h-4 w-4" />
                                        </button>
                                        <button 
                                            onClick={() => setIsParlayManagerOpen(true)}
                                            className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-500"
                                        >
                                            <FolderOpenIcon className="h-4 w-4" />
                                        </button>
                                         <button 
                                            onClick={() => onAnalyze(legs.map(({playerDetails, propDetails, ...leg}) => leg))}
                                            disabled={legs.length === 0}
                                            className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                                        >
                                            <SendIcon className="h-5 w-5" />
                                            Analyze
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isParlayManagerOpen && (
                 <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
                    onClick={() => setIsParlayManagerOpen(false)}
                >
                    <div className="relative w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <button 
                            onClick={() => setIsParlayManagerOpen(false)} 
                            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-white transition-colors hover:bg-gray-600"
                            aria-label="Close parlay manager"
                        >
                            <XIcon className="h-5 w-5" />
                        </button>
                        <h3 className="text-xl font-semibold text-gray-200 mb-4">Saved Parlays</h3>
                        
                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                           {savedParlays.length > 0 ? (
                                savedParlays.map(parlay => (
                                    <div key={parlay.id} className="bg-gray-800/50 p-3 rounded-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-200">{parlay.name}</p>
                                                <p className="text-xs text-gray-400">{parlay.legs.length} leg(s) &bull; Created {new Date(parlay.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-mono text-lg font-bold text-yellow-300">{formatAmericanOdds(parlay.odds)}</p>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-end gap-2">
                                            <button 
                                                onClick={() => handleDeleteParlay(parlay.id)}
                                                className="px-3 py-1 text-xs font-semibold rounded-md bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                            >
                                                Delete
                                            </button>
                                            <button 
                                                onClick={() => handleLoadParlay(parlay)}
                                                className="px-3 py-1 text-xs font-semibold rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                                            >
                                                Load
                                            </button>
                                        </div>
                                    </div>
                                ))
                           ) : (
                                <p className="text-center text-gray-500 py-8">You have no saved parlays.</p>
                           )}
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
};

export default BetBuilder;
