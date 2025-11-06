import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import type { Message } from '../../types';

// Wrapper component for testing hooks
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatHistoryProvider>{children}</ChatHistoryProvider>
);

describe('ChatHistoryContext', () => {
  describe('ChatHistoryProvider', () => {
    it('should initialize with a single empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        id: expect.stringContaining('chat-'),
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should provide all required context values', () => {
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

  describe('useChatHistory hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');

      consoleSpy.mockRestore();
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

      const newChatId = result.current.activeChatId;
      expect(result.current.chatHistory[0].id).toBe(newChatId);
    });

    it('should generate unique IDs for each new chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });
      const firstChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });
      const secondChatId = result.current.activeChatId;

      expect(firstChatId).not.toBe(secondChatId);
      expect(result.current.chatHistory).toHaveLength(3);
    });
  });

  describe('setActiveChatId', () => {
    it('should switch active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });
      const firstChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });

      expect(result.current.activeChatId).toBe(secondChatId);
      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should update activeChat when switching', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Add message to first chat
      const firstMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First chat message',
      };

      act(() => {
        result.current.addMessageToActiveChat(firstMessage);
      });

      const firstChatId = result.current.activeChatId!;

      // Create second chat
      act(() => {
        result.current.createNewChat();
      });

      // Switch back to first chat
      act(() => {
        result.current.setActiveChatId(firstChatId);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toBe('First chat message');
    });
  });

  describe('deleteChat', () => {
    it('should delete specified chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[1].id;
      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(initialLength - 1);
      expect(result.current.chatHistory.find(c => c.id === chatToDelete)).toBeUndefined();
    });

    it('should switch to first chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[1].id;
      const activeChatId = result.current.activeChatId!;

      act(() => {
        result.current.deleteChat(activeChatId);
      });

      expect(result.current.activeChatId).toBe(firstChatId);
    });

    it('should not change active chat when deleting non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const currentActiveId = result.current.activeChatId;
      const chatToDelete = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.activeChatId).toBe(currentActiveId);
    });

    it('should create replacement chat when deleting last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
      expect(result.current.chatHistory[0].messages).toEqual([]);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should handle deleting multiple chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Create 3 more chats
      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4);

      // Delete two chats
      const chat2Id = result.current.chatHistory[1].id;
      const chat3Id = result.current.chatHistory[2].id;

      act(() => {
        result.current.deleteChat(chat2Id);
        result.current.deleteChat(chat3Id);
      });

      expect(result.current.chatHistory).toHaveLength(2);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add user message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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

    it('should add assistant message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const assistantMessage: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: {
          summary: 'Analysis summary',
          reasoning: [{ step: 1, description: 'Step 1', activatedModules: ['KM_01'] }],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: -105,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.85,
            projectedMean: 288.5,
            projectedStdDev: 42.3,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(assistantMessage);
    });

    it('should update chat title from first user message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Analyze Patrick Mahomes passing yards over 285.5',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('Analyze Patrick Mahomes passing yards over 285.5');
    });

    it('should truncate long titles to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'A very long message that should be truncated because it exceeds the maximum allowed length for chat titles',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('A very long message that should be truncated because it ex');
    });

    it('should not update title after first message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const firstMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const secondMessage: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message should not update title',
      };

      act(() => {
        result.current.addMessageToActiveChat(firstMessage);
        result.current.addMessageToActiveChat(secondMessage);
      });

      expect(result.current.activeChat?.title).toBe('First message');
      expect(result.current.activeChat?.messages).toHaveLength(2);
    });

    it('should not update title for assistant messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Analysis summary',
          reasoning: [],
          quantitative: {
            expectedValue: 5.5,
            vigRemovedOdds: -105,
            kellyCriterionStake: 1.25,
            confidenceScore: 0.85,
            projectedMean: 288.5,
            projectedStdDev: 42.3,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should handle empty string message content', () => {
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
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should not add message when no active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Manually set activeChatId to null (edge case)
      act(() => {
        // @ts-ignore - Testing edge case
        result.current.setActiveChatId(null);
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const initialLength = result.current.chatHistory[0].messages.length;

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.chatHistory[0].messages).toHaveLength(initialLength);
    });

    it('should maintain message order', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Message 1' },
        { id: 'msg-2', role: 'assistant', content: { summary: 'Response', reasoning: [], quantitative: { expectedValue: 5, vigRemovedOdds: -110, kellyCriterionStake: 1, confidenceScore: 0.8, projectedMean: 100, projectedStdDev: 10 } } },
        { id: 'msg-3', role: 'user', content: 'Message 3' },
      ];

      act(() => {
        messages.forEach(msg => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages[0].id).toBe('msg-1');
      expect(result.current.activeChat?.messages[1].id).toBe('msg-2');
      expect(result.current.activeChat?.messages[2].id).toBe('msg-3');
    });
  });

  describe('isLoading state', () => {
    it('should initialize with isLoading as false', () => {
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
  });

  describe('activeChat computed value', () => {
    it('should return undefined when no chat matches activeChatId', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Manually corrupt activeChatId (edge case)
      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChat).toBeUndefined();
    });

    it('should update when chatHistory changes', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
    });
  });

  describe('Edge cases and error scenarios', () => {
    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should handle creating and deleting chats in sequence', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });
      const chatId = result.current.activeChatId!;

      act(() => {
        result.current.deleteChat(chatId);
      });

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory.length).toBeGreaterThanOrEqual(1);
      expect(result.current.activeChatId).toBeTruthy();
    });

    it('should preserve messages when switching between chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const msg1: Message = { id: 'msg-1', role: 'user', content: 'Chat 1 message' };
      
      act(() => {
        result.current.addMessageToActiveChat(msg1);
      });

      const chat1Id = result.current.activeChatId!;

      act(() => {
        result.current.createNewChat();
      });

      const msg2: Message = { id: 'msg-2', role: 'user', content: 'Chat 2 message' };
      
      act(() => {
        result.current.addMessageToActiveChat(msg2);
      });

      act(() => {
        result.current.setActiveChatId(chat1Id);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toBe('Chat 1 message');
    });
  });

  describe('Memoization and performance', () => {
    it('should memoize callback functions', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), { wrapper });

      const initialCreateNewChat = result.current.createNewChat;
      const initialSetActiveChatId = result.current.setActiveChatId;
      const initialDeleteChat = result.current.deleteChat;

      rerender();

      expect(result.current.createNewChat).toBe(initialCreateNewChat);
      expect(result.current.setActiveChatId).toBe(initialSetActiveChatId);
      expect(result.current.deleteChat).toBe(initialDeleteChat);
    });

    it('should update addMessageToActiveChat when activeChatId changes', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const initialAddMessage = result.current.addMessageToActiveChat;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.addMessageToActiveChat).not.toBe(initialAddMessage);
    });
  });
});