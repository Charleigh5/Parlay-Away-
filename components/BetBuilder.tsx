
import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, LineOdds, SavedParlay, ParlayCorrelationAnalysis, AnalysisResponse, MarketAnalysis } from '../types';
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
import { DEFENSIVE_STATS, TEAM_ABBREVIATION_TO_NAME, TEAM_NAME_TO_ABBREVIATION } from '../data/mockDefensiveStats';
import { getDraftKingsMarketData } from '../services/marketDataService';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';
import { ADVANCED_STATS, AdvancedStat } from '../data/mockAdvancedStats';
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

const propTypeToDefensiveStatKey: Record<string, string | { position: string, key: string } > = {
    'Passing Yards': 'Passing Yards',
    'Passing Touchdowns': 'Passing Touchdowns',
    '1st Half Passing Yards': '1st Half Passing Yards',
    'Rushing Yards': 'Rushing Yards',
    'Receiving Yards': { position: 'WR', key: 'vsWR' },
    'Receptions': { position: 'WR', key: 'vsWR' }, // Can map to same as yards
    'Sacks': 'Sacks',
    'Tackles + Assists': 'Tackles + Assists',
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
    setCollapsedPanels(prev => ({...prev, [panelKey]: !prev[panelKey]}));
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
     // Fetch rosters when a game is selected
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
            // The service returns the full roster object which contains players
            setPlayersInSelectedGame([...homeRoster.players, ...awayRoster.players]);
        } catch (error) {
            console.error("Failed to fetch rosters for game:", error);
            // Handle error state in UI if necessary
        } finally {
            setIsLoadingPlayers(false);
        }
    };

    loadPlayersForGame();
  }, [selectedGame])

  useEffect(() => {
    // Reset correlation analysis if legs change
    setCorrelationAnalysis(null);
    setCorrelationError(null);
    setIsCorrelationVisible(false);
  }, [parlayLegs]);

  useEffect(() => {
    if (selectedProp && selectedPlayer && selectedGame) {
        const runFullPropAnalysis = async () => {
            // Reset states
            setIsPropAnalysisLoading(true);
            setPropAnalysis(null);
            setPropAnalysisError(null);
            setMarketAnalysis(null);
            setDraftKingsOdds(null);
            
            try {
                // Step 1: Get base projection
                const primaryLine = selectedProp.lines[Math.floor(selectedProp.lines.length / 2)] || selectedProp.lines[0];
                const query = `Analyze the prop: ${selectedPlayer.name} ${selectedProp.propType}. Provide a detailed projection including a projectedMean and projectedStdDev for the final stat outcome, disregard specific odds for now.`;
                const baseAnalysis = await getAnalysis(query);
                setPropAnalysis(baseAnalysis); // Set base analysis for context

                // Step 2: Calculate market-wide EV using the projection
                if (baseAnalysis.quantitative.projectedMean !== undefined && baseAnalysis.quantitative.projectedStdDev !== undefined) {
                    const { projectedMean: mean, projectedStdDev: stdDev } = baseAnalysis.quantitative;
                    if (stdDev <= 0) {
                        throw new Error("Projected standard deviation must be positive to calculate probabilities.");
                    }

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

                    setMarketAnalysis({
                        lines: lineAnalyses,
                        optimalBet,
                        baseAnalysis,
                    });

                } else {
                     throw new Error("Base analysis did not return the required projections (mean, std dev).");
                }

                 // Step 3: Fetch DraftKings odds for comparison
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
    // Since players aren't loaded with games, we can't search by player here yet.
    // This could be enhanced later if needed.
    return games.filter(game =>
      game.name.toLowerCase().includes(lowercasedTerm)
    );
  }, [games, searchTerm]);
  
  const gamesByDate = useMemo(() => {
    const grouped: Record<string, Game[]> = {};
    filteredGames.forEach(game => {
        const date = game.date;
        if (!grouped[date]) {
            grouped[date] = [];
        }
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
    if (parlayLegs.length > 0) {
      onAnalyze(parlayLegs);
    }
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
      const newSave: SavedParlay = {
        id: `parlay_${Date.now()}`,
        name,
        legs: parlayLegs,
        odds: parlayOdds,
        createdAt: new Date().toISOString()
      };
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
  
    const getScoreGradient = (score: number) => {
        const positiveColor = [96, 234, 155]; // text-green-400
        const neutralColor = [156, 163, 175]; // text-gray-400
        const negativeColor = [248, 113, 113]; // text-red-400

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

    const formatDateForDisplay = (dateString: string) => {
        const date = new Date(dateString + 'T00:00:00'); // Treat as local time
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            return 'Today';
        }
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
    };

  const renderSelectionPanel = () => {
    if (!selectedGame) {
      return (
        <>
           {gameLoadError && <div className="p-2 mb-2 text-center text-yellow-300 bg-yellow-500/10 rounded-md text-sm shrink-0">{gameLoadError}</div>}
           <div className="relative mb-2 shrink-0">
             <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
             <input
               type="text"
               placeholder="Search games..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full bg-gray-900 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
             />
           </div>
           {isLoadingGames ? (
             <div className="text-center p-4 flex-1">Loading schedule...</div>
           ) : (
            <div className="flex-1 overflow-y-auto -mr-4 pr-4">
              {Object.entries(gamesByDate).map(([date, gamesForDate]) => (
                <div key={date}>
                  <h3 className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400 mt-4 mb-2 border-b border-gray-700/60 pb-1.5 sticky top-0 bg-gray-800/80 backdrop-blur-sm z-10">
                      <CalendarDaysIcon className="h-4 w-4 text-cyan-400" />
                      {formatDateForDisplay(date)}
                  </h3>
                  <div className="space-y-2">
                      {gamesForDate.map(game => (
                          <button key={game.id} onClick={() => handleSelectGame(game)} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                              {game.name}
                          </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
           )}
        </>
      );
    }

    if (!selectedPlayer) {
      return (
         <>
            <div className="shrink-0">
                <div className="flex justify-between items-center mb-2">
                    <button onClick={() => setSelectedGame(null)} className="flex items-center gap-1 text-sm text-cyan-400 hover:underline">
                        <ChevronLeftIcon className="h-4 w-4" /> Back to Games
                    </button>
                    <button onClick={() => setIsCreatePropModalOpen(true)} className="flex items-center gap-1.5 text-sm text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded-md hover:bg-cyan-500/20">
                        <FilePlus2Icon className="h-4 w-4" />
                        Create Prop
                    </button>
                </div>
                <h3 className="font-semibold text-lg text-gray-200 mb-2">{selectedGame.name}</h3>
            </div>
            {isLoadingPlayers ? (
                <div className="text-center p-4 flex-1">Loading players...</div>
            ) : (
                <div className="space-y-2 flex-1 overflow-y-auto -mr-4 pr-4">
                    {playersInSelectedGame.map(player => (
                        <button key={player.name} onClick={() => handleSelectPlayer(player)} disabled={player.injuryStatus?.status === 'O'} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-between items-center">
                            <span>{player.name} <span className="text-gray-400 text-xs">{player.position}</span></span>
                            {player.injuryStatus?.status && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${player.injuryStatus.status === 'Q' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400'}`}>
                                    {player.injuryStatus.status}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </>
      )
    }
    
    if (!selectedProp) {
        return (
            <>
               <div className='shrink-0'>
                   <button onClick={() => setSelectedPlayer(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline">
                       <ChevronLeftIcon className="h-4 w-4" /> Back to Players
                   </button>
                   <h3 className="font-semibold text-lg text-gray-200 mb-2">{selectedPlayer.name}</h3>
               </div>
               <div className="space-y-2 flex-1 overflow-y-auto -mr-4 pr-4">
                   {selectedPlayer.props.map(prop => (
                       <button key={prop.propType} onClick={() => handleSelectProp(prop)} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                           {prop.propType}
                       </button>
                   ))}
               </div>
           </>
        )
    }
    
    const opposingTeamName = getOpposingTeam(selectedPlayer.team);
    const defensiveStats = opposingTeamName ? DEFENSIVE_STATS[opposingTeamName] : null;
    let relevantDefensiveStat = null;
    const lookupKey = propTypeToDefensiveStatKey[selectedProp.propType];

    if (defensiveStats && lookupKey) {
        if (typeof lookupKey === 'string') {
            relevantDefensiveStat = defensiveStats[lookupKey];
        } else if (lookupKey.position.includes(selectedPlayer.position)) { // for WR/TE etc.
            relevantDefensiveStat = defensiveStats[lookupKey.key];
        }
    }
    
    const advancedStats = ADVANCED_STATS[selectedPlayer.name]?.[selectedProp.propType];
    
    return (
        <div className="overflow-y-auto -mr-4 pr-4">
            <button onClick={() => setSelectedProp(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline">
                <ChevronLeftIcon className="h-4 w-4" /> Back to Props
            </button>
            <h3 className="font-semibold text-lg text-gray-200">{selectedPlayer.name}</h3>
            <p className="text-md text-gray-300 mb-3">{selectedProp.propType}</p>

            {/* Market Lines */}
            <div className="space-y-2 mb-4">
                {selectedProp.lines.map((line) => {
                    const lineAnalysis = marketAnalysis?.lines.find(l => l.line === line.line);
                    const overEv = lineAnalysis?.overEV;
                    const underEv = lineAnalysis?.underEV;

                    const renderEv = (ev: number | undefined) => {
                        if (ev === undefined) return <div className="h-4"></div>; // Placeholder for alignment
                        const color = ev > 0 ? 'text-green-400' : 'text-red-400';
                        return (
                            <div className={`text-xs font-mono h-4 ${color}`}>{ev.toFixed(1)}% EV</div>
                        )
                    }
                    
                    return (
                        <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-800 rounded-md">
                            <div className="col-span-4 text-center">
                                <button onClick={() => handleAddLeg(line, 'Over')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50" disabled={isPropAnalysisLoading}>
                                    <div>Over</div>
                                    <div className="font-semibold">{formatAmericanOdds(line.overOdds)}</div>
                                    {renderEv(overEv)}
                                </button>
                            </div>
                            <div className="col-span-3 text-center">
                                <div className="text-lg font-bold text-gray-200">{line.line}</div>
                            </div>
                            <div className="col-span-4 text-center">
                                 <button onClick={() => handleAddLeg(line, 'Under')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors disabled:opacity-50" disabled={isPropAnalysisLoading}>
                                    <div>Under</div>
                                    <div className="font-semibold">{formatAmericanOdds(line.underOdds)}</div>
                                    {renderEv(underEv)}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Market Analysis Panel */}
            {isPropAnalysisLoading && (
                <div className="my-4 p-4 text-center text-sm text-gray-400 border border-gray-700/50 bg-gray-800/80 rounded-lg animate-pulse">
                    Running full market analysis...
                </div>
            )}
            {propAnalysisError && !isPropAnalysisLoading && (
                <div className="my-4 p-3 text-center text-red-400 bg-red-500/10 rounded-md text-sm border border-red-500/30">
                    {propAnalysisError}
                </div>
            )}
            {marketAnalysis && !isPropAnalysisLoading && (
                <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                    <button onClick={() => togglePanel('marketAnalysis')} className="w-full flex justify-between items-center text-left mb-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                            <PackageSearchIcon className="h-4 w-4 text-cyan-400" /> Market Analysis
                        </h4>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.marketAnalysis ? '' : 'rotate-180'}`} />
                    </button>
                    {!collapsedPanels.marketAnalysis && (
                        <div className="space-y-3 animate-fade-in">
                            {marketAnalysis.optimalBet ? (
                                <div className="p-2.5 rounded-md bg-green-500/10 border border-green-500/30">
                                    <div className="text-xs text-green-300 font-semibold mb-1">Optimal Bet Identified</div>
                                    <div className="flex justify-between items-center">
                                        <div className="font-semibold text-gray-100">
                                            {selectedPlayer.name} {marketAnalysis.optimalBet.position} {marketAnalysis.optimalBet.line}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-lg text-green-400 font-bold">
                                                {marketAnalysis.optimalBet.ev.toFixed(2)}% EV
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono">
                                                @{formatAmericanOdds(marketAnalysis.optimalBet.odds)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2.5 text-center text-sm text-gray-400 bg-gray-900/50 rounded-md">
                                    No significant positive EV found in the current market.
                                </div>
                            )}
                            <MarketAnalysisChart marketAnalysis={marketAnalysis} />
                            <p className="text-xs text-gray-400 mt-2 p-2 bg-gray-900/50 rounded-md italic">
                                <strong>Base Analysis:</strong> {marketAnalysis.baseAnalysis.summary}
                            </p>
                        </div>
                    )}
                </div>
            )}

             {/* DraftKings Market Panel */}
             {draftKingsOdds && !isPropAnalysisLoading && (
                <div className="my-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                    <button onClick={() => togglePanel('draftKingsMarket')} className="w-full flex justify-between items-center text-left mb-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                            <LandmarkIcon className="h-4 w-4 text-cyan-400" /> DraftKings Market
                        </h4>
                        <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${collapsedPanels.draftKingsMarket ? '' : 'rotate-180'}`} />
                    </button>
                    {!collapsedPanels.draftKingsMarket && (
                        <div className="space-y-2 animate-fade-in">
                            {draftKingsOdds.lines.map((line) => (
                                <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-800 rounded-md text-sm">
                                    <div className="col-span-4 text-center font-semibold text-gray-300">
                                        {formatAmericanOdds(line.overOdds)}
                                    </div>
                                    <div className="col-span-3 text-center">
                                        <div className="text-lg font-bold text-gray-200">{line.line}</div>
                                    </div>
                                    <div className="col-span-4 text-center font-semibold text-gray-300">
                                        {formatAmericanOdds(line.underOdds)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}


            {/* Other Contextual Data Panels */}
            <div className="mt-4 space-y-3 text-sm">
                {selectedProp.historicalContext?.gameLog && (
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('historical')} className="w-full flex justify-between items-center text-left">
                            <h4 className="text-xs font-semibold text-gray-400 uppercase">Last 7 Games Performance</h4>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${collapsedPanels.historical ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedPanels.historical && (
                            <div className="animate-fade-in pt-2">
                                <HistoricalPerformanceChart
                                    gameLog={selectedProp.historicalContext.gameLog}
                                    selectedLine={selectedProp.lines[Math.floor(selectedProp.lines.length / 2)].line}
                                    seasonAvg={selectedProp.historicalContext.seasonAvg}
                                    last5Avg={selectedProp.historicalContext.last5Avg}
                                />
                            </div>
                        )}
                    </div>
                )}

                {advancedStats && advancedStats.length > 0 && (
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('advanced')} className="w-full flex justify-between items-center text-left">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
                                <TrendingUpIcon className="h-4 w-4 text-cyan-400" /> Advanced Metrics
                            </h4>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${collapsedPanels.advanced ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedPanels.advanced && (
                            <div className="space-y-2 animate-fade-in mt-2">
                                {advancedStats.map(stat => (
                                    <div key={stat.abbreviation} className="group relative">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">{stat.abbreviation}</span>
                                            <span className="font-mono text-cyan-300">{stat.value}</span>
                                        </div>
                                        <div className="relative h-1.5 bg-gray-700 rounded-full mt-1">
                                            <div className="absolute h-1.5 bg-cyan-500 rounded-full" style={{ width: `${stat.percentile}%` }}></div>
                                        </div>
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            <p className="font-bold text-cyan-300">{stat.name}</p>
                                            <p>{stat.description} Ranks #{stat.rank} ({stat.percentile}th percentile).</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {selectedPlayer.injuryStatus && (
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                        <button onClick={() => togglePanel('injury')} className="w-full flex justify-between items-center text-left">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
                                <StethoscopeIcon className="h-4 w-4 text-cyan-400" /> Injury Analysis
                            </h4>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${collapsedPanels.injury ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedPanels.injury && (
                            <div className="animate-fade-in mt-2">
                                <p className="text-gray-300"><strong className={`font-bold ${selectedPlayer.injuryStatus.status === 'Q' ? 'text-yellow-300' : 'text-red-400'}`}>{selectedPlayer.injuryStatus.status === 'Q' ? 'Questionable' : 'Out'}:</strong> {selectedPlayer.injuryStatus.news}</p>
                                <p className="text-gray-400 italic mt-1 text-xs"><strong>Impact:</strong> {selectedPlayer.injuryStatus.impact}</p>
                            </div>
                        )}
                    </div>
                )}

                {relevantDefensiveStat && (
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                         <button onClick={() => togglePanel('matchup')} className="w-full flex justify-between items-center text-left">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">
                                <ShieldIcon className="h-4 w-4 text-cyan-400" /> Defensive Matchup ({TEAM_NAME_TO_ABBREVIATION[opposingTeamName!] || opposingTeamName})
                            </h4>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${collapsedPanels.matchup ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedPanels.matchup && (
                            <div className="animate-fade-in mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300">Allowed {relevantDefensiveStat.unit}</span>
                                    <span className="font-mono text-cyan-300">{relevantDefensiveStat.value.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-gray-300">League Rank</span>
                                    <span className="font-mono text-cyan-300">#{relevantDefensiveStat.rank}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {selectedPlayer.homeAwaySplits && (
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                         <button onClick={() => togglePanel('splits')} className="w-full flex justify-between items-center text-left">
                            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-400">Performance Splits</h4>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 transition-transform ${collapsedPanels.splits ? '' : 'rotate-180'}`} />
                        </button>
                        {!collapsedPanels.splits && (
                             <div className="space-y-1 animate-fade-in mt-2">
                                <div className="flex items-center gap-2 text-gray-300"><HomeIcon className="h-4 w-4" /> <span>Home: <span className="font-mono text-gray-200">{selectedPlayer.homeAwaySplits.home[selectedProp.propType]?.toFixed(1)}</span></span></div>
                                <div className="flex items-center gap-2 text-gray-300"><PlaneIcon className="h-4 w-4" /> <span>Away: <span className="font-mono text-gray-200">{selectedPlayer.homeAwaySplits.away[selectedProp.propType]?.toFixed(1)}</span></span></div>
                                {selectedPlayer.divisionalSplits?.[selectedProp.propType] && (
                                    <div className="flex items-center gap-2 text-gray-300"><SwordsIcon className="h-4 w-4" /> <span>Divisional: <span className="font-mono text-gray-200">{selectedPlayer.divisionalSplits[selectedProp.propType]?.toFixed(1)}</span></span></div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="flex h-full w-full">
      {/* Left Panel: Game/Player/Prop Selection */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 border-r border-gray-700/50 flex flex-col">
        {renderSelectionPanel()}
      </div>

      {/* Right Panel: Parlay Slip */}
      <div className="hidden md:flex flex-col w-1/2 lg:w-3/5 bg-gray-900/30 relative">
        <div className="p-4 border-b border-gray-700/50">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-200">Parlay Slip</h2>
                <div className="flex items-center gap-2">
                    <button onClick={handleSaveParlay} disabled={parlayLegs.length === 0} className="p-2 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" aria-label="Save parlay">
                        <SaveIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => setIsLoadModalOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors" aria-label="Load parlay">
                        <FolderOpenIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
          <div className="mt-2 text-sm text-gray-400">Total Odds: <span className="font-mono text-lg font-bold text-cyan-300">{formatAmericanOdds(parlayOdds)}</span></div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {parlayLegs.length === 0 ? (
            <div className="text-center text-gray-500 pt-10">Add selections to build your parlay.</div>
          ) : (
            parlayLegs.map((leg, index) => (
              <div key={index} className="p-3 bg-gray-800/70 rounded-md flex justify-between items-center animate-fade-in">
                <div>
                  <p className="font-semibold text-gray-200">{leg.player}</p>
                  <p className="text-sm text-gray-400">{`${leg.position} ${leg.line} ${leg.propType}`}</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-gray-300">{formatAmericanOdds(leg.marketOdds)}</span>
                    <button onClick={() => handleRemoveLeg(index)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">
                        <Trash2Icon className="h-4 w-4" />
                    </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Correlation Analysis Section */}
        {parlayLegs.length >= 2 && (
             <div className="p-4 border-t border-gray-700/50">
                 <button 
                    onClick={() => setIsCorrelationVisible(!isCorrelationVisible)} 
                    className="w-full flex justify-between items-center text-left text-gray-300 hover:text-cyan-300 transition-colors"
                    aria-expanded={isCorrelationVisible}
                    aria-controls="correlation-analysis-panel"
                 >
                    <div className="flex items-center gap-2">
                         <LinkIcon className="h-5 w-5" />
                         <span className="font-semibold" id="correlation-analysis-heading">Correlation Analysis</span>
                    </div>
                    <ChevronDownIcon className={`h-5 w-5 transition-transform ${isCorrelationVisible ? 'rotate-180' : ''}`} />
                 </button>
                 {isCorrelationVisible && (
                     <div id="correlation-analysis-panel" className="mt-3 animate-fade-in" role="region" aria-labelledby="correlation-analysis-heading">
                        {!correlationAnalysis && !isCorrelationLoading && !correlationError && (
                             <button onClick={handleAnalyzeCorrelation} className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/20">
                                 <SparklesIcon className="h-4 w-4" /> Analyze Correlation
                             </button>
                        )}
                        {isCorrelationLoading && <div className="text-center text-sm text-gray-400 p-2" role="status" aria-live="polite">Analyzing...</div>}
                        {correlationError && <div className="text-center text-sm text-red-400 p-2 bg-red-500/10 rounded-md" role="alert">{correlationError}</div>}
                        {correlationAnalysis && (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center p-3 bg-gray-800 rounded-md">
                                    <div>
                                        <div className="text-xs text-gray-400">Overall Score</div>
                                        <div className="text-lg font-bold" style={{ color: getScoreGradient(correlationAnalysis.overallScore) }}>
                                            {correlationAnalysis.overallScore.toFixed(2)}
                                        </div>
                                    </div>
                                    <button onClick={handleAnalyzeCorrelation} className="p-1.5 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700" aria-label="Re-analyze correlation">
                                        <RotateCwIcon className={`h-4 w-4 ${isCorrelationLoading ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 italic p-2 bg-gray-800 rounded-md">{correlationAnalysis.summary}</p>
                                <div className="text-xs space-y-1.5 max-h-40 overflow-y-auto pr-2">
                                    {correlationAnalysis.analysis.map((detail, index) => {
                                        const leg1 = parlayLegs[detail.leg1Index];
                                        const leg2 = parlayLegs[detail.leg2Index];
                                        return (
                                            <div key={index} className="p-2 bg-gray-950/60 rounded">
                                                <div className={`font-semibold mb-1 text-sm ${getRelationshipColor(detail.relationship)}`}>
                                                    {detail.relationship}
                                                </div>
                                                <p className="text-gray-400">
                                                    {leg1.player} ({leg1.propType}) &amp; {leg2.player} ({leg2.propType})
                                                </p>
                                                <p className="text-gray-500 italic mt-1">{detail.explanation}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                     </div>
                 )}
            </div>
        )}
        
        <div className="p-4 border-t border-gray-700/50">
          <button 
            onClick={handleAnalyzeClick} 
            disabled={parlayLegs.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SendIcon className="h-5 w-5" />
            Analyze {parlayLegs.length > 0 ? `${parlayLegs.length} Leg Parlay` : 'Parlay'}
          </button>
        </div>

        {isLoadModalOpen && (
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-20" onClick={() => setIsLoadModalOpen(false)}>
              <div className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-semibold text-gray-200">Load Saved Parlay</h3>
                      <button onClick={() => setIsLoadModalOpen(false)} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600">
                        <XIcon className="h-5 w-5" />
                      </button>
                  </div>
                  <div className="p-4 max-h-[60vh] overflow-y-auto">
                      {savedParlays.length === 0 ? (
                          <p className="text-center text-gray-500 py-10">You have no saved parlays.</p>
                      ) : (
                          <div className="space-y-2">
                              {savedParlays.map(parlay => (
                                  <div key={parlay.id} className="group p-3 bg-gray-900/70 rounded-md flex justify-between items-center">
                                      <div>
                                          <p className="font-semibold text-gray-200">{parlay.name}</p>
                                          <p className="text-sm text-gray-400">{parlay.legs.length} legs &bull; <span className="font-mono">{formatAmericanOdds(parlay.odds)}</span></p>
                                          <p className="text-xs text-gray-500">Saved: {new Date(parlay.createdAt).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <button onClick={() => handleLoadParlay(parlay)} className="px-3 py-1.5 text-sm rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors">Load</button>
                                          <button onClick={() => handleDeleteSavedParlay(parlay.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                              <Trash2Icon className="h-4 w-4" />
                                          </button>
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
      </div>
    </div>
  );
};

export default BetBuilder;
