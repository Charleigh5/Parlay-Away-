/**
 * Chat history context responsible for persisting analyzer conversations and
 * exposing helpers used by the chat workspace within the main panel.
 * Restores the behavior lost during the monorepo refactor by wiring the
 * sidebar, chat panel, and provider together.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import type { ChatSession, Message } from '../types';

export interface ChatHistoryContextValue {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | null;
  createNewChat: () => void;
  setActiveChatId: (chatId: string | null) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(undefined);

interface ChatHistoryProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'synopticEdge_chatHistory';
const DEFAULT_TITLE = 'New Analysis';

const createEmptyChat = (): ChatSession => ({
  id: `chat_${Date.now()}`,
  title: DEFAULT_TITLE,
  createdAt: new Date().toISOString(),
  messages: [],
});

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({ children }) => {
  const [chatHistory, setChatHistory] = useLocalStorage<ChatSession[]>(STORAGE_KEY, []);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(() => chatHistory[0]?.id ?? null);
  const [isLoadingState, setIsLoadingState] = useState(false);

  useEffect(() => {
    setActiveChatIdState((prevId) => {
      if (prevId && chatHistory.some((chat) => chat.id === prevId)) {
        return prevId;
      }
      return chatHistory[0]?.id ?? null;
    });
  }, [chatHistory]);

  const activeChat = useMemo(
    () => chatHistory.find((chat) => chat.id === activeChatId) ?? null,
    [chatHistory, activeChatId],
  );

  const setActiveChatId = useCallback((chatId: string | null) => {
    setActiveChatIdState(chatId);
  }, []);

  const createNewChat = useCallback(() => {
    const newChat = createEmptyChat();
    setChatHistory((prev) => [newChat, ...prev]);
    setActiveChatIdState(newChat.id);
  }, [setChatHistory]);

  const deleteChat = useCallback(
    (chatId: string) => {
      setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
      setActiveChatIdState((prevId) => (prevId === chatId ? null : prevId));
    },
    [setChatHistory],
  );

  const renameChat = useCallback(
    (chatId: string, newTitle: string) => {
      const trimmedTitle = newTitle.trim();
      if (!trimmedTitle) {
        return;
      }

      setChatHistory((prev) =>
        prev.map((chat) => (chat.id === chatId ? { ...chat, title: trimmedTitle } : chat)),
      );
    },
    [setChatHistory],
  );

  const addMessageToActiveChat = useCallback(
    (message: Message) => {
      let newChatId: string | null = null;

      setChatHistory((prevHistory) => {
        let workingHistory = prevHistory;
        let targetChatId = activeChatId ?? prevHistory[0]?.id ?? null;

        if (!targetChatId && message.role === 'user') {
          const generatedChat = createEmptyChat();
          workingHistory = [generatedChat, ...prevHistory];
          targetChatId = generatedChat.id;
          newChatId = generatedChat.id;
        }

        if (!targetChatId) {
          return workingHistory;
        }

        return workingHistory.map((chat) => {
          if (chat.id !== targetChatId) {
            return chat;
          }

          const updatedMessages = [...chat.messages, message];
          let updatedTitle = chat.title;

          if (
            message.role === 'user' &&
            chat.title === DEFAULT_TITLE &&
            typeof message.content === 'string' &&
            message.content.trim()
          ) {
            const truncated = message.content.trim().slice(0, 40);
            updatedTitle = truncated.length === message.content.trim().length ? truncated : `${truncated}...`;
          }

          return { ...chat, messages: updatedMessages, title: updatedTitle };
        });
      });

      if (newChatId) {
        setActiveChatIdState(newChatId);
      }
    },
    [activeChatId, setChatHistory],
  );

  const setIsLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
  }, []);

  const contextValue = useMemo<ChatHistoryContextValue>(
    () => ({
      chatHistory,
      activeChatId,
      activeChat,
      createNewChat,
      setActiveChatId,
      deleteChat,
      renameChat,
      addMessageToActiveChat,
      isLoading: isLoadingState,
      setIsLoading,
    }),
    [
      chatHistory,
      activeChatId,
      activeChat,
      createNewChat,
      setActiveChatId,
      deleteChat,
      renameChat,
      addMessageToActiveChat,
      isLoadingState,
      setIsLoading,
    ],
  );

  return <ChatHistoryContext.Provider value={contextValue}>{children}</ChatHistoryContext.Provider>;
};

export const useChatHistory = (): ChatHistoryContextValue => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
