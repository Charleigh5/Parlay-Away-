import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import type { Message } from '../../types';

// Helper to create wrapper
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ChatHistoryProvider>{children}</ChatHistoryProvider>
  );
};

describe('ChatHistoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ChatHistoryProvider', () => {
    it('should initialize with a default empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toBeTruthy();
      expect(result.current.chatHistory[0].createdAt).toBeTruthy();
    });

    it('should set the initial chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toEqual(result.current.chatHistory[0]);
    });

    it('should initialize with isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useChatHistory hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');

      consoleError.mockRestore();
    });

    it('should return context value when used within provider', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('chatHistory');
      expect(result.current).toHaveProperty('activeChatId');
      expect(result.current).toHaveProperty('activeChat');
      expect(result.current).toHaveProperty('createNewChat');
      expect(result.current).toHaveProperty('setActiveChatId');
      expect(result.current).toHaveProperty('deleteChat');
      expect(result.current).toHaveProperty('addMessageToActiveChat');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('setIsLoading');
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat session', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(initialLength + 1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
    });

    it('should add new chat to the beginning of the list', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory[0].id).not.toBe(firstChatId);
      expect(result.current.chatHistory[1].id).toBe(firstChatId);
    });

    it('should set the new chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;
      expect(result.current.activeChatId).toBe(newChatId);
      expect(result.current.activeChat?.id).toBe(newChatId);
    });

    it('should generate unique IDs for each new chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const ids = result.current.chatHistory.map((chat) => chat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('setActiveChatId', () => {
    it('should change the active chat ID', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });

      expect(result.current.activeChatId).toBe(secondChatId);
    });

    it('should update activeChat to match the new active ID', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const secondChat = result.current.chatHistory[1];

      act(() => {
        result.current.setActiveChatId(secondChat.id);
      });

      expect(result.current.activeChat).toEqual(secondChat);
    });

    it('should handle setting active chat to non-existent ID gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChatId).toBe('non-existent-id');
      expect(result.current.activeChat).toBeUndefined();
    });
  });

  describe('deleteChat', () => {
    it('should remove chat from history', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[0].id;
      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(initialLength - 1);
      expect(result.current.chatHistory.find((c) => c.id === chatToDelete)).toBeUndefined();
    });

    it('should create a replacement chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
    });

    it('should set active chat to replacement when deleting last chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toEqual(result.current.chatHistory[0]);
    });

    it('should switch to first chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId!;

      act(() => {
        result.current.deleteChat(activeChatId);
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should not change active chat when deleting non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId!;
      const chatToDelete = result.current.chatHistory[2].id;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.activeChatId).toBe(activeChatId);
    });

    it('should handle deleting non-existent chat gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialLength = result.current.chatHistory.length;
      const initialActiveId = result.current.activeChatId;

      act(() => {
        result.current.deleteChat('non-existent-id');
      });

      expect(result.current.chatHistory).toHaveLength(initialLength);
      expect(result.current.activeChatId).toBe(initialActiveId);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(message);
    });

    it('should update chat title from first user message', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'What is the best betting strategy for NFL games?',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('What is the best betting strategy for NFL games?');
    });

    it('should truncate title to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This is a very long message that should be truncated because it exceeds the maximum allowed length for a chat title',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe(longMessage.content.slice(0, 60));
    });

    it('should not update title after first message', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const firstMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const secondMessage: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message that should not become title',
      };

      act(() => {
        result.current.addMessageToActiveChat(firstMessage);
        result.current.addMessageToActiveChat(secondMessage);
      });

      expect(result.current.activeChat?.title).toBe('First message');
      expect(result.current.activeChat?.messages).toHaveLength(2);
    });

    it('should not update title for assistant messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Assistant response',
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle non-string message content', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const analysisMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Analysis summary',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: -110,
            kellyCriterionStake: 2.5,
            confidenceScore: 7.5,
            projectedMean: 250,
            projectedStdDev: 30,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(analysisMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(analysisMessage);
    });

    it('should append messages in order', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'First' },
        { id: 'msg-2', role: 'assistant', content: 'Second' },
        { id: 'msg-3', role: 'user', content: 'Third' },
      ];

      act(() => {
        messages.forEach((msg) => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages.map((m) => m.id)).toEqual(['msg-1', 'msg-2', 'msg-3']);
    });

    it('should not modify other chats when adding message', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const inactiveChatId = result.current.chatHistory[1].id;
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      const inactiveChat = result.current.chatHistory.find((c) => c.id === inactiveChatId);
      expect(inactiveChat?.messages).toHaveLength(0);
    });

    it('should do nothing when no active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveChatId('non-existent');
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      const initialHistory = result.current.chatHistory;

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.chatHistory).toEqual(initialHistory);
    });

    it('should use "New Conversation" as title if first message is empty', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const emptyMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      act(() => {
        result.current.addMessageToActiveChat(emptyMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });
  });

  describe('isLoading state', () => {
    it('should update isLoading state', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should support functional updates', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setIsLoading((prev) => !prev);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading((prev) => !prev);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('activeChat computed value', () => {
    it('should reactively update when chatHistory changes', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialActiveChat = result.current.activeChat;

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat).not.toBe(initialActiveChat);
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should return undefined when active chat is not in history', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChat).toBeUndefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle rapid consecutive operations', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.deleteChat(result.current.chatHistory[0].id);
        result.current.setActiveChatId(result.current.chatHistory[0].id);
      });

      expect(result.current.chatHistory.length).toBeGreaterThan(0);
      expect(result.current.activeChatId).toBeTruthy();
      expect(result.current.activeChat).toBeDefined();
    });

    it('should maintain referential stability of callback functions', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialCallbacks = {
        createNewChat: result.current.createNewChat,
        setActiveChatId: result.current.setActiveChatId,
        deleteChat: result.current.deleteChat,
        addMessageToActiveChat: result.current.addMessageToActiveChat,
        setIsLoading: result.current.setIsLoading,
      };

      rerender();

      expect(result.current.createNewChat).toBe(initialCallbacks.createNewChat);
      expect(result.current.setActiveChatId).toBe(initialCallbacks.setActiveChatId);
      expect(result.current.deleteChat).toBe(initialCallbacks.deleteChat);
      expect(result.current.setIsLoading).toBe(initialCallbacks.setIsLoading);
    });

    it('should handle addMessageToActiveChat callback stability correctly', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const callback1 = result.current.addMessageToActiveChat;

      act(() => {
        result.current.createNewChat();
      });

      const callback2 = result.current.addMessageToActiveChat;

      // This callback depends on activeChatId, so it should change
      expect(callback1).not.toBe(callback2);
    });

    it('should handle messages with all role types', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const messages: Message[] = [
        { id: 'msg-1', role: 'system', content: 'System message' },
        { id: 'msg-2', role: 'user', content: 'User message' },
        { id: 'msg-3', role: 'assistant', content: 'Assistant message' },
      ];

      act(() => {
        messages.forEach((msg) => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages.map((m) => m.role)).toEqual([
        'system',
        'user',
        'assistant',
      ]);
    });
  });

  describe('integration scenarios', () => {
    it('should support complete conversation workflow', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Create a conversation
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Analyze this prop bet',
        });
      });

      expect(result.current.activeChat?.title).toBe('Analyze this prop bet');
      expect(result.current.activeChat?.messages).toHaveLength(1);

      // Add assistant response
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'assistant',
          content: 'Here is the analysis',
        });
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);

      // Create new chat and verify previous is preserved
      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.chatHistory[1].messages).toHaveLength(2);
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
    });

    it('should support multiple chats with independent state', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // First chat
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'chat1-msg1',
          role: 'user',
          content: 'First chat message',
        });
      });

      const firstChatId = result.current.activeChatId!;

      // Create second chat
      act(() => {
        result.current.createNewChat();
        result.current.addMessageToActiveChat({
          id: 'chat2-msg1',
          role: 'user',
          content: 'Second chat message',
        });
      });

      const secondChatId = result.current.activeChatId!;

      // Verify isolation
      const firstChat = result.current.chatHistory.find((c) => c.id === firstChatId);
      const secondChat = result.current.chatHistory.find((c) => c.id === secondChatId);

      expect(firstChat?.title).toBe('First chat message');
      expect(secondChat?.title).toBe('Second chat message');
      expect(firstChat?.messages).toHaveLength(1);
      expect(secondChat?.messages).toHaveLength(1);
    });

    it('should handle switching between chats and adding messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Create two chats
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg1',
          role: 'user',
          content: 'Chat 1',
        });
        result.current.createNewChat();
      });

      const chat1Id = result.current.chatHistory[1].id;
      const chat2Id = result.current.chatHistory[0].id;

      // Add to chat 2
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg2',
          role: 'user',
          content: 'Chat 2',
        });
      });

      // Switch to chat 1 and add message
      act(() => {
        result.current.setActiveChatId(chat1Id);
        result.current.addMessageToActiveChat({
          id: 'msg3',
          role: 'assistant',
          content: 'Response to chat 1',
        });
      });

      const chat1 = result.current.chatHistory.find((c) => c.id === chat1Id);
      const chat2 = result.current.chatHistory.find((c) => c.id === chat2Id);

      expect(chat1?.messages).toHaveLength(2);
      expect(chat2?.messages).toHaveLength(1);
    });
  });
});