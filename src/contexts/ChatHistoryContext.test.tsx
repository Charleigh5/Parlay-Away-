import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from './ChatHistoryContext';
import type { Message } from '../types';

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatHistoryProvider>{children}</ChatHistoryProvider>
);

describe('ChatHistoryContext', () => {
  describe('ChatHistoryProvider initialization', () => {
    it('should initialize with a default empty chat session', () => {
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
      expect(result.current.activeChat).toBeDefined();
      expect(result.current.activeChat?.id).toBe(result.current.activeChatId);
    });

    it('should initialize isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat with default values', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialChatCount = result.current.chatHistory.length;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(initialChatCount + 1);
      const newChat = result.current.chatHistory[0];
      expect(newChat.title).toBe('New Conversation');
      expect(newChat.messages).toEqual([]);
      expect(newChat.id).toMatch(/^chat-/);
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

    it('should prepend new chat to history array', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[0].id;
      expect(result.current.chatHistory[1].id).toBe(firstChatId);
      expect(secondChatId).not.toBe(firstChatId);
    });

    it('should generate unique IDs for multiple chats', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const ids = new Set<string>();

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      result.current.chatHistory.forEach((chat) => {
        ids.add(chat.id);
      });

      expect(ids.size).toBe(result.current.chatHistory.length);
    });
  });

  describe('setActiveChatId', () => {
    it('should update the active chat ID', () => {
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
      const initialCount = result.current.chatHistory.length;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(initialCount - 1);
      expect(result.current.chatHistory.find((c) => c.id === chatToDelete)).toBeUndefined();
    });

    it('should create a new empty chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.chatHistory[0].messages).toEqual([]);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should switch to first chat when deleting active chat', () => {
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

      expect(result.current.activeChatId).toBe(expectedNewActiveId);
    });

    it('should not change active chat when deleting non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const activeChatId = result.current.activeChatId;
      const chatToDelete = result.current.chatHistory[2].id;

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.activeChatId).toBe(activeChatId);
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
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const longMessage = 'This is a very long message that should be truncated to 60 characters when used as title';
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: longMessage,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe(longMessage.slice(0, 60));
      expect(result.current.activeChat?.title).not.toBe('New Conversation');
    });

    it('should not update title for assistant messages', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const originalTitle = result.current.activeChat?.title;
      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: 'Assistant response',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe(originalTitle);
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
        content: 'Second message that should not update title',
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

    it('should handle empty string message content', () => {
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
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should do nothing when no active chat exists', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Manually set activeChatId to null by deleting and preventing new chat creation
      const originalCreateNew = result.current.createNewChat;
      act(() => {
        result.current.deleteChat(result.current.chatHistory[0].id);
      });

      // The implementation creates a new chat when the last one is deleted,
      // so let's test the edge case by checking message addition doesn't crash
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      expect(() => {
        act(() => {
          result.current.addMessageToActiveChat(message);
        });
      }).not.toThrow();
    });

    it('should append messages in order', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'First' },
        { id: 'msg-2', role: 'assistant', content: 'Second' },
        { id: 'msg-3', role: 'user', content: 'Third' },
      ];

      act(() => {
        messages.forEach((msg) => result.current.addMessageToActiveChat(msg));
      });

      expect(result.current.activeChat?.messages).toHaveLength(3);
      expect(result.current.activeChat?.messages[0].id).toBe('msg-1');
      expect(result.current.activeChat?.messages[1].id).toBe('msg-2');
      expect(result.current.activeChat?.messages[2].id).toBe('msg-3');
    });

    it('should handle non-string content (AnalysisResponse)', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const analysisContent = {
        summary: 'Analysis summary',
        reasoning: [],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: 2.1,
          kellyCriterionStake: 1.25,
          confidenceScore: 0.8,
          projectedMean: 288.5,
          projectedStdDev: 15.2,
        },
      };
      const message: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisContent,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toEqual(analysisContent);
    });

    it('should truncate long titles at 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const longMessage = 'a'.repeat(100);
      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: longMessage,
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('a'.repeat(60));
    });
  });

  describe('isLoading state', () => {
    it('should update isLoading state', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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

    it('should accept a function updater', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

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

  describe('edge cases and integration scenarios', () => {
    it('should handle rapid sequential operations', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Test',
        });
        result.current.setIsLoading(true);
        result.current.createNewChat();
        result.current.setIsLoading(false);
      });

      expect(result.current.chatHistory.length).toBeGreaterThan(1);
      expect(result.current.isLoading).toBe(false);
    });

    it('should maintain referential stability of callback functions', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), { wrapper });

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
      expect(result.current.addMessageToActiveChat).toBe(initialCallbacks.addMessageToActiveChat);
      expect(result.current.setIsLoading).toBe(initialCallbacks.setIsLoading);
    });

    it('should handle complex chat history workflow', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      // Create multiple chats
      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      const chat1Id = result.current.chatHistory[0].id;
      const chat2Id = result.current.chatHistory[1].id;
      const chat3Id = result.current.chatHistory[2].id;

      // Add messages to different chats
      act(() => {
        result.current.setActiveChatId(chat2Id);
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Message in chat 2',
        });

        result.current.setActiveChatId(chat3Id);
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'user',
          content: 'Message in chat 3',
        });
      });

      // Delete middle chat
      act(() => {
        result.current.deleteChat(chat2Id);
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.chatHistory.find((c) => c.id === chat2Id)).toBeUndefined();

      // Verify remaining chats have correct messages
      const remainingChat3 = result.current.chatHistory.find((c) => c.id === chat3Id);
      expect(remainingChat3?.messages).toHaveLength(1);
      expect(remainingChat3?.messages[0].content).toBe('Message in chat 3');
    });

    it('should preserve createdAt timestamps', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const initialTimestamp = result.current.chatHistory[0].createdAt;

      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Test',
        });
      });

      expect(result.current.activeChat?.createdAt).toBe(initialTimestamp);
    });
  });
});