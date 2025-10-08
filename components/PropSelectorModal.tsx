
import React, { useState, useMemo, useEffect } from 'react';
import { Game, Player, PlayerProp, LineOdds, PropSelectionDetails } from '../types';
import { fetchNFLEvents } from '../services/sportsDataService';
import { getMarketData, getDraftKingsMarketData } from '../services/marketDataService';
import { formatAmericanOdds } from '../utils';
import { XIcon } from './icons/XIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SearchIcon } from './icons/SearchIcon';
import { CalendarDaysIcon } from './icons/CalendarDaysIcon';

interface PropSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: PropSelectionDetails) => void;
}

type Step = 'game' | 'player' | 'prop' | 'line';

const PropSelectorModal: React.FC<PropSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [step, setStep] = useState<Step>('game');

  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [gameLoadError, setGameLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);
  const [draftKingsProp, setDraftKingsProp] = useState<PlayerProp | null>(null);

  const marketData = useMemo(() => getMarketData(), []);

  useEffect(() => {
    const loadGames = async () => {
      try {
        setGameLoadError(null);
        setIsLoadingGames(true);
        const fetchedGames = await fetchNFLEvents(marketData);
        setGames(fetchedGames);
      } catch (error) {
        setGameLoadError("Could not load schedule. Using available market data.");
        setGames(marketData);
      } finally {
        setIsLoadingGames(false);
      }
    };
    if (isOpen) {
      loadGames();
    }
  }, [isOpen, marketData]);

  useEffect(() => {
    if (step === 'line' && selectedGame && selectedPlayer && selectedProp) {
        const dkMarket = getDraftKingsMarketData();
        const game = dkMarket.find(g => g.id === selectedGame.id);
        const player = game?.players.find(p => p.name === selectedPlayer.name);
        const prop = player?.props.find(p => p.propType === selectedProp.propType);
        setDraftKingsProp(prop || null);
    } else {
        setDraftKingsProp(null);
    }
  }, [step, selectedGame, selectedPlayer, selectedProp]);

  const resetSelection = () => {
    setStep('game');
    setSelectedGame(null);
    setSelectedPlayer(null);
    setSelectedProp(null);
    setDraftKingsProp(null);
    setSearchTerm('');
  };

  const handleClose = () => {
    resetSelection();
    onClose();
  };
  
  const handleBack = () => {
    if (step === 'line') setStep('prop');
    else if (step === 'prop') setStep('player');
    else if (step === 'player') setStep('game');
  };

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    const lowercasedTerm = searchTerm.toLowerCase();
    return games.filter(game =>
      game.name.toLowerCase().includes(lowercasedTerm) ||
      game.players.some(player => player.name.toLowerCase().includes(lowercasedTerm))
    );
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

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date.getTime() === today.getTime()) return 'Today';
    return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(date);
  };

  const renderHeader = () => {
    let title = "Select a Game";
    if (step === 'player') title = selectedGame?.name ?? "Select Player";
    if (step === 'prop') title = selectedPlayer?.name ?? "Select Prop";
    if (step === 'line') title = selectedProp?.propType ?? "Select Line";
    
    return (
        <div className="p-4 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-gray-800 z-10">
            {step !== 'game' ? (
                <button onClick={handleBack} className="p-2 -ml-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
            ) : <div className="w-9"></div>}
            <h3 className="text-lg font-semibold text-gray-200 text-center truncate">{title}</h3>
            <button onClick={handleClose} className="p-2 -mr-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700">
                <XIcon className="h-5 w-5" />
            </button>
        </div>
    )
  }

  const renderContent = () => {
    switch (step) {
      case 'game':
        return (
          <>
            <div className="relative p-4">
              <SearchIcon className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search games or players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-md pl-10 pr-4 py-2 text-gray-200 focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            {isLoadingGames && <div className="text-center p-4 text-gray-400">Loading schedule...</div>}
            {gameLoadError && <div className="p-4 text-center text-yellow-300 bg-yellow-500/10 rounded-md mx-4 text-sm">{gameLoadError}</div>}
            {!isLoadingGames && Object.entries(gamesByDate).map(([date, gamesForDate]) => (
                <div key={date}>
                    <h3 className="flex items-center gap-2 text-xs uppercase font-bold text-gray-400 mt-2 mx-4 pb-1.5 border-b border-gray-700/60 sticky top-[69px] bg-gray-800">
                        <CalendarDaysIcon className="h-4 w-4 text-cyan-400" />
                        {formatDateForDisplay(date)}
                    </h3>
                    <div className="space-y-1 p-4 pt-2">
                        {gamesForDate.map(game => (
                            <button key={game.id} onClick={() => { setSelectedGame(game); setStep('player'); }} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                                {game.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </>
        );
      case 'player':
        return (
            <div className="space-y-1 p-4">
                {selectedGame?.players.map(player => (
                    <button key={player.name} onClick={() => { setSelectedPlayer(player); setStep('prop'); }} disabled={player.injuryStatus?.status === 'O'} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors disabled:opacity-50 flex justify-between items-center">
                        <span>{player.name} <span className="text-gray-400 text-xs">{player.position}</span></span>
                        {player.injuryStatus?.status && (
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md ${player.injuryStatus.status === 'Q' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-400'}`}>
                                {player.injuryStatus.status}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        );
      case 'prop':
         return (
            <div className="space-y-1 p-4">
                {selectedPlayer?.props.map(prop => (
                    <button key={prop.propType} onClick={() => { setSelectedProp(prop); setStep('line'); }} className="w-full text-left p-3 bg-gray-800 hover:bg-gray-700/70 rounded-md transition-colors">
                        {prop.propType}
                    </button>
                ))}
            </div>
        );
      case 'line':
        return (
            <div className="space-y-2 p-4">
                {selectedProp?.lines.map((line) => {
                    const dkLine = draftKingsProp?.lines.find(dkL => dkL.line === line.line);
                    const handleSelectLine = (position: 'Over' | 'Under') => {
                        if (!selectedGame || !selectedPlayer || !selectedProp) return;
                        onSelect({
                            game: selectedGame,
                            player: selectedPlayer,
                            prop: selectedProp,
                            selectedLine: line,
                            selectedPosition: position
                        });
                        resetSelection();
                    };
                    return (
                        <div key={line.line} className="grid grid-cols-11 gap-2 items-center p-2 bg-gray-900/50 rounded-md">
                            <div className="col-span-4 text-center">
                                <button onClick={() => handleSelectLine('Over')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors">
                                    <div>Over</div>
                                    <div className="font-semibold">{formatAmericanOdds(line.overOdds)}</div>
                                    {dkLine ? (
                                        <div className="text-xs text-gray-400 font-mono">DK {formatAmericanOdds(dkLine.overOdds)}</div>
                                    ) : (
                                        <div className="h-[18px]"></div>
                                    )}
                                </button>
                            </div>
                            <div className="col-span-3 text-center">
                                <div className="text-lg font-bold text-gray-200">{line.line}</div>
                            </div>
                            <div className="col-span-4 text-center">
                                 <button onClick={() => handleSelectLine('Under')} className="w-full p-2 text-sm rounded-md bg-gray-700/50 hover:bg-gray-700 transition-colors">
                                    <div>Under</div>
                                    <div className="font-semibold">{formatAmericanOdds(line.underOdds)}</div>
                                    {dkLine ? (
                                        <div className="text-xs text-gray-400 font-mono">DK {formatAmericanOdds(dkLine.underOdds)}</div>
                                    ) : (
                                        <div className="h-[18px]"></div>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm animate-fade-in" onClick={handleClose}>
      <div className="w-full max-w-md h-[80vh] max-h-[700px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4 flex flex-col" onClick={e => e.stopPropagation()}>
        {renderHeader()}
        <div className="flex-1 overflow-y-auto">
            {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PropSelectorModal;
