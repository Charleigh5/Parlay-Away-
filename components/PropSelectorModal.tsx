
import React, { useState, useEffect, useMemo } from 'react';
import { Game, Player, PlayerProp, LineOdds, PropSelectionDetails } from '../types';
import { getMarketData } from '../services/marketDataService';
import { SearchIcon } from './icons/SearchIcon';
import { XIcon } from './icons/XIcon';
import { formatAmericanOdds } from '../utils';

interface PropSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: PropSelectionDetails) => void;
}

const PropSelectorModal: React.FC<PropSelectorModalProps> = ({ isOpen, onClose, onSelect }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedProp, setSelectedProp] = useState<PlayerProp | null>(null);
  const [selectedLine, setSelectedLine] = useState<LineOdds | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGames(getMarketData());
    } else {
      // Reset state on close
      setTimeout(() => {
        setSearchTerm('');
        setSelectedGame(null);
        setSelectedPlayer(null);
        setSelectedProp(null);
        setSelectedLine(null);
      }, 300); // Delay to allow fade-out animation
    }
  }, [isOpen]);

  const filteredGames = useMemo(() => {
    if (!searchTerm) return games;
    const lowerSearch = searchTerm.toLowerCase();
    return games.filter(game =>
      game.name.toLowerCase().includes(lowerSearch) ||
      game.players.some(p => p.name.toLowerCase().includes(lowerSearch))
    );
  }, [games, searchTerm]);

  const handleSelect = (position: 'Over' | 'Under') => {
    if (selectedGame && selectedPlayer && selectedProp && selectedLine) {
      onSelect({
        game: selectedGame,
        player: selectedPlayer,
        prop: selectedProp,
        selectedLine: selectedLine,
        selectedPosition: position,
      });
    }
  };

  const renderContent = () => {
    if (selectedProp && selectedPlayer && selectedGame) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{selectedPlayer.name} - {selectedProp.propType}</h3>
          <p className="text-sm text-gray-400 mb-4">{selectedGame.name}</p>
          <div className="space-y-2">
            {selectedProp.lines.map((line, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSelectedLine(line); handleSelect('Over'); }}
                  className="w-full text-center p-3 rounded-lg bg-gray-700 hover:bg-cyan-500/20 transition-colors"
                >
                  <span className="text-gray-300">Over {line.line}</span>
                  <span className="block font-mono text-cyan-400 font-semibold">{formatAmericanOdds(line.overOdds)}</span>
                </button>
                <button
                  onClick={() => { setSelectedLine(line); handleSelect('Under'); }}
                  className="w-full text-center p-3 rounded-lg bg-gray-700 hover:bg-cyan-500/20 transition-colors"
                >
                  <span className="text-gray-300">Under {line.line}</span>
                  <span className="block font-mono text-cyan-400 font-semibold">{formatAmericanOdds(line.underOdds)}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (selectedPlayer && selectedGame) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{selectedPlayer.name}</h3>
          <p className="text-sm text-gray-400 mb-4">{selectedGame.name}</p>
          <div className="space-y-2">
            {selectedPlayer.props.map(prop => (
              <button key={prop.propType} onClick={() => setSelectedProp(prop)} className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                <span className="text-gray-200">{prop.propType}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (selectedGame) {
      return (
        <div>
          <h3 className="text-lg font-semibold text-gray-200">{selectedGame.name}</h3>
          <p className="text-sm text-gray-400 mb-4">Select a player</p>
          <div className="space-y-2">
            {selectedGame.players.map(player => (
              <button key={player.name} onClick={() => setSelectedPlayer(player)} className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
                <span className="text-gray-200">{player.name}</span>
                <span className="text-sm text-gray-500 ml-2">{player.position} - {player.team}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search games or players..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-md pl-9 pr-3 py-2 text-gray-200 focus:ring-1 focus:ring-cyan-500"
          />
        </div>
        <div className="space-y-2">
          {filteredGames.map(game => (
            <button key={game.id} onClick={() => setSelectedGame(game)} className="w-full text-left p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors">
              <span className="text-gray-200">{game.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };
  
  const getBreadcrumbs = () => {
      const crumbs = [{ label: 'Games', action: () => { setSelectedGame(null); setSelectedPlayer(null); setSelectedProp(null); }}];
      if(selectedGame) crumbs.push({ label: selectedGame.name.split(' @ ')[0] || 'Game', action: () => { setSelectedPlayer(null); setSelectedProp(null); }});
      if(selectedPlayer) crumbs.push({ label: selectedPlayer.name, action: () => setSelectedProp(null) });
      if(selectedProp) crumbs.push({ label: selectedProp.propType, action: () => {} });
      return crumbs;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full max-w-lg bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4 transition-all duration-300 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <div>
                 <h3 className="text-lg font-semibold text-gray-200">Select a Prop</h3>
                 <div className="text-xs text-gray-400 flex items-center gap-1 flex-wrap">
                     {getBreadcrumbs().map((crumb, i) => (
                        <React.Fragment key={i}>
                            <button onClick={crumb.action} disabled={i === getBreadcrumbs().length-1} className="hover:text-cyan-400 disabled:text-cyan-400 disabled:pointer-events-none truncate max-w-[120px]">{crumb.label}</button>
                            {i < getBreadcrumbs().length-1 && <span className="text-gray-500">/</span>}
                        </React.Fragment>
                     ))}
                 </div>
            </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 h-96 overflow-y-auto">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PropSelectorModal;
