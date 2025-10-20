import React, { useState, useCallback } from 'react';
import { SystemUpdate } from '../types';
import { proposeModelUpdate, sendUpdateFeedback } from '../services/geminiService';
import { ZapIcon } from '../assets/icons/ZapIcon';
import { CheckCircleIcon } from '../assets/icons/CheckCircleIcon';
import { ClockIcon } from '../assets/icons/ClockIcon';
import { RefreshCwIcon } from '../assets/icons/RefreshCwIcon';
import { Settings2Icon } from '../assets/icons/Settings2Icon';
import { XCircleIcon } from '../assets/icons/XCircleIcon';
import { CheckIcon } from '../assets/icons/CheckIcon';
import { XIcon } from '../assets/icons/XIcon';


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
    // Fire-and-forget feedback
    sendUpdateFeedback(update, decision);

    const newStatus = decision === 'accepted' ? 'Approved & Deployed' : 'Rejected';
    setUpdates(prev =>
      prev.map(u => (u.id === update.id ? { ...u, status: newStatus } : u))
    );
  };

  const StatusIcon = ({ status }: { status: SystemUpdate['status'] }) => {
    switch (status) {
      case 'Approved & Deployed':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'Pending Review':
        return <ClockIcon className="h-5 w-5 text-yellow-400" />;
      case 'Rejected':
        return <XCircleIcon className="h-5 w-5 text-red-400" />;
      case 'Backtesting Failed':
        return <div className="h-5 w-5 text-red-400 font-bold flex items-center justify-center">X</div>;
      default:
        return null;
    }
  };

  const getStatusColor = (status: SystemUpdate['status']) => {
    switch (status) {
      case 'Approved & Deployed':
        return 'border-green-500/30 bg-green-500/10';
      case 'Pending Review':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'Rejected':
      case 'Backtesting Failed':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-gray-700';
    }
  }

  return (
    <aside className="hidden w-96 flex-col border-l border-gray-700/50 bg-gray-900/50 p-4 lg:flex">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-300">
          <ZapIcon className="h-5 w-5 text-cyan-400" />
          AI Evolution Stream
        </h2>
        <button
          onClick={fetchUpdate}
          disabled={isLoading}
          className="p-1.5 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Refresh updates"
        >
          <RefreshCwIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {isLoading && (
            <div className="text-center text-gray-400 p-4">
                <p>Fetching AI model proposal...</p>
            </div>
        )}
        {error && <p className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg">{error}</p>}
        {!isLoading && !error && updates.length === 0 && (
            <div className="text-center text-gray-500 p-6 border-2 border-dashed border-gray-700 rounded-lg h-full flex flex-col justify-center">
                <ZapIcon className="mx-auto h-8 w-8 text-gray-600" />
                <p className="mt-2 font-semibold text-gray-400">AI Evolution Stream</p>
                <p className="mt-1 text-sm">This feed shows potential upgrades to the core model.</p>
                <p className="mt-2 text-xs">Click the refresh icon above to fetch the latest proposal.</p>
            </div>
        )}
        {!isLoading && updates.map(update => (
          <div key={update.id} className={`rounded-lg border p-3 ${getStatusColor(update.status)}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-200">{update.featureName}</p>
              <StatusIcon status={update.status} />
            </div>
            <p className="mt-1 text-sm text-gray-400">{update.description}</p>
            
            {update.integrationStrategy && (
                <div className="mt-2 pt-2 border-t border-gray-700/50">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-300 mb-1">
                        <Settings2Icon className="h-3.5 w-3.5 text-cyan-400" />
                        Integration Strategy
                    </h4>
                    <p className="text-xs text-gray-400 italic">{update.integrationStrategy}</p>
                </div>
            )}

            <div className="mt-2 text-xs font-mono grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-800 p-1 rounded">
                    <div className="text-gray-400">ROI</div>
                    <div className={`font-semibold ${update.backtestResults.roiChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>{update.backtestResults.roiChange > 0 ? '+' : ''}{update.backtestResults.roiChange.toFixed(2)}%</div>
                </div>
                <div className="bg-gray-800 p-1 rounded">
                    <div className="text-gray-400">Brier</div>
                    <div className="text-cyan-400 font-semibold">{update.backtestResults.brierScore.toFixed(4)}</div>
                </div>
                 <div className="bg-gray-800 p-1 rounded">
                    <div className="text-gray-400">Sharpe</div>
                    <div className="text-yellow-400 font-semibold">{update.backtestResults.sharpeRatio.toFixed(2)}</div>
                </div>
            </div>

            {update.status === 'Pending Review' && (
              <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-end gap-2">
                <button
                  onClick={() => handleFeedback(update, 'rejected')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-red-400 transition-colors"
                  aria-label="Reject update"
                >
                  <XIcon className="h-3.5 w-3.5" />
                  Reject
                </button>
                <button
                  onClick={() => handleFeedback(update, 'accepted')}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors"
                  aria-label="Accept update"
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                  Accept
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
};

export default SystemStatusPanel;
