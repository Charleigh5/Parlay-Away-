import React, { createContext, useState, useContext, ReactNode, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ChatSession, Message } from '../types';

interface ChatHistoryContextType {
  history: ChatSession[];
  activeChat: ChatSession | null;
  createNewChat: () => void;
  setActiveChat: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export const ChatHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useLocalStorage<ChatSession[]>('synopticEdge_chatHistory', []);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const activeChat = useMemo(() => history.find(chat => chat.id === activeChatId) ?? null, [history, activeChatId]);

  const createNewChat = () => {
    setActiveChatId(null);
  };

  const setActiveChat = (chatId: string | null) => {
    setActiveChatId(chatId);
  };

  const deleteChat = (chatId: string) => {
    setHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
  };
  
  const renameChat = (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setHistory(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, title: newTitle.trim() } : chat
      )
    );
  };

  const addMessageToActiveChat = (message: Message) => {
    let targetChatId = activeChatId;

    if (!targetChatId && message.role === 'user') {
      const newChat: ChatSession = {
        id: `chat_${Date.now()}`,
        title: 'New Analysis',
        createdAt: new Date().toISOString(),
        messages: [message],
      };
      setHistory(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    } else {
        setHistory(prev =>
            prev.map(chat => {
                const isTargetChat = chat.id === activeChatId || (message.role !== 'user' && chat.id === (history.find(c => c.id === activeChatId)?.id ?? history[0]?.id));
                
                if (isTargetChat) {
                    const updatedMessages = [...chat.messages, message];
                    const userMessages = updatedMessages.filter(m => m.role === 'user');
                    let newTitle = chat.title;

                    if (userMessages.length === 1 && chat.title === 'New Analysis' && typeof userMessages[0].content === 'string') {
                        newTitle = (userMessages[0].content as string).substring(0, 40) + '...';
                    }

                    return { ...chat, messages: updatedMessages, title: newTitle };
                }
                return chat;
            })
        );
    }
  };

  const value = {
    history,
    activeChat,
    createNewChat,
    setActiveChat,
    deleteChat,
    renameChat,
    addMessageToActiveChat,
    isLoading,
    setIsLoading,
  };

  return (
    <ChatHistoryContext.Provider value={value}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = (): ChatHistoryContextType => {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
