import React, { useEffect, useRef } from 'react';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { CopyIcon } from './icons/CopyIcon';
import { Trash2Icon } from './icons/Trash2Icon';

interface ContextMenuAction {
  label: string;
  action: () => void;
  isDestructive?: boolean;
}

interface CanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  actions: ContextMenuAction[];
  onClose: () => void;
}

const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'Analyze Details': TestTubeIcon,
  'Duplicate Node': CopyIcon,
  'Remove Node': Trash2Icon,
};

const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({ isOpen, position, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-48 rounded-md shadow-lg bg-gray-900 border border-gray-700/50 p-1 animate-fade-in-fast"
      style={{ top: position.y, left: position.x }}
    >
      {actions.map((item, index) => {
        const Icon = iconMap[item.label];
        return (
            <button
            key={index}
            onClick={() => {
                item.action();
                onClose();
            }}
            className={`w-full flex items-center gap-3 text-left px-3 py-2 text-sm rounded-md transition-colors ${
                item.isDestructive
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-gray-300 hover:bg-gray-700/70'
            }`}
            >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
            </button>
        );
      })}
    </div>
  );
};

export default CanvasContextMenu;