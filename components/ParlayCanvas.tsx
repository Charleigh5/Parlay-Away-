
import React, { useState, useRef, useCallback, useEffect, DragEvent } from 'react';
import {
  ExtractedBetLeg,
  AnalyzedBetLeg,
  ParlayNode,
  ParlayCorrelationAnalysis,
  Viewport,
} from '../types';
import { getAnalysis, analyzeParlayCorrelation } from '../services/geminiService';
import usePanAndZoom from '../hooks/usePanAndZoom';
import BetNode from './BetNode';
import ConnectionLines from './ConnectionLines';
import PropLibrary from './PropLibrary';
import CreatePropModal from './CreatePropModal';
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { formatAmericanOdds } from '../utils';

interface ParlayCanvasProps {
  onAnalyze: (legs: AnalyzedBetLeg[]) => void;
  onBack: () => void;
}

const ParlayCanvas: React.FC<ParlayCanvasProps> = ({ onAnalyze, onBack }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { viewport, zoom, canvasStyle, screenToCanvasCoords, resetViewport } = usePanAndZoom(canvasContainerRef);

  const [nodes, setNodes] = useState<ParlayNode[]>([]);
  const [correlation, setCorrelation] = useState<ParlayCorrelationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addNode = async (leg: ExtractedBetLeg, position?: { x: number; y: number }) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const query = `Analyze the prop bet: ${leg.player} ${leg.position} ${leg.line} ${leg.propType} at ${formatAmericanOdds(leg.marketOdds)} odds.`;
      const analysis = await getAnalysis(query);
      const analyzedLeg: AnalyzedBetLeg = { ...leg, analysis };

      const newNode: ParlayNode = {
        id: `node_${Date.now()}_${Math.random()}`,
        leg: analyzedLeg,
        position: position || { x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 },
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze prop.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
    );
  };
  
  const removeNode = (nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
  };
  
  const duplicateNode = (nodeToDuplicate: ParlayNode) => {
    const newNode: ParlayNode = {
        ...nodeToDuplicate,
        id: `node_${Date.now()}_${Math.random()}`,
        position: {
            x: nodeToDuplicate.position.x + 20,
            y: nodeToDuplicate.position.y + 20,
        },
    };
    setNodes(prev => [...prev, newNode]);
  };
  
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/type');
    
    if (type === 'prop-library-item') {
      const legData = e.dataTransfer.getData('application/json');
      if (legData) {
        const leg: ExtractedBetLeg = JSON.parse(legData);
        const position = screenToCanvasCoords({ x: e.clientX, y: e.clientY });
        addNode(leg, position);
      }
    }
  };
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); // Necessary to allow drop
  };

  const handleFinalizeAndAnalyze = () => {
    if (nodes.length > 0) {
      onAnalyze(nodes.map(n => n.leg));
    }
  };

  const handlePropCreated = (leg: ExtractedBetLeg) => {
    setIsCreateModalOpen(false);
    addNode(leg, { x: 200, y: 150 });
  };
  
  useEffect(() => {
    const analyzeCorrelation = async () => {
      if (nodes.length < 2) {
        setCorrelation(null);
        return;
      }
      setIsAnalyzing(true);
      setError(null);
      try {
        const legsToAnalyze = nodes.map(n => n.leg);
        const correlationResult = await analyzeParlayCorrelation(legsToAnalyze);
        setCorrelation(correlationResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to analyze correlation.');
      } finally {
        setIsAnalyzing(false);
      }
    };
    analyzeCorrelation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  return (
    <div className="flex-1 flex h-full">
      <PropLibrary onAddCustomProp={() => setIsCreateModalOpen(true)} />
      <div className="flex-1 flex flex-col relative" ref={canvasContainerRef} onDrop={handleDrop} onDragOver={handleDragOver}>
        <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern"></div>

        <div ref={canvasRef} style={canvasStyle} className="w-full h-full">
          <ConnectionLines nodes={nodes} correlationAnalysis={correlation} />
          {nodes.map((node) => (
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
        
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-8 bg-gray-900/50 rounded-lg backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-gray-200">Parlay Canvas</h3>
                <p className="text-gray-400 mt-2">Drag props from the library or create a custom one to begin.</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 left-4 flex flex-col gap-2">
            <button onClick={onBack} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 transition-colors shadow-lg">
                <ChevronLeftIcon className="h-4 w-4" />
                Back
            </button>
        </div>
        
        <div className="absolute top-4 right-4 flex flex-col gap-2">
           <div className="bg-gray-800/80 rounded-lg shadow-lg flex flex-col">
                <button onClick={() => zoom(1.2)} className="p-2 text-gray-400 hover:text-cyan-400"><ZoomInIcon className="h-5 w-5"/></button>
                <button onClick={() => zoom(0.8)} className="p-2 text-gray-400 hover:text-cyan-400"><ZoomOutIcon className="h-5 w-5"/></button>
                <button onClick={resetViewport} className="p-2 text-gray-400 hover:text-cyan-400"><EyeIcon className="h-5 w-5"/></button>
            </div>
        </div>
        
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
             {isAnalyzing && (
                <div className="flex items-center gap-2 text-sm text-cyan-400 bg-gray-800/80 px-4 py-2 rounded-lg shadow-lg">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                    <span>Analyzing...</span>
                </div>
            )}
            {error && <div className="text-sm text-red-400 bg-red-900/50 px-4 py-2 rounded-lg shadow-lg">{error}</div>}

            {nodes.length > 0 && (
                <button 
                    onClick={handleFinalizeAndAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-6 py-3 text-lg font-semibold rounded-lg bg-cyan-500 text-white transition-colors hover:bg-cyan-600 disabled:bg-gray-600 shadow-xl"
                >
                    <SparklesIcon className="h-6 w-6" />
                    Finalize & Analyze Parlay
                </button>
            )}
        </div>
      </div>
      <CreatePropModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onPropCreated={handlePropCreated}
      />
    </div>
  );
};

export default ParlayCanvas;
