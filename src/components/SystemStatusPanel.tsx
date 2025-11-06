import React, { useState, useCallback } from 'react';
import { SystemUpdate } from '../types';
import { proposeModelUpdate, sendUpdateFeedback } from '../services/geminiService';
import { ZapIcon } from './icons/ZapIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ClockIcon } from './icons/ClockIcon';
import { RefreshCwIcon } from '../assets/icons/RefreshCwIcon';
import { Settings2Icon } from './icons/Settings2Icon';
import { XCircleIcon } from './icons/XCircleIcon';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';


const SystemStatusPanel: React.FC = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newUpdate = await proposeModelUpdate();
      // Simulate a mix of statuses for demonstration
      const randomStatus = Math.random();
      if (randomStatus > 0.7) {
        newUpdate.status = 'Approved & Deployed';
      } else if (randomStatus < 0.1) {
        newUpdate.status = 'Backtesting Failed';
      }
      setUpdates(prev => [newUpdate, ...prev].slice(0, 5)); // Keep last 5 updates
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching AI model updates.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFeedback = (update: SystemUpdate, decision: 'accepted' | 'rejected') => {
    sendUpdateFeedback(update, decision);
    // Optimistically update the UI
    setUpdates(prev => prev.map(u => u.id === update.id ? { ...u, status: decision === 'accepted' ? 'Approved & Deployed' : 'Rejected' } : u));
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-cyan-400 flex items-center gap-2">
          <ZapIcon className="h-5 w-5" />
          System Updates
        </h2>
        <button
          onClick={fetchUpdate}
          disabled={isLoading}
          className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Propose Update'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {updates.length === 0 && !isLoading && (
          <p className="text-gray-500 text-sm text-center py-4">No updates yet. Click "Propose Update" to generate one.</p>
        )}
        {updates.map((update) => (
          <div key={update.id} className="bg-gray-800 border border-gray-700 rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2Icon className="h-4 w-4 text-cyan-400" />
                <span className="font-semibold text-gray-200">{update.featureName}</span>
              </div>
              <div className="flex items-center gap-1">
                {update.status === 'Approved & Deployed' && <CheckCircleIcon className="h-4 w-4 text-green-400" />}
                {update.status === 'Pending Review' && <ClockIcon className="h-4 w-4 text-yellow-400" />}
                {update.status === 'Rejected' && <XCircleIcon className="h-4 w-4 text-red-400" />}
                {update.status === 'Backtesting Failed' && <XCircleIcon className="h-4 w-4 text-orange-400" />}
                <span className="text-xs text-gray-400">{update.status}</span>
              </div>
            </div>
            <p className="text-sm text-gray-400">{update.description}</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-500">ROI Change:</span>
                <span className="ml-1 text-green-400">+{update.backtestResults.roiChange.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-gray-500">Brier Score:</span>
                <span className="ml-1 text-cyan-400">{update.backtestResults.brierScore.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-gray-500">Sharpe Ratio:</span>
                <span className="ml-1 text-cyan-400">{update.backtestResults.sharpeRatio.toFixed(2)}</span>
              </div>
            </div>
            {update.status === 'Pending Review' && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleFeedback(update, 'accepted')}
                  className="flex-1 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-md text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <CheckIcon className="h-3 w-3" />
                  Accept
                </button>
                <button
                  onClick={() => handleFeedback(update, 'rejected')}
                  className="flex-1 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-xs transition-colors flex items-center justify-center gap-1"
                >
                  <XIcon className="h-3 w-3" />
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemStatusPanel;