
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
        if (!opponentInfo || !selectedPropType) return null;

        const opponentDefensiveStats = DEFENSIVE_STATS[opponentInfo.fullName];
        if (!opponentDefensiveStats || !opponentDefensiveStats[selectedPropType]) return null;
        
        const statData = opponentDefensiveStats[selectedPropType];
        
        if ('value' in statData && 'rank' in statData && 'unit' in statData) {
            return {
                opponentAbbr: opponentInfo.abbr,
                value: statData.value,
                rank: statData.rank,
                unit: statData.unit,
                label: getConciseStatLabel(selectedPropType),
            };
        }
        return null;
    }, [opponentInfo, selectedPropType]);
    
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
                    {selectedPlayer && (
                        <div className="p-4 border-b border-gray-700/50 bg-gray-900/80">
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

                             {selectedProp && opponentInfo && (
                                <div className="mt-4 p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-cyan-400 mb-3">
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
                                        
                                        {selectedPropType && opponentStat && opponentInfo && (
                                            <div className="col-span-2">
                                                { selectedLine === null ? (
                                                    // State 1: Neutral opponent info display
                                                    <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                                                        <h5 className="font-semibold text-gray-200 text-center mb-2">Matchup vs. {opponentInfo.abbr}</h5>
                                                        <div className="flex justify-around items-center text-center">
                                                            <div>
                                                                 <p className="text-xs text-gray-400">Overall D Rank</p>
                                                                 <p className="font-mono text-xl font-bold text-gray-200">#{opponentInfo.overallRank}</p>
                                                            </div>
                                                             <div>
                                                                <p className="text-xs text-gray-400">{getConciseStatLabel(selectedPropType)}</p>
                                                                <div className="flex items-baseline justify-center gap-2">
                                                                    <p className="font-mono text-xl font-bold text-gray-200">{opponentStat.value.toFixed(1)}</p>
                                                                    <div className={`text-xs font-semibold px-1.5 py-0.5 rounded-full inline-block ${getRankCategory(opponentStat.rank).bgColor} ${getRankCategory(opponentStat.rank).color}`}>
                                                                        (Rank #{opponentStat.rank})
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                         <p className="text-center text-xs text-yellow-400 mt-3 pt-2 border-t border-gray-700">Select a line to see detailed matchup analysis.</p>
                                                    </div>
                                                ) : (
                                                    // State 2: Full comparison display
                                                    (() => {
                                                        const diff = selectedLine - opponentStat.value;
                                                        const isFavorable = (selectedPosition === 'Over' && diff < 0) || (selectedPosition === 'Under' && diff > 0);
                                                        
                                                        let style, icon, assessmentText;
                                
                                                        if (!selectedPosition) {
                                                            style = {
                                                                borderColor: 'border-yellow-500/30',
                                                                bgColor: 'bg-yellow-500/10',
                                                                textColor: 'text-yellow-300',
                                                                innerBgColor: 'bg-yellow-500/10',
                                                            };
                                                            assessmentText = "Select Over/Under to assess matchup";
                                                        } else if (isFavorable) {
                                                            style = {
                                                                borderColor: 'border-green-500/30',
                                                                bgColor: 'bg-green-500/10',
                                                                textColor: 'text-green-300',
                                                                innerBgColor: 'bg-green-500/20',
                                                            };
                                                            icon = <TrendingDownIcon className="h-4 w-4 mr-1.5" />;
                                                            assessmentText = `Favorable matchup for ${selectedPosition}`;
                                                        } else { // isHarder
                                                            style = {
                                                                borderColor: 'border-red-500/30',
                                                                bgColor: 'bg-red-500/10',
                                                                textColor: 'text-red-300',
                                                                innerBgColor: 'bg-red-500/20',
                                                            };
                                                            icon = <TrendingUpIcon className="h-4 w-4 mr-1.5" />;
                                                            assessmentText = `Tougher matchup for ${selectedPosition}`;
                                                        }
                                
                                                        return (
                                                            <div className={`p-3 rounded-lg border ${style.borderColor} ${style.bgColor}`}>
                                                                <div className="grid grid-cols-3 items-center text-center">
                                                                     <div>
                                                                        <p className="text-xs text-gray-400">Selected Line</p>
                                                                        <p className="font-mono text-2xl font-bold text-white">{selectedLine}</p>
                                                                    </div>
                                                                    
                                                                    <div className={`text-center font-mono font-bold text-lg ${style.textColor}`}>
                                                                        <div className="leading-tight">{diff === 0 ? '–' : (diff > 0 ? '▲' : '▼')}</div>
                                                                        <div>{Math.abs(diff).toFixed(1)}</div>
                                                                    </div>
                                
                                                                    <div>
                                                                        <p className="text-xs text-gray-400">Opponent Avg</p>
                                                                        <p className="font-mono text-2xl font-bold text-gray-300">{opponentStat.value.toFixed(1)}</p>
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className={`mt-2 flex items-center justify-center text-xs font-semibold p-1.5 rounded ${style.innerBgColor} ${style.textColor}`}>
                                                                    {icon}
                                                                    <span>{assessmentText}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {historicalOdds && marketOdds !== null && (
                                        <div className="mt-4 pt-4 border-t border-gray-700/50">
                                            <h5 className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase mb-2">
                                                <LineChartIcon className="h-4 w-4" />
                                                7-Day Odds Movement
                                            </h5>
                                            <OddsLineChart data={historicalOdds} />
                                        </div>
                                    )}
                                </div>
                            )}

                             <button 
                                onClick={handleAddLeg}
                                disabled={!selectedPosition || !marketOdds}
                                className="w-full mt-4 flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Add to Slip
                            </button>
                        </div>
                    )}

                     {selectedPropType && (
                         <div className="p-4 space-y-4">
                            {advancedPlayerStats && (
                                <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2"><TrendingUpIcon className="h-5 w-5 text-cyan-400"/> Advanced Player Metrics</h4>
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
                                                <div className="absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-md border border-gray-700 bg-gray-950 p-2 text-xs text-gray-300 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                                                    <strong className="font-semibold text-cyan-400">{stat.name}</strong>
                                                    <p className="text-gray-400 mt-1">{stat.description}</p>
                                                    <p className="mt-1 font-mono">Rank: #{stat.rank} | PCTL: {stat.percentile}th</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProp?.historicalContext?.gameLog && selectedLine !== null && (
                                <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/50">
                                    <HistoricalPerformanceChart 
                                        gameLog={selectedProp.historicalContext.gameLog}
                                        selectedLine={selectedLine}
                                        seasonAvg={selectedProp.historicalContext.seasonAvg || null}
                                        last5Avg={selectedProp.historicalContext.last5Avg || null}
                                    />
                                </div>
                             )}
                         </div>
                     )}

                    <div className="flex-1 p-4 bg-gray-800/30">
                        <h3 className="font-semibold text-lg text-gray-200 mb-3">Bet Slip</h3>
                        {legs.length === 0 ? (
                            <div className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-700 rounded-lg">
                                <p>Your bet slip is empty.</p>
                                <p className="text-sm">Add legs from the panel on the left.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {legs.map((leg, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-gray-900/50 rounded-md">
                                        <div>
                                            <p className="font-medium text-gray-200">{leg.player}</p>
                                            <p className="text-xs text-gray-400">{leg.position} {leg.line} {leg.propType}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="font-mono text-sm text-yellow-300">{formatAmericanOdds(leg.marketOdds)}</span>
                                            <button onClick={() => handleRemoveLeg(index)} className="text-gray-500 hover:text-red-400"><Trash2Icon className="h-4 w-4" /></button>
                                        </div>
                                    </div>
                                ))}
                                {legs.length > 1 && (
                                    <div className="pt-3 mt-3 border-t border-gray-700/50 flex justify-between items-center">
                                        <span className="font-semibold text-gray-300">{legs.length}-Leg Parlay</span>
                                        <span className="font-mono text-xl font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                                    </div>
                                )}

                                <div className="pt-4 flex gap-2">
                                     <button 
                                        onClick={() => onAnalyze(legs)}
                                        disabled={legs.length === 0}
                                        className="w-full flex items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                    >
                                        <SendIcon className="h-5 w-5" />
                                        Analyze {legs.length} Leg(s)
                                    </button>
                                    <button
                                        onClick={handleSaveParlay}
                                        disabled={legs.length === 0}
                                        className="p-2.5 rounded-md bg-gray-600 text-white transition-colors hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed"
                                        title="Save Bet"
                                    >
                                        <SaveIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => setIsParlayManagerOpen(true)}
                                        className="p-2.5 rounded-md bg-gray-600 text-white transition-colors hover:bg-gray-500"
                                        title="Load Saved Bet"
                                    >
                                        <FolderOpenIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isParlayManagerOpen && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-800 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-200">Saved Bets</h3>
                             <button onClick={() => setIsParlayManagerOpen(false)} className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                <XIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                            {savedParlays.length > 0 ? savedParlays.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(p => (
                                <div key={p.id} className="p-3 bg-gray-700/50 rounded-md flex justify-between items-center gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-200 truncate">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.legs.length} Leg(s) | {formatAmericanOdds(p.odds)} | {new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button onClick={() => handleLoadParlay(p)} className="px-3 py-1 text-sm bg-cyan-600 rounded-md hover:bg-cyan-700 text-white font-semibold">Load</button>
                                        <button onClick={() => handleDeleteParlay(p.id)} className="p-1.5 text-gray-400 hover:text-red-400" title="Delete Parlay"><Trash2Icon className="h-4 w-4" /></button>
                                    </div>
                                </div>
                            )) : <p className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">No saved bets found.</p>}
                        </div>
                        <button onClick={() => setIsParlayManagerOpen(false)} className="mt-6 w-full py-2 bg-gray-600 rounded-md hover:bg-gray-500 text-white font-semibold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BetBuilder;
