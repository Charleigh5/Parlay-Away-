import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import type { Message } from '../../types';

// Helper to render hook with provider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatHistoryProvider>{children}</ChatHistoryProvider>
);

describe('ChatHistoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should initialize with a single empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.chatHistory[0].createdAt).toBeTruthy();
    });

    it('should set the initial chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toBe(result.current.chatHistory[0]);
    });

    it('should initialize with isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('useChatHistory hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');

      consoleSpy.mockRestore();
    });

    it('should return all context values', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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
    it('should create a new empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialCount = result.current.chatHistory.length;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(initialCount + 1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
    });

    it('should set the new chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;
      expect(result.current.activeChatId).toBe(newChatId);
      expect(result.current.activeChat?.id).toBe(newChatId);
    });

    it('should add new chat to the beginning of history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory[1].id).toBe(firstChatId);
      expect(result.current.chatHistory[0].id).not.toBe(firstChatId);
    });

    it('should generate unique IDs for multiple new chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });
      const firstNewId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });
      const secondNewId = result.current.chatHistory[0].id;

      expect(firstNewId).not.toBe(secondNewId);
    });

    it('should preserve existing chat history when creating new chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      
      // Add a message to the initial chat
      const testMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'test message',
      };

      act(() => {
        result.current.addMessageToActiveChat(testMessage);
      });

      const initialChatWithMessage = result.current.chatHistory[0];

      act(() => {
        result.current.createNewChat();
      });

      // The old chat should still exist with its message
      expect(result.current.chatHistory[1]).toEqual(initialChatWithMessage);
      expect(result.current.chatHistory[1].messages).toHaveLength(1);
    });
  });

  describe('setActiveChatId', () => {
    it('should change the active chat ID', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });

      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should return undefined for activeChat if ID does not exist', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChat).toBeUndefined();
    });
  });

  describe('deleteChat', () => {
    it('should remove the specified chat from history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[0].id;
      const initialCount = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(initialCount - 1);
      expect(result.current.chatHistory.find(c => c.id === chatToDelete)).toBeUndefined();
    });

    it('should switch to first remaining chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId;
      const remainingChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(activeChatId!);
      });

      expect(result.current.activeChatId).toBe(remainingChatId);
    });

    it('should maintain active chat when deleting a non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const activeId = result.current.activeChatId;
      const nonActiveId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(nonActiveId);
      });

      expect(result.current.activeChatId).toBe(activeId);
    });

    it('should create a replacement chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
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

    it('should set the replacement chat as active when deleting last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toBe(result.current.chatHistory[0]);
    });

    it('should handle deleting non-existent chat gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialCount = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat('non-existent-id');
      });

      expect(result.current.chatHistory).toHaveLength(initialCount);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add a user message to the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, world!',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(userMessage);
    });

    it('should update chat title with first user message content', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'What are the best betting strategies?',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.title).toBe('What are the best betting strategies?');
    });

    it('should truncate long first user messages to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This is a very long message that exceeds sixty characters and should be truncated properly',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('This is a very long message that exceeds sixty characters');
    });

    it('should use "New Conversation" for empty first user message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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

    it('should not update title for subsequent user messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const firstMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const secondMessage: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message that should not change title',
      };

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

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Analysis result',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: 2.1,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.8,
            projectedMean: 288.5,
            projectedStdDev: 45.2,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should maintain message order', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message1: Message = { id: 'msg-1', role: 'user', content: 'First' };
      const message2: Message = { id: 'msg-2', role: 'assistant', content: 'Second' as any };
      const message3: Message = { id: 'msg-3', role: 'user', content: 'Third' };

      act(() => {
        result.current.addMessageToActiveChat(message1);
        result.current.addMessageToActiveChat(message2);
        result.current.addMessageToActiveChat(message3);
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages[0].id).toBe('msg-1');
      expect(result.current.activeChat?.messages[1].id).toBe('msg-2');
      expect(result.current.activeChat?.messages[2].id).toBe('msg-3');
    });

    it('should do nothing when activeChatId is null', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Manually set activeChatId to null
      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      const message: Message = { id: 'msg-1', role: 'user', content: 'Test' };
      const historyBefore = [...result.current.chatHistory];

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.chatHistory).toEqual(historyBefore);
    });

    it('should only add message to the active chat, not others', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId;
      const inactiveChatId = result.current.chatHistory[1].id;

      const message: Message = { id: 'msg-1', role: 'user', content: 'Test' };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      const activeChat = result.current.chatHistory.find(c => c.id === activeChatId);
      const inactiveChat = result.current.chatHistory.find(c => c.id === inactiveChatId);

      expect(activeChat?.messages).toHaveLength(1);
      expect(inactiveChat?.messages).toHaveLength(0);
    });

    it('should handle system messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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
    });
  });

  describe('isLoading state', () => {
    it('should allow setting loading state to true', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should allow setting loading state to false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should allow toggling loading state', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(prev => !prev);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(prev => !prev);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Context value memoization', () => {
    it('should maintain stable references for callback functions', () => {
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
    });

    it('should update addMessageToActiveChat when activeChatId changes', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const initialCallback = result.current.addMessageToActiveChat;

      act(() => {
        result.current.createNewChat();
      });

      // The callback should be different because activeChatId is in its dependency array
      expect(result.current.addMessageToActiveChat).not.toBe(initialCallback);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle rapid consecutive operations', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4); // Initial + 3 new
    });

    it('should handle adding multiple messages in quick succession', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const messages: Message[] = Array.from({ length: 10 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      act(() => {
        messages.forEach(msg => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(10);
    });

    it('should handle deleting and recreating chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const chatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(chatId);
      });

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory.length).toBeGreaterThanOrEqual(2);
    });

    it('should properly handle non-string message content', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const complexMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Test analysis',
          reasoning: [
            {
              step: 1,
              description: 'First step',
              activatedModules: ['KM_01'],
            },
          ],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: 2.1,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.8,
            projectedMean: 288.5,
            projectedStdDev: 45.2,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(complexMessage);
      });

      expect(result.current.activeChat?.messages[0]).toEqual(complexMessage);
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle a complete chat lifecycle', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Start loading
      act(() => {
        result.current.setIsLoading(true);
      });

      // Add user message
      const userMsg: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Analyze Patrick Mahomes passing yards over 285.5',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMsg);
      });

      expect(result.current.activeChat?.title).toContain('Patrick Mahomes');

      // Add assistant response
      const assistantMsg: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: {
          summary: 'Strong +EV opportunity',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: 2.1,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.8,
            projectedMean: 288.5,
            projectedStdDev: 45.2,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMsg);
        result.current.setIsLoading(false);
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);
      expect(result.current.isLoading).toBe(false);

      // Create new chat
      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChat?.messages).toHaveLength(0);

      // Previous chat should still have its messages
      expect(result.current.chatHistory[1].messages).toHaveLength(2);
    });

    it('should maintain data integrity across multiple chat sessions', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Create multiple chats with different messages
      const sessions = [
        { userMsg: 'Chat 1 message', title: 'Chat 1 message' },
        { userMsg: 'Chat 2 message', title: 'Chat 2 message' },
        { userMsg: 'Chat 3 message', title: 'Chat 3 message' },
      ];

      sessions.forEach((session, index) => {
        if (index > 0) {
          act(() => {
            result.current.createNewChat();
          });
        }

        act(() => {
          result.current.addMessageToActiveChat({
            id: `msg-${index}`,
            role: 'user',
            content: session.userMsg,
          });
        });
      });

      // Verify all chats exist with correct data
      expect(result.current.chatHistory).toHaveLength(4); // Initial + 3 new

      // Check each chat has the correct title (in reverse order since new chats are prepended)
      sessions.reverse().forEach((session, index) => {
        expect(result.current.chatHistory[index].title).toBe(session.title);
      });
    });
  });
});