/**
 * ChatHistoryContext.tsx
 * ----------------------
 * Provides the chat session state management and exposes helper methods
 * required by chat-related UI components such as ChatPanel and ChatHistorySidebar.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ChatSession, Message, AnalysisResponse } from '../types';

interface ChatHistoryContextValue {
  chatHistory: ChatSession[];
  activeChat: ChatSession | undefined;
  activeChatId: string | null;
  createNewChat: () => void;
  setActiveChatId: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(
  undefined,
);

const HISTORY_STORAGE_KEY = 'chatHistory';
const ACTIVE_CHAT_STORAGE_KEY = 'activeChatId';

const toMessagePreview = (content: string | AnalysisResponse): string => {
  if (typeof content === 'string') {
    return content;
  }
  return content.summary ?? 'Assistant response';
};

const getInitialChatHistory = (): ChatSession[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as ChatSession[];
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse chat history from storage:', error);
  }

  return [];
};

const getInitialActiveChatId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to read active chat id from storage:', error);
  }

  return null;
};

const createEmptyChatSession = (): ChatSession => {
  const createdAt = new Date();
  return {
    id: crypto.randomUUID(),
    title: `New Chat ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    createdAt: createdAt.toISOString(),
    messages: [],
  };
};

export const ChatHistoryProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(
    getInitialChatHistory,
  );
  const [activeChatId, setActiveChatIdState] = useState<string | null>(
    getInitialActiveChatId,
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(chatHistory),
    );
  }, [chatHistory]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (activeChatId) {
      window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId);
    } else {
      window.localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY);
    }
  }, [activeChatId]);

  const setActiveChatId = useCallback((chatId: string | null) => {
    setActiveChatIdState(chatId);
  }, []);

  const createNewChat = useCallback(() => {
    setChatHistory((prevChats) => {
      const newChat = createEmptyChatSession();
      setActiveChatIdState(newChat.id);
      return [newChat, ...prevChats];
    });
  }, []);

  const deleteChat = useCallback(
    (chatId: string) => {
      setChatHistory((prevChats) => {
        const nextChats = prevChats.filter((chat) => chat.id !== chatId);
        if (nextChats.length === 0) {
          setActiveChatIdState(null);
          return nextChats;
        }

        setActiveChatIdState((currentId) => {
          if (!currentId || !nextChats.some((chat) => chat.id === currentId)) {
            return nextChats[0].id;
          }
          if (currentId === chatId) {
            return nextChats[0].id;
          }
          return currentId;
        });

        return nextChats;
      });
    },
    [],
  );

  const ensureActiveChatExists = useCallback(() => {
    setChatHistory((prevChats) => {
      if (prevChats.length === 0) {
        const newChat = createEmptyChatSession();
        setActiveChatIdState(newChat.id);
        return [newChat];
      }
      return prevChats;
    });
  }, []);

  useEffect(() => {
    ensureActiveChatExists();
  }, [ensureActiveChatExists]);

  const addMessageToActiveChat = useCallback(
    (message: Message) => {
      const preview = toMessagePreview(message.content).split('\n')[0].trim();
      setChatHistory((prevChats) => {
        if (prevChats.length === 0) {
          const newChat = createEmptyChatSession();
          const updatedChat: ChatSession = {
            ...newChat,
            messages: [message],
            title: message.role === 'user' && preview ? preview.slice(0, 60) : newChat.title,
          };
          setActiveChatIdState(updatedChat.id);
          return [updatedChat];
        }

        const targetChatId = activeChatId ?? prevChats[0].id;

        return prevChats.map((chat) => {
          if (chat.id !== targetChatId) {
            return chat;
          }

          const updatedMessages = [...chat.messages, message];
          let updatedTitle = chat.title;
          if (chat.messages.length === 0 && message.role === 'user' && preview) {
            updatedTitle = preview.slice(0, 60);
          }

          return {
            ...chat,
            messages: updatedMessages,
            title: updatedTitle,
          };
        });
      });
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
