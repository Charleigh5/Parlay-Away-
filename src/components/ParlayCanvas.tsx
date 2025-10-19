import React, { useState, useRef, useCallback, useEffect, DragEvent, MouseEvent, useMemo } from 'react';
import {
  AnalyzedBetLeg,
  ExtractedBetLeg,
  ParlayNode,
  ParlayCorrelationAnalysis,
} from '../types';
import { getAnalysis, analyzeParlayCorrelation } from '../services/geminiService';
import usePanAndZoom from '../hooks/usePanAndZoom';
import BetNode from './BetNode';
import ConnectionLines from './ConnectionLines';
import PropLibrary from './PropLibrary';
import CreatePropModal from './CreatePropModal';
import NodeDetailPanel from './NodeDetailPanel'; // Import the new component
import { ZoomInIcon } from './icons/ZoomInIcon';
import { ZoomOutIcon } from './icons/ZoomOutIcon';
import { EyeIcon } from './icons/EyeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { formatAmericanOdds } from '../utils';

interface ParlayCanvasProps {
  onAnalyze: (legs: AnalyzedBetLeg[], correlation: ParlayCorrelationAnalysis | null) => void;
  onBack: () => void;
}

const GRID_SNAP = 20;

const getCorrelationScoreColor = (score: number) => {
    if (score > 0.3) return 'text-green-400';
    if (score > 0) return 'text-green-500';
    if (score < -0.3) return 'text-red-400';
    if (score < 0) return 'text-red-500';
    return 'text-gray-300';
};

const getCorrelationStrengthText = (score: number) => {
    const absScore = Math.abs(score);
    if (absScore >= 0.7) return 'Strong';
    if (absScore >= 0.3) return 'Moderate';
    return 'Weak';
};


const ParlayCanvas: React.FC<ParlayCanvasProps> = ({ onAnalyze, onBack }) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { viewport, zoom, canvasStyle, screenToCanvasCoords, resetViewport } = usePanAndZoom(canvasContainerRef);

  const [nodes, setNodes] = useState<ParlayNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [correlation, setCorrelation] = useState<ParlayCorrelationAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const snapToGrid = (coord: { x: number; y: number }) => ({
    x: Math.round(coord.x / GRID_SNAP) * GRID_SNAP,
    y: Math.round(coord.y / GRID_SNAP) * GRID_SNAP,
  });

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
        position: position ? snapToGrid(position) : snapToGrid({ x: 100 + Math.random() * 50, y: 100 + Math.random() * 50 }),
      };
      setNodes((prevNodes) => [...prevNodes, newNode]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze prop.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const updateNodePosition = (nodeId: string, position: { x: number; y: number }) => {
    const snappedPosition = snapToGrid(position);
    setNodes((prevNodes) =>
      prevNodes.map((node) => (node.id === nodeId ? { ...node, position: snappedPosition } : node))
    );
  };
  
  const removeNode = (nodeId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== nodeId));
    if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
    }
  };
  
  const duplicateNode = (nodeToDuplicate: ParlayNode) => {
    const newNode: ParlayNode = {
        ...nodeToDuplicate,
        id: `node_${Date.now()}_${Math.random()}`,
        position: snapToGrid({
            x: nodeToDuplicate.position.x + GRID_SNAP * 2,
            y: nodeToDuplicate.position.y + GRID_SNAP * 2,
        }),
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id); // Select the new duplicated node
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
    e.preventDefault();
  };
  
  const handleCanvasClick = (e: MouseEvent) => {
    // Deselect node if clicking on the canvas background
    if (e.target === canvasContainerRef.current || e.target === canvasRef.current) {
        setSelectedNodeId(null);
    }
  };

  const handleFinalizeAndAnalyze = () => {
    if (nodes.length > 0) {
      onAnalyze(nodes.map(n => n.leg), correlation);
    }
  };

  const handlePropCreated = (leg: ExtractedBetLeg) => {
    setIsCreateModalOpen(false);
    if (canvasContainerRef.current) {
        const rect = canvasContainerRef.current.getBoundingClientRect();
        const screenCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        const canvasCenter = screenToCanvasCoords(screenCenter);
        addNode(leg, canvasCenter);
    } else {
        addNode(leg