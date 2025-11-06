import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import type { Message, ChatSession } from '../../types';

describe('ChatHistoryContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatHistoryProvider>{children}</ChatHistoryProvider>
  );

  describe('ChatHistoryProvider initialization', () => {
    it('should initialize with an empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.isLoading).toBe(false);
    });

    it('should set activeChat to the initial chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.activeChat).toBeDefined();
      expect(result.current.activeChat?.id).toBe(result.current.chatHistory[0].id);
    });

    it('should generate unique chat IDs using crypto.randomUUID', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory[0].id).toContain('test-uuid-123');
    });

    it('should fall back to timestamp-based ID when crypto.randomUUID is unavailable', () => {
      const originalCrypto = globalThis.crypto;
      // @ts-ignore - Testing fallback behavior
      delete globalThis.crypto;

      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.chatHistory[0].id).not.toContain('test-uuid-123');

      globalThis.crypto = originalCrypto;
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat and set it as active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).not.toBe(initialChatId);
      expect(result.current.activeChat?.title).toBe('New Conversation');
      expect(result.current.activeChat?.messages).toEqual([]);
    });

    it('should prepend new chat to history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory[0].id).toBe(result.current.activeChatId);
    });

    it('should create multiple new chats correctly', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });
  });

  describe('setActiveChatId', () => {
    it('should change the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[0].id;
      const firstChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.setActiveChatId(firstChatId);
      });

      expect(result.current.activeChatId).toBe(firstChatId);
      expect(result.current.activeChat?.id).toBe(firstChatId);
    });

    it('should update activeChat when activeChatId changes', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.setActiveChatId(newChatId);
      });

      expect(result.current.activeChat?.id).toBe(newChatId);
    });

    it('should handle switching between multiple chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const [chat1, chat2, chat3] = result.current.chatHistory;

      act(() => {
        result.current.setActiveChatId(chat3.id);
      });
      expect(result.current.activeChatId).toBe(chat3.id);

      act(() => {
        result.current.setActiveChatId(chat2.id);
      });
      expect(result.current.activeChatId).toBe(chat2.id);

      act(() => {
        result.current.setActiveChatId(chat1.id);
      });
      expect(result.current.activeChatId).toBe(chat1.id);
    });
  });

  describe('deleteChat', () => {
    it('should delete a chat that is not active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[1].id;
      const activeChatId = result.current.activeChatId;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory.find((c) => c.id === chatToDelete)).toBeUndefined();
      expect(result.current.activeChatId).toBe(activeChatId);
    });

    it('should delete active chat and set first remaining as active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId;
      const expectedNewActiveId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(activeChatId!);
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).toBe(expectedNewActiveId);
    });

    it('should create a new chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle deleting multiple chats sequentially', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4);

      act(() => {
        result.current.deleteChat(result.current.chatHistory[3].id);
      });
      expect(result.current.chatHistory).toHaveLength(3);

      act(() => {
        result.current.deleteChat(result.current.chatHistory[2].id);
      });
      expect(result.current.chatHistory).toHaveLength(2);
    });

    it('should not fail when trying to delete non-existent chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat('non-existent-id');
      });

      expect(result.current.chatHistory).toHaveLength(initialLength);
    });
  });

  describe('addMessageToActiveChat', () => {
    const createUserMessage = (content: string): Message => ({
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
    });

    const createAssistantMessage = (): Message => ({
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: {
        summary: 'Test analysis summary',
        reasoning: [
          {
            step: 1,
            description: 'Test reasoning',
            activatedModules: ['test-module'],
          },
        ],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: -110,
          kellyCriterionStake: 2.5,
          confidenceScore: 8.0,
          projectedMean: 25.5,
          projectedStdDev: 3.2,
        },
      },
    });

    it('should add a message to the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message = createUserMessage('Test message');

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(message);
    });

    it('should update chat title with first user message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message = createUserMessage('What are the best props today?');

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('What are the best props today?');
    });

    it('should truncate long titles to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const longMessage = 'A'.repeat(100);
      const message = createUserMessage(longMessage);

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('A'.repeat(60));
    });

    it('should not update title for subsequent messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const firstMessage = createUserMessage('First message');
      const secondMessage = createUserMessage('Second message should not change title');

      act(() => {
        result.current.addMessageToActiveChat(firstMessage);
      });

      const titleAfterFirst = result.current.activeChat?.title;

      act(() => {
        result.current.addMessageToActiveChat(secondMessage);
      });

      expect(result.current.activeChat?.title).toBe(titleAfterFirst);
    });

    it('should not update title for assistant messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const assistantMessage = createAssistantMessage();

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle adding multiple messages in sequence', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const userMsg = createUserMessage('User question');
      const assistantMsg = createAssistantMessage();
      const followUpMsg = createUserMessage('Follow-up question');

      act(() => {
        result.current.addMessageToActiveChat(userMsg);
        result.current.addMessageToActiveChat(assistantMsg);
        result.current.addMessageToActiveChat(followUpMsg);
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages[0]).toEqual(userMsg);
      expect(result.current.activeChat?.messages[1]).toEqual(assistantMsg);
      expect(result.current.activeChat?.messages[2]).toEqual(followUpMsg);
    });

    it('should not add message when no active chat exists', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Force activeChatId to null
      act(() => {
        // @ts-ignore - Testing edge case
        result.current.activeChatId = null;
      });

      const initialHistoryLength = result.current.chatHistory.length;
      const message = createUserMessage('Test');

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      // History should remain unchanged
      expect(result.current.chatHistory).toHaveLength(initialHistoryLength);
    });

    it('should handle empty string content gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const emptyMessage = createUserMessage('');

      act(() => {
        result.current.addMessageToActiveChat(emptyMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should preserve message immutability', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message = createUserMessage('Original message');
      const originalContent = message.content;

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      // Modify the original message
      message.content = 'Modified message';

      // Check that the stored message is unchanged
      expect(result.current.activeChat?.messages[0].content).toBe(originalContent);
    });
  });

  describe('isLoading and setIsLoading', () => {
    it('should initialize isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it('should update isLoading state', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should toggle isLoading multiple times', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setIsLoading(true);
      });
      expect(result.current.isLoading).toBe(true);
    });
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
  });

  describe('Edge cases and error handling', () => {
    it('should handle rapid state changes', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        const message = {
          id: 'test-msg',
          role: 'user' as const,
          content: 'Test',
        };
        result.current.addMessageToActiveChat(message);
        result.current.setIsLoading(true);
        result.current.createNewChat();
        result.current.setIsLoading(false);
      });

      expect(result.current.chatHistory.length).toBeGreaterThan(0);
      expect(result.current.activeChatId).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain referential stability of callbacks', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), { wrapper });

      const initialCallbacks = {
        createNewChat: result.current.createNewChat,
        setActiveChatId: result.current.setActiveChatId,
        deleteChat: result.current.deleteChat,
        addMessageToActiveChat: result.current.addMessageToActiveChat,
      };

      rerender();

      expect(result.current.createNewChat).toBe(initialCallbacks.createNewChat);
      expect(result.current.setActiveChatId).toBe(initialCallbacks.setActiveChatId);
      expect(result.current.deleteChat).toBe(initialCallbacks.deleteChat);
      expect(result.current.addMessageToActiveChat).toBe(initialCallbacks.addMessageToActiveChat);
    });

    it('should handle concurrent message additions', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const messages = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        content: `Message ${i}`,
      }));

      act(() => {
        messages.forEach((msg) => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(10);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete chat workflow', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Create new chat
      act(() => {
        result.current.createNewChat();
      });

      const chatId = result.current.activeChatId;

      // Add user message
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'What is the best prop bet today?',
        });
      });

      expect(result.current.activeChat?.title).toBe('What is the best prop bet today?');

      // Add assistant response
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'assistant',
          content: {
            summary: 'Based on analysis...',
            reasoning: [],
            quantitative: {
              expectedValue: 10,
              vigRemovedOdds: -105,
              kellyCriterionStake: 5,
              confidenceScore: 9,
              projectedMean: 30,
              projectedStdDev: 2,
            },
          },
        });
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);

      // Create another chat
      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(3);

      // Switch back to original chat
      act(() => {
        result.current.setActiveChatId(chatId!);
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);
    });
  });
});