import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { AnalyzedBetLeg, ExtractedBetLeg, ParlayNode, ParlayCorrelationAnalysis } from '../types';
import { analyzeParlayCorrelation, getAnalysis } from '../services/geminiService';
import { calculateParlayOdds, formatAmericanOdds } from '../utils';
import usePanAndZoom from '../hooks/usePanAndZoom';
import PropLibrary from './PropLibrary';
import BetNode from './BetNode';
import ConnectionLines from './ConnectionLines';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SendIcon } from './icons/SendIcon';
import { LinkIcon } from './icons/LinkIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { RotateCwIcon } from './icons/RotateCwIcon';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { EyeIcon } from './icons/EyeIcon';

const GRID_SIZE = 20;

interface ParlayCanvasProps {
  onAnalyze: (legs: AnalyzedBetLeg[]) => void;
  onBack: () => void;
}

const ParlayCanvas: React.FC<ParlayCanvasProps> = ({ onAnalyze, onBack }) => {
  const [nodes, setNodes] = useState<ParlayNode[]>([]);
  const [correlationAnalysis, setCorrelationAnalysis] = useState<ParlayCorrelationAnalysis | null>(null);
  const [isCorrelationLoading, setIsCorrelationLoading] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const { viewport, pan, zoom, canvasStyle, screenToCanvasCoords, resetViewport } = usePanAndZoom(canvasRef);

  const parlayOdds = useMemo(() => calculateParlayOdds(nodes.map(n => n.leg)), [nodes]);

  const runCorrelationAnalysis = useCallback(async (currentNodes: ParlayNode[]) => {
    if (currentNodes.length < 2) {
      setCorrelationAnalysis(null);
      return;
    }
    setIsCorrelationLoading(true);
    try {
      const legs = currentNodes.map(n => n.leg);
      const result = await analyzeParlayCorrelation(legs);
      setCorrelationAnalysis(result);
    } catch (error) {
      console.error("Correlation analysis failed", error);
      setCorrelationAnalysis(null);
    } finally {
      setIsCorrelationLoading(false);
    }
  }, []);

  useEffect(() => {
    runCorrelationAnalysis(nodes);
  }, [nodes.length, runCorrelationAnalysis]);

  const addNode = useCallback(async (leg: ExtractedBetLeg, position: { x: number; y: number }) => {
    const nodeId = `node_${Date.now()}`;
    const tempNode: ParlayNode = {
      id: nodeId,
      leg: { ...leg, analysis: { summary: 'Loading...', reasoning: [], quantitative: { expectedValue: 0, confidenceScore: 0, kellyCriterionStake: 0, vigRemovedOdds: 0 } } },
      position
    };

    setNodes(prev => [...prev, tempNode]);

    try {
      const query = `Analyze the prop bet: ${leg.player} ${leg.position} ${leg.line} ${leg.propType} at ${leg.marketOdds} odds.`;
      const analysis = await getAnalysis(query);
      const analyzedLeg: AnalyzedBetLeg = { ...leg, analysis };
      
      setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, leg: analyzedLeg } : n));
    } catch (error) {
      console.error("Failed to analyze prop:", error);
      setNodes(prev => prev.filter(n => n.id !== nodeId)); // Remove on failure
    }
  }, []);

  const updateNodePosition = (nodeId: string, newPosition: { x: number; y: number }) => {
    setNodes(nodes => nodes.map(node =>
      node.id === nodeId ? { ...node, position: { x: Math.round(newPosition.x / GRID_SIZE) * GRID_SIZE, y: Math.round(newPosition.y / GRID_SIZE) * GRID_SIZE } } : node
    ));
  };
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/type');
    
    if (type === 'prop-library-item') {
        const leg = JSON.parse(e.dataTransfer.getData('application/json')) as ExtractedBetLeg;
        if (nodes.some(n => JSON.stringify(n.leg) === JSON.stringify(leg))) return;
        
        const dropPosition = screenToCanvasCoords({ x: e.clientX, y: e.clientY });
        const snappedPosition = {
            x: Math.round(dropPosition.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(dropPosition.y / GRID_SIZE) * GRID_SIZE,
        };
        addNode(leg, snappedPosition);
    }
  }, [addNode, nodes, screenToCanvasCoords]);

  const removeNode = (nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  };
  
  const duplicateNode = (node: ParlayNode) => {
    const newPosition = { x: node.position.x + GRID_SIZE * 2, y: node.position.y + GRID_SIZE * 2 };
    const newLeg = { ...node.leg, analysis: node.leg.analysis }; // Keep existing analysis
    const newNode: ParlayNode = {
        id: `node_${Date.now()}`,
        leg: newLeg,
        position: newPosition,
    };
    setNodes(prev => [...prev, newNode]);
  };
  
  return (
    <div className="flex flex-1 h-full w-full bg-gray-800/30 overflow-hidden">
      <PropLibrary />
      <div className="flex-1 flex flex-col relative">
        <header className="flex-shrink-0 h-16 bg-gray-900/50 border-b border-gray-700/50 flex items-center justify-between p-4 z-10">
           <button onClick={onBack} className="flex items-center gap-2 rounded-md bg-gray-700/50 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700">
                <ChevronLeftIcon className="h-4 w-4" />
                Back
            </button>
            <div>
                <h2 className="text-xl font-semibold text-gray-200">Parlay Canvas</h2>
            </div>
            <div className="w-24"></div>
        </header>

        <main
            ref={canvasRef}
            className="flex-1 relative bg-gray-900 overflow-hidden cursor-grab active:cursor-grabbing"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:20px_20px]" style={{ backgroundPosition: `${viewport.x % 20}px ${viewport.y % 20}px` }} />
          <div style={canvasStyle}>
              <ConnectionLines nodes={nodes} correlationAnalysis={correlationAnalysis} />
              {nodes.map(node => (
                <BetNode
                  key={node.id}
                  node={node}
                  updatePosition={updateNodePosition}
                  onRemove={removeNode}
                  onDuplicate={duplicateNode}
                  viewport={viewport}
                />
              ))}
          </div>
        </main>
        
        <div className="absolute top-20 right-4 z-10 flex flex-col gap-2">
            <button onClick={() => zoom(1.2)} title="Zoom In" className="p-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 backdrop-blur-sm"><ZoomInIcon className="h-5 w-5"/></button>
            <button onClick={() => zoom(0.8)} title="Zoom Out" className="p-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 backdrop-blur-sm"><ZoomOutIcon className="h-5 w-5"/></button>
            <button onClick={resetViewport} title="Reset View" className="p-2 rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 backdrop-blur-sm"><EyeIcon className="h-5 w-5"/></button>
        </div>

        <footer className="flex-shrink-0 h-24 bg-gray-900/50 border-t border-gray-700/50 p-4 z-10 flex items-center justify-between">
           <div className="flex gap-4">
             <button onClick={() => setNodes([])} disabled={nodes.length === 0} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-red-500/20 text-gray-300 hover:text-red-300 transition-colors disabled:opacity-50" title="Clear Canvas">
                <Trash2Icon className="h-4 w-4" /> Clear
             </button>
             <button onClick={() => runCorrelationAnalysis(nodes)} disabled={nodes.length < 2 || isCorrelationLoading} className="flex items-center gap-2 px-4 py-2 text-sm rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-50" title="Re-run Correlation Analysis">
                {isCorrelationLoading ? <RotateCwIcon className="h-4 w-4 animate-spin"/> : <LinkIcon className="h-4 w-4" />}
                Correlation
             </button>
           </div>
           <div className="text-right">
                <p className="text-sm text-gray-400">{nodes.length} Legs</p>
                <p className="text-2xl font-bold font-mono text-cyan-300">{formatAmericanOdds(parlayOdds)}</p>
           </div>
           <button onClick={() => onAnalyze(nodes.map(n => n.leg))} disabled={nodes.length === 0} className="flex items-center justify-center gap-2 rounded-md bg-cyan-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:bg-gray-600">
             <SendIcon className="h-5 w-5" />
             Finalize & Analyze
           </button>
        </footer>
      </div>
    </div>
  );
};

export default ParlayCanvas;
