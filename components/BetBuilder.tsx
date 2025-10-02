
import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, AnalysisResponse, LineOdds, ParlayCorrelationAnalysis, SavedParlay, MarketAnalysis, MarketLineAnalysis } from '../types';
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

const INJURY_STATUS_MAP = {
    P: { text: 'Probable', color: 'text-blue-300', badgeClass: 'bg-blue-500/20 text-blue-300' },
    Q: { text: 'Questionable', color: 'text-yellow-300', badgeClass: 'bg-yellow-500/20 text-yellow-300' },
    O: { text: 'Out', color: 'text-red-400', badgeClass: 'bg-red-500/20 text-red-400' },
};

const BetBuilder: React.FC<BetBuilderProps> = ({ onAnalyze, onBack }) => {
    const [betSlip, setBetSlip] = useState<EnrichedLeg[]>([]);
    const [games, setGames] = useState<Game[]>([]);
    const [filteredGames, setFilteredGames] = useState<Game[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
    const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
    const [selectedPropType, setSelectedPropType] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showManualAdd, setShowManualAdd] = useState(false);
    const [manualFormData, setManualFormData] = useState({ line: '', marketOdds: '' });
    const [formErrors, setFormErrors] = useState<{ line?: string; marketOdds?: string }>({});

    const [savedParlays, setSavedParlays] = useState<SavedParlay[]>([]);
    const [showSavedParlays, setShowSavedParlays] = useState(false);

    const [marketAnalysisResult, setMarketAnalysisResult] = useState<MarketAnalysis | null>(null);
    const [isAnalyzingMarket, setIsAnalyzingMarket] = useState(false);
    const [correlationAnalysis, setCorrelationAnalysis] = useState<ParlayCorrelationAnalysis | null>(null);
    const [isAnalyzingCorrelation, setIsAnalyzingCorrelation] = useState(false);
    
    const [isLoadingGames, setIsLoadingGames] = useState(true);
    const [gameLoadError, setGameLoadError] = useState<string | null>(null);

    const baseMarketData = useMemo(() => getMarketData(), []);

    useEffect(() => {
        const loadGames = async () => {
            setIsLoadingGames(true);
            setGameLoadError(null);
            try {
                const fetchedGames = await fetchNFLEvents(baseMarketData);
                setGames(fetchedGames);
            } catch (error) {
                console.error("Failed to fetch NFL events:", error);
                setGameLoadError("Could not load live game data. Falling back to base market data. Some games may be outdated.");
                setGames(baseMarketData); // Fallback to mocks
            } finally {
                setIsLoadingGames(false);
            }
        };
        loadGames();
    }, [baseMarketData]);
    
    useEffect(() => {
        setFilteredGames(
            games.filter(game =>
                game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                game.players.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            )
        );
    }, [searchTerm, games]);
    
     useEffect(() => {
        try {
            const storedParlays = localStorage.getItem('synopticEdge_savedParlays');
            if (storedParlays) {
                setSavedParlays(JSON.parse(storedParlays));
            }
        } catch (error) {
            console.error("Failed to load saved parlays from localStorage", error);
        }
    }, []);

    const selectedGame = useMemo(() => games.find(g => g.id === selectedGameId), [games, selectedGameId]);
    const selectedPlayer = useMemo(() => selectedGame?.players.find(p => p.name === selectedPlayerName), [selectedGame, selectedPlayerName]);
    const selectedProp = useMemo(() => selectedPlayer?.props.find(p => p.propType === selectedPropType), [selectedPlayer, selectedPropType]);

    const parlayOdds = useMemo(() => calculateParlayOdds(betSlip), [betSlip]);

    const handleSelectGame = (gameId: string) => {
        setSelectedGameId(gameId);
        setSelectedPlayerName(null);
        setSelectedPropType(null);
        setMarketAnalysisResult(null);
    };

    const handleSelectPlayer = (playerName: string) => {
        setSelectedPlayerName(playerName);
        setSelectedPropType(null);
        setMarketAnalysisResult(null);
    };

    const handleSelectProp = (propType: string) => {
        setSelectedPropType(propType);
        setMarketAnalysisResult(null);
    }
    
    const handleAddLegToSlip = (leg: ExtractedBetLeg) => {
        const enrichedLeg: EnrichedLeg = {
            ...leg,
            playerDetails: selectedPlayer,
            propDetails: selectedProp
        }
        setBetSlip(prev => [...prev, enrichedLeg]);
    };

    const handleRemoveLeg = (index: number) => {
        setBetSlip(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearSlip = () => {
        setBetSlip([]);
        setCorrelationAnalysis(null);
    };

    const handleAnalyzeSlip = () => {
      if (betSlip.length > 0) {
        onAnalyze(betSlip.map(({ player, propType, line, position, marketOdds }) => ({ player, propType, line, position, marketOdds })));
      }
    };
    
    const validateManualForm = () => {
        const errors: { line?: string; marketOdds?: string } = {};
        const { line, marketOdds } = manualFormData;

        if (line === '' || isNaN(parseFloat(line))) {
            errors.line = "Line must be a number.";
        }
        
        const odds = Number(marketOdds);
        if (marketOdds === '' || isNaN(odds) || !Number.isInteger(odds)) {
            errors.marketOdds = "Odds must be an integer.";
        } else if (odds > -100 && odds < 100) {
            errors.marketOdds = "Odds must be ≤ -100 or ≥ 100.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleManualFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setManualFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof typeof formErrors]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleAddManualLeg = () => {
        if (!selectedPlayer || !selectedProp) return;
        if (!validateManualForm()) return;

        const line = parseFloat(manualFormData.line);
        const marketOdds = parseInt(manualFormData.marketOdds, 10);

        const leg: ExtractedBetLeg = {
            player: selectedPlayer.name,
            propType: selectedProp.propType,
            line: line,
            marketOdds: marketOdds,
            position: line > selectedProp.lines.find(l => l.line)?.line ?? line ? 'Over' : 'Under', // Simple assumption
        };
        handleAddLegToSlip(leg);
        setShowManualAdd(false);
        setManualFormData({ line: '', marketOdds: '' });
        setFormErrors({});
    };

    const handleSaveParlay = () => {
        const parlayName = prompt("Enter a name for this parlay:", `Parlay - ${new Date().toLocaleDateString()}`);
        if (parlayName && betSlip.length > 0) {
            const newParlay: SavedParlay = {
                id: `parlay_${Date.now()}`,
                name: parlayName,
                odds: parlayOdds,
                legs: betSlip.map(({ player, propType, line, position, marketOdds }) => ({ player, propType, line, position, marketOdds })),
                createdAt: new Date().toISOString(),
            };
            const updatedParlays = [newParlay, ...savedParlays];
            setSavedParlays(updatedParlays);
            localStorage.setItem('synopticEdge_savedParlays', JSON.stringify(updatedParlays));
        }
    };

    const handleLoadParlay = (parlay: SavedParlay) => {
        const enrichedLegs = parlay.legs.map(leg => {
            const game = games.find(g => g.players.some(p => p.name === leg.player));
            const playerDetails = game?.players.find(p => p.name === leg.player);
            const propDetails = playerDetails?.props.find(p => p.propType === leg.propType);
            return { ...leg, playerDetails, propDetails };
        });
        setBetSlip(enrichedLegs);
        setShowSavedParlays(false);
    };

    const handleDeleteSavedParlay = (parlayId: string) => {
        if (window.confirm("Are you sure you want to delete this saved parlay?")) {
            const updatedParlays = savedParlays.filter(p => p.id !== parlayId);
            setSavedParlays(updatedParlays);
            localStorage.setItem('synopticEdge_savedParlays', JSON.stringify(updatedParlays));
        }
    };

    const handleAnalyzeMarket = async () => {
        if (!selectedProp || !selectedPlayer) return;
        setIsAnalyzingMarket(true);
        setMarketAnalysisResult(null);
        try {
            const mainLine = selectedProp.lines.find(l => l.line) || selectedProp.lines[0];
            const query = `Provide a full market analysis for the player prop: ${selectedPlayer.name}, ${selectedProp.propType}. The primary market line is ${mainLine.line} with over odds ${mainLine.overOdds} and under odds ${mainLine.underOdds}. Provide a projected mean and standard deviation for the final stat outcome.`;
            const baseAnalysis = await getAnalysis(query);

            const { projectedMean, projectedStdDev } = baseAnalysis.quantitative;

            if (projectedMean === undefined || projectedStdDev === undefined) {
                throw new Error("AI analysis did not return the required projected mean and standard deviation.");
            }

            const marketLines: MarketLineAnalysis[] = selectedProp.lines.map(lineData => {
                const probOver = 1 - normalCdf(lineData.line, projectedMean, projectedStdDev);
                const probUnder = normalCdf(lineData.line, projectedMean, projectedStdDev);
                const overEV = calculateSingleLegEV(probOver, lineData.overOdds);
                const underEV = calculateSingleLegEV(probUnder, lineData.underOdds);
                return { ...lineData, overEV, underEV };
            });

            let optimalBet: MarketAnalysis['optimalBet'] = null;
            let maxEV = -Infinity;

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
            
            if (maxEV <= 0.1) { // EV threshold to be considered "optimal"
                optimalBet = null;
            }

            setMarketAnalysisResult({ lines: marketLines, optimalBet, baseAnalysis });

        } catch (error) {
            console.error("Error analyzing market:", error);
            // You might want to set an error state here to show in the UI
        } finally {
            setIsAnalyzingMarket(false);
        }
    };
    
    const handleAnalyzeCorrelation = async () => {
        if (betSlip.length < 2) return;
        setIsAnalyzingCorrelation(true);
        setCorrelationAnalysis(null);
        try {
            const correlationData = await analyzeParlayCorrelation(betSlip);
            setCorrelationAnalysis(correlationData);
        } catch (error) {
            console.error("Error analyzing correlation:", error);
        } finally {
            setIsAnalyzingCorrelation(false);
        }
    };

    return (
        <div className="flex flex-1 flex-col h-full">
             <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-700/50 bg-gray-900/50 px-4">
                <button onClick={onBack} className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                    <ChevronLeftIcon className="h-4 w-4" />
                    Back
                </button>
                <h2 className="text-lg font-semibold text-gray-200">Bet Builder</h2>
                <button
                    onClick={handleAnalyzeSlip}
                    disabled={betSlip.length === 0}
                    className="flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                    <SendIcon className="h-5 w-5" />
                    Analyze Slip ({betSlip.length})
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden">
                {/* Left Panel: Game/Player Selection */}
                <div className="md:col-span-3 flex flex-col border-r border-gray-700/50">
                    <div className="p-3 border-b border-gray-700/50">
                         <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search games or players..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-gray-600 bg-gray-800 py-2 pl-10 pr-4 text-gray-200 placeholder-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        </div>
                    </div>
                    {isLoadingGames ? (
                        <div className="flex-1 flex items-center justify-center text-gray-400">Loading Games...</div>
                    ) : gameLoadError ? (
                         <div className="p-3 text-sm text-yellow-300 bg-yellow-500/10 rounded-md m-3">{gameLoadError}</div>
                    ) : null}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {filteredGames.map(game => (
                            <div key={game.id}>
                                <button onClick={() => handleSelectGame(game.id)} className={`w-full text-left p-2 rounded-md transition-colors ${selectedGameId === game.id ? 'bg-gray-700/80' : 'hover:bg-gray-800/50'}`}>
                                    <p className="font-semibold text-gray-200 text-sm">{game.name}</p>
                                </button>
                                {selectedGameId === game.id && (
                                    <div className="pl-3 mt-1 space-y-1">
                                        {game.players.map(player => (
                                            <button key={player.name} onClick={() => handleSelectPlayer(player.name)} className={`w-full text-left px-2 py-1.5 rounded-md transition-colors text-sm ${selectedPlayerName === player.name ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400 hover:bg-gray-700/50'}`}>
                                                {player.name} <span className="text-gray-500 text-xs">({player.position})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Center Panel: Prop Details */}
                <div className="md:col-span-5 flex flex-col border-r border-gray-700/50">
                     <div className="flex-1 overflow-y-auto p-4">
                        {!selectedPlayer && <div className="text-center text-gray-500 mt-8">Select a game and player to view markets.</div>}
                        {selectedPlayer && !selectedProp && (
                             <div>
                                <h3 className="text-lg font-semibold text-gray-200">{selectedPlayer.name}'s Markets</h3>
                                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {selectedPlayer.props.map(prop => (
                                        <button key={prop.propType} onClick={() => handleSelectProp(prop.propType)} className="p-3 rounded-md bg-gray-800 hover:bg-gray-700/70 text-left transition-colors">
                                            <p className="font-medium text-gray-300">{prop.propType}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        {selectedPlayer && selectedProp && (
                            <div>
                               <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-100">{selectedPlayer.name}</h2>
                                        <p className="text-cyan-400 font-semibold">{selectedProp.propType}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">{selectedPlayer.team}</p>
                                        <p className="text-xs text-gray-400">{selectedPlayer.position}</p>
                                    </div>
                               </div>

                                {/* Injury Status */}
                                {selectedPlayer.injuryStatus && (
                                    <div className="mt-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                                        <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-300">
                                            <StethoscopeIcon className="h-4 w-4" />
                                            Injury Report <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${INJURY_STATUS_MAP[selectedPlayer.injuryStatus.status].badgeClass}`}>{selectedPlayer.injuryStatus.status}</span>
                                        </h4>
                                        <p className="text-xs text-yellow-200/80 mt-1">{selectedPlayer.injuryStatus.news}</p>
                                        <p className="text-xs text-yellow-200/80 mt-1 italic"><strong className="font-semibold">Impact:</strong> {selectedPlayer.injuryStatus.impact}</p>
                                    </div>
                                )}
                                
                                <div className="mt-4">
                                     <button 
                                        onClick={handleAnalyzeMarket}
                                        disabled={isAnalyzingMarket}
                                        className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isAnalyzingMarket ? <RotateCwIcon className="h-4 w-4 animate-spin"/> : <SparklesIcon className="h-4 w-4" />}
                                        {isAnalyzingMarket ? 'Analyzing Market...' : 'Run Full Market Analysis'}
                                    </button>
                                </div>
                                
                                {marketAnalysisResult ? (
                                    <div className="mt-4 p-3 rounded-lg border border-cyan-500/30 bg-gray-900/30 animate-fade-in">
                                        <h3 className="text-md font-semibold text-cyan-400 mb-2">Market Analysis Result</h3>
                                        {marketAnalysisResult.optimalBet ? (
                                            <div className="bg-green-500/10 border border-green-500/30 rounded-md p-3 text-center">
                                                <p className="text-sm text-gray-300">Optimal Bet Identified</p>
                                                <p className="text-lg font-bold text-green-300">
                                                    {marketAnalysisResult.optimalBet.position} {marketAnalysisResult.optimalBet.line}
                                                    <span className="text-sm font-normal text-gray-400"> at </span>
                                                    {formatAmericanOdds(marketAnalysisResult.optimalBet.odds)}
                                                </p>
                                                <p className="text-sm font-semibold text-green-400">
                                                    +EV: {marketAnalysisResult.optimalBet.ev.toFixed(2)}%
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-700/50 rounded-md p-3 text-center text-sm text-gray-400">
                                                No significant market edge found at current lines.
                                            </div>
                                        )}
                                        <p className="text-xs text-gray-400 mt-3 italic">{marketAnalysisResult.baseAnalysis.summary}</p>
                                    </div>
                                ) : (
                                     <div className="mt-4">
                                        <h3 className="text-md font-semibold text-gray-300 mb-2">Available Lines</h3>
                                        <div className="space-y-2">
                                            {selectedProp.lines.map((line) => (
                                                <div key={line.line} className="grid grid-cols-10 gap-2 items-center bg-gray-800/50 p-2 rounded-md">
                                                    <div className="col-span-4 text-sm text-center">
                                                        <span className="text-gray-400">Line: </span>
                                                        <span className="font-semibold text-gray-200">{line.line}</span>
                                                    </div>
                                                    <button onClick={() => handleAddLegToSlip({ player: selectedPlayer.name, propType: selectedProp.propType, line: line.line, position: 'Over', marketOdds: line.overOdds })} className="col-span-3 flex justify-between items-center text-sm p-1.5 rounded bg-gray-700/50 hover:bg-green-500/20 transition-colors">
                                                        <span>Over</span>
                                                        <span className="font-mono">{formatAmericanOdds(line.overOdds)}</span>
                                                    </button>
                                                    <button onClick={() => handleAddLegToSlip({ player: selectedPlayer.name, propType: selectedProp.propType, line: line.line, position: 'Under', marketOdds: line.underOdds })} className="col-span-3 flex justify-between items-center text-sm p-1.5 rounded bg-gray-700/50 hover:bg-green-500/20 transition-colors">
                                                        <span>Under</span>
                                                        <span className="font-mono">{formatAmericanOdds(line.underOdds)}</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Bet Slip */}
                <div className="md:col-span-4 flex flex-col bg-gray-900/30">
                     <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <h3 className="text-lg font-semibold text-gray-200 border-b border-gray-700 pb-2">Bet Slip</h3>
                        {betSlip.length === 0 ? (
                            <div className="text-center text-gray-500 pt-8">Your bet slip is empty.</div>
                        ) : (
                            betSlip.map((leg, index) => (
                                <div key={index} className="bg-gray-800/70 p-2.5 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-200 text-sm">{leg.player}</p>
                                        <p className="text-xs text-gray-400">{leg.propType}</p>
                                        <p className="font-mono text-xs text-cyan-300">
                                            {leg.position} {leg.line} @ {formatAmericanOdds(leg.marketOdds)}
                                        </p>
                                    </div>
                                    <button onClick={() => handleRemoveLeg(index)} className="p-2 rounded-md text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                                        <Trash2Icon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))
                        )}
                     </div>
                     <div className="p-4 border-t border-gray-700/50 bg-gray-950/50 space-y-3">
                        {selectedProp && !showManualAdd && (
                            <button onClick={() => setShowManualAdd(true)} className="w-full text-sm text-cyan-400 hover:text-cyan-300 transition-colors py-1">
                                + Add custom line for {selectedProp.propType}
                            </button>
                        )}
                         {selectedProp && showManualAdd && (
                            <div className="p-3 bg-gray-800/50 rounded-lg space-y-2 animate-fade-in">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm font-medium text-gray-300">Add Custom Line</p>
                                    <button onClick={() => {setShowManualAdd(false); setFormErrors({})}} className="p-1 text-gray-500 hover:text-gray-200"><XIcon className="h-4 w-4" /></button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            name="line"
                                            placeholder="Line"
                                            value={manualFormData.line}
                                            onChange={handleManualFormChange}
                                            className={`w-full text-sm rounded-md border bg-gray-700 p-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 ${formErrors.line ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                        />
                                        {formErrors.line && <p className="text-xs text-red-400 mt-1">{formErrors.line}</p>}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            name="marketOdds"
                                            placeholder="Odds"
                                            value={manualFormData.marketOdds}
                                            onChange={handleManualFormChange}
                                             className={`w-full text-sm rounded-md border bg-gray-700 p-2 text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 ${formErrors.marketOdds ? 'border-red-500 ring-red-500' : 'border-gray-600 focus:border-cyan-500 focus:ring-cyan-500'}`}
                                        />
                                        {formErrors.marketOdds && <p className="text-xs text-red-400 mt-1">{formErrors.marketOdds}</p>}
                                    </div>
                                    <button onClick={handleAddManualLeg} className="p-2 bg-cyan-500 rounded-md text-white hover:bg-cyan-600"><PlusIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        )}
                        {betSlip.length > 0 && (
                            <>
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-semibold text-gray-300">Total Odds:</span>
                                    <span className="font-mono font-bold text-yellow-300">{formatAmericanOdds(parlayOdds)}</span>
                                </div>

                                {betSlip.length > 1 && (
                                     <div>
                                        <button onClick={handleAnalyzeCorrelation} disabled={isAnalyzingCorrelation} className="w-full text-sm flex items-center justify-center gap-2 py-1.5 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50">
                                            {isAnalyzingCorrelation ? <RotateCwIcon className="h-4 w-4 animate-spin"/> : <LinkIcon className="h-4 w-4" />}
                                            {isAnalyzingCorrelation ? 'Analyzing...' : 'Analyze Correlation'}
                                        </button>
                                        {correlationAnalysis && (
                                            <div className="mt-2 text-xs text-center p-2 bg-gray-800/50 rounded-md">
                                                <p><strong className="text-gray-200">Correlation:</strong> <span className={correlationAnalysis.overallScore > 0.2 ? 'text-green-400' : correlationAnalysis.overallScore < -0.2 ? 'text-red-400' : 'text-yellow-400'}>{correlationAnalysis.overallScore.toFixed(2)}</span></p>
                                                <p className="text-gray-400 italic mt-1">{correlationAnalysis.summary}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                                
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSavedParlays(true)} className="w-full text-sm flex items-center justify-center gap-2 py-2 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"><FolderOpenIcon className="h-4 w-4" /> Load</button>
                                    <button onClick={handleSaveParlay} className="w-full text-sm flex items-center justify-center gap-2 py-2 rounded-md bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"><SaveIcon className="h-4 w-4" /> Save</button>
                                </div>
                                <button onClick={handleClearSlip} className="w-full text-sm text-red-400 hover:text-red-300 transition-colors py-1">Clear Slip</button>
                            </>
                        )}
                     </div>
                </div>
            </div>
             {showSavedParlays && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={() => setShowSavedParlays(false)}>
                    <div className="w-full max-w-lg bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Load Saved Parlay</h3>
                            <button onClick={() => setShowSavedParlays(false)} className="p-1 text-gray-500 hover:text-gray-200"><XIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {savedParlays.length > 0 ? savedParlays.map(p => (
                                <div key={p.id} className="group bg-gray-800/50 p-3 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-gray-200">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.legs.length} Legs &bull; {formatAmericanOdds(p.odds)} &bull; {new Date(p.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDeleteSavedParlay(p.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"><Trash2Icon className="h-4 w-4"/></button>
                                        <button onClick={() => handleLoadParlay(p)} className="px-3 py-1.5 text-sm rounded-md bg-cyan-500 text-white hover:bg-cyan-600">Load</button>
                                    </div>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4">No saved parlays.</p>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BetBuilder;
