import React, { useState, useRef, useEffect } from 'react';
import { useChatHistory } from '../contexts/ChatHistoryContext';
import { MessageSquarePlusIcon } from './icons/MessageSquarePlusIcon';
import { Trash2Icon } from './icons/Trash2Icon';
import { PencilIcon } from './icons/PencilIcon';

const ChatHistorySidebar: React.FC = () => {
    const { history, activeChat, createNewChat, setActiveChat, deleteChat, renameChat } = useChatHistory();
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [titleInput, setTitleInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingChatId && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingChatId]);

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return "Today";
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    const handleStartEditing = (chatId: string, currentTitle: string) => {
        setEditingChatId(chatId);
        setTitleInput(currentTitle);
    };

    const handleRenameSubmit = () => {
        if (editingChatId && titleInput.trim()) {
            renameChat(editingChatId, titleInput);
        }
        setEditingChatId(null);
    };

    return (
        <aside className="w-64 flex-col border-r border-gray-700/50 bg-gray-900/50 p-2 flex shrink-0">
            <button
                onClick={createNewChat}
                className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-700/60 px-3 py-2.5 text-sm font-medium text-gray-200 transition-colors hover:bg-gray-700 mb-2"
            >
                <MessageSquarePlusIcon className="h-5 w-5" />
                New Chat
            </button>
            <div className="flex-1 space-y-1 overflow-y-auto">
                {history.map(chat => (
                    <div key={chat.id} className="group relative">
                        {editingChatId === chat.id ? (
                            <input
                                ref={inputRef}
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onBlur={handleRenameSubmit}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameSubmit();
                                    if (e.key === 'Escape') setEditingChatId(null);
                                }}
                                className="w-full text-left rounded-md p-2.5 text-sm bg-gray-700 text-cyan-300 border border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                            />
                        ) : (
                            <button
                                onClick={() => setActiveChat(chat.id)}
                                className={`w-full text-left rounded-md p-2.5 text-sm transition-colors ${activeChat?.id === chat.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-300 hover:bg-gray-800'}`}
                            >
                                <p className="truncate font-medium">{chat.title}</p>
                                <p className={`text-xs ${activeChat?.id === chat.id ? 'text-cyan-500' : 'text-gray-500'}`}>{formatDate(chat.createdAt)}</p>
                            </button>
                        )}

                        {editingChatId !== chat.id && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleStartEditing(chat.id, chat.title)}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-cyan-400 hover:bg-cyan-500/10"
                                    aria-label={`Rename chat ${chat.title}`}
                                >
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to delete "${chat.title}"?`)) {
                                            deleteChat(chat.id);
                                        }
                                    }}
                                    className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                                    aria-label={`Delete chat ${chat.title}`}
                                >
                                    <Trash2Icon className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </aside>
    );
};

export default ChatHistorySidebar;
