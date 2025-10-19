import React from 'react';
import { AnalyzedBetLeg } from '../types';
import { XIcon } from './icons/XIcon';

interface ParlayOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  legs: AnalyzedBetLeg[];
}

const ParlayOptimizerModal: React.FC<ParlayOptimizerModalProps> = ({ isOpen, onClose, legs }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-lg shadow-xl m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-200">Parlay Optimizer</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-600">
            <XIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-center text-gray-400">
            Parlay Optimizer feature is under development.
          </p>
          <p className="text-center text-sm text-gray-500 mt-2">
            This modal will suggest swaps or additions to maximize your parlay's EV and correlation score.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParlayOptimizerModal;