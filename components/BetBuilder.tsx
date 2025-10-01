import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, AnalysisResponse, LineOdds, ParlayCorrelationAnalysis, SavedParlay } from '../types';
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
import { getAnalysis, analyzeParlayCorrelation } from '../services/geminiService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { RotateCwIcon } from './icons/RotateCwIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';

const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
  </svg>
);

const UnlinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" />
      <line x1="2" y1="22" x2="22" y2="2" />
    </svg>
);

const MinusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);


interface BetBuilderProps {
  onAnalyze: (legs: ExtractedBetLeg[]) => void;
  onBack: () => void;
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
    
    // State for Correlation Analysis
    const [correlationAnalysis, setCorrelationAnalysis] = useState<ParlayCorrelationAnalysis | null>(null);
    const [isAnalyzingCorrelation, setIsAnalyzingCorrelation] = useState(false);
    const [correlationError, setCorrelationError] = useState<string | null>(null);
    const [isCorrelationDetailsOpen, setIsCorrelationDetailsOpen] = useState(false);


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
            const stored = localStorage.getItem(SAVED_PARLAYS_LIST_KEY);
            if (stored) {
                setSavedParlays(JSON.parse(stored));
            }
        } catch (error) {
            console.error("Failed to load saved parlays from localStorage", error);
        }
    }, []);

    const filteredPlayers = useMemo(() => {
        if (!selectedGameId) return [];
        const game = games.find(g => g.id === selectedGameId);
        if (!game) return [];
        if (!searchTerm) return game.players;
        return game.players.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [games, selectedGameId, searchTerm]);

    const selectedGame = useMemo(() => {
        return games.find(g => g.id === selectedGameId) || null;
    }, [games, selectedGameId]);

    const selectedPlayer = useMemo(() => {
        return selectedGame?.players.find(p => p.name === selectedPlayerName) || null;
    }, [selectedGame, selectedPlayerName]);
    
    const selectedProp = useMemo(() => {
        return selectedPlayer?.props.find(p => p.propType === selectedPropType) || null;
    }, [selectedPlayer, selectedPropType]);

    const parlayOdds = useMemo(() => calculateParlayOdds(legs), [legs]);

    const opponentInfo: OpponentInfo | null = useMemo(() => {
        if (!selectedPlayer || !selectedGame) return null;

        const teams = selectedGame.name.split(' @ ');
        const playerTeamName = TEAM_ABBREVIATION_TO_NAME[selectedPlayer.team];
        const opponentTeamName = teams.find(t => t !== playerTeamName);
        if (!opponentTeamName) return null;

        const opponentAbbr = TEAM_NAME_TO_ABBREVIATION[opponentTeamName];
        const opponentStats = DEFENSIVE_STATS[opponentTeamName];
        const overallRank = opponentStats ? (opponentStats.overall as { rank: number }).rank : null;

        return {
            fullName: opponentTeamName,
            abbr: opponentAbbr,
            overallRank: overallRank,
        };
    }, [selectedGame, selectedPlayer]);

    const displayableOpponentStat: DisplayableOpponentStat | null = useMemo(() => {
        if (!opponentInfo || !selectedPropType) return null;
        
        const opponentStats = DEFENSIVE_STATS[opponentInfo.fullName];
        if (!opponentStats) return null;

        // Special handling for TE/WR props
        let propKey = selectedPropType;
        if (propKey === 'Receiving Yards' || propKey === 'Receptions') {
             if (selectedPlayer?.position === 'TE') propKey = 'vsTE';
             else if (selectedPlayer?.position === 'WR') propKey = 'vsWR';
        }

        const stat = opponentStats?.[propKey];
        if (stat && typeof stat === 'object' && 'value' in stat && 'rank' in stat && 'unit' in stat) {
            return {
                opponentAbbr: opponentInfo.abbr,
                value: stat.value,
                unit: stat.unit,
                rank: stat.rank,
                label: getConciseStatLabel(selectedPropType)
            }
        }
        return null;

    }, [opponentInfo, selectedPropType, selectedPlayer]);

    const resetSelection = (level: 'game' | 'player' | 'prop' | 'full') => {
        setMarketAnalysis(null);
        setMarketAnalysisError(null);
        setIsAnalyzingMarket(false);

        if (level === 'full') {
            setSelectedGameId(null);
        }
        if (level === 'full' || level === 'game') {
            setSelectedPlayerName(null);
            setSearchTerm('');
        }
        if (level !== 'prop') {
             setSelectedPropType(null);
        }
        setLineInput('');
        setOddsInput('');
        setSelectedPosition(null);
        setErrors({});
    };

    const handleAnalyzeMarket = async () => {
        if (!selectedProp || !selectedPlayer) return;

        setIsAnalyzingMarket(true);
        setMarketAnalysis(null);
        setMarketAnalysisError(null);

        try {
            const query = `Analyze the market for ${selectedPlayer.name} - ${selectedPropType}. His historical season average is ${selectedProp.historicalContext?.seasonAvg} and his last 5 games average is ${selectedProp.historicalContext?.last5Avg}. Provide your core projections (mean and std dev) for the final outcome.`;
            const baseAnalysis = await getAnalysis(query);

            const { projectedMean, projectedStdDev } = baseAnalysis.quantitative;

            if (projectedMean === undefined || projectedStdDev === undefined) {
                throw new Error("AI analysis did not return the required projected mean and standard deviation.");
            }

            const marketLines: MarketLineAnalysis[] = selectedProp.lines.map(line => {
                const probOver = 1 - normalCdf(line.line, projectedMean, projectedStdDev);
                const probUnder = normalCdf(line.line, projectedMean, projectedStdDev);

                return {
                    line: line.line,
                    overOdds: line.overOdds,
                    underOdds: line.underOdds,
                    overEV: calculateSingleLegEV(probOver, line.overOdds),
                    underEV: calculateSingleLegEV(probUnder, line.underOdds)
                };
            });
            
            let optimalBet: MarketAnalysis['optimalBet'] = null;
            let maxEV = 0;

            marketLines.forEach(line => {
                if (line.overEV > maxEV) {
                    maxEV = line.overEV;
                    optimalBet = { line: line.line, position: 'Over', ev: line.overEV, odds: line.overOdds };
                }
                if (line.underEV > maxEV) {
                    maxEV = line.underEV;
                    optimalBet = { line: line.line, position: 'Under', ev: line.underEV, odds: line.underOdds };
                }
            });

            setMarketAnalysis({
                lines: marketLines,
                optimalBet,
                baseAnalysis
            });

        } catch (err) {
            const message = err instanceof Error ? err.message : "An unknown error occurred during market analysis.";
            setMarketAnalysisError(message);
        } finally {
            setIsAnalyzingMarket(false);
        }
    };
    
    const handleSelectLine = (line: number, position: 'Over' | 'Under', odds: number) => {
        setLineInput(String(line));
        setSelectedPosition(position);
        setOddsInput(String(odds));
    };

    const handleAddLeg = () => {
        const line = parseFloat(lineInput);
        const odds = parseInt(oddsInput, 10);
        
        let hasError = false;
        const newErrors: typeof errors = {};
        if (isNaN(line) || line <= 0) {
            newErrors.line = "Invalid line";
            hasError = true;
        }
        if (isNaN(odds) || Math.abs(odds) < 100) {
            newErrors.odds = "Invalid odds";
            hasError = true;
        }
        if (!selectedPosition) {
            // This case shouldn't happen with the UI, but good to have
            hasError = true;
        }

        setErrors(newErrors);

        if (hasError || !selectedPlayer || !selectedPropType || !selectedPosition) {
            return;
        }

        const newLeg: EnrichedLeg = {
            player: selectedPlayer.name,
            propType: selectedPropType,
            line: line,
            position: selectedPosition,
            marketOdds: odds,
            playerDetails: selectedPlayer,
            propDetails: selectedProp
        };

        setLegs(prev => [...prev, newLeg]);
        resetSelection('prop'); // Reset prop selection but keep player
        setCorrelationAnalysis(null);
    };

    const handleRemoveLeg = (index: number) => {
        setLegs(prev => prev.filter((_, i) => i !== index));
        setCorrelationAnalysis(null);
    };

    const handleSaveParlay = () => {
        if (legs.length === 0) return;

        let name = prompt(`Enter a name for this parlay (${legs.length} legs, ${formatAmericanOdds(parlayOdds)}):`, `Parlay - ${new Date().toLocaleDateString()}`);

        if (name) {
            const newParlay: SavedParlay = {
                id: `parlay_${Date.now()}`,
                name,
                odds: parlayOdds,
                legs: legs.map(({ playerDetails, propDetails, ...rest }) => rest), // Strip enriched data before saving
                createdAt: new Date().toISOString(),
            };
            const updatedParlays = [...savedParlays, newParlay];
            setSavedParlays(updatedParlays);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
            alert(`Parlay "${name}" saved!`);
        }
    };

    const handleLoadParlay = async (parlay: SavedParlay) => {
        // We need to re-enrich the legs with player and prop details from our market data
        const enrichedLegs: EnrichedLeg[] = [];
        const allPlayers = games.flatMap(g => g.players);
        
        for (const leg of parlay.legs) {
            const playerDetails = allPlayers.find(p => p.name === leg.player);
            const propDetails = playerDetails?.props.find(p => p.propType === leg.propType);
            enrichedLegs.push({ ...leg, playerDetails, propDetails });
        }
        
        setLegs(enrichedLegs);
        setIsParlayManagerOpen(false);
        resetSelection('full');
    };
    
    const handleDeleteParlay = (parlayId: string) => {
        if (window.confirm("Are you sure you want to delete this saved parlay?")) {
            const updatedParlays = savedParlays.filter(p => p.id !== parlayId);
            setSavedParlays(updatedParlays);
            localStorage.setItem(SAVED_PARLAYS_LIST_KEY, JSON.stringify(updatedParlays));
        }
    };

    const handleAnalyzeCorrelation = async () => {
        if (legs.length < 2) return;
        setIsAnalyzingCorrelation(true);
        setCorrelationError(null);
        setCorrelationAnalysis(null);
        try {
            const analysis = await analyzeParlayCorrelation(legs.map(({ playerDetails, propDetails, ...rest }) => rest));
            setCorrelationAnalysis(analysis);
        } catch (err) {
            setCorrelationError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsAnalyzingCorrelation(false);
        }
    };
    
    const resetBuilder = () => {
        setLegs([]);
        resetSelection('full');
        setCorrelationAnalysis(null);
        setCorrelationError(null);
    };

    const renderSelectionPanel = () => {
        if (!selectedGameId) {
            return (
                <div className="p-4">
                    <h3 className="text-gray-300 font-semibold mb-2">Select a Game</h3>
                    {scheduleLoading && <p className="text-sm text-gray-400">Loading schedule...</p>}
                    {scheduleError && <p className="text-sm text-yellow-400 bg-yellow-500/10 p-2 rounded">{scheduleError}</p>}
                    <div className="space-y-2">
                        {games.map(game => (
                            <button key={game.id} onClick={() => setSelectedGameId(game.id)} className="w-full text-left p-2 rounded-md bg-gray-800 hover:bg-gray-700/80 transition-colors">
                                <span className="text-gray-200 text-sm font-medium">{game.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )
        }
        if (!selectedPlayerName) {
            return (
                <div className="p-4">
                    <button onClick={() => resetSelection('full')} className="text-xs text-cyan-400 hover:underline mb-2 flex items-center gap-1">
                       <ChevronLeftIcon className="h-3 w-3" /> Back to Games
                    </button>
                    <h3 className="text-gray-300 font-semibold mb-2 truncate">{selectedGame?.name}</h3>
                     <div className="relative mb-2">
                        <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search player..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded-md py-1.5 pl-8 pr-2 text-sm text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                        />
                    </div>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {filteredPlayers.map(player => (
                            <button key={player.name} onClick={() => setSelectedPlayerName(player.name)} className="w-full text-left p-2 rounded-md hover:bg-gray-700/80 transition-colors flex items-center justify-between">
                                <div>
                                    <span className="text-gray-200 text-sm font-medium">{player.name}</span>
                                    <span className="text-gray-500 text-xs ml-2">{player.position}</span>
                                </div>
                                {player.injuryStatus && (
                                     <span className={`text-xs px-1.5 py-0.5 rounded-full ${getInjuryStatusStyle(player.injuryStatus.status).bgColor} ${getInjuryStatusStyle(player.injuryStatus.status).color}`}>
                                        {player.injuryStatus.status.charAt(0)}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        if (!selectedPropType) {
             return (
                <div className="p-4">
                    <button onClick={() => resetSelection('game')} className="text-xs text-cyan-400 hover:underline mb-2 flex items-center gap-1">
                       <ChevronLeftIcon className="h-3 w-3" /> Back to Players
                    </button>
                    <div className="flex items-start gap-3 p-2 rounded-lg bg-gray-800/50 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-cyan-400 font-bold text-lg flex-shrink-0">
                           {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <h3 className="text-gray-200 font-semibold">{selectedPlayer.name}</h3>
                            <p className="text-xs text-gray-400">{selectedPlayer.position} - {selectedPlayer.team}</p>
                        </div>
                    </div>

                    {opponentInfo && (
                        <div className="mb-3 p-2 border border-gray-700/50 rounded-lg bg-gray-900/30">
                            <h4 className="text-xs text-gray-400 uppercase font-semibold mb-1">Matchup</h4>
                            <div className="flex items-center gap-2 text-sm">
                                <ShieldIcon className="h-4 w-4 text-cyan-400"/>
                                <span>vs {opponentInfo.abbr} Defense</span>
                                {opponentInfo.overallRank && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getRankCategory(opponentInfo.overallRank).bgColor} ${getRankCategory(opponentInfo.overallRank).borderColor} ${getRankCategory(opponentInfo.overallRank).color}`}>
                                    #{opponentInfo.overallRank} Overall
                                </span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <h4 className="text-gray-300 font-semibold text-sm mb-1">Select Prop Market</h4>
                    <div className="space-y-1 max-h-96 overflow-y-auto">
                        {selectedPlayer.props.map(prop => (
                            <button key={prop.propType} onClick={() => setSelectedPropType(prop.propType)} className="w-full text-left p-2 rounded-md hover:bg-gray-700/80 transition-colors flex items-center justify-between text-sm">
                                <span className="text-gray-200">{prop.propType}</span>
                                {prop.historicalContext && (
                                    <MicroPerformanceChart gameLog={prop.historicalContext.gameLog || []} selectedLine={prop.lines[0].line} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            );
        }
        // Prop is selected, show market details
        return (
            <div className="p-4 flex flex-col h-full">
                <button onClick={() => { setSelectedPropType(null); setMarketAnalysis(null); setMarketAnalysisError(null); }} className="text-xs text-cyan-400 hover:underline mb-2 flex items-center gap-1">
                    <ChevronLeftIcon className="h-3 w-3" /> Back to Props for {selectedPlayerName}
                </button>
                <h3 className="text-gray-200 font-semibold">{selectedPlayer.name}</h3>
                <p className="text-sm text-cyan-400 mb-2">{selectedPropType}</p>

                <div className="flex-grow overflow-y-auto pr-2 -mr-2">
                    {displayableOpponentStat && (
                        <div className="mb-3 p-2 border border-gray-700/50 rounded-lg bg-gray-900/30">
                            <h4 className="text-xs text-gray-400 uppercase font-semibold mb-1">Positional Matchup</h4>
                            <div className="flex items-center gap-2 text-sm">
                                <CrosshairIcon className="h-4 w-4 text-cyan-400"/>
                                <span>vs {displayableOpponentStat.opponentAbbr}</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full border ${getRankCategory(displayableOpponentStat.rank).bgColor} ${getRankCategory(displayableOpponentStat.rank).borderColor} ${getRankCategory(displayableOpponentStat.rank).color}`}>
                                    #{displayableOpponentStat.rank} vs {selectedPlayer.position}
                                </span>
                            </div>
                             <p className="text-xs text-gray-500 mt-1">{displayableOpponentStat.label}: {displayableOpponentStat.value.toFixed(1)} {displayableOpponentStat.unit}</p>
                        </div>
                    )}

                    {selectedPlayer.injuryStatus && (
                         <div className="mb-3 p-2 border border-gray-700/50 rounded-lg bg-gray-900/30">
                            <h4 className="flex items-center gap-1.5 text-xs text-gray-400 uppercase font-semibold mb-1"><StethoscopeIcon className="h-3.5 w-3.5" />Injury Status</h4>
                            <div className={`text-sm font-semibold ${getInjuryStatusStyle(selectedPlayer.injuryStatus.status).color}`}>{getInjuryStatusStyle(selectedPlayer.injuryStatus.status).text}</div>
                            <p className="text-xs text-gray-500 mt-0.5">{selectedPlayer.injuryStatus.news}</p>
                            <div className="mt-1.5 pt-1.5 border-t border-gray-700/50 text-xs text-gray-400 italic">
                                <strong className="text-gray-300 not-italic">Impact: </strong>
                                <RenderImpactText text={selectedPlayer.injuryStatus.impact} />
                            </div>
                         </div>
                    )}
                    
                    {selectedPlayer.homeAwaySplits && (
                        <div className="mb-3 p-2 border border-gray-700/50 rounded-lg bg-gray-900/30">
                            <h4 className="text-xs text-gray-400 uppercase font-semibold mb-2">Performance Splits</h4>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-800 p-1.5 rounded">
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-1"><HomeIcon className="h-3 w-3"/> Home</div>
                                    {Object.entries(selectedPlayer.homeAwaySplits.home).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between"><span>{stat.substring(0,8)}...</span> <span className="font-mono text-gray-200">{value}</span></div>
                                    ))}
                                </div>
                                <div className="bg-gray-800 p-1.5 rounded">
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-1"><PlaneIcon className="h-3 w-3"/> Away</div>
                                    {Object.entries(selectedPlayer.homeAwaySplits.away).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between"><span>{stat.substring(0,8)}...</span> <span className="font-mono text-gray-200">{value}</span></div>
                                    ))}
                                </div>
                            </div>
                            {selectedPlayer.divisionalSplits && (
                                <div className="bg-gray-800 p-1.5 rounded mt-2">
                                    <div className="flex items-center gap-1.5 text-gray-400 mb-1"><SwordsIcon className="h-3 w-3"/> Divisional</div>
                                    {Object.entries(selectedPlayer.divisionalSplits).map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between text-xs"><span>{stat.substring(0,8)}...</span> <span className="font-mono text-gray-200">{value}</span></div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {ADVANCED_STATS[selectedPlayer.name]?.[selectedPropType] && (
                        <div className="mb-3 p-2 border border-gray-700/50 rounded-lg bg-gray-900/30">
                            <h4 className="flex items-center gap-1.5 text-xs text-gray-400 uppercase font-semibold mb-2"><TrendingUpIcon className="h-3.5 w-3.5" /> Advanced Metrics</h4>
                            <div className="space-y-2">
                                {ADVANCED_STATS[selectedPlayer.name][selectedPropType].map(stat => (
                                    <div key={stat.name} className="group relative text-xs">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-gray-300">{stat.abbreviation}</span>
                                            <span className="font-mono text-cyan-300">{stat.value} (#{stat.rank})</span>
                                        </div>
                                        <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full" style={{ width: `${stat.percentile}%`}}></div>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                           <strong className="font-semibold text-cyan-400">{stat.name}</strong>
                                           <p className="text-gray-400">{stat.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {selectedProp.historicalContext && (
                        <HistoricalPerformanceChart 
                            gameLog={selectedProp.historicalContext.gameLog || []}
                            selectedLine={selectedProp.lines[0].line}
                            seasonAvg={selectedProp.historicalContext.seasonAvg || null}
                            last5Avg={selectedProp.historicalContext.last5Avg || null}
                        />
                    )}
                </div>

                {!marketAnalysis && (
                     <div className="mt-auto pt-4 border-t border-gray-700/50">
                        <button 
                            onClick={handleAnalyzeMarket}
                            disabled={isAnalyzingMarket}
                            className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                        >
                            {isAnalyzingMarket ? (
                                <>
                                 <RotateCwIcon className="h-4 w-4 animate-spin" />
                                 Analyzing Market...
                                </>
                            ) : (
                                <>
                                <SparklesIcon className="h-5 w-5" />
                                Run AI Market Analysis
                                </>
                            )}
                        </button>
                        {marketAnalysisError && <p className="text-xs text-red-400 mt-2 text-center">{marketAnalysisError}</p>}
                    </div>
                )}
                
                {marketAnalysis && (
                    <div className="mt-auto pt-2 border-t border-gray-700/50">
                        <div className="space-y-1">
                            {marketAnalysis.lines.map(l => (
                                <div key={l.line} className="grid grid-cols-10 gap-1 text-xs">
                                     <button 
                                        onClick={() => handleSelectLine(l.line, 'Over', l.overOdds)}
                                        className={`col-span-4 flex justify-between items-center p-1 rounded transition-colors ${
                                            lineInput === String(l.line) && selectedPosition === 'Over' ? 'bg-cyan-500/20 ring-1 ring-cyan-400' : 'hover:bg-gray-700/50'
                                        } ${l.overEV > 0 ? 'bg-green-500/10' : ''}`}
                                    >
                                        <span className={`font-mono font-semibold ${l.overEV > 0 ? 'text-green-300' : 'text-gray-300'}`}>{l.overEV.toFixed(1)}%</span>
                                        <span className="font-mono text-gray-400">{formatAmericanOdds(l.overOdds)}</span>
                                    </button>
                                     <div className="col-span-2 text-center py-1 font-mono text-gray-200">{l.line}</div>
                                     <button 
                                        onClick={() => handleSelectLine(l.line, 'Under', l.underOdds)}
                                        className={`col-span-4 flex justify-between items-center p-1 rounded transition-colors ${
                                            lineInput === String(l.line) && selectedPosition === 'Under' ? 'bg-cyan-500/20 ring-1 ring-cyan-400' : 'hover:bg-gray-700/50'
                                        } ${l.underEV > 0 ? 'bg-green-500/10' : ''}`}
                                    >
                                        <span className="font-mono text-gray-400">{formatAmericanOdds(l.underOdds)}</span>
                                        <span className={`font-mono font-semibold ${l.underEV > 0 ? 'text-green-300' : 'text-gray-300'}`}>{l.underEV.toFixed(1)}%</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                             <input type="number" placeholder="Line" value={lineInput} onChange={e => setLineInput(e.target.value)} className={`w-1/3 bg-gray-800 border ${errors.line ? 'border-red-500' : 'border-gray-600'} rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500`} />
                             <input type="number" placeholder="Odds" value={oddsInput} onChange={e => setOddsInput(e.target.value)} className={`w-1/3 bg-gray-800 border ${errors.odds ? 'border-red-500' : 'border-gray-600'} rounded-md p-2 text-sm text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500`} />
                             <button onClick={handleAddLeg} className="w-1/3 flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600" disabled={!lineInput || !oddsInput || !selectedPosition}>
                                <PlusIcon className="h-4 w-4"/> Add
                             </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
    <div className="flex-1 flex overflow-hidden relative">
        <button onClick={onBack} className="absolute top-2 left-2 z-10 flex items-center gap-1 rounded-md bg-gray-700/50 px-2 py-1 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700">
            <ChevronLeftIcon className="h-3 w-3" />
            Back
        </button>
      <div className="w-2/5 border-r border-gray-700/50 flex flex-col">
        {renderSelectionPanel()}
      </div>
      <div className="w-3/5 flex flex-col bg-gray-900/30 p-4">
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Bet Slip</h2>
        {legs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 border-2 border-dashed border-gray-700 rounded-lg p-4">
                <p>Your bet slip is empty.</p>
                <p className="text-sm">Select a game, player, and prop to get started.</p>
            </div>
        ) : (
            <div className="flex-1 flex flex-col">
                <div className="flex-grow space-y-2 overflow-y-auto pr-2 -mr-2">
                    {legs.map((leg, index) => (
                        <div key={index} className="bg-gray-800 p-2.5 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-200">{leg.player}</p>
                                <p className="text-xs text-gray-400">{leg.propType}</p>
                                <p className="text-sm text-cyan-400">{leg.position} {leg.line} @ <span className="font-mono">{formatAmericanOdds(leg.marketOdds)}</span></p>
                            </div>
                            <button onClick={() => handleRemoveLeg(index)} className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                <Trash2Icon className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
                <div className="mt-auto pt-4 border-t border-gray-700/50">
                    <div className="p-3 rounded-lg border border-gray-700 bg-gray-800/50">
                        <h3 className="text-md font-semibold text-gray-200 mb-3">Parlay Summary & Actions</h3>
                        
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-gray-300">Total Parlay Odds</span>
                                <span className="text-xl font-bold font-mono text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                            </div>

                            {/* Correlation Analysis Section */}
                            {legs.length >= 2 && (
                                <div className="p-3 rounded-lg border border-gray-700 bg-gray-900/40">
                                    {!correlationAnalysis && !isAnalyzingCorrelation && !correlationError && (
                                        <button onClick={handleAnalyzeCorrelation} className="w-full flex items-center justify-center gap-2 rounded-md bg-transparent border border-cyan-500/50 px-3 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/10 disabled:opacity-50">
                                            <SparklesIcon className="h-4 w-4" /> Analyze Parlay Correlation
                                        </button>
                                    )}
                                    {isAnalyzingCorrelation && (
                                        <div className="text-center text-sm text-gray-400">
                                            <RotateCwIcon className="h-4 w-4 inline mr-2 animate-spin" />
                                            Analyzing synergy...
                                        </div>
                                    )}
                                    {correlationError && (
                                        <div className="text-center text-xs text-red-400">
                                            <p>Analysis failed: {correlationError}</p>
                                            <button onClick={handleAnalyzeCorrelation} className="text-cyan-400 underline mt-1">Retry</button>
                                        </div>
                                    )}
                                    {correlationAnalysis && (
                                        <div>
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-semibold text-cyan-400">Synergy Analysis</h4>
                                                <div className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${correlationAnalysis.overallScore > 0.2 ? 'bg-green-500/20 text-green-300' : correlationAnalysis.overallScore < -0.2 ? 'bg-red-500/20 text-red-300' : 'bg-gray-600 text-gray-200'}`}>
                                                    Score: {correlationAnalysis.overallScore.toFixed(2)}
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">{correlationAnalysis.summary}</p>
                                            <button onClick={() => setIsCorrelationDetailsOpen(prev => !prev)} className="text-xs text-cyan-400 hover:underline mt-1.5 flex items-center gap-1">
                                                {isCorrelationDetailsOpen ? 'Hide' : 'Show'} Details <ChevronDownIcon className={`h-3 w-3 transition-transform ${isCorrelationDetailsOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isCorrelationDetailsOpen && (
                                                <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-2 max-h-40 overflow-y-auto">
                                                    {correlationAnalysis.analysis.map((detail, i) => {
                                                        const leg1 = legs[detail.leg1Index];
                                                        const leg2 = legs[detail.leg2Index];
                                                        
                                                        const getRelationshipIcon = () => {
                                                            switch(detail.relationship) {
                                                                case 'Positive': return <LinkIcon className="h-4 w-4 text-green-400 flex-shrink-0" />;
                                                                case 'Negative': return <UnlinkIcon className="h-4 w-4 text-red-400 flex-shrink-0" />;
                                                                case 'Neutral': return <MinusCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />;
                                                            }
                                                        };
                                                        
                                                        return (
                                                            <div key={i} className="text-xs bg-gray-950/50 p-2 rounded">
                                                                <div className="flex items-center gap-2 font-semibold">
                                                                    {getRelationshipIcon()}
                                                                    <p className="text-gray-300 truncate">
                                                                        {leg1.player.split(' ').slice(-1)} ({leg1.position.charAt(0)}{leg1.line}) vs {leg2.player.split(' ').slice(-1)} ({leg2.position.charAt(0)}{leg2.line})
                                                                    </p>
                                                                </div>
                                                                <p className="text-gray-400 mt-1 pl-6">{detail.explanation}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                             <div className="pt-4 border-t border-gray-700/50">
                                <button
                                    onClick={() => onAnalyze(legs)}
                                    disabled={legs.length === 0}
                                    className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    <TestTubeIcon className="h-5 w-5" />
                                    Run Full Synoptic Analysis ({legs.length})
                                </button>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    This will perform a deep-dive quantitative analysis on each individual leg of your parlay.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setIsParlayManagerOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700/70 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
                                    >
                                        <FolderOpenIcon className="h-4 w-4" /> Load Parlay
                                    </button>
                                    <button
                                        onClick={handleSaveParlay}
                                        disabled={legs.length === 0}
                                        className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700/70 px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        <SaveIcon className="h-4 w-4" /> Save Parlay
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>

       {isParlayManagerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsParlayManagerOpen(false)}>
                <div className="w-full max-w-lg rounded-xl border border-gray-700 bg-gray-900 p-6 text-gray-200" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Parlay Manager</h2>
                        <button onClick={() => setIsParlayManagerOpen(false)} className="p-1.5 rounded-md hover:bg-gray-700"><XIcon className="h-5 w-5"/></button>
                    </div>
                    {savedParlays.length > 0 ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                            {savedParlays.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(parlay => (
                                <div key={parlay.id} className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold">{parlay.name}</p>
                                        <p className="text-xs text-gray-400">{parlay.legs.length} Legs &bull; {formatAmericanOdds(parlay.odds)} &bull; Saved on {new Date(parlay.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleLoadParlay(parlay)} className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"><FolderOpenIcon className="h-4 w-4"/></button>
                                        <button onClick={() => handleDeleteParlay(parlay.id)} className="p-1.5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20"><Trash2Icon className="h-4 w-4"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">No saved parlays yet.</p>
                    )}
                </div>
            </div>
        )}

    </div>
  );
};

export default BetBuilder;