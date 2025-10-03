

import React, { useState, Suspense } from 'react';
import { ChatHistoryProvider } from '../contexts/ChatHistoryContext';
import { MessageSquareIcon } from './icons/MessageSquareIcon';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { ScaleIcon } from './icons/ScaleIcon';

type View = 'chat' | 'lens' | 'comparator';

const SynopticLens = React.lazy(() => import('./SynopticLens'));
const ChatPanel = React.lazy(() => import('./ChatPanel'));
const ChatHistorySidebar = React.lazy(() => import('./ChatHistorySidebar'));
const PropComparator = React.lazy(() => import('./PropComparator'));

const LoadingFallback = () => (
    <div className="flex flex-1 items-center justify-center">
        <div className="flex items-center gap-3 rounded-lg p-4">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        </div>
    </div>
);


const MainPanel: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('lens');

  const getTabClass = (view: View) => {
    return activeView === view
      ? 'border-b-2 border-cyan-400 text-cyan-300'
      : 'border-b-2 border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-200';
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-800/30">
      <div className="flex border-b border-gray-700/50">
        <button
          onClick={() => setActiveView('lens')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${getTabClass('lens')}`}
          aria-current={activeView === 'lens'}
        >
          <TestTubeIcon className="h-5 w-5" />
          Synoptic Lens
        </button>
        <button
          onClick={() => setActiveView('comparator')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${getTabClass('comparator')}`}
          aria-current={activeView === 'comparator'}
        >
          <ScaleIcon className="h-5 w-5" />
          Prop Comparator
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${getTabClass('chat')}`}
          aria-current={activeView === 'chat'}
        >
          <MessageSquareIcon className="h-5 w-5" />
          Analyzer Chat
        </button>
      </div>
      <div className="flex flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingFallback />}>
          {activeView === 'lens' && <SynopticLens />}
          {activeView === 'comparator' && <PropComparator />}
          {activeView === 'chat' && (
            <ChatHistoryProvider>
              <div className="flex flex-1">
                <ChatHistorySidebar />
                <ChatPanel />
              </div>
            </ChatHistoryProvider>
          )}
        </Suspense>
      </div>
    </div>
  );
};

export default MainPanel;