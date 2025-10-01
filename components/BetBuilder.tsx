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
import { HomeIcon } from './icons/HomeIcon';
import { PlaneIcon } from './icons/PlaneIcon';
import { SwordsIcon } from './icons/SwordsIcon';


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
    const [saveInputValue, setSaveInputValue] = useState("");


    // State for live schedule data
    const [games, setGames] = useState<Game[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(true);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    // State for current leg selection
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
    const [selectedPropType, setSelectedPropType] = useState<string | null>(null);
    
    // State for custom bet inputs
    const [lineInput, setLineInput] = useState('');
    const [oddsInput, setOddsInput] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<'Over' | 'Under' | null>(null);
    

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
    
    // Derived state for selected items
    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId), [games, selectedGameId]);
    const selectedPlayer = useMemo(() => selectedGame?.players.find(p => p.name === selectedPlayerName), [selectedGame, selectedPlayerName]);
    const selectedProp = useMemo(() => selectedPlayer?.props.find(p => p.propType === selectedPropType), [selectedPlayer, selectedPropType]);

    // Parsed values from input for validation and use in components
    const parsedLine = useMemo(() => {
        const num = parseFloat(lineInput);
        return isNaN(num) ? null : num;
    }, [lineInput]);

    const parsedOdds = useMemo(() => {
        if (oddsInput.trim() === '-') return null; // Allow typing negative
        const num = parseInt(oddsInput, 10);
        return isNaN(num) ? null : num;
    }, [oddsInput]);

    const historicalOdds = useMemo(() => {
        if (parsedOdds !== null) {
            return generateHistoricalOdds(parsedOdds);
        }
        return null;
    }, [parsedOdds]);

    // Effect to pre-fill inputs when a new prop type is selected
    useEffect(() => {
        if (selectedProp && selectedProp.lines.length > 0) {
            const defaultLine = selectedProp.lines[0];
            setLineInput(defaultLine.line.toString());
            setSelectedPosition('Over');
            setOddsInput(defaultLine.overOdds.toString());
        } else {
            setLineInput('');
            setSelectedPosition(null);
            setOddsInput('');
        }
    }, [selectedProp]);

    // Effect to update odds automatically when position is toggled for a known line
    useEffect(() => {
        if (!selectedProp || !selectedPosition || parsedLine === null) return;

        const matchingLine = selectedProp.lines.find(l => l.line === parsedLine);
        if (matchingLine) {
            const newOdds = selectedPosition === 'Over' ? matchingLine.overOdds : matchingLine.underOdds;
            setOddsInput(newOdds.toString());
        }
    }, [selectedPosition, parsedLine, selectedProp]);


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

        if (statData && 'value' in statData && parsedLine !== null) {
            const isFavorable = (leg.position === 'Over' && parsedLine < statData.value) || (leg.position === 'Under' && parsedLine > statData.value);
            matchupFavorability = isFavorable ? 'Favorable' : 'Tough';
        }

        return { opponentAbbr, matchupFavorability };
    };

    const resetSelection = (keepPlayer = false) => {
        if (!keepPlayer) {
            setSelectedPlayerName(null);
        }
        setSelectedPropType(null);
    };

    const handleAddLeg = () => {
        if (!selectedPlayer || !selectedPropType || parsedLine === null || !selectedPosition || parsedOdds === null) return;
        
        const newLeg: EnrichedLeg = {
            player: selectedPlayer.name,
            propType: selectedPropType,
            line: parsedLine,
            position: selectedPosition,
            marketOdds: parsedOdds,
            playerDetails: selectedPlayer,
            propDetails: selectedProp
        };
        setLegs(prev => [...prev, newLeg]);
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
            if (playerPosition === 'TE') {
                positionalKey = 'vsTE';
            } else if (playerPosition === 'WR') {
                positionalKey = 'vsWR';
            }
        }
        const statKey = positionalKey && opponentDefensiveStats[positionalKey] ? positionalKey : selectedPropType;
    
        const statData = opponentDefensiveStats[statKey];
    
        // Type guard to ensure we have a full DefensiveStat object
        if (statData && 'value' in statData) {
            return {
                opponentAbbr: opponentInfo.abbr,
                value: statData.value,
                unit: statData.unit,
                rank: statData.rank,
                label: getConciseStatLabel(selectedPropType),
            };
        }
    
        return null;
    }, [opponentInfo, selectedPlayer, selectedPropType]);

    const handleSaveParlay = () => {
        if (legs.length === 0) return;
        const name = prompt("Enter a name for this parlay:", `Parlay - ${new Date().toLocaleDateString()}`);
        if (name) {
            const newParlay: SavedParlay = {
                id: `parlay_${Date.now()}`,
                name,
                odds: parlayOdds,
                legs,
                createdAt: new Date().toISOString(),
            };
            const updatedParlays = [...savedParlays, newParlay];
            setSavedParlays(updatedParlays);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
        }
    };

    const handleLoadParlay = (parlay: SavedParlay) => {
        setLegs(parlay.legs);
        setIsParlayManagerOpen(false);
    };

    const handleDeleteParlay = (parlayId: string) => {
        const updatedParlays = savedParlays.filter(p => p.id !== parlayId);
        setSavedParlays(updatedParlays);
        localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
    };

    // Main render content divided into sections for clarity
    const renderPlayerList = () => (
        <div className="flex-1 overflow-y-auto">
            {scheduleError && <div className="p-4 text-sm text-yellow-300 bg-yellow-500/10 rounded-md m-4">{scheduleError}</div>}
            {filteredGames.map((game) => (
                <div key={game.id} className="mb-4">
                    <button
                        onClick={() => setSelectedGameId(game.id === selectedGameId ? null : game.id)}
                        className="w-full text-left p-2 rounded-md bg-gray-800/60 hover:bg-gray-800"
                    >
                        <h3 className="text-sm font-semibold text-gray-300">{game.name}</h3>
                    </button>
                    {selectedGameId === game.id && (
                        <div className="pl-2 pt-2 border-l-2 border-gray-700 ml-2">
                            {game.players.map(player => (
                                <div key={player.name} className="mb-2">
                                    <button
                                        onClick={() => setSelectedPlayerName(player.name)}
                                        className={`w-full text-left p-2 rounded-md transition-colors ${selectedPlayerName === player.name ? 'bg-cyan-500/10' : 'hover:bg-gray-800/50'}`}
                                    >
                                        <p className="font-semibold text-gray-200 text-sm">{player.name}</p>
                                        <p className="text-xs text-gray-500">{player.position} - {player.team}</p>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
    
    const renderBetConstructor = () => (
         <div className="mt-4 bg-gray-900/50 p-3 rounded-lg border border-gray-700/70">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 text-center">Construct Your Bet</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                {/* Line Input */}
                <div>
                    <label htmlFor="line-input" className="block text-xs font-medium text-gray-400 mb-1">Line</label>
                    <input
                        id="line-input"
                        type="number"
                        step="0.5"
                        value={lineInput}
                        onChange={(e) => setLineInput(e.target.value)}
                        placeholder="e.g. 275.5"
                        className="w-full text-center rounded-md border border-gray-600 bg-gray-800 py-2 px-2 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>

                {/* Position Toggle */}
                <div className="flex">
                    <button
                        onClick={() => setSelectedPosition('Over')}
                        className={`w-1/2 flex items-center justify-center gap-2 rounded-l-md py-2 text-sm font-semibold transition-colors border border-gray-600 ${
                            selectedPosition === 'Over' ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <ArrowUpCircleIcon className="h-4 w-4" /> Over
                    </button>
                    <button
                        onClick={() => setSelectedPosition('Under')}
                        className={`w-1/2 flex items-center justify-center gap-2 rounded-r-md py-2 text-sm font-semibold transition-colors border-y border-r border-gray-600 ${
                            selectedPosition === 'Under' ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <ArrowDownCircleIcon className="h-4 w-4" /> Under
                    </button>
                </div>

                {/* Odds Input */}
                <div>
                    <label htmlFor="odds-input" className="block text-xs font-medium text-gray-400 mb-1">Odds</label>
                    <input
                        id="odds-input"
                        type="text"
                        value={oddsInput}
                        onChange={(e) => {
                            if (/^-?\d*$/.test(e.target.value)) {
                                setOddsInput(e.target.value);
                            }
                        }}
                        placeholder="e.g. -115"
                        className="w-full text-center rounded-md border border-gray-600 bg-gray-800 py-2 px-2 text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                </div>
            </div>
            {historicalOdds && (
                <div className="mt-4">
                    <h5 className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-400 mb-1">
                        <LineChartIcon className="h-3 w-3" />
                        7-Day Odds Movement
                    </h5>
                    <OddsLineChart data={historicalOdds} />
                </div>
            )}
        </div>
    );
    
    const renderPlayerDetailView = () => {
        if (!selectedPlayer) return null;
        
        const homeSplit = selectedPropType ? selectedPlayer.homeAwaySplits?.home[selectedPropType] : undefined;
        const awaySplit = selectedPropType ? selectedPlayer.homeAwaySplits?.away[selectedPropType] : undefined;
        const divisionalSplit = selectedPropType ? selectedPlayer.divisionalSplits?.[selectedPropType] : undefined;

        return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
                <button onClick={() => setSelectedPlayerName(null)} className="flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400">
                    <ChevronLeftIcon className="h-4 w-4" /> Back to Players
                </button>
                <div className="mt-2">
                    <div className="flex items-center gap-3 mb-0.5">
                        <h3 className="font-bold text-lg text-gray-100">{selectedPlayer.name}</h3>
                        {selectedPlayer.injuryStatus && selectedPlayer.injuryStatus.status !== 'Healthy' && (
                            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${getInjuryStatusStyle(selectedPlayer.injuryStatus.status).bgColor} ${getInjuryStatusStyle(selectedPlayer.injuryStatus.status).color}`}>
                                {selectedPlayer.injuryStatus.status}
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-400">{selectedPlayer.position} - {selectedPlayer.team}</p>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                 {selectedPlayer.injuryStatus && selectedPlayer.injuryStatus.status !== 'Healthy' && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700/70">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-1"><StethoscopeIcon className="h-4 w-4 text-cyan-400" /> Injury Report</h4>
                        <p className="text-xs text-gray-400 mb-1"><strong>News:</strong> {selectedPlayer.injuryStatus.news}</p>
                        <p className="text-xs text-gray-400"><strong>Impact:</strong> <RenderImpactText text={selectedPlayer.injuryStatus.impact} /></p>
                    </div>
                 )}

                 {opponentInfo && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700/70">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2"><ShieldIcon className="h-4 w-4 text-cyan-400" /> Opponent Profile: {opponentInfo.fullName}</h4>
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-xs text-gray-400">Overall Def Rank</p>
                                <p className={`text-lg font-bold ${getRankCategory(opponentInfo.overallRank).color}`}>{opponentInfo.overallRank || 'N/A'}</p>
                            </div>
                           {opponentStat && (
                                <div>
                                    <p className="text-xs text-gray-400">{opponentStat.label}</p>
                                    <p className={`text-lg font-bold ${getRankCategory(opponentStat.rank).color}`}>{opponentStat.rank || 'N/A'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                 )}

                <div className="space-y-2">
                    <p className="text-sm font-semibold text-gray-400">Select Prop:</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedPlayer.props.map(prop => (
                            <button
                                key={prop.propType}
                                onClick={() => setSelectedPropType(prop.propType)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${selectedPropType === prop.propType ? 'bg-cyan-500 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
                            >
                                {prop.propType}
                            </button>
                        ))}
                    </div>
                </div>

                {selectedProp && (
                    <div className="mt-4 border-t border-gray-700/50 pt-4">
                        {(homeSplit !== undefined || divisionalSplit !== undefined) && (
                            <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700/70">
                                <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">Performance Splits for {selectedPropType}</h4>
                                <div className="flex gap-2 text-center text-xs">
                                    {homeSplit !== undefined && awaySplit !== undefined && (
                                        <>
                                            <div className="flex-1 bg-gray-800 p-2 rounded-md">
                                                <p className="flex items-center justify-center gap-1.5 text-gray-400"><HomeIcon className="h-3 w-3" /> Home</p>
                                                <p className="font-bold text-base text-gray-200 mt-1">{homeSplit.toFixed(1)}</p>
                                            </div>
                                            <div className="flex-1 bg-gray-800 p-2 rounded-md">
                                                <p className="flex items-center justify-center gap-1.5 text-gray-400"><PlaneIcon className="h-3 w-3" /> Away</p>
                                                <p className="font-bold text-base text-gray-200 mt-1">{awaySplit.toFixed(1)}</p>
                                            </div>
                                        </>
                                    )}
                                    {divisionalSplit !== undefined && (
                                        <div className="flex-1 bg-gray-800 p-2 rounded-md">
                                            <p className="flex items-center justify-center gap-1.5 text-gray-400"><SwordsIcon className="h-3 w-3" /> Divisional</p>
                                            <p className="font-bold text-base text-gray-200 mt-1">{divisionalSplit.toFixed(1)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {selectedProp.historicalContext?.gameLog && parsedLine !== null && (
                            <HistoricalPerformanceChart 
                                gameLog={selectedProp.historicalContext.gameLog}
                                selectedLine={parsedLine}
                                seasonAvg={selectedProp.historicalContext.seasonAvg ?? null}
                                last5Avg={selectedProp.historicalContext.last5Avg ?? null}
                            />
                        )}
                        {renderBetConstructor()}
                         <div className="mt-4">
                            <button
                                onClick={handleAddLeg}
                                disabled={!selectedPlayer || !selectedPropType || parsedLine === null || !selectedPosition || parsedOdds === null}
                                className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600 disabled:text-gray-400"
                            >
                                <PlusIcon className="h-5 w-5" /> Add to Slip
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
        );
    };
    
    const renderParlayManager = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsParlayManagerOpen(false)}>
            <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900/80 p-6 text-center" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Saved Parlays</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {savedParlays.length > 0 ? savedParlays.map(parlay => (
                        <div key={parlay.id} className="group flex items-center justify-between rounded-md bg-gray-800/70 p-3 text-left">
                            <div>
                                <p className="font-semibold text-gray-200">{parlay.name}</p>
                                <p className="text-xs text-gray-400">{parlay.legs.length} Legs &middot; <span className="font-mono">{formatAmericanOdds(parlay.odds)}</span></p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button
                                    onClick={() => handleLoadParlay(parlay)}
                                    className="flex items-center justify-center rounded-md bg-cyan-500 p-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                                    aria-label={`Load parlay ${parlay.name}`}
                                >
                                    <FolderOpenIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteParlay(parlay.id)}
                                    className="flex items-center justify-center rounded-md bg-red-600/80 p-2 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                                     aria-label={`Delete parlay ${parlay.name}`}
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )) : (
                        <p className="text-gray-500 py-8">No saved parlays yet.</p>
                    )}
                </div>
                <button
                    onClick={() => setIsParlayManagerOpen(false)}
                    className="mt-6 w-full rounded-md bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600"
                >
                    Close
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full">
            {isParlayManagerOpen && renderParlayManager()}
            {/* Left: Bet Slip */}
            <div className="flex w-full max-w-sm flex-col border-r border-gray-700/50 bg-gray-900/50">
                 <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-200">Bet Slip</h2>
                     <button
                        onClick={() => setIsParlayManagerOpen(true)}
                        className="flex items-center gap-2 rounded-md bg-gray-700/60 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
                        aria-label="Manage saved parlays"
                    >
                        <FolderOpenIcon className="h-4 w-4" /> Manage Saved
                    </button>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                   {legs.length === 0 ? (
                        <div className="text-center text-sm text-gray-500 pt-8">
                            <p>Your slip is empty.</p>
                            <p>Add a leg to get started.</p>
                        </div>
                   ) : (
                       legs.map((leg, index) => (
                           <div key={index} className="rounded-lg border border-gray-700 bg-gray-800/70 p-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-200">{leg.player}</p>
                                        <p className="text-xs text-gray-400">{leg.position} {leg.line} {leg.propType}</p>
                                    </div>
                                    <button onClick={() => handleRemoveLeg(index)} className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700" aria-label={`Remove ${leg.player} prop`}>
                                        <Trash2Icon className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
                                    <span className="font-mono text-sm text-yellow-300">{formatAmericanOdds(leg.marketOdds)}</span>
                                     {leg.propDetails?.historicalContext?.gameLog && (
                                        <MicroPerformanceChart gameLog={leg.propDetails.historicalContext.gameLog} selectedLine={leg.line} />
                                     )}
                                </div>
                           </div>
                       ))
                   )}
                </div>
                <div className="p-4 border-t border-gray-700/50">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-semibold text-gray-300">Total Parlay Odds:</span>
                        <span className="font-mono text-lg font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                    </div>
                    <button
                        onClick={() => onAnalyze(legs)}
                        disabled={legs.length === 0}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                    >
                        <SendIcon className="h-5 w-5" /> Analyze Parlay
                    </button>
                </div>
            </div>

            {/* Right: Market/Player Selection */}
            <div className="flex flex-1 flex-col">
                <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                    <button onClick={onBack} className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                        <ChevronLeftIcon className="h-4 w-4" />
                        Back to Menu
                    </button>
                    <h2 className="text-lg font-semibold text-gray-200">Market Explorer</h2>
                </div>
                <div className="flex flex-1 overflow-hidden">
                    {/* Left side within this panel: game/player list */}
                    <div className="flex w-full max-w-xs flex-col border-r border-gray-700/50">
                        <div className="p-4 border-b border-gray-700/50">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search games or players..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-md border border-gray-600 bg-gray-800 py-2 pl-9 pr-3 text-sm text-gray-200 placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                             {scheduleLoading ? <p className="text-gray-400 text-sm text-center">Loading schedule...</p> : renderPlayerList()}
                        </div>
                    </div>

                    {/* Right side within this panel: details & constructor */}
                    <div className="flex-1 overflow-y-auto">
                        {selectedPlayerName && selectedPlayer ? (
                            renderPlayerDetailView()
                        ) : (
                            <div className="flex h-full items-center justify-center text-center text-gray-500 p-8">
                                <p>Select a player to view available props.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BetBuilder;
