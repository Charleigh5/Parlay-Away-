// ChatHistoryContext.tsx
// Provides chat session state management and persistence for Analyzer conversations across the Synoptic Edge UI.
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import type { ChatSession, Message } from '@/types';

interface ChatHistoryContextValue {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | null;
  createNewChat: (title?: string) => string;
  setActiveChatId: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const LOCAL_STORAGE_HISTORY_KEY = 'synoptic-edge.chat-history';
const LOCAL_STORAGE_ACTIVE_KEY = 'synoptic-edge.active-chat-id';
const DEFAULT_CHAT_TITLE = 'New Conversation';

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(undefined);

const generateSessionId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createSession = (title: string = DEFAULT_CHAT_TITLE): ChatSession => ({
  id: generateSessionId(),
  title,
  createdAt: new Date().toISOString(),
  messages: [],
});

const hydrateInitialState = (): { history: ChatSession[]; activeId: string | null } => {
  if (typeof window === 'undefined') {
    const session = createSession();
    return { history: [session], activeId: session.id };
  }

  try {
    const rawHistory = window.localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    if (rawHistory) {
      const parsedHistory = JSON.parse(rawHistory) as ChatSession[];
      if (Array.isArray(parsedHistory) && parsedHistory.length > 0) {
        const sanitizedHistory = parsedHistory
          .filter((session): session is ChatSession => {
            return (
              session &&
              typeof session.id === 'string' &&
              typeof session.title === 'string' &&
              typeof session.createdAt === 'string' &&
              Array.isArray(session.messages)
            );
          })
          .map(session => ({
            ...session,
            messages: Array.isArray(session.messages) ? session.messages : [],
          }));

        if (sanitizedHistory.length > 0) {
          const storedActiveId = window.localStorage.getItem(LOCAL_STORAGE_ACTIVE_KEY);
          const activeId = sanitizedHistory.some(session => session.id === storedActiveId)
            ? storedActiveId
            : sanitizedHistory[0].id;
          return { history: sanitizedHistory, activeId };
        }
      }
    }
  } catch (error) {
    console.warn('Failed to hydrate chat history from storage:', error);
  }

  const session = createSession();
  return { history: [session], activeId: session.id };
};

interface ChatHistoryProviderProps {
  children: ReactNode;
}

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({ children }) => {
  const initialState = useMemo(() => hydrateInitialState(), []);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(initialState.history);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(initialState.activeId);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.warn('Unable to persist chat history:', error);
    }
  }, [chatHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (activeChatId) {
        window.localStorage.setItem(LOCAL_STORAGE_ACTIVE_KEY, activeChatId);
      } else {
        window.localStorage.removeItem(LOCAL_STORAGE_ACTIVE_KEY);
      }
    } catch (error) {
      console.warn('Unable to persist active chat id:', error);
    }
  }, [activeChatId]);

  const setActiveChatId = useCallback((chatId: string) => {
    setActiveChatIdState(prev => (prev === chatId ? prev : chatId));
  }, []);

  const createNewChat = useCallback((title: string = DEFAULT_CHAT_TITLE) => {
    const newSession = createSession(title);
    setChatHistory(prev => [newSession, ...prev]);
    setActiveChatIdState(newSession.id);
    return newSession.id;
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory(prev => {
      const filtered = prev.filter(session => session.id !== chatId);
      if (filtered.length === 0) {
        const replacement = createSession();
        setActiveChatIdState(replacement.id);
        return [replacement];
      }
      if (activeChatId === chatId) {
        setActiveChatIdState(filtered[0].id);
      }
      return filtered;
    });
  }, [activeChatId]);

  const addMessageToActiveChat = useCallback((message: Message) => {
    setChatHistory(prev => {
      if (!activeChatId) {
        return prev;
      }
      return prev.map(session => {
        if (session.id !== activeChatId) {
          return session;
        }
        const updatedMessages = [...session.messages, message];
        let nextTitle = session.title;
        if (
          session.title === DEFAULT_CHAT_TITLE &&
          message.role === 'user' &&
          typeof message.content === 'string'
        ) {
          const trimmed = message.content.trim();
          if (trimmed.length > 0) {
            nextTitle = trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
          }
        }
        return {
          ...session,
          title: nextTitle,
          messages: updatedMessages,
        };
      });
    });
  }, [activeChatId]);

  const activeChat = useMemo(() => {
    if (!activeChatId) return null;
    return chatHistory.find(session => session.id === activeChatId) ?? null;
  }, [activeChatId, chatHistory]);

  const value: ChatHistoryContextValue = useMemo(() => ({
    chatHistory,
    activeChatId,
    activeChat,
    createNewChat,
    setActiveChatId,
    deleteChat,
    addMessageToActiveChat,
    isLoading,
    setIsLoading,
  }), [chatHistory, activeChatId, activeChat, createNewChat, setActiveChatId, deleteChat, addMessageToActiveChat, isLoading]);

  return <ChatHistoryContext.Provider value={value}>{children}</ChatHistoryContext.Provider>;
};

export const useChatHistory = (): ChatHistoryContextValue => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
