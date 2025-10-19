import React, { useState, useRef, DragEvent } from 'react';
import { ParlayNode, Viewport } from '../types/index';
import { formatAmericanOdds } from '../utils';
import CanvasContextMenu from './CanvasContextMenu';

interface BetNodeProps {
  node: ParlayNode;
  updatePosition: (nodeId: string, position: { x: number; y: number }) => void;
  onRemove: (nodeId: string) => void;
  onDuplicate: (node: ParlayNode) => void;
  viewport: Viewport;
  screenToCanvasCoords: (coords: { x: number; y: number }) => { x: number; y: number };
  isSelected: boolean;
  onSelect: (nodeId: string) => void;
}

const getEvColor = (ev: number) => {
  if (ev > 0) return 'border-l-4 border-green-500';
  if (ev < 0) return 'border-l-4 border-red-500';
  return 'border-l-4 border-gray-600';
};

const BetNode: React.FC<BetNodeProps> = ({ node, updatePosition, onRemove, onDuplicate, viewport, screenToCanvasCoords, isSelected, onSelect }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const nodeRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: DragEvent) => {
    // Prevent selection from interfering with drag
    if (e.target !== e.currentTarget) {
      e.preventDefault();
      return;
    }
    
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
    e.dataTransfer.setDragImage(img, 0, 0);

    const rect = nodeRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: (e.clientX - rect.left) / viewport.zoom,
        y: (e.clientY - rect.top) / viewport.zoom,
      });
    }
  };

  const handleDrag = (e: DragEvent) => {
    if(e.clientX === 0 && e.clientY === 0) return;
  };

  const handleDragEnd = (e: DragEvent) => {
    setIsDragging(false);
    const finalMousePos = screenToCanvasCoords({ x: e.clientX, y: e.clientY });
    const newX = finalMousePos.x - dragStart.x;
    const newY = finalMousePos.y - dragStart.y;
    updatePosition(node.id, { x: newX, y: newY });
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(node.id); // Select the node on right-click as well
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setIsContextMenuOpen(true);
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent canvas click from deselecting
    onSelect(node.id);
  };
  
  const ev = node.leg.analysis.quantitative.expectedValue;
  const evColorClass = getEvColor(ev);

  return (
    <>
      <div
        ref={nodeRef}
        className={`absolute w-56 p-3 rounded-lg shadow-xl bg-gray-800 cursor-grab active:cursor-grabbing select-none transition-all duration-100 ${evColorClass} ${isDragging ? 'opacity-50 shadow-2xl scale-105' : ''} ${isSelected ? 'ring-2 ring-cyan-400 shadow-cyan-500/20' : ''}`}
        style={{
          transform: `translate(${node.position.x}px, ${node.position.y}px)`,
          willChange: 'transform'
        }}
        draggable
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        <div className="flex justify-between items-start">
            <div>
                <p className="font-bold text-gray-100 text-md">{node.leg.player}</p>
                <p className="text-xs text-gray-400">{`${node.leg.position} ${node.leg.line} ${node.leg.propType}`}</p>
            </div>
            <div className="text-right flex-shrink-0 pl-2">
                 <p className="font-mono font-semibold text-cyan-300 text-lg">{formatAmericanOdds(node.leg.marketOdds)}</p>
            </div>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between items-center">
            <p className="text-xs text-gray-400">EV Score</p>
            <p className={`text-sm font-mono font-bold ${ev > 0 ? 'text-green-400' : ev < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                {ev.toFixed(2)}%
            </p>
        </div>
      </div>

      <CanvasContextMenu
        isOpen={isContextMenuOpen}
        position={contextMenuPosition}
        onClose={() => setIsContextMenuOpen(false)}
        actions={[
            { label: 'Duplicate Node', action: () => onDuplicate(node) },
            { label: 'Remove Node', action: () => onRemove(node.id), isDestructive: true },
        ]}
      />
    </>
  );
};

export default BetNode;