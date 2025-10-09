
import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, LineOdds, SavedParlay, ParlayCorrelationAnalysis, AnalysisResponse, MarketAnalysis, DefensiveStat } from '../types';
import { calculateParlayOdds, formatAmericanOdds, normalCdf, calculateSingleLegEV } from '../utils';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { PlusIcon } from './icons/PlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { SaveIcon } from './icons/SaveIcon';
import { FolderOpenIcon } from './icons/FolderOpenIcon';
import { SearchIcon } from './icons/SearchIcon';
import { getScheduleByWeek, getTeamRoster } from '../services/nflDataService';
import { ShieldIcon } from './icons/ShieldIcon';
import { DEFENSIVE_STATS, TEAM_ABBREVIATION_TO_NAME } from '../data/mockDefensiveStats';
import { getDraftKingsMarketData } from '../services/marketDataService';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';
import { ADVANCED_STATS } from '../data/mockAdvancedStats';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { StethoscopeIcon } from './icons/StethoscopeIcon';
import { HomeIcon } from './icons/HomeIcon';
import { PlaneIcon } from './icons/PlaneIcon';
import { SwordsIcon } from './icons/SwordsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { analyzeParlayCorrelation, getAnalysis } from '../services/geminiService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import useLocalStorage from '../hooks/useLocalStorage';
import { LinkIcon } from './icons/LinkIcon';
import { RotateCwIcon } from './icons/RotateCwIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';
import MarketAnalysisChart from './MarketAnalysisChart';
import { PackageSearchIcon } from './icons/PackageSearchIcon';
import { XIcon } from './icons/XIcon';
import { LandmarkIcon } from './icons/LandmarkIcon';
import { FilePlus2Icon } from './icons/FilePlus2Icon';
import CreatePropModal from './CreatePropModal';


interface BetBuilderProps {
    onAnalyze: (legs: ExtractedBetLeg[]) => void;
    onBack: () => void;
}

const propTypeToDefensiveStatKey: Record<string, string | { position: string, key: string }> = {
    'Passing Yards': 'Passing Yards',
    'Passing Touchdowns': 'Passing Touchdowns',
    '1st Half Passing Yards': '1st Half Passing Yards',
    'Rushing Yards': 'Rushing Yards',
    'Receiving Yards': { position: 'WR', key: 'vsWR' },
    'Receptions': { position: 'WR', key: 'vsWR' },
    'Sacks': 'Sacks',
    'Tackles + Assists': 'Tackles + Assists',
};

