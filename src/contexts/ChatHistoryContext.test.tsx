import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from './ChatHistoryContext';
import type { Message } from '../types';

// Helper to create wrapper
const createWrapper = () => {
  return ({ children }: { children: React.ReactNode }) => (
    <ChatHistoryProvider>{children}</ChatHistoryProvider>
  );
};

describe('ChatHistoryContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe('useChatHistory hook', () => {
    it('should throw error when used outside of provider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');
      
      consoleErrorSpy.mockRestore();
    });

    it('should provide context value when used within provider', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.chatHistory).toBeInstanceOf(Array);
      expect(result.current.activeChatId).toBeTruthy();
      expect(result.current.activeChat).toBeDefined();
      expect(typeof result.current.createNewChat).toBe('function');
      expect(typeof result.current.setActiveChatId).toBe('function');
      expect(typeof result.current.deleteChat).toBe('function');
      expect(typeof result.current.addMessageToActiveChat).toBe('function');
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.setIsLoading).toBe('function');
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
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
      expect(result.current.chatHistory[0].messages).toEqual([]);
    });

    it('should set the new chat as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const oldActiveChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.activeChatId).not.toBe(oldActiveChatId);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
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

    it('should create chats with unique IDs', () => {
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

    it('should update activeChat when active chat ID changes', () => {
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

      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should return undefined for activeChat if ID does not exist', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChat).toBeUndefined();
    });
  });

  describe('deleteChat', () => {
    it('should remove a chat from history', () => {
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

    it('should switch to first remaining chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

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
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

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

    it('should create a new empty chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.chatHistory[0].messages).toEqual([]);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should handle deleting multiple chats in sequence', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(4);

      act(() => {
        result.current.deleteChat(result.current.chatHistory[0].id);
        result.current.deleteChat(result.current.chatHistory[0].id);
      });

      expect(result.current.chatHistory).toHaveLength(2);
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add a message to the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, world!',
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
        content: 'What is the weather today?',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('What is the weather today?');
    });

    it('should truncate long first messages to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This is a very long message that should be truncated to exactly sixty characters for the title',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe(
        'This is a very long message that should be truncated to ex'
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
        result.current.addMessageToActiveChat(secondMessage);
      });

      expect(result.current.activeChat?.title).toBe('First message');
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

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: {
          summary: 'Analysis result',
          reasoning: [],
          quantitative: {
            expectedValue: 5.2,
            vigRemovedOdds: 1.95,
            kellyCriterionStake: 3.5,
            confidenceScore: 7.8,
            projectedMean: 25.5,
            projectedStdDev: 3.2,
          },
        },
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });

    it('should not add message if no active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Set active chat to null by using a non-existent ID
      act(() => {
        result.current.setActiveChatId('non-existent');
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This should not be added',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      // Check that no chat has this message
      const hasMessage = result.current.chatHistory.some((chat) =>
        chat.messages.some((msg) => msg.id === 'msg-1')
      );
      expect(hasMessage).toBe(false);
    });

    it('should maintain message order', () => {
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
      expect(result.current.activeChat?.messages[0].id).toBe('msg-1');
      expect(result.current.activeChat?.messages[1].id).toBe('msg-2');
      expect(result.current.activeChat?.messages[2].id).toBe('msg-3');
    });

    it('should handle empty string content gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });
  });

  describe('isLoading state', () => {
    it('should update loading state', () => {
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

    it('should handle functional updates', () => {
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

  describe('Complex scenarios', () => {
    it('should handle creating, switching, and deleting multiple chats', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Create multiple chats
      act(() => {
        result.current.createNewChat();
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(3);

      // Add messages to different chats
      const firstChatId = result.current.chatHistory[0].id;
      const secondChatId = result.current.chatHistory[1].id;

      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Message in first chat',
        });

        result.current.setActiveChatId(secondChatId);

        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'user',
          content: 'Message in second chat',
        });
      });

      expect(result.current.chatHistory[0].messages).toHaveLength(1);
      expect(result.current.chatHistory[1].messages).toHaveLength(1);

      // Delete the second chat
      act(() => {
        result.current.deleteChat(secondChatId);
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).toBe(firstChatId);
    });

    it('should handle rapid chat creation and deletion', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        // Create many chats
        for (let i = 0; i < 10; i++) {
          result.current.createNewChat();
        }
      });

      expect(result.current.chatHistory).toHaveLength(11);

      act(() => {
        // Delete all but one
        for (let i = 0; i < 10; i++) {
          result.current.deleteChat(result.current.chatHistory[0].id);
        }
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.activeChatId).toBeTruthy();
    });

    it('should preserve message history when switching between chats', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[1].id;
      const secondChatId = result.current.chatHistory[0].id;

      // Add messages to first chat
      act(() => {
        result.current.setActiveChatId(firstChatId);
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'First chat message',
        });
      });

      // Switch to second chat and add messages
      act(() => {
        result.current.setActiveChatId(secondChatId);
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'user',
          content: 'Second chat message',
        });
      });

      // Switch back to first chat
      act(() => {
        result.current.setActiveChatId(firstChatId);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toBe('First chat message');
    });

    it('should handle edge case of empty title update', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: '   ',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      // Empty or whitespace-only content should not update title
      expect(result.current.activeChat?.title).toBe('New Conversation');
    });
  });

  describe('Memory management and performance', () => {
    it('should handle large number of messages in a chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        for (let i = 0; i < 100; i++) {
          result.current.addMessageToActiveChat({
            id: `msg-${i}`,
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `Message ${i}`,
          });
        }
      });

      expect(result.current.activeChat?.messages).toHaveLength(100);
    });

    it('should maintain referential stability for callbacks', () => {
      const { result, rerender } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

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
      // Note: addMessageToActiveChat depends on activeChatId, so it may change
    });
  });

  describe('Chat ID generation', () => {
    it('should generate unique chat IDs using crypto.randomUUID when available', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      const ids = new Set<string>();

      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.createNewChat();
          ids.add(result.current.chatHistory[0].id);
        }
      });

      expect(ids.size).toBe(20);
    });

    it('should generate IDs with expected format', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.chatHistory[0].id;
      expect(newChatId).toMatch(/^chat-/);
    });
  });

  describe('Integration scenarios', () => {
    it('should simulate a complete chat workflow', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: createWrapper(),
      });

      // Start with initial chat
      expect(result.current.chatHistory).toHaveLength(1);

      // User sends first message
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Analyze player props for tonight',
        });
      });

      // Title should update
      expect(result.current.activeChat?.title).toBe('Analyze player props for tonight');

      // Assistant responds
      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'assistant',
          content: 'I can help analyze player props.',
        });
      });

      // Title should remain the same
      expect(result.current.activeChat?.title).toBe('Analyze player props for tonight');
      expect(result.current.activeChat?.messages).toHaveLength(2);

      // User starts a new chat
      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChat?.messages).toHaveLength(0);

      // Switch back to original chat
      const originalChatId = result.current.chatHistory[1].id;
      act(() => {
        result.current.setActiveChatId(originalChatId);
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);
    });
  });
});