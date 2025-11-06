import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import type { Message } from '../../types';

describe('ChatHistoryContext', () => {
  describe('ChatHistoryProvider', () => {
    it('should initialize with a default empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toBeDefined();
    });

    it('should throw error when useChatHistory is used outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useChatHistory());
      }).toThrow('useChatHistory must be used within a ChatHistoryProvider');

      console.error = originalError;
    });

    it('should have isLoading initially set to false', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat and set it as active', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const initialChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).not.toBe(initialChatId);
      expect(result.current.chatHistory[0].id).toBe(result.current.activeChatId);
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
    });

    it('should prepend new chat to history array', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const firstChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[0].id;
      expect(result.current.chatHistory[1].id).toBe(firstChatId);

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(3);
      expect(result.current.chatHistory[1].id).toBe(secondChatId);
      expect(result.current.chatHistory[2].id).toBe(firstChatId);
    });

    it('should generate unique IDs for each new chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const chatIds = new Set<string>();
      chatIds.add(result.current.chatHistory[0].id);

      act(() => {
        result.current.createNewChat();
      });
      chatIds.add(result.current.chatHistory[0].id);

      act(() => {
        result.current.createNewChat();
      });
      chatIds.add(result.current.chatHistory[0].id);

      expect(chatIds.size).toBe(3);
    });
  });

  describe('setActiveChatId', () => {
    it('should set the active chat ID', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

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
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.setActiveChatId(secondChatId);
      });

      expect(result.current.activeChat?.id).toBe(secondChatId);
    });
  });

  describe('deleteChat', () => {
    it('should remove chat from history', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      act(() => {
        result.current.createNewChat();
      });

      const chatToDelete = result.current.chatHistory[1].id;
      expect(result.current.chatHistory).toHaveLength(2);

      act(() => {
        result.current.deleteChat(chatToDelete);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory.find(c => c.id === chatToDelete)).toBeUndefined();
    });

    it('should set active chat to first remaining chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[1].id;
      const secondChatId = result.current.chatHistory[0].id;

      expect(result.current.activeChatId).toBe(secondChatId);

      act(() => {
        result.current.deleteChat(secondChatId);
      });

      expect(result.current.activeChatId).toBe(firstChatId);
      expect(result.current.activeChat?.id).toBe(firstChatId);
    });

    it('should not change active chat when deleting non-active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      act(() => {
        result.current.createNewChat();
      });

      const firstChatId = result.current.chatHistory[1].id;
      const secondChatId = result.current.chatHistory[0].id;

      expect(result.current.activeChatId).toBe(secondChatId);

      act(() => {
        result.current.deleteChat(firstChatId);
      });

      expect(result.current.activeChatId).toBe(secondChatId);
    });

    it('should create a new empty chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const onlyChatId = result.current.chatHistory[0].id;

      act(() => {
        result.current.deleteChat(onlyChatId);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0].id).not.toBe(onlyChatId);
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
    });

    it('should handle deleting non-existent chat gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
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
    it('should add a message to the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
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

    it('should update chat title with first user message content', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const message: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'What are the best betting strategies?',
      };

      act(() => {
        result.current.addMessageToActiveChat(message);
      });

      expect(result.current.activeChat?.title).toBe('What are the best betting strategies?');
    });

    it('should truncate title to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const longMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'This is a very long message that exceeds sixty characters and should be truncated appropriately',
      };

      act(() => {
        result.current.addMessageToActiveChat(longMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('This is a very long message that exceeds sixty characters');
    });

    it('should not update title if chat already has messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const firstMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'First message',
      };

      const secondMessage: Message = {
        id: 'msg-2',
        role: 'user',
        content: 'Second message',
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

    it('should not update title for non-user messages', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const systemMessage: Message = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification',
      };

      act(() => {
        result.current.addMessageToActiveChat(systemMessage);
      });

      expect(result.current.activeChat?.title).toBe('New Conversation');
      expect(result.current.activeChat?.messages).toHaveLength(1);
    });

    it('should handle empty message content', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
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

    it('should append messages in order', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const messages: Message[] = [
        { id: 'msg-1', role: 'user', content: 'Message 1' },
        { id: 'msg-2', role: 'assistant', content: 'Response 1' },
        { id: 'msg-3', role: 'user', content: 'Message 2' },
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

  describe('isLoading and setIsLoading', () => {
    it('should update isLoading state', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
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
  });

  describe('integration scenarios', () => {
    it('should handle a complete chat workflow', () => {
      const { result } = renderHook(() => useChatHistory(), {
        wrapper: ChatHistoryProvider,
      });

      const initialChatId = result.current.activeChatId;

      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-1',
          role: 'user',
          content: 'Analyze this bet',
        });
      });

      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-2',
          role: 'assistant',
          content: 'Here is the analysis',
        });
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.activeChatId;
      expect(newChatId).not.toBe(initialChatId);

      act(() => {
        result.current.addMessageToActiveChat({
          id: 'msg-3',
          role: 'user',
          content: 'Different analysis',
        });
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChat?.messages).toHaveLength(1);

      act(() => {
        result.current.setActiveChatId(initialChatId!);
      });

      expect(result.current.activeChat?.messages).toHaveLength(2);

      act(() => {
        result.current.deleteChat(newChatId!);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.activeChatId).toBe(initialChatId);
    });
  });
});