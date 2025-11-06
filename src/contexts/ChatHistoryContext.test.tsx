import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ChatHistoryProvider, useChatHistory } from './ChatHistoryContext';
import type { Message } from '../types';

describe('ChatHistoryContext', () => {
  // Helper to render the hook with provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatHistoryProvider>{children}</ChatHistoryProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initialization', () => {
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

    it('should initialize isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

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
    it('should create a new chat and add it to history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
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

    it('should set the new chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;
      expect(result.current.activeChatId).toBe(newChatId);
      expect(result.current.activeChat).toBe(result.current.chatHistory[0]);
    });

    it('should prepend new chat to history (most recent first)', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;
      expect(newChatId).not.toBe(firstChatId);
      expect(result.current.chatHistory[1].id).toBe(firstChatId);
    });

    it('should create unique IDs for each chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const ids = result.current.chatHistory.map(chat => chat.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('setActiveChatId', () => {
    it('should change the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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
  });

  describe('deleteChat', () => {
    it('should remove the chat from history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[0].id;
      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(initialLength - 1);
      expect(result.current.chatHistory.find(c => c.id === chatToDelete)).toBeUndefined();
    });

    it('should create a new empty chat if deleting the last chat', () => {
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

    it('should set the replacement chat as active when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChatId).not.toBe(onlyChatId);
    });

    it('should switch to first chat if deleting the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeId = result.current.chatHistory[0].id;
      const nextId = result.current.chatHistory[1].id;

      act(() => {
        result.current.deleteChat(activeId);
      });

      expect(result.current.activeChatId).toBe(nextId);
      expect(result.current.activeChat?.id).toBe(nextId);
    });

    it('should not change active chat if deleting a non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeId = result.current.chatHistory[0].id;
      const chatToDelete = result.current.chatHistory[2].id;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.activeChatId).toBe(activeId);
    });

    it('should handle deleting non-existent chat gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialLength = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat('non-existent-id');
      });

      expect(result.current.chatHistory).toHaveLength(initialLength);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add a user message to the active chat', () => {
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

    it('should add an assistant message to the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Response message',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(message);
    });

    it('should append messages in order', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message1: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const message2: Message = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second message',
      };

      act(() => {
        result.current.addMessageToActiveChat(message1);
        result.current.addMessageToActiveChat(message2);
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);
      expect(result.current.activeChat?.messages[0]).toEqual(message1);
      expect(result.current.activeChat?.messages[1]).toEqual(message2);
    });

    it('should update chat title with first user message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'What are the best bets today?',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('What are the best bets today?');
    });

    it('should truncate long titles to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const longMessage = 'A'.repeat(100);
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: longMessage,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('A'.repeat(60));
    });

    it('should not update title after the first message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message1: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const message2: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message that should not update title',
      };

      act(() => {
        result.current.addMessageToActiveChat(message1);
        result.current.addMessageToActiveChat(message2);
      });

      expect(result.current.activeChat?.title).toBe('First message');
    });

    it('should not update title for non-string content', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: { complex: 'object' } as any,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should keep "New Conversation" title if first message is empty string', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should only modify the active chat, not others', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Message for first chat',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      const firstChat = result.current.chatHistory.find(c => c.id === firstChatId);
      const secondChat = result.current.chatHistory.find(c => c.id === secondChatId);

      expect(firstChat?.messages).toHaveLength(1);
      expect(secondChat?.messages).toHaveLength(0);
    });
  });

  describe('isLoading state', () => {
    it('should allow setting isLoading to true', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should allow setting isLoading to false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should allow toggling isLoading', () => {
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

  describe('context value memoization', () => {
    it('should memoize context value when state does not change', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), { wrapper });

      const firstValue = result.current;
      rerender();
      const secondValue = result.current;

      // Functions should be stable
      expect(firstValue.createNewChat).toBe(secondValue.createNewChat);
      expect(firstValue.setActiveChatId).toBe(secondValue.setActiveChatId);
      expect(firstValue.deleteChat).toBe(secondValue.deleteChat);
      expect(firstValue.addMessageToActiveChat).toBe(secondValue.addMessageToActiveChat);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle rapid successive operations', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.deleteChat(result.current.chatHistory[0].id);
        result.current.createNewChat();
      });

      expect(result.current.chatHistory.length).toBeGreaterThan(0);
      expect(result.current.activeChatId).toBeTruthy();
    });

    it('should handle adding messages with various content types', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const analysisResponse = {
        summary: 'Test analysis',
        reasoning: [{ step: 1, description: 'Test', activatedModules: [] }],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: -105,
          kellyCriterionStake: 2.0,
          confidenceScore: 0.85,
          projectedMean: 288.5,
          projectedStdDev: 42.3,
        },
      };

      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisResponse as any,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toEqual(analysisResponse);
    });

    it('should maintain data integrity across multiple operations', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Create chats
      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const chat1Id = result.current.chatHistory[0].id;
      const chat2Id = result.current.chatHistory[1].id;
      const chat3Id = result.current.chatHistory[2].id;

      // Add messages to different chats
      act(() => {
        result.current.setActiveChatId(chat1Id);
        result.current.addMessageToActiveChat({
          id: 'msg-1-1',
          role: 'user',
          content: 'Chat 1 message',
        });

        result.current.setActiveChatId(chat2Id);
        result.current.addMessageToActiveChat({
          id: 'msg-2-1',
          role: 'user',
          content: 'Chat 2 message',
        });
      });

      // Delete one chat
      act(() => {
        result.current.deleteChat(chat3Id);
      });

      // Verify data integrity
      const remainingChat1 = result.current.chatHistory.find(c => c.id === chat1Id);
      const remainingChat2 = result.current.chatHistory.find(c => c.id === chat2Id);
      const deletedChat = result.current.chatHistory.find(c => c.id === chat3Id);

      expect(remainingChat1?.messages).toHaveLength(1);
      expect(remainingChat2?.messages).toHaveLength(1);
      expect(deletedChat).toBeUndefined();
    });
  });

  describe('createEmptyChatSession helper', () => {
    it('should create chat sessions with consistent structure', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      result.current.chatHistory.forEach(chat => {
        expect(chat).toHaveProperty('id');
        expect(chat).toHaveProperty('title');
        expect(chat).toHaveProperty('createdAt');
        expect(chat).toHaveProperty('messages');
        expect(Array.isArray(chat.messages)).toBe(true);
      });
    });

    it('should create valid ISO date strings for createdAt', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const createdAt = result.current.chatHistory[0].createdAt;
      const date = new Date(createdAt);

      expect(date.toISOString()).toBe(createdAt);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});