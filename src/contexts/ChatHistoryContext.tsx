import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Message } from '../types';

type ChatSession = {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
};

type ChatHistoryContextValue = {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | null;
  isLoading: boolean;
  createNewChat: () => void;
  deleteChat: (id: string) => void;
  setActiveChatId: (id: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
};

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(undefined);

const createInitialSession = (): ChatSession => ({
  id:
    typeof globalThis.crypto?.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : Date.now().toString(),
  title: 'New Session',
  createdAt: new Date().toISOString(),
  messages: [],
});

const deriveTitle = (session: ChatSession, message: Message): string => {
  if (session.title !== 'New Session' || message.role !== 'user') {
    return session.title;
  }
  const content = typeof message.content === 'string' ? message.content : '';
  return content ? `${content.slice(0, 40)}${content.length > 40 ? '…' : ''}` : session.title;
};

export const ChatHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const initialSession = createInitialSession();
    return [initialSession];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(() => chatHistory[0]?.id ?? null);
  const [isLoading, setIsLoading] = useState(false);

  const activeChat = useMemo(
    () => (activeChatId ? chatHistory.find((session) => session.id === activeChatId) ?? null : chatHistory[0] ?? null),
    [activeChatId, chatHistory],
  );

  const createNewChat = useCallback(() => {
    const newSession = createInitialSession();
    setChatHistory((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
  }, []);

  const deleteChat = useCallback((id: string) => {
    setChatHistory((prev) => {
      const updated = prev.filter((session) => session.id !== id);
      setActiveChatId((current) => {
        if (current === id) {
          return updated[0]?.id ?? null;
        }
        return current;
      });
      return updated;
    });
  }, []);

  const addMessageToActiveChat = useCallback(
    (message: Message) => {
      setChatHistory((prev) => {
        const targetId = activeChatId ?? prev[0]?.id;
        if (!targetId) {
          return prev;
        }
        return prev.map((session) => {
          if (session.id !== targetId) {
            return session;
          }
          return {
            ...session,
            title: deriveTitle(session, message),
            messages: [...session.messages, message],
          };
        });
      });
      setActiveChatId((current) => current ?? activeChatId ?? null);
    },
    [activeChatId],
  );

  const activeChat = useMemo(() => {
    if (!activeChatId) {
      return chatHistory[0];
    }
    return chatHistory.find((chat) => chat.id === activeChatId);
  }, [activeChatId, chatHistory]);

  const contextValue = useMemo<ChatHistoryContextValue>(
    () => ({
      chatHistory,
      activeChat,
      activeChatId: activeChat?.id ?? null,
      createNewChat,
      setActiveChatId,
      deleteChat,
      addMessageToActiveChat,
      isLoading,
      setIsLoading,
    }),
    [
      addMessageToActiveChat,
      activeChat,
      chatHistory,
      createNewChat,
      deleteChat,
      isLoading,
      setActiveChatId,
    ],
  );

  return (
    <ChatHistoryContext.Provider value={contextValue}>
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = (): ChatHistoryContextValue => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
};