const getScoreGradient = (score: number) => {
    const positiveColor = [96, 234, 155];
    const neutralColor = [156, 163, 175];
    const negativeColor = [248, 113, 113];

    let r, g, b;
    if (score >= 0) {
        r = Math.round(neutralColor[0] + (positiveColor[0] - neutralColor[0]) * score);
        g = Math.round(neutralColor[1] + (positiveColor[1] - neutralColor[1]) * score);
        b = Math.round(neutralColor[2] + (positiveColor[2] - neutralColor[2]) * score);
    } else {
        r = Math.round(neutralColor[0] + (negativeColor[0] - neutralColor[0]) * -score);
        g = Math.round(neutralColor[1] + (negativeColor[1] - neutralColor[1]) * -score);
        b = Math.round(neutralColor[2] + (negativeColor[2] - neutralColor[2]) * -score);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

const getRelationshipColor = (relationship: 'Positive' | 'Negative' | 'Neutral') => {
    switch (relationship) {
        case 'Positive': return 'text-green-400';
        case 'Negative': return 'text-red-400';
        default: return 'text-gray-400';
    }
};

const BetBuilder: React.FC<BetBuilderProps> = ({ onAnalyze, onBack }) => {
    const [games, setGames] = useState<Game[]>([]);
    const [isLoadingGames, setIsLoadingGames] = useState(true);
    const [gameLoadError, setGameLoadError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedGame, setSelectedGame] = useState<Game | null>(null);
    const [playersInSelectedGame, setPlayersInSelectedGame] = useState<Player[]>([]);
    const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
    const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
    const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);

    const [parlayLegs, setParlayLegs] = useState<ExtractedBetLeg[]>([]);

    const [isCreatePropModalOpen, setIsCreatePropModalOpen] = useState(false);
    const [savedParlays, setSavedParlays] = useLocalStorage<SavedParlay[]>('synopticEdge_savedParlays', []);
    const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

    const [correlationAnalysis, setCorrelationAnalysis] = useState<ParlayCorrelationAnalysis | null>(null);
    const [isCorrelationLoading, setIsCorrelationLoading] = useState(false);
    const [correlationError, setCorrelationError] = useState<string | null>(null);
    const [isCorrelationVisible, setIsCorrelationVisible] = useState(false);

    const [propAnalysis, setPropAnalysis] = useState<AnalysisResponse | null>(null);
    const [isPropAnalysisLoading, setIsPropAnalysisLoading] = useState(false);
    const [propAnalysisError, setPropAnalysisError] = useState<string | null>(null);
    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [draftKingsOdds, setDraftKingsOdds] = useState<PlayerProp | null>(null);

    const [collapsedPanels, setCollapsedPanels] = useState<Record<string, boolean>>({
        marketAnalysis: false,
        draftKingsMarket: true,
        historical: true,
        advanced: true,
        injury: false,
        matchup: true,
        splits: true,
    });

    const togglePanel = (panelKey: string) => {
        setCollapsedPanels(prev => ({ ...prev, [panelKey]: !prev[panelKey] }));
    };

    useEffect(() => {
        const loadGames = async () => {
            try {
                setGameLoadError(null);
                setIsLoadingGames(true);
                const response = await getScheduleByWeek(2024, 1);
                setGames(response.games);
            } catch (error) {
                console.error("Failed to fetch NFL events:", error);
                setGameLoadError(error instanceof Error ? error.message : "Could not load schedule.");
            } finally {
                setIsLoadingGames(false);
            }
        };
        loadGames();
    }, []);

    useEffect(() => {
        const loadPlayersForGame = async () => {
            if (!selectedGame || !selectedGame.homeTeam || !selectedGame.awayTeam) {
                setPlayersInSelectedGame([]);
                return;
            }

            setIsLoadingPlayers(true);
            try {
                const [homeRoster, awayRoster] = await Promise.all([
                    getTeamRoster(selectedGame.homeTeam.id),
                    getTeamRoster(selectedGame.awayTeam.id)
                ]);
                setPlayersInSelectedGame([...homeRoster.players, ...awayRoster.players]);
            } catch (error) {
                console.error("Failed to fetch rosters for game:", error);
            } finally {
                setIsLoadingPlayers(false);
            }
        };
        loadPlayersForGame();
    }, [selectedGame]);

    useEffect(() => {
        setCorrelationAnalysis(null);
        setCorrelationError(null);
        setIsCorrelationVisible(false);
    }, [parlayLegs]);

    useEffect(() => {
        if (selectedProp && selectedPlayer && selectedGame) {
            const runFullPropAnalysis = async () => {
                setIsPropAnalysisLoading(true);
                setPropAnalysis(null);
                setPropAnalysisError(null);
                setMarketAnalysis(null);
                setDraftKingsOdds(null);

                try {
                    const primaryLine = selectedProp.lines[Math.floor(selectedProp.lines.length / 2)] || selectedProp.lines[0];
                    const query = `Analyze the prop: ${selectedPlayer.name} ${selectedProp.propType}. Provide a detailed projection including a projectedMean and projectedStdDev for the final stat outcome, disregard specific odds for now.`;
                    const baseAnalysis = await getAnalysis(query);
                    setPropAnalysis(baseAnalysis);

                    if (baseAnalysis.quantitative.projectedMean !== undefined && baseAnalysis.quantitative.projectedStdDev !== undefined) {
                        const { projectedMean: mean, projectedStdDev: stdDev } = baseAnalysis.quantitative;
                        if (stdDev <= 0) throw new Error("Projected standard deviation must be positive.");

                        const lineAnalyses = selectedProp.lines.map(line => {
                            const probOver = 1 - normalCdf(line.line, mean, stdDev);
                            const probUnder = normalCdf(line.line, mean, stdDev);
                            return {
                                line: line.line,
                                overOdds: line.overOdds,
                                underOdds: line.underOdds,
                                overEV: calculateSingleLegEV(probOver, line.overOdds),
                                underEV: calculateSingleLegEV(probUnder, line.underOdds),
                            };
                        });

                        let optimalBet: MarketAnalysis['optimalBet'] = null;
                        let maxEv = 0;
                        lineAnalyses.forEach(line => {
                            if (line.overEV > maxEv) {
                                maxEv = line.overEV;
                                optimalBet = { line: line.line, position: 'Over', ev: line.overEV, odds: line.overOdds };
                            }
                            if (line.underEV > maxEv) {
                                maxEv = line.underEV;
                                optimalBet = { line: line.line, position: 'Under', ev: line.underEV, odds: line.underOdds };
                            }
                        });
                        setMarketAnalysis({ lines: lineAnalyses, optimalBet, baseAnalysis });
                    } else {
                        throw new Error("Base analysis did not return required projections.");
                    }

                    const dkMarket = getDraftKingsMarketData();
                    const game = dkMarket.find(g => g.id === selectedGame.id);
                    const player = game?.players.find(p => p.name === selectedPlayer.name);
                    const prop = player?.props.find(p => p.propType === selectedProp.propType);
                    setDraftKingsOdds(prop || null);

                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Could not load real-time prop analysis.';
                    setPropAnalysisError(errorMessage);
                } finally {
                    setIsPropAnalysisLoading(false);
                }
            };
            runFullPropAnalysis();
        }
    }, [selectedProp, selectedPlayer, selectedGame]);

    const filteredGames = useMemo(() => {
        if (!searchTerm) return games;
        const lowercasedTerm = searchTerm.toLowerCase();
        return games.filter(game => game.name.toLowerCase().includes(lowercasedTerm));
    }, [games, searchTerm]);

    const gamesByDate = useMemo(() => {
        const grouped: Record<string, Game[]> = {};
        filteredGames.forEach(game => {
            const date = game.date;
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push(game);
        });
        return Object.fromEntries(
            Object.entries(grouped).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
        );
    }, [filteredGames]);

    const handleSelectGame = (game: Game) => {
        setSelectedGame(game);
        setSelectedPlayer(null);
        setSelectedProp(null);
    };

    const handleSelectPlayer = (player: Player) => {
        setSelectedPlayer(player);
        setSelectedProp(null);
    }

    const handleSelectProp = (prop: PlayerProp) => {
        setSelectedProp(prop);
    }

    const handleAddLeg = (line: LineOdds, position: 'Over' | 'Under') => {
        if (!selectedPlayer || !selectedProp) return;
        const newLeg: ExtractedBetLeg = {
            player: selectedPlayer.name,
            propType: selectedProp.propType,
            line: line.line,
            position,
            marketOdds: position === 'Over' ? line.overOdds : line.underOdds,
            gameLog: selectedProp.historicalContext?.gameLog,
        };
        setParlayLegs(prev => [...prev, newLeg]);
    };

    const handleRemoveLeg = (index: number) => {
        setParlayLegs(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyzeClick = () => {
        if (parlayLegs.length > 0) onAnalyze(parlayLegs);
    };

    const handleAnalyzeCorrelation = async () => {
        if (parlayLegs.length < 2) return;
        setIsCorrelationLoading(true);
        setCorrelationError(null);
        setCorrelationAnalysis(null);
        try {
            const result = await analyzeParlayCorrelation(parlayLegs);
            setCorrelationAnalysis(result);
            if (!isCorrelationVisible) setIsCorrelationVisible(true);
        } catch (error) {
            setCorrelationError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsCorrelationLoading(false);
        }
    };

    const parlayOdds = useMemo(() => calculateParlayOdds(parlayLegs), [parlayLegs]);

    const getOpposingTeam = (playerTeamAbbr: string): string | null => {
        if (!selectedGame) return null;
        const playerTeamName = TEAM_ABBREVIATION_TO_NAME[playerTeamAbbr];
        if (!playerTeamName) return null;
        const opposingTeamName = selectedGame.name.includes(playerTeamName)
            ? (selectedGame.homeTeam?.fullName === playerTeamName ? selectedGame.awayTeam?.fullName : selectedGame.homeTeam?.fullName)
            : null;
        return opposingTeamName ?? null;
    }

    const handleSaveParlay = () => {
        if (parlayLegs.length === 0) return;
        const name = prompt("Enter a name for this parlay:", `My Parlay ${new Date().toLocaleDateString()}`);
        if (name) {
            const newSave: SavedParlay = { id: `parlay_${Date.now()}`, name, legs: parlayLegs, odds: parlayOdds, createdAt: new Date().toISOString() };
            setSavedParlays(prev => [newSave, ...prev]);
            alert("Parlay saved!");
        }
    };

    const handlePropCreated = (newLeg: ExtractedBetLeg) => {
        setParlayLegs(prev => [...prev, newLeg]);
        setIsCreatePropModalOpen(false);
    };

    const handleLoadParlay = (parlay: SavedParlay) => {
        setParlayLegs(parlay.legs);
        setIsLoadModalOpen(false);
    };

    const handleDeleteSavedParlay = (id: string) => {
        if (window.confirm("Are you sure you want to delete this saved parlay?")) {
            setSavedParlays(prev => prev.filter(p => p.id !== id));
        }
    };

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date.getTime() === today.getTime()) return 'Today';
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
    };

    const renderSelectionPanel = () => {
        if (!selectedGame) {
            return (
                <div className="flex flex-col h-full">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">Select a Game</h2>
                    {gameLoadError && <div className="p-2 mb-2 text-center text-yellow-300 bg-yellow-500/10 rounded-md text-sm shrink-0">{gameLoadError}</div>}
                    <div className="relative mb-2 shrink-0">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input type="text" placeholder="Search games..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-gray-200 focus:ring-1 focus:ring-cyan-500" />
                    </div>
                    {isLoadingGames ? (
                        <div className="text-center p-4 flex-1">Loading schedule...</div>
                    ) : (
                        <div className="flex-1 overflow-y-auto -mr-2 pr-2">
                            {Object.entries(gamesByDate).map(([date, gamesForDate]) => (
                                <div key={date}>
                                    <h3 className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400 mt-4 mb-2 border-b border-gray-700/60 pb-1.5 sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10">
                                        <CalendarDaysIcon className="h-4 w-4 text-cyan-400" /> {formatDateForDisplay(date)}
                                    </h3>
                                    <div className="space-y-2">
                                        {gamesForDate.map(game => (
                                            <button key={game.id} onClick={() => handleSelectGame(game)} className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 rounded-md transition-colors">{game.name}</button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (!selectedPlayer) {
            return (
                <div className="flex flex-col h-full">
                    <div className="shrink-0 mb-4">
                        <button onClick={() => setSelectedGame(null)} className="flex items-center gap-1 text-sm text-cyan-400 hover:underline mb-2"><ChevronLeftIcon className="h-4 w-4" /> Back to Games</button>
                        <h3 className="font-semibold text-lg text-gray-200">{selectedGame.name}</h3>
                    </div>
                    {isLoadingPlayers ? (
                        <div className="text-center p-4 flex-1">Loading players...</div>
                    ) : (
                        <div className="space-y-2 flex-1 overflow-y-auto -mr-2 pr-2">
                            {playersInSelectedGame.map(player => (
                                <button key={player.name} onClick={() => handleSelectPlayer(player)} disabled={player.injuryStatus?.status === 'O'} className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 rounded-md transition-colors disabled:opacity-50 flex justify-between items-center">
                                    <span>{player.name} <span className="text-gray-400 text-xs">{player.position}</span></span>
                                    {player.injuryStatus?.status && <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${player.injuryStatus.status === 'Q' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400'}`}>{player.injuryStatus.status}</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )
        }

        if (!selectedProp) {
            return (
                <div className="flex flex-col h-full">
                    <div className='shrink-0 mb-4'>
                        <button onClick={() => setSelectedPlayer(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline"><ChevronLeftIcon className="h-4 w-4" /> Back to Players</button>
                        <h3 className="font-semibold text-lg text-gray-200">{selectedPlayer.name}</h3>
                    </div>
                    <div className="space-y-2 flex-1 overflow-y-auto -mr-2 pr-2">
                        {selectedPlayer.props.map(prop => (
                            <button key={prop.propType} onClick={() => handleSelectProp(prop)} className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 rounded-md transition-colors">{prop.propType}</button>
                        ))}
                    </div>
                </div>
            )
        }

        const opposingTeamName = getOpposingTeam(selectedPlayer.team);
        const defensiveStats = opposingTeamName ? DEFENSIVE_STATS[opposingTeamName] : null;
        let relevantDefensiveStat: DefensiveStat | null = null;
        const lookupKey = propTypeToDefensiveStatKey[selectedProp.propType];

        if (defensiveStats && lookupKey) {
            if (typeof lookupKey === 'string') {
                const stat = defensiveStats[lookupKey];
                if (stat && 'value' in stat) relevantDefensiveStat = stat;
            } else if (lookupKey.position.includes(selectedPlayer.position)) {
                const stat = defensiveStats[lookupKey.key];
                if (stat && 'value' in stat) relevantDefensiveStat = stat;
            }
        }

        const advancedStats = ADVANCED_STATS[selectedPlayer.name]?.[selectedProp.propType];

        return (
            <div className="overflow-y-auto -mr-2 pr-2">
                <button onClick={() => setSelectedProp(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline"><ChevronLeftIcon className="h-4 w-4" /> Back to Props</button>
                <h3 className="font-semibold text-lg text-gray-200">{selectedPlayer.name}</h3>
                <p className="text-md text-gray-300 mb-3">{selectedProp.propType}</p>

                <div className="space-y-2 mb-4">
                    {selectedProp.lines.map((line) => {
                        const lineAnalysis = marketAnalysis?.lines.find(l => l.line === line.line);
                        const overEv = lineAnalysis?.overEV;
                        const underEv = lineAnalysis?.underEV;
                        const optimalBet = marketAnalysis?.optimalBet;
                        const isOptimalOver = optimalBet?.line === line.line && optimalBet?.position === 'Over';
                        const isOptimalUnder = optimalBet?.line === line.line && optimalBet?.position === 'Under';
                        const renderEv = (ev: number | undefined) => ev !== undefined ? <div className={`text-xs font-mono h-4 ${ev > 0 ? 'text-green-400' : 'text-red-400'}`}>{ev.toFixed(1)}% EV</div> : <div className="h-4"></div>;
                        return (
                            <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-800/50 rounded-md">
                                <div className="col-span-4 text-center">
                                    <button onClick={() => handleAddLeg(line, 'Over')} className={`relative w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50 ${isOptimalOver ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-400' : ''}`} disabled={isPropAnalysisLoading}>
                                        {isOptimalOver && <SparklesIcon className="absolute top-1 right-1 h-3.5 w-3.5 text-yellow-300" />}
                                        <div>Over</div><div className="font-semibold">{formatAmericanOdds(line.overOdds)}</div>{renderEv(overEv)}
                                    </button>
                                </div>
                                <div className="col-span-3 text-center"><div className="text-lg font-bold text-gray-200">{line.line}</div></div>
                                <div className="col-span-4 text-center">
                                    <button onClick={() => handleAddLeg(line, 'Under')} className={`relative w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50 ${isOptimalUnder ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-yellow-400' : ''}`} disabled={isPropAnalysisLoading}>
                                        {isOptimalUnder && <SparklesIcon className="absolute top-1 right-1 h-3.5 w-3.5 text-yellow-300" />}
                                        <div>Under</div><div className="font-semibold">{formatAmericanOdds(line.underOdds)}</div>{renderEv(underEv)}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {isPropAnalysisLoading && <div className="my-4 p-4 text-center text-sm text-gray-400 border border-gray-700/50 bg-gray-800/80 rounded-lg animate-pulse">Running full market analysis...</div>}
                {propAnalysisError && !isPropAnalysisLoading && <div className="my-4 p-3 text-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/30">{propAnalysisError}</div>}
                {marketAnalysis && !isPropAnalysisLoading && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('marketAnalysis')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><PackageSearchIcon className="h-4 w-4 text-cyan-400" /> Market Analysis</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.marketAnalysis ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.marketAnalysis && (
                            <div className="space-y-3 animate-fade-in">
                                {marketAnalysis.optimalBet ? <div className="p-2.5 rounded-md bg-green-500/10 border border-green-500/30"><div className="text-xs text-green-300 font-semibold mb-1">Optimal Bet Identified</div><div className="flex justify-between items-center"><div className="font-semibold text-gray-100">{selectedPlayer.name} {marketAnalysis.optimalBet.position} {marketAnalysis.optimalBet.line}</div><div className="text-right"><div className="font-mono text-lg text-green-400 font-bold">{marketAnalysis.optimalBet.ev.toFixed(2)}% EV</div><div className="text-xs text-gray-400 font-mono">@{formatAmericanOdds(marketAnalysis.optimalBet.odds)}</div></div></div></div> : <div className="p-2.5 text-center text-sm text-gray-400 bg-gray-900/50 rounded-md">No significant positive EV found in the current market.</div>}
                                <MarketAnalysisChart marketAnalysis={marketAnalysis} />
                                <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-900/50 rounded-md italic"><strong>Base Analysis:</strong> {marketAnalysis.baseAnalysis.summary}</p>
                            </div>
                        )}
                    </div>
                )}
                {draftKingsOdds && !isPropAnalysisLoading && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('draftKingsMarket')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><LandmarkIcon className="h-4 w-4 text-cyan-400" /> DraftKings Market</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.draftKingsMarket ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.draftKingsMarket && <div className="space-y-2 animate-fade-in">{draftKingsOdds.lines.map((line) => <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-800 rounded-md text-sm"><div className="col-span-4 text-center font-semibold">{formatAmericanOdds(line.overOdds)}</div><div className="col-span-3 text-center text-gray-200 font-bold">{line.line}</div><div className="col-span-4 text-center font-semibold">{formatAmericanOdds(line.underOdds)}</div></div>)}</div>}
                    </div>
                )}
                {selectedProp.historicalContext && selectedProp.historicalContext.gameLog && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('historical')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><TrendingUpIcon className="h-4 w-4 text-cyan-400" /> Historical Performance</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.historical ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.historical && <div className="animate-fade-in"><HistoricalPerformanceChart gameLog={selectedProp.historicalContext.gameLog} selectedLine={selectedProp.lines[0].line} seasonAvg={selectedProp.historicalContext.seasonAvg || null} last5Avg={selectedProp.historicalContext.last5Avg || null}/></div>}
                    </div>
                )}
                 {advancedStats && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('advanced')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><SparklesIcon className="h-4 w-4 text-cyan-400" /> Advanced Stats</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.advanced ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.advanced && (
                            <div className="space-y-3 animate-fade-in pt-2">
                                {advancedStats.map(stat => (
                                    <div key={stat.abbreviation} className="group relative">
                                        <div className="flex justify-between items-baseline">
                                            <p className="text-gray-300 text-sm font-medium">{stat.abbreviation}</p>
                                            <p className="font-mono text-gray-200 text-sm">{stat.value}</p>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                            <div className="bg-gradient-to-r from-cyan-600 to-cyan-400 h-1.5 rounded-full" style={{ width: `${stat.percentile}%` }}></div>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <p className="font-bold">{stat.name}</p>
                                            <p>{stat.description}</p>
                                            <p className="mt-1"><span className="font-semibold">Rank:</span> {stat.rank}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                 {selectedPlayer.injuryStatus && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                         <button onClick={() => togglePanel('injury')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><StethoscopeIcon className="h-4 w-4 text-cyan-400" /> Injury Status</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.injury ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.injury && (
                            <div className="animate-fade-in space-y-2 text-xs pt-1">
                                <p><span className="font-semibold text-gray-200">News:</span> <span className="text-gray-400">{selectedPlayer.injuryStatus.news}</span></p>
                                <p><span className="font-semibold text-gray-200">Impact Analysis:</span> <span className="text-gray-400 italic">{selectedPlayer.injuryStatus.impact}</span></p>
                            </div>
                        )}
                    </div>
                )}
                {relevantDefensiveStat && (
                    <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('matchup')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><ShieldIcon className="h-4 w-4 text-cyan-400" /> Matchup Details</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.matchup ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.matchup && (
                            <div className="animate-fade-in pt-1">
                                <p className="text-xs text-gray-400">vs. {opposingTeamName} Defense</p>
                                <div className="flex justify-between items-baseline mt-1">
                                    <p className="text-gray-200 text-sm font-medium">{selectedProp.propType} Allowed</p>
                                    <p className="font-mono text-gray-200 text-sm">{relevantDefensiveStat.value.toFixed(1)} {relevantDefensiveStat.unit}</p>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                    <div className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-1.5 rounded-full" style={{ width: `${(1 - (relevantDefensiveStat.rank - 1) / 31) * 100}%` }}></div>
                                </div>
                                <p className="text-right text-xs text-gray-500 mt-1">#{relevantDefensiveStat.rank} in NFL</p>
                            </div>
                        )}
                    </div>
                )}
                {selectedPlayer.homeAwaySplits && (
                     <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('splits')} className="w-full flex justify-between items-center text-left mb-2"><h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300"><HomeIcon className="h-4 w-4 text-cyan-400" /> Performance Splits</h4><ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.splits ? '' : 'rotate-180'}`} /></button>
                        {!collapsedPanels.splits && (
                            <div className="animate-fade-in pt-1 text-sm space-y-2">
                                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-300"><HomeIcon className="h-4 w-4"/> Home</span> <span className="font-mono">{selectedPlayer.homeAwaySplits.home[selectedProp.propType]}</span></div>
                                <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-300"><PlaneIcon className="h-4 w-4"/> Away</span> <span className="font-mono">{selectedPlayer.homeAwaySplits.away[selectedProp.propType]}</span></div>
                                {selectedPlayer.divisionalSplits && <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-gray-300"><SwordsIcon className="h-4 w-4"/> Divisional</span> <span className="font-mono">{selectedPlayer.divisionalSplits[selectedProp.propType]}</span></div>}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex h-full w-full p-4 md:p-6 gap-6">
            <div className="flex-1 bg-gray-800/50 rounded-lg p-4 flex flex-col min-w-0">
                {renderSelectionPanel()}
            </div>
            <div className="w-96 shrink-0 bg-gray-900/40 rounded-lg border border-gray-700/50 p-4 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-xl font-semibold text-gray-200">Parlay Slip</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setIsLoadModalOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors" aria-label="Load parlay"><FolderOpenIcon className="h-5 w-5"/></button>
                        <button onClick={handleSaveParlay} disabled={parlayLegs.length === 0} className="p-2 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors disabled:opacity-50" aria-label="Save parlay"><SaveIcon className="h-5 w-5"/></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto -mr-2 pr-2 space-y-2 mb-2">
                    {parlayLegs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                           <p>Your slip is empty.</p>
                           <p className="text-xs mt-1">Select a prop to get started.</p>
                        </div>
                    ) : (
                        parlayLegs.map((leg, index) => (
                            <div key={index} className="bg-gray-800 p-2.5 rounded-md flex justify-between items-center animate-fade-in">
                                <div>
                                    <p className="font-semibold text-gray-200 text-sm">{leg.player}</p>
                                    <p className="text-xs text-gray-400">{`${leg.position} ${leg.line} ${leg.propType}`}</p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <p className="font-mono text-sm text-gray-300">{formatAmericanOdds(leg.marketOdds)}</p>
                                    <button onClick={() => handleRemoveLeg(index)} className="p-1 text-gray-500 hover:text-red-400"><Trash2Icon className="h-4 w-4"/></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {parlayLegs.length > 0 && (
                  <>
                    <button onClick={() => setIsCreatePropModalOpen(true)} className="w-full flex items-center justify-center gap-2 mt-2 py-1.5 text-xs rounded-md bg-gray-700/50 hover:bg-gray-700 text-cyan-300 transition-colors">
                        <FilePlus2Icon className="h-4 w-4" /> Add Custom Prop
                    </button>
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-semibold text-gray-300">Total Odds</span>
                            <span className="font-mono font-bold text-cyan-300">{formatAmericanOdds(parlayOdds)}</span>
                        </div>
                        <div className="mt-3">
                             <button onClick={() => setIsCorrelationVisible(!isCorrelationVisible)} disabled={parlayLegs.length < 2} className="w-full flex items-center justify-center gap-2 text-sm py-1 rounded-md text-gray-300 bg-gray-800/60 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                <LinkIcon className="h-4 w-4" /> Correlation <ChevronDownIcon className={`h-4 w-4 transition-transform ${isCorrelationVisible ? 'rotate-180' : ''}`} />
                            </button>
                            {isCorrelationVisible && (
                                <div className="mt-2 p-3 bg-gray-800/70 rounded-md border border-gray-700/50 animate-fade-in">
                                    {isCorrelationLoading ? <p className="text-xs text-center text-gray-400">Analyzing correlation...</p> : 
                                    correlationError ? <p className="text-xs text-center text-red-400">{correlationError}</p> :
                                    correlationAnalysis ? (
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-semibold">Synergy Score</span>
                                                <span className="text-lg font-bold" style={{ color: getScoreGradient(correlationAnalysis.overallScore) }}>{correlationAnalysis.overallScore.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 italic">{correlationAnalysis.summary}</p>
                                            {correlationAnalysis.analysis.map((detail, i) => (
                                                <div key={i} className="text-xs border-t border-gray-700/50 pt-1">
                                                    <p className="font-semibold">{parlayLegs[detail.leg1Index].player.split(' ').pop()} / {parlayLegs[detail.leg2Index].player.split(' ').pop()}: <span className={getRelationshipColor(detail.relationship)}>{detail.relationship}</span></p>
                                                    <p className="text-gray-500">{detail.explanation}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <button onClick={handleAnalyzeCorrelation} className="w-full flex items-center justify-center gap-1 text-xs py-1 rounded bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"><RotateCwIcon className="h-3 w-3" /> Run Analysis</button>}
                                </div>
                            )}
                        </div>
                        <button onClick={handleAnalyzeClick} className="w-full flex items-center justify-center gap-2 mt-4 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600">
                            <SendIcon className="h-5 w-5" /> Analyze Parlay
                        </button>
                    </div>
                  </>
                )}
            </div>

            {isLoadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsLoadModalOpen(false)}>
                    <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-200">Load Saved Parlay</h3>
                            <button onClick={() => setIsLoadModalOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600"><XIcon className="h-5 w-5" /></button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            {savedParlays.length === 0 ? <p className="text-center text-gray-500">No saved parlays yet.</p> : (
                                <div className="space-y-2">
                                    {savedParlays.map(parlay => (
                                        <div key={parlay.id} className="bg-gray-900/50 p-3 rounded-md flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-200">{parlay.name}</p>
                                                <p className="text-xs text-gray-400">{parlay.legs.length} legs &bull; {formatAmericanOdds(parlay.odds)}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleDeleteSavedParlay(parlay.id)} className="p-2 rounded-md bg-gray-700/50 text-gray-400 hover:bg-red-500/20 hover:text-red-400"><Trash2Icon className="h-4 w-4"/></button>
                                                <button onClick={() => handleLoadParlay(parlay)} className="px-3 py-1.5 text-sm rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20">Load</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
             <CreatePropModal 
                isOpen={isCreatePropModalOpen}
                onClose={() => setIsCreatePropModalOpen(false)}
                onPropCreated={handlePropCreated}
            />
            <button onClick={onBack} className="absolute top-20 left-6 flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                <ChevronLeftIcon className="h-4 w-4" />
                Back to Mode Select
            </button>
        </div>
    );
};

export default BetBuilder;
