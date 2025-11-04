import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ChatSession, Message } from '../types';

type ChatHistoryContextValue = {
  chatHistory: ChatSession[];
  activeChatId: string | null;
  activeChat: ChatSession | undefined;
  createNewChat: () => void;
  setActiveChatId: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  addMessageToActiveChat: (message: Message) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const ChatHistoryContext = createContext<ChatHistoryContextValue | undefined>(undefined);

const createEmptyChatSession = (): ChatSession => ({
  id: `chat-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`,
  title: 'New Conversation',
  createdAt: new Date().toISOString(),
  messages: [],
});

export const ChatHistoryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const initialChatRef = useRef<ChatSession>(createEmptyChatSession());
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([initialChatRef.current]);
  const [activeChatId, setActiveChatIdState] = useState<string | null>(initialChatRef.current.id);
  const [isLoading, setIsLoading] = useState(false);

  const setActiveChatId = useCallback((chatId: string) => {
    setActiveChatIdState(chatId);
  }, []);

  const createNewChat = useCallback(() => {
    const newChat = createEmptyChatSession();
    setChatHistory((prevChats) => [newChat, ...prevChats]);
    setActiveChatIdState(newChat.id);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChatHistory((prevChats) => {
      let filteredChats = prevChats.filter((chat) => chat.id !== chatId);

      if (filteredChats.length === 0) {
        const replacementChat = createEmptyChatSession();
        filteredChats = [replacementChat];
        setActiveChatIdState(replacementChat.id);
        return filteredChats;
      }

      setActiveChatIdState((prevActiveId) => {
        if (prevActiveId !== chatId) {
          return prevActiveId;
        }

        return filteredChats[0]?.id ?? null;
      });

      return filteredChats;
    });
  }, []);

  const addMessageToActiveChat = useCallback(
    (message: Message) => {
      setChatHistory((prevChats) => {
        if (!activeChatId) {
          return prevChats;
        }

        return prevChats.map((chat) => {
          if (chat.id !== activeChatId) {
            return chat;
          }

          const updatedMessages = [...chat.messages, message];
          const shouldUpdateTitle =
            chat.messages.length === 0 && message.role === 'user' && typeof message.content === 'string';

          return {
            ...chat,
            title: shouldUpdateTitle
              ? ((message.content as string).slice(0, 60) || 'New Conversation')
              : chat.title,
            messages: updatedMessages,
          };
        });
      });
    },
    [activeChatId],
  );

  const activeChat = useMemo(
    () => chatHistory.find((chat) => chat.id === activeChatId),
    [chatHistory, activeChatId],
  );

  const value = useMemo(
    () => ({
      chatHistory,
      activeChatId,
      activeChat,
      createNewChat,
      setActiveChatId,
      deleteChat,
      addMessageToActiveChat,
      isLoading,
      setIsLoading,
    }),
    [
      chatHistory,
      activeChatId,
      activeChat,
      createNewChat,
      setActiveChatId,
      deleteChat,
      addMessageToActiveChat,
      isLoading,
    ],
  );

  return <ChatHistoryContext.Provider value={value}>{children}</ChatHistoryContext.Provider>;
};

export const useChatHistory = (): ChatHistoryContextValue => {
  const context = useContext(ChatHistoryContext);

  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }

  return context;
};
