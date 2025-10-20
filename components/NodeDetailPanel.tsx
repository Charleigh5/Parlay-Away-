import React from 'react';
import { ParlayNode } from '../types/index';
import { formatAmericanOdds } from '../utils';
// FIX: Corrected import path for ClipboardListIcon
import { ClipboardListIcon } from './icons/ClipboardListIcon';
// FIX: Corrected import path for CopyIcon
import { CopyIcon } from './icons/CopyIcon';
// FIX: Corrected import path for Trash2Icon
import { Trash2Icon } from './icons/Trash2Icon';

interface NodeDetailPanelProps {
  selectedNode: ParlayNode | null;
  onDuplicate: (node: ParlayNode) => void;
  onRemove: (nodeId: string) => void;
}

const NodeDetailPanel: React.FC<NodeDetailPanelProps> = ({ selectedNode, onDuplicate, onRemove }) => {
  return (
    <aside className="w-80 flex-shrink-0 bg-gray-900/50 border-l border-gray-700/50 flex flex-col transition-all duration-300">
        <header className="p-4 border-b border-gray-700/50 flex items-center gap-2">
            <ClipboardListIcon className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-gray-200">Node Details</h3>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
            {!selectedNode ? (
                <div className="flex h-full items-center justify-center text-center text-gray-500">
                    <p>Select a node on the canvas to view its details.</p>
                </div>
            ) : (
                <div className="space-y-6 animate-fade-in">
                    <div>
                        <p className="font-bold text-gray-100 text-xl">{selectedNode.leg.player}</p>
                        <p className="text-md text-cyan-300">{`${selectedNode.leg.position} ${selectedNode.leg.line} ${selectedNode.leg.propType}`}</p>
                        <p className="font-mono font-semibold text-gray-300 text-lg">{formatAmericanOdds(selectedNode.leg.marketOdds)}</p>
                    </div>

                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-3">
                        <h4 className="font-semibold text-gray-300 mb-2">Quantitative Analysis</h4>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Expected Value</span>
                                <span className={`font-mono font-bold ${selectedNode.leg.analysis.quantitative.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>{selectedNode.leg.analysis.quantitative.expectedValue.toFixed(2)}%</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-400">Vig-Removed Odds</span>
                                <span className="font-mono text-gray-200">{formatAmericanOdds(selectedNode.leg.analysis.quantitative.vigRemovedOdds)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-400">Kelly Stake %</span>
                                <span className="font-mono text-yellow-400">{selectedNode.leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-400">Projected Mean</span>
                                <span className="font-mono text-gray-200">{selectedNode.leg.analysis.quantitative.projectedMean.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-400">Projected StdDev</span>
                                <span className="font-mono text-gray-200">{selectedNode.leg.analysis.quantitative.projectedStdDev.toFixed(2)}</span>
                            </div>
                            <div className="pt-1">
                                <span className="text-gray-400">Confidence</span>
                                <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${selectedNode.leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="rounded-lg border border-gray-700/50 bg-gray-800/40 p-3">
                        <h4 className="font-semibold text-gray-300 mb-2">Reasoning Summary</h4>
                        <p className="text-xs text-gray-400 italic">
                          {selectedNode.leg.analysis.summary}
                        </p>
                    </div>
                </div>
            )}
        </div>
        
        {selectedNode && (
            <div className="p-4 border-t border-gray-700/50 flex gap-2">
                <button 
                    onClick={() => onDuplicate(selectedNode)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                >
                    <CopyIcon className="h-4 w-4" />
                    Duplicate
                </button>
                <button 
                    onClick={() => onRemove(selectedNode.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                    <Trash2Icon className="h-4 w-4" />
                    Remove
                </button>
            </div>
        )}
    </aside>
  );
};

export default NodeDetailPanel;