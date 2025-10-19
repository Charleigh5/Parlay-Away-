import React from 'react';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import { MessageSquarePlusIcon } from './icons/MessageSquarePlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';

const ChatHistorySidebar: React.FC = () => {
  const { chatHistory, createNewChat, setActiveChatId, deleteChat, activeChatId } = useChatHistory();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div className="hidden w-72 flex-col border-r border-gray-700/50 bg-gray-900/50 p-2 md:flex">
      <div className="flex items-center justify-between p-2">
        <h2 className="text-lg font-semibold text-gray-300">Chat History</h2>
        <button
          onClick={createNewChat}
          className="p-1.5 rounded-md text-gray-400 hover:text-cyan-400 hover:bg-gray-700 transition-colors"
          aria-label="New Chat"
        >
          <MessageSquarePlusIcon className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto mt-2">
        {chatHistory.map(session => (
          <div
            key={session.id}
            onClick={() => setActiveChatId(session.id)}
            className={`group flex items-start justify-between rounded-lg p-2 cursor-pointer transition-colors ${
              activeChatId === session.id ? 'bg-cyan-500/10' : 'hover:bg-gray-800/60'
            }`}
          >
            <div className="flex-1 overflow-hidden">
                <p className={`truncate text-sm font-medium ${activeChatId === session.id ? 'text-cyan-300' : 'text-gray-300'}`}>
                    {session.title}
                </p>
                <p className="text-xs text-gray-500">{formatDate(session.createdAt)}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to delete this chat?')) {
                  deleteChat(session.id);
                }
              }}
              className="p-1 rounded-md text-gray-500 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/10 transition-opacity"
              aria-label="Delete chat"
            >
              <Trash2Icon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatHistorySidebar;
