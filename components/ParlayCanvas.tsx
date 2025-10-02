import React, { useState, useRef } from 'react';
import { ExtractedBetLeg, Player } from '../types';
import { Trash2Icon } from './icons/Trash2Icon';


interface PlayerBlockProps {
  player: Player;
  onAddLeg: (player: Player) => void;
  onOpenSettings: (player: Player) => void;
}

const PlayerBlock: React.FC<PlayerBlockProps> = ({ player, onAddLeg, onOpenSettings }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLongPress, setIsLongPress] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      onOpenSettings(player);
    }, 500); // 500ms for long press
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    if (!isLongPress) {
      onAddLeg(player);
    }
    
    setIsLongPress(false);
  };

  const handleMouseMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-700 ${isLongPress ? 'ring-2 ring-cyan-400' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        setIsLongPress(false);
      }}
    >
      <div className="flex items-center">
        <div className="bg-gray-600 border-2 border-dashed rounded-xl w-16 h-16" />
        <div className="ml-3">
          <div className="font-semibold text-gray-200">{player.name}</div>
          <div className="text-sm text-gray-400">{player.position} • {player.team}</div>
        </div>
      </div>
    </div>
  );
};

interface ParlayCanvasProps {
  players: Player[];
  parlayLegs: ExtractedBetLeg[];
  onAddLeg: (leg: ExtractedBetLeg) => void;
  onRemoveLeg: (index: number) => void;
  onAnalyze: (legs: ExtractedBetLeg[]) => void;
  onBack: () => void;
}

const ParlayCanvas: React.FC<ParlayCanvasProps> = ({ 
  players, 
  parlayLegs, 
  onAddLeg, 
  onRemoveLeg, 
  onAnalyze, 
  onBack 
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleAddLeg = (player: Player) => {
    // For now, we'll add a default prop (first one) and over position
    // In a more complete implementation, we'd show a modal to select prop/position
    if (player.props.length > 0) {
      const defaultProp = player.props[0];
      const defaultLine = defaultProp.lines[0];
      
      const newLeg: ExtractedBetLeg = {
        player: player.name,
        propType: defaultProp.propType,
        line: defaultLine.line,
        position: 'Over',
        marketOdds: defaultLine.overOdds,
      };
      
      onAddLeg(newLeg);
    }
  };

  const handleOpenSettings = (player: Player) => {
    setSelectedPlayer(player);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
    setSelectedPlayer(null);
  };

  return (
    <div className="flex h-full w-full">
      {/* Player Blocks Panel */}
      <div className="w-full md:w-1/2 lg:w-2/5 p-4 border-r border-gray-700/50 overflow-y-auto">
        <div className="mb-4">
          <button 
            onClick={onBack} 
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mb-4"
          >
            ← Back to Modes
          </button>
          <h2 className="text-xl font-bold text-gray-100 mb-2">Available Players</h2>
          <p className="text-gray-400 text-sm mb-4">
            Drag players to the canvas or press and hold for settings
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          {players.map((player) => (
            <PlayerBlock 
              key={player.name} 
              player={player} 
              onAddLeg={handleAddLeg}
              onOpenSettings={handleOpenSettings}
            />
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="hidden md:flex flex-col w-1/2 lg:w-3/5 bg-gray-900/30 relative">
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-xl font-semibold text-gray-200">Parlay Canvas</h2>
          <p className="text-gray-400 text-sm">
            {parlayLegs.length} player{parlayLegs.length !== 1 ? 's' : ''} selected
          </p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {parlayLegs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <div className="bg-gray-800 border-2 border-dashed border-gray-700 rounded-xl w-16 h-16 mx-auto mb-4" />
                <p>Add players to build your parlay</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {parlayLegs.map((leg, index) => (
                <div key={index} className="p-4 bg-gray-800 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-200">{leg.player}</div>
                    <div className="text-sm text-gray-400">
                      {leg.position} {leg.line} {leg.propType}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-300">{leg.marketOdds > 0 ? `+${leg.marketOdds}` : leg.marketOdds}</span>
                    <button 
                      onClick={() => onRemoveLeg(index)}
                      className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-700/50">
          <button 
            onClick={() => onAnalyze(parlayLegs)}
            disabled={parlayLegs.length === 0}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 text-white py-3 px-4 rounded-md font-semibold transition-colors"
          >
            Analyze Parlay
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && selectedPlayer && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-100">Player Settings</h3>
              <button 
                onClick={closeSettings}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            
            <div className="flex items-center mb-6">
              <div className="bg-gray-600 border-2 border-dashed rounded-xl w-16 h-16" />
              <div className="ml-4">
                <div className="font-bold text-lg text-gray-100">{selectedPlayer.name}</div>
                <div className="text-gray-400">{selectedPlayer.position} • {selectedPlayer.team}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Player Analysis</h4>
                <p className="text-gray-400 text-sm">
                  {/* This would be populated with real player analysis data */}
                  Detailed analysis of {selectedPlayer.name}'s performance metrics, tendencies, and matchup advantages.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Prop Bets</h4>
                <div className="space-y-2">
                  {selectedPlayer.props.map((prop, index) => (
                    <div key={index} className="p-3 bg-gray-700 rounded">
                      <div className="font-medium text-gray-200">{prop.propType}</div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="text-gray-400">Lines: {prop.lines.map(l => l.line).join(', ')}</span>
                        <button 
                          onClick={() => {
                            // This would open a detailed view for the prop
                            console.log('View details for', prop.propType);
                          }}
                          className="text-cyan-400 hover:text-cyan-300"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Bet History</h4>
                <p className="text-gray-400 text-sm">
                  {/* This would show historical bet data */}
                  Historical performance and results for bets placed on {selectedPlayer.name}.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-300 mb-2">Matchup Info</h4>
                <p className="text-gray-400 text-sm">
                  {/* This would show matchup analysis */}
                  Analysis of {selectedPlayer.name}'s strengths against the opposing team's defensive metrics.
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeSettings}
                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-md font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParlayCanvas;
