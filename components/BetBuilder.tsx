import React, { useState, useMemo, useEffect } from 'react';
import { ExtractedBetLeg, Game, Player, PlayerProp, LineOdds, SavedParlay } from '../types';
import { calculateParlayOdds, formatAmericanOdds, normalCdf, calculateSingleLegEV } from '../utils';
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
import { ArrowDownCircleIcon } from './icons/ArrowDownCircleIcon';
import { ArrowUpCircleIcon } from './icons/ArrowUpCircleIcon';
import { StethoscopeIcon } from './icons/StethoscopeIcon';
import MicroPerformanceChart from './MicroPerformanceChart';
import { HomeIcon } from './icons/HomeIcon';
import { PlaneIcon } from './icons/PlaneIcon';
import { SwordsIcon } from './icons/SwordsIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { analyzeParlayCorrelation } from '../services/geminiService';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import useLocalStorage from '../hooks/useLocalStorage';

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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);
  
  const [parlayLegs, setParlayLegs] = useState<ExtractedBetLeg[]>([]);
  
  const [savedParlays, setSavedParlays] = useLocalStorage<SavedParlay[]>('synopticEdge_savedParlays', []);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  const marketData = useMemo(() => getMarketData(), []);
  
  useEffect(() => {
    const loadGames = async () => {
      try {
        setGameLoadError(null);
        setIsLoadingGames(true);
        const fetchedGames = await fetchNFLEvents(marketData);
        setGames(fetchedGames);
      } catch (error) {
        console.error("Failed to fetch NFL events:", error);
        setGameLoadError("Could not load live schedule. Falling back to mock data.");
        setGames(marketData); // Fallback to mocks
      } finally {
        setIsLoadingGames(false);
      }
    };
    loadGames();
  }, [marketData]);

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    const lowercasedTerm = searchTerm.toLowerCase();
    return games.filter(game =>
      game.name.toLowerCase().includes(lowercasedTerm) ||
      game.players.some(player => player.name.toLowerCase().includes(lowercasedTerm))
    );
  }, [games, searchTerm]);

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
  
  const parlayOdds = useMemo(() => calculateParlayOdds(parlayLegs), [parlayLegs]);

  const getOpposingTeam = (playerTeamAbbr: string): string | null => {
      if (!selectedGame) return null;
      const teams = selectedGame.name.split(' @ ');
      const playerTeamName = TEAM_ABBREVIATION_TO_NAME[playerTeamAbbr];
      if (!playerTeamName) return null;

      const opposingTeamName = teams.find(team => team !== playerTeamName);
      return opposingTeamName || null;
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

  const handleLoadParlay = (parlay: SavedParlay) => {
    setParlayLegs(parlay.legs);
    setIsLoadModalOpen(false);
  };

  const handleDeleteSavedParlay = (id: string) => {
    if (window.confirm("Are you sure you want to delete this saved parlay?")) {
      setSavedParlays(prev => prev.filter(p => p.id !== id));
    }
  };

  const renderSelectionPanel = () => {
    if (!selectedGame) {
      return (
        <div>
           {gameLoadError && <div className="p-2 mb-2 text-center text-yellow-300 bg-yellow-500/10 rounded-md text-sm">{gameLoadError}</div>}
           {isLoadingGames ? (
             <div className="text-center p-4">Loading schedule...</div>
           ) : (
            <>
              <div className="relative mb-2">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search games or players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filteredGames.map(game => (
                  <button key={game.id} onClick={() => handleSelectGame(game)} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                    {game.name}
                  </button>
                ))}
              </div>
            </>
           )}
        </div>
      );
    }

    if (!selectedPlayer) {
      return (
         <div>
            <button onClick={() => setSelectedGame(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline">
                <ChevronLeftIcon className="h-4 w-4" /> Back to Games
            </button>
            <h3 className="font-semibold text-lg text-gray-200 mb-2">{selectedGame.name}</h3>
            <div className="space-y-2">
                {selectedGame.players.map(player => (
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
        </div>
      )
    }
    
    if (!selectedProp) {
        return (
            <div>
               <button onClick={() => setSelectedPlayer(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline">
                   <ChevronLeftIcon className="h-4 w-4" /> Back to Players
               </button>
               <h3 className="font-semibold text-lg text-gray-200 mb-2">{selectedPlayer.name}</h3>
               <div className="space-y-2">
                   {selectedPlayer.props.map(prop => (
                       <button key={prop.propType} onClick={() => handleSelectProp(prop)} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                           {prop.propType}
                       </button>
                   ))}
               </div>
           </div>
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
        <div className="max-h-[80vh] overflow-y-auto pr-2">
            <button onClick={() => setSelectedProp(null)} className="flex items-center gap-1 text-sm text-cyan-400 mb-2 hover:underline">
                <ChevronLeftIcon className="h-4 w-4" /> Back to Props
            </button>
            <h3 className="font-semibold text-lg text-gray-200">{selectedPlayer.name}</h3>
            <p className="text-md text-gray-300 mb-3">{selectedProp.propType}</p>
            
            {/* Market Lines */}
            <div className="space-y-2 mb-4">
                {selectedProp.lines.map((line) => (
                    <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-800 rounded-md">
                        <div className="col-span-4 text-center">
                            <button onClick={() => handleAddLeg(line, 'Over')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors">
                                <div>Over</div>
                                <div className="font-semibold">{formatAmericanOdds(line.overOdds)}</div>
                            </button>
                        </div>
                        <div className="col-span-3 text-center">
                            <div className="text-lg font-bold text-gray-200">{line.line}</div>
                        </div>
                        <div className="col-span-4 text-center">
                             <button onClick={() => handleAddLeg(line, 'Under')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors">
                                <div>Under</div>
                                <div className="font-semibold">{formatAmericanOdds(line.underOdds)}</div>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Injury Status */}
            {selectedPlayer.injuryStatus && (
                <div className="mb-4 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-yellow-300 mb-1">
                        <StethoscopeIcon className="h-4 w-4" /> Injury Report
                    </h4>
                    <p className="text-xs text-gray-300">{selectedPlayer.injuryStatus.news}</p>
                    <p className="text-xs text-gray-400 mt-1 italic">Impact: {selectedPlayer.injuryStatus.impact}</p>
                </div>
            )}
            
            {/* Defensive Matchup */}
            {defensiveStats && relevantDefensiveStat && 'value' in relevantDefensiveStat && (
                 <div className="mb-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <ShieldIcon className="h-4 w-4 text-cyan-400" /> Defensive Matchup vs {opposingTeamName}
                    </h4>
                     <div className="flex justify-between items-center text-xs">
                         <span className="text-gray-400">{selectedProp.propType} Allowed</span>
                         <span className="font-mono text-gray-200">{relevantDefensiveStat.value} {relevantDefensiveStat.unit} (Rank: {relevantDefensiveStat.rank})</span>
                     </div>
                 </div>
            )}
            
            {/* Performance Splits */}
            { (selectedPlayer.homeAwaySplits || selectedPlayer.divisionalSplits) && (
                <div className="mb-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                     <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <SparklesIcon className="h-4 w-4 text-cyan-400" /> Performance Splits
                    </h4>
                    <div className="space-y-1 text-xs">
                        {selectedPlayer.homeAwaySplits && (
                            <>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-1.5 text-gray-400"><HomeIcon className="h-3.5 w-3.5"/>Home Avg</span> <span className="font-mono text-gray-200">{selectedPlayer.homeAwaySplits.home[selectedProp.propType]?.toFixed(1)}</span></div>
                            <div className="flex justify-between items-center"><span className="flex items-center gap-1.5 text-gray-400"><PlaneIcon className="h-3.5 w-3.5"/>Away Avg</span> <span className="font-mono text-gray-200">{selectedPlayer.homeAwaySplits.away[selectedProp.propType]?.toFixed(1)}</span></div>
                            </>
                        )}
                         {selectedPlayer.divisionalSplits && (
                             <div className="flex justify-between items-center"><span className="flex items-center gap-1.5 text-gray-400"><SwordsIcon className="h-3.5 w-3.5"/>Divisional Avg</span> <span className="font-mono text-gray-200">{selectedPlayer.divisionalSplits[selectedProp.propType]?.toFixed(1)}</span></div>
                         )}
                    </div>
                </div>
            )}
            
             {/* Advanced Stats */}
            {advancedStats && advancedStats.length > 0 && (
                <div className="mb-4 p-3 rounded-lg border border-gray-700/50 bg-gray-800/80">
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                        <TrendingUpIcon className="h-4 w-4 text-cyan-400" /> Advanced Metrics
                    </h4>
                    <div className="space-y-2">
                        {advancedStats.map(stat => (
                            <div key={stat.abbreviation} className="text-xs group relative">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-400">{stat.abbreviation}</span>
                                    <span className="font-mono text-gray-200">{stat.value} (Rank: {stat.rank})</span>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                   <p className="font-bold">{stat.name}</p>
                                   <p>{stat.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Historical Performance */}
            {selectedProp.historicalContext && selectedProp.historicalContext.gameLog && (
                <HistoricalPerformanceChart 
                    gameLog={selectedProp.historicalContext.gameLog}
                    selectedLine={selectedProp.lines[0].line}
                    seasonAvg={selectedProp.historicalContext.seasonAvg ?? null}
                    last5Avg={selectedProp.historicalContext.last5Avg ?? null}
                />
            )}

        </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="w-1/3 border-r border-gray-700/50 p-4 overflow-y-auto">
        {renderSelectionPanel()}
      </div>
      <div className="flex-1 p-4 flex flex-col">
        <h2 className="text-xl font-semibold mb-3">Bet Slip</h2>
        <div className="flex-1 space-y-2 overflow-y-auto">
            {parlayLegs.length === 0 ? (
                <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-700 rounded-lg">
                    <p>Your bet slip is empty.</p>
                    <p className="text-sm">Select a game, player, and prop to add a leg.</p>
                </div>
            ) : (
                parlayLegs.map((leg, index) => (
                    <div key={index} className="p-3 bg-gray-800 rounded-md flex justify-between items-center">
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
        <div className="pt-4 border-t border-gray-700/50">
            {parlayLegs.length > 0 && (
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-400">Total Odds</span>
                    <span className="text-xl font-bold text-cyan-400">{formatAmericanOdds(parlayOdds)}</span>
                </div>
            )}
            <div className="flex gap-2">
                <button onClick={() => setIsLoadModalOpen(true)} className="p-2.5 bg-gray-700/70 hover:bg-gray-700 rounded-md transition-colors" aria-label="Load Parlay">
                    <FolderOpenIcon className="h-5 w-5" />
                </button>
                <button onClick={handleSaveParlay} disabled={parlayLegs.length === 0} className="p-2.5 bg-gray-700/70 hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50" aria-label="Save Parlay">
                    <SaveIcon className="h-5 w-5" />
                </button>
                <button onClick={handleAnalyzeClick} disabled={parlayLegs.length === 0} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed">
                    <SendIcon className="h-5 w-5" />
                    Analyze ({parlayLegs.length}) Leg{parlayLegs.length !== 1 && 's'}
                </button>
            </div>
             <button onClick={onBack} className="w-full mt-2 text-center text-sm text-gray-400 hover:text-gray-200 p-2">
                Back to Input Selection
            </button>
        </div>
      </div>
      {isLoadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsLoadModalOpen(false)}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <h3 className="text-lg font-semibold">Load Saved Parlay</h3>
                    <button onClick={() => setIsLoadModalOpen(false)} className="p-1 rounded-md hover:bg-gray-700">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {savedParlays.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No saved parlays found.</p>
                    ) : (
                        <div className="space-y-2">
                            {savedParlays.map(parlay => (
                                <div key={parlay.id} className="group p-3 bg-gray-900/50 rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{parlay.name}</p>
                                        <p className="text-xs text-gray-400">{parlay.legs.length} Legs &bull; {formatAmericanOdds(parlay.odds)}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleDeleteSavedParlay(parlay.id)} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100" aria-label="Delete saved parlay">
                                            <Trash2Icon className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => handleLoadParlay(parlay)} className="px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-700 rounded-md">Load</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default BetBuilder;
