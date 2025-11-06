import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ChatHistoryProvider, useChatHistory } from './ChatHistoryContext';
import type { Message } from '../types';
import React from 'react';

// Helper to create a wrapper with provider
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ChatHistoryProvider>{children}</ChatHistoryProvider>
  );
};

describe('ChatHistoryContext', () => {
  beforeEach(() => {
    // Reset any mocks before each test
    vi.clearAllMocks();
  });

  describe('useChatHistory hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');

      console.error = originalError;
    });

    it('should provide context value when used within provider', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.chatHistory).toBeDefined();
      expect(result.current.activeChatId).toBeDefined();
      expect(result.current.createNewChat).toBeDefined();
      expect(result.current.setActiveChatId).toBeDefined();
      expect(result.current.deleteChat).toBeDefined();
      expect(result.current.addMessageToActiveChat).toBeDefined();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.setIsLoading).toBeDefined();
    });
  });

  describe('Initial State', () => {
    it('should initialize with one empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.chatHistory[0].createdAt).toBeDefined();
    });

    it('should set initial chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toEqual(result.current.chatHistory[0]);
    });

    it('should generate unique IDs for chat sessions', () => {
      const { result: result1 } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });
      const { result: result2 } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result1.current.chatHistory[0].id).not.toBe(
        result2.current.chatHistory[0].id
      );
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat and add it to history', () => {
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

    it('should set new chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toEqual(result.current.chatHistory[0]);
    });

    it('should prepend new chat to the beginning of history', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory[1].id).toBe(firstChatId);
    });

    it('should create multiple chats independently', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4); // Initial + 3 new
      const ids = result.current.chatHistory.map((chat) => chat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(4);
    });
  });

  describe('setActiveChatId', () => {
    it('should set the active chat ID', () => {
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
      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should update activeChat when activeChatId changes', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });
      expect(result.current.activeChat?.id).toBe(secondChatId);

      act(() => {
        result.current.setActiveChatId(firstChatId);
      });
      expect(result.current.activeChat?.id).toBe(firstChatId);
    });

    it('should handle setting non-existent chat ID', () => {
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
    it('should delete a chat from history', () => {
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
      expect(
        result.current.chatHistory.find((chat) => chat.id === chatToDelete)
      ).toBeUndefined();
    });

    it('should switch to first remaining chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(activeChatId);
      });

      expect(result.current.activeChatId).toBe(secondChatId);
      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should not change active chat when deleting non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const activeChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(secondChatId);
      });

      expect(result.current.activeChatId).toBe(activeChatId);
    });

    it('should create a new chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should handle deleting non-existent chat gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat('non-existent-id');
      });

      expect(result.current.chatHistory).toHaveLength(initialLength);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add a user message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(userMessage);
    });

    it('should add an assistant message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Test analysis',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: 2.1,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.85,
            projectedMean: 288.5,
            projectedStdDev: 25.3,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(assistantMessage);
    });

    it('should update chat title with first user message', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Analyze Patrick Mahomes passing yards over 285.5',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.title).toBe(
        'Analyze Patrick Mahomes passing yards over 285.5'
      );
    });

    it('should truncate long titles to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content:
          'This is a very long message that should be truncated to exactly 60 characters for the title',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe(
        longMessage.content.slice(0, 60)
      );
    });

    it('should not update title for subsequent messages', () => {
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
        content: 'Second message should not change title',
      };

      act(() => {
        result.current.addMessageToActiveChat(firstMessage);
      });

      const titleAfterFirst = result.current.activeChat?.title;

      act(() => {
        result.current.addMessageToActiveChat(secondMessage);
      });

      expect(result.current.activeChat?.title).toBe(titleAfterFirst);
      expect(result.current.activeChat?.messages).toHaveLength(2);
    });

    it('should not update title for assistant messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Analysis',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: 2.1,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.85,
            projectedMean: 288.5,
            projectedStdDev: 25.3,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle empty message content gracefully', () => {
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
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should do nothing when no active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Delete the only chat to have no active chat
      const chatId = result.current.chatHistory[0].id;
      
      act(() => {
        result.current.deleteChat(chatId);
      });

      const newChatId = result.current.chatHistory[0].id;
      
      // Set to non-existent ID
      act(() => {
        result.current.setActiveChatId('non-existent');
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      // The chat history should still have the replacement chat
      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
    });

    it('should maintain message order', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'First' },
        { id: 'msg-2', role: 'assistant', content: 'Response 1' },
        { id: 'msg-3', role: 'user', content: 'Second' },
        { id: 'msg-4', role: 'assistant', content: 'Response 2' },
      ];

      act(() => {
        messages.forEach((msg) => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(4);
      expect(result.current.activeChat?.messages.map((m) => m.id)).toEqual([
        'msg-1',
        'msg-2',
        'msg-3',
        'msg-4',
      ]);
    });
  });

  describe('isLoading state', () => {
    it('should initialize as false', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should update loading state', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should accept function updater', () => {
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

  describe('Complex Scenarios', () => {
    it('should handle rapid chat creation and switching', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const chatIds = result.current.chatHistory.map((chat) => chat.id);

      act(() => {
        result.current.setActiveChatId(chatIds[2]);
        result.current.setActiveChatId(chatIds[0]);
        result.current.setActiveChatId(chatIds[1]);
      });

      expect(result.current.activeChatId).toBe(chatIds[1]);
    });

    it('should handle adding messages to different chats', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      const message1: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Message for first chat',
      };

      act(() => {
        result.current.addMessageToActiveChat(message1);
      });

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });

      const message2: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Message for second chat',
      };

      act(() => {
        result.current.addMessageToActiveChat(message2);
      });

      const firstChat = result.current.chatHistory.find(
        (chat) => chat.id === firstChatId
      );
      const secondChat = result.current.chatHistory.find(
        (chat) => chat.id === secondChatId
      );

      expect(firstChat?.messages).toHaveLength(1);
      expect(firstChat?.messages[0].content).toBe('Message for first chat');
      expect(secondChat?.messages).toHaveLength(1);
      expect(secondChat?.messages[0].content).toBe('Message for second chat');
    });

    it('should handle delete and recreate scenario', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const initialChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(initialChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(initialChatId);

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle system messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const systemMessage: Message = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification',
      };

      act(() => {
        result.current.addMessageToActiveChat(systemMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].role).toBe('system');
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle non-string content for user message title update', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const userMessageWithObjectContent: Message = {
        id: 'msg-1',
        role: 'user',
        content: { some: 'object' } as any,
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessageWithObjectContent);
      });

      // Should not crash and should keep default title
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle whitespace-only content', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const whitespaceMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: '   \n\t  ',
      };

      act(() => {
        result.current.addMessageToActiveChat(whitespaceMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      // Whitespace is preserved but used for title
      expect(result.current.activeChat?.title).toBe('   \n\t  ');
    });
  });
});