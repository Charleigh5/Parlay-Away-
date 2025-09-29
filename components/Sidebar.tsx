
import React from 'react';
import { KNOWLEDGE_MODULES } from '../constants';
import { LayersIcon } from './icons/LayersIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';

const Sidebar: React.FC = () => {
  return (
    <aside className="hidden w-80 flex-col border-r border-gray-700/50 bg-gray-900/50 p-4 md:flex">
      <div className="flex-1 overflow-y-auto">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-300">
          <LayersIcon className="h-5 w-5 text-cyan-400" />
          Knowledge Modules
        </h2>
        <nav className="grid gap-2">
          {KNOWLEDGE_MODULES.map((module) => (
            <div
              key={module.id}
              className="group flex items-start gap-3 rounded-lg bg-gray-800/40 p-3 transition-colors hover:bg-gray-800"
            >
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-700 text-cyan-400">
                <BookOpenIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-gray-200">{module.domain}</p>
                <p className="text-sm text-gray-400">{module.description}</p>
              </div>
            </div>
          ))}
        </nav>
      </div>
      <div className="mt-4 border-t border-gray-700 pt-4">
        <p className="text-xs text-gray-500">
          Project Synoptic Edge &copy; 2024. Institutional-Grade Analytical Co-Pilot.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
