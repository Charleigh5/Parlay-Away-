// FIX: Corrected a syntax error in the React import statement that was preventing the component from loading.
import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, AnalysisResponse, LineOdds } from '../types';
import { calculateParlayOdds, formatAmericanOdds, generateHistoricalOdds, normalCdf, calculateSingleLegEV } from '../utils';
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
import { getMarketData } from '../services/marketDataService';
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
import { SparklesIcon } from './icons/SparklesIcon';
import { getAnalysis } from '../services/geminiService';


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

interface MarketLineAnalysis {
    line: number;
    overOdds: number;
    underOdds: number;
    overEV: number;
    underEV: number;
}
interface MarketAnalysis {
    lines: MarketLineAnalysis[];
    optimalBet: { line: number; position: 'Over' | 'Under'; ev: number; odds: number } | null;
    baseAnalysis: AnalysisResponse;
}

const getConciseStatLabel = (propType: string): string => {
    switch (propType) {
        case 'Passing Yards': return 'Pass Yds Allowed';
        case 'Passing Touchdowns': return 'Pass TDs Allowed';
        case 'Rushing Yards': return 'Rush Yds Allowed';
        case 'Receiving Yards': return 'Rec Yds Allowed';
        case 'Receptions': return 'Receptions Allowed';
        case 'Sacks': return 'Sacks Allowed';
        case '1st Half Passing Yards': return '1H Pass Yds Allowed';
        case 'Passing + Rushing Yards': return 'Total Yds Allowed';
        case 'Tackles + Assists': return 'Offensive Plays Ran';
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
    
    // State for custom bet inputs
    const [lineInput, setLineInput] = useState('');
    const [oddsInput, setOddsInput] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<'Over' | 'Under' | null>(null);
    const [errors, setErrors] = useState<{ line?: string; odds?: string }>({});

    // State for Market Analysis
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
    const [marketAnalysisError, setMarketAnalysisError] = useState<string | null>(null);
    

    // Fetch schedule data on mount
    useEffect(() => {
        const loadSchedule = async () => {
            try {
                setScheduleLoading(true);
                setScheduleError(null);
                const marketData = getMarketData(); // Use the service
                const fetchedGames = await fetchNFLEvents(marketData);
                setGames(fetchedGames);
            } catch (error) {
                console.error("Failed to fetch NFL events:", error);
                setScheduleError("Could not load schedule. Using mock data.");
                setGames(getMarketData()); // Fallback to service data
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

    // Validation for bet constructor inputs
    useEffect(() => {
        const newErrors: { line?: string; odds?: string } = {};

        if (lineInput && isNaN(parseFloat(lineInput))) {
            newErrors.line = 'Line must be a valid number.';
        }

        if (oddsInput && oddsInput !== '-') {
            const num = parseInt(oddsInput, 10);
            if (isNaN(num)) {
                newErrors.odds = 'Odds must be a valid integer.';
            } else if (num > -100 && num < 100) {
                newErrors.odds = 'Odds must be <= -100 or >= 100.';
            }
        }
        setErrors(newErrors);
    }, [lineInput, oddsInput]);
    
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
        if (parsedOdds !== null && !errors.odds) {
            return generateHistoricalOdds(parsedOdds);
        }
        return null;
    }, [parsedOdds, errors.odds]);

    const advancedStatsForProp = useMemo((): AdvancedStat[] | null => {
        if (!selectedPlayer?.name || !selectedPropType) return null;
        const playerStats = ADVANCED_STATS[selectedPlayer.name];
        if (!playerStats) return null;
        return playerStats[selectedPropType] || null;
    }, [selectedPlayer, selectedPropType]);

    // Effect to pre-fill inputs when a new line is selected from market analysis
    const handleLineSelection = (line: LineOdds | MarketLineAnalysis, position: 'Over' | 'Under') => {
        setLineInput(line.line.toString());
        setSelectedPosition(position);
        setOddsInput(position === 'Over' ? line.overOdds.toString() : line.underOdds.toString());
    };

    // Effect to update inputs when prop type changes
    useEffect(() => {
        setMarketAnalysis(null);
        setMarketAnalysisError(null);
        if (selectedProp && selectedProp.lines.length > 0) {
            const defaultLine = selectedProp.lines[Math.floor(selectedProp.lines.length / 2)];
            handleLineSelection(defaultLine, 'Over');
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

    const handleAnalyzeMarket = async () => {
        if (!selectedPlayer || !selectedProp) return;
        setIsAnalyzingMarket(true);
        setMarketAnalysis(null);
        setMarketAnalysisError(null);

        try {
            const primaryLine = selectedProp.lines[Math.floor(selectedProp.lines.length / 2)];
            const query = `Analyze the market for ${selectedPlayer.name} ${selectedProp.propType}. The primary line is ${primaryLine.line} with odds O:${primaryLine.overOdds}/U:${primaryLine.underOdds}. Provide your best projection for the mean and standard deviation.`;
            
            const analysis = await getAnalysis(query);
            const { projectedMean, projectedStdDev } = analysis.quantitative;
            
            if (projectedMean === undefined || projectedStdDev === undefined) {
                throw new Error("AI analysis did not return the required projections (mean/std dev).");
            }

            let optimalBet: MarketAnalysis['optimalBet'] = null;
            
            const lineAnalyses = selectedProp.lines.map(line => {
                const probOver = 1 - normalCdf(line.line, projectedMean, projectedStdDev);
                const probUnder = 1 - probOver;
                
                const overEV = calculateSingleLegEV(probOver, line.overOdds);
                const underEV = calculateSingleLegEV(probUnder, line.underOdds);

                if (optimalBet === null || overEV > optimalBet.ev) {
                    optimalBet = { line: line.line, position: 'Over', ev: overEV, odds: line.overOdds };
                }
                if (optimalBet === null || underEV > optimalBet.ev) {
                    optimalBet = { line: line.line, position: 'Under', ev: underEV, odds: line.underOdds };
                }

                return { line: line.line, overOdds: line.overOdds, underOdds: line.underOdds, overEV, underEV };
            });

            setMarketAnalysis({ lines: lineAnalyses, optimalBet, baseAnalysis: analysis });

        } catch (err) {
            const msg = err instanceof Error ? err.message : "An unknown error occurred during market analysis.";
            setMarketAnalysisError(msg);
        } finally {
            setIsAnalyzingMarket(false);
        }
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

        // More robust mapping to find the correct counter-stat
        const getStatKey = () => {
            const playerPosition = selectedPlayer.position;
            
            // 1. Positional overrides for receiving props
            if (['Receiving Yards', 'Receptions'].includes(selectedPropType)) {
                if (playerPosition === 'TE' && opponentDefensiveStats['vsTE']) return 'vsTE';
                if (playerPosition === 'WR' && opponentDefensiveStats['vsWR']) return 'vsWR';
            }
            // 2. Direct mapping for special prop types
            const directMapping: Record<string, string> = {
                'Sacks': 'Sacks Allowed',
                '1st Half Passing Yards': '1st Half Passing Yards Allowed'
            };
            if (directMapping[selectedPropType] && opponentDefensiveStats[directMapping[selectedPropType]]) {
                return directMapping[selectedPropType];
            }

            // 3. Fallback to propType itself
            return selectedPropType;
        };
        
        const statKey = getStatKey();
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
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
                        className={`w-full text-center rounded-md border bg-gray-800 py-2 px-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                            errors.line
                                ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500'
                        }`}
                    />
                    {errors.line && <p className="text-xs text-red-400 mt-1 text-center">{errors.line}</p>}
                </div>

                {/* Position Toggle */}
                <div className="flex self-end">
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
                        className={`w-full text-center rounded-md border bg-gray-800 py-2 px-2 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 ${
                            errors.odds
                                ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500'
                                : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500'
                        }`}
                    />
                    {errors.odds && <p className="text-xs text-red-400 mt-1 text-center">{errors.odds}</p>}
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

        const isAddButtonDisabled = !!errors.line ||
                                    !!errors.odds ||
                                    !selectedPlayer ||
                                    !selectedPropType ||
                                    parsedLine === null ||
                                    !selectedPosition ||
                                    parsedOdds === null;

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
                        {/* MARKET ANALYSIS PANEL */}
                        <div className="mb-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700/70">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-3">Market Analysis</h4>
                            {!marketAnalysis && !isAnalyzingMarket && (
                                <>
                                    <div className="max-h-32 overflow-y-auto space-y-1 pr-2 mb-3">
                                        {selectedProp.lines.map(line => (
                                            <div key={line.line} className="grid grid-cols-3 gap-2 items-center text-center text-xs">
                                                <button onClick={() => handleLineSelection(line, 'Over')} className={`p-1 rounded font-mono transition-colors ${selectedPosition === 'Over' && parsedLine === line.line ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800/60 hover:bg-gray-700/80 text-gray-300'}`}>{formatAmericanOdds(line.overOdds)}</button>
                                                <div className="font-semibold text-gray-400">{line.line}</div>
                                                <button onClick={() => handleLineSelection(line, 'Under')} className={`p-1 rounded font-mono transition-colors ${selectedPosition === 'Under' && parsedLine === line.line ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-800/60 hover:bg-gray-700/80 text-gray-300'}`}>{formatAmericanOdds(line.underOdds)}</button>
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={handleAnalyzeMarket} className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700 px-4 py-2 text-xs font-semibold text-cyan-300 transition-colors hover:bg-gray-600">
                                        <SparklesIcon className="h-4 w-4" /> Analyze Market & Find Optimal Line
                                    </button>
                                </>
                            )}
                            {isAnalyzingMarket && (
                                <div className="text-center text-sm text-gray-400 py-4">
                                    <p>Analyzing market with AI core...</p>
                                    <p className="text-xs text-gray-500">Calculating EV for all alternate lines.</p>
                                </div>
                            )}
                            {marketAnalysisError && <p className="text-red-400 text-xs text-center py-4">{marketAnalysisError}</p>}
                            {marketAnalysis && (
                                <>
                                <div className="text-xs text-center text-gray-400 mb-2">Model Projection: <span className="font-mono text-cyan-300">{marketAnalysis.baseAnalysis.quantitative.projectedMean?.toFixed(2)}</span> (±{marketAnalysis.baseAnalysis.quantitative.projectedStdDev?.toFixed(2)})</div>
                                <div className="w-full text-xs text-center">
                                    <div className="grid grid-cols-5 gap-2 font-semibold text-gray-500 pb-1 border-b border-gray-700">
                                        <div className="text-left">Over</div><div>+EV</div><div>Line</div><div>+EV</div><div className="text-right">Under</div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1 pt-1 pr-2">
                                        {marketAnalysis.lines.map(line => {
                                            const isOptimalOver = marketAnalysis.optimalBet?.line === line.line && marketAnalysis.optimalBet?.position === 'Over';
                                            const isOptimalUnder = marketAnalysis.optimalBet?.line === line.line && marketAnalysis.optimalBet?.position === 'Under';
                                            return (
                                            <div key={line.line} className="grid grid-cols-5 gap-2 items-center font-mono rounded-md">
                                                <button onClick={() => handleLineSelection(line, 'Over')} className={`text-left p-1 rounded transition-colors ${isOptimalOver ? 'bg-green-500/20 ring-1 ring-green-400' : 'hover:bg-gray-700/50'}`}>{formatAmericanOdds(line.overOdds)}</button>
                                                <div className={`text-center p-1 rounded ${line.overEV > 0 ? 'text-green-400' : 'text-red-400'}`}>{line.overEV.toFixed(2)}%</div>
                                                <div className="text-center text-gray-400">{line.line}</div>
                                                <div className={`text-center p-1 rounded ${line.underEV > 0 ? 'text-green-400' : 'text-red-400'}`}>{line.underEV.toFixed(2)}%</div>
                                                <button onClick={() => handleLineSelection(line, 'Under')} className={`text-right p-1 rounded transition-colors ${isOptimalUnder ? 'bg-green-500/20 ring-1 ring-green-400' : 'hover:bg-gray-700/50'}`}>{formatAmericanOdds(line.underOdds)}</button>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                </>
                            )}
                        </div>
                        {/* END MARKET ANALYSIS PANEL */}

                        {renderBetConstructor()}

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedProp.historicalContext && parsedLine !== null && (
                                <HistoricalPerformanceChart
                                    gameLog={selectedProp.historicalContext.gameLog || []}
                                    selectedLine={parsedLine}
                                    seasonAvg={selectedProp.historicalContext.seasonAvg || null}
                                    last5Avg={selectedProp.historicalContext.last5Avg || null}
                                />
                            )}
                            {advancedStatsForProp && (
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2 flex items-center gap-2"><TrendingUpIcon className="h-3.5 w-3.5"/> Advanced Metrics</h4>
                                    <div className="space-y-3">
                                        {advancedStatsForProp.map(stat => (
                                            <div key={stat.abbreviation} className="group relative">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-300">{stat.abbreviation}</span>
                                                    <span className="text-sm font-mono text-cyan-300">{stat.value}</span>
                                                </div>
                                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                                    <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: `${stat.percentile}%` }}></div>
                                                </div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                    <strong className="font-semibold text-cyan-400">{stat.name}</strong>
                                                    <p className="mt-1">{stat.description}</p>
                                                    <p className="mt-1 font-mono">Rank: {stat.rank} ({stat.percentile}th percentile)</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                         {(homeSplit !== undefined || awaySplit !== undefined || divisionalSplit !== undefined) && (
                            <div className="mt-4">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">Performance Splits</h4>
                                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                    {homeSplit !== undefined && (
                                        <div className="bg-gray-900/50 p-2 rounded-md"><HomeIcon className="h-4 w-4 mx-auto mb-1 text-gray-400" />{homeSplit.toFixed(1)}</div>
                                    )}
                                    {awaySplit !== undefined && (
                                        <div className="bg-gray-900/50 p-2 rounded-md"><PlaneIcon className="h-4 w-4 mx-auto mb-1 text-gray-400" />{awaySplit.toFixed(1)}</div>
                                    )}
                                    {divisionalSplit !== undefined && (
                                        <div className="bg-gray-900/50 p-2 rounded-md"><SwordsIcon className="h-4 w-4 mx-auto mb-1 text-gray-400" />{divisionalSplit.toFixed(1)}</div>
                                    )}
                                </div>
                            </div>
                         )}

                    </div>
                )}
            </div>
            {selectedPlayer && (
                <div className="p-4 border-t border-gray-700/50">
                    <button
                        onClick={handleAddLeg}
                        disabled={isAddButtonDisabled}
                        className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Add to Slip
                    </button>
                </div>
            )}
        </div>
        )
    }

    const renderParlayManager = () => (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm"
            onClick={() => setIsParlayManagerOpen(false)}
        >
            <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">Saved Parlays</h3>
                    <button onClick={() => setIsParlayManagerOpen(false)} className="p-1 rounded-md hover:bg-gray-700"><XIcon className="h-5 w-5 text-gray-400"/></button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3">
                    {savedParlays.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No saved parlays.</p>
                    ) : (
                        savedParlays.map(parlay => (
                            <div key={parlay.id} className="p-3 bg-gray-900/50 rounded-md border border-gray-700/50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-300">{parlay.name}</p>
                                        <p className="text-xs text-gray-400">{parlay.legs.length} Legs &bull; {formatAmericanOdds(parlay.odds)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleLoadParlay(parlay)} className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded hover:bg-cyan-500/40">Load</button>
                                        <button onClick={() => handleDeleteParlay(parlay.id)} className="p-1 text-gray-500 hover:text-red-400"><Trash2Icon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex h-full w-full">
            {isParlayManagerOpen && renderParlayManager()}
            {/* Left Column: Player/Game Selection */}
            <div className="w-1/3 max-w-sm flex flex-col border-r border-gray-700/50 p-4">
                <div className="mb-4 relative">
                    <input
                        type="text"
                        placeholder="Search players or teams..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-10 pr-4 text-gray-200 placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 text-sm"
                    />
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {scheduleLoading ? (
                    <div className="text-center text-gray-400">Loading schedule...</div>
                ) : (
                    renderPlayerList()
                )}
            </div>

            {/* Middle Column: Player Details & Bet Constructor */}
            <div className="w-1/3 flex-1 flex flex-col border-r border-gray-700/50">
                {selectedPlayerName ? (
                    renderPlayerDetailView()
                ) : (
                     <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                        <CrosshairIcon className="h-12 w-12 text-gray-600" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-300">Player Details</h3>
                        <p className="mt-2 text-gray-400">Select a player from the list on the left to view their available prop markets and analytical data.</p>
                    </div>
                )}
            </div>

            {/* Right Column: Bet Slip */}
            <div className="w-1/3 max-w-md flex flex-col p-4">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Bet Slip</h3>
                <div className="flex-1 space-y-3 overflow-y-auto">
                    {legs.length === 0 ? (
                        <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-700 rounded-lg h-full flex flex-col justify-center">
                            <p className="font-semibold text-gray-400">Your slip is empty.</p>
                            <p className="mt-1 text-sm">Add bets from the middle panel to get started.</p>
                        </div>
                    ) : (
                        legs.map((leg, index) => (
                            <div key={`${leg.player}-${leg.propType}-${index}`} className="relative p-3 bg-gray-800/60 rounded-lg border border-gray-700">
                                <button onClick={() => handleRemoveLeg(index)} className="absolute top-1.5 right-1.5 p-1 rounded-md text-gray-500 hover:text-red-400"><XIcon className="h-4 w-4"/></button>
                                <p className="font-semibold text-gray-200 text-sm pr-4">{leg.player}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <p className="text-xs text-gray-400">{leg.position} {leg.line} {leg.propType}</p>
                                    <div className="flex items-center gap-2">
                                        {leg.propDetails?.historicalContext && (
                                            <MicroPerformanceChart gameLog={leg.propDetails.historicalContext.gameLog || []} selectedLine={leg.line} />
                                        )}
                                        <p className="font-mono text-sm text-yellow-300">{formatAmericanOdds(leg.marketOdds)}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {legs.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700/50">
                        {legs.length > 1 && (
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-semibold text-gray-300">{legs.length}-Leg Parlay</span>
                                <span className="text-lg font-mono font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                            </div>
                        )}
                         <div className="flex gap-2">
                            <button onClick={handleSaveParlay} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600">
                                <SaveIcon className="h-4 w-4" /> Save
                            </button>
                            <button onClick={() => setIsParlayManagerOpen(true)} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-gray-600">
                                <FolderOpenIcon className="h-4 w-4" /> Load
                            </button>
                        </div>
                        <button
                            onClick={() => onAnalyze(legs)}
                            className="w-full mt-2 flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
                        >
                            <SendIcon className="h-5 w-5" />
                            Analyze Parlay
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BetBuilder;
