
import React from 'react';
import Sidebar from './components/Sidebar';
import SynopticLens from './components/SynopticLens';
import SystemStatusPanel from './components/SystemStatusPanel';
import { BrainCircuitIcon } from './components/icons/BrainCircuitIcon';

const App: React.FC = () => {
  return (
    <div className="flex h-screen w-full font-sans text-gray-200 bg-gray-900 overflow-hidden">
      <Sidebar />
      <main className="flex flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-center border-b border-gray-700/50 bg-gray-900 px-6">
          <div className="flex items-center gap-2">
            <BrainCircuitIcon className="h-6 w-6 text-cyan-400" />
            <h1 className="text-xl font-semibold tracking-wider text-gray-100 uppercase">
              Synoptic Edge
            </h1>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <SynopticLens />
          {/* FIX: The SystemStatusPanel component was used without being imported, causing a compilation error. The import has been added. */}
          <SystemStatusPanel />
        </div>
      </main>
    </div>
  );
};

export default App;