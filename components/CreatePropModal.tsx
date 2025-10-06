import React, { useState, FormEvent } from 'react';
import { ExtractedBetLeg } from '../types';
import { XIcon } from './icons/XIcon';
import { PlusIcon } from './icons/PlusIcon';

interface CreatePropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPropCreated: (leg: ExtractedBetLeg) => void;
}

const CreatePropModal: React.FC<CreatePropModalProps> = ({ isOpen, onClose, onPropCreated }) => {
  const [player, setPlayer] = useState('');
  const [propType, setPropType] = useState('');
  const [line, setLine] = useState('');
  const [position, setPosition] = useState<'Over' | 'Under'>('Over');
  const [marketOdds, setMarketOdds] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const lineNum = parseFloat(line);
    const oddsNum = parseInt(marketOdds, 10);

    if (!player.trim() || !propType.trim() || isNaN(lineNum) || isNaN(oddsNum)) {
      setError('Please fill all fields with valid values.');
      return;
    }
    
    const newLeg: ExtractedBetLeg = {
      player: player.trim(),
      propType: propType.trim(),
      line: lineNum,
      position,
      marketOdds: oddsNum,
    };
    
    onPropCreated(newLeg);
    // Reset form for next time
    setPlayer('');
    setPropType('');
    setLine('');
    setPosition('Over');
    setMarketOdds('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">Create Custom Prop</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="player" className="block text-sm font-medium text-gray-300 mb-1">Player Name</label>
            <input type="text" id="player" value={player} onChange={e => setPlayer(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Patrick Mahomes" />
          </div>
          <div>
            <label htmlFor="propType" className="block text-sm font-medium text-gray-300 mb-1">Prop Type</label>
            <input type="text" id="propType" value={propType} onChange={e => setPropType(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., Passing Yards" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="line" className="block text-sm font-medium text-gray-300 mb-1">Line</label>
              <input type="number" step="0.5" id="line" value={line} onChange={e => setLine(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., 275.5" />
            </div>
            <div>
              <label htmlFor="marketOdds" className="block text-sm font-medium text-gray-300 mb-1">Odds</label>
              <input type="number" id="marketOdds" value={marketOdds} onChange={e => setMarketOdds(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500" placeholder="e.g., -115" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Position</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPosition('Over')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${position === 'Over' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Over</button>
              <button type="button" onClick={() => setPosition('Under')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${position === 'Under' ? 'bg-cyan-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>Under</button>
            </div>
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          
          <div className="pt-2">
            <button type="submit" className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600">
              <PlusIcon className="h-5 w-5" />
              Add Prop to Slip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePropModal;
