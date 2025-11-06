import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ChatHistoryProvider, useChatHistory } from '../ChatHistoryContext';
import { Message, AnalysisResponse } from '../../types';

// Mock crypto.randomUUID for consistent testing
const mockUUID = vi.fn();
beforeEach(() => {
  mockUUID.mockReturnValue('test-uuid-123');
  if (!globalThis.crypto) {
    globalThis.crypto = {} as Crypto;
  }
  globalThis.crypto.randomUUID = mockUUID;
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ChatHistoryProvider>{children}</ChatHistoryProvider>
);

describe('ChatHistoryContext', () => {
  describe('Provider initialization', () => {
    it('should initialize with a single empty chat session', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.chatHistory[0]).toMatchObject({
        title: 'New Conversation',
        messages: [],
      });
      expect(result.current.chatHistory[0].id).toMatch(/^chat-/);
      expect(result.current.activeChatId).toBe(result.current.chatHistory[0].id);
      expect(result.current.activeChat).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should use crypto.randomUUID when available', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(mockUUID).toHaveBeenCalled();
      expect(result.current.chatHistory[0].id).toBe('chat-test-uuid-123');
    });

    it('should fallback to Date.now() when crypto.randomUUID is unavailable', () => {
      const originalCrypto = globalThis.crypto;
      (globalThis as any).crypto = undefined;

      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.chatHistory[0].id).toMatch(/^chat-[a-z0-9]+$/);

      globalThis.crypto = originalCrypto;
    });
  });

  describe('useChatHistory hook', () => {
    it('should throw error when used outside of provider', () => {
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
      expect(result.current.chatHistory[0].id).toBe(result.current.activeChatId);
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
    });

    it('should add new chat at the beginning of the history', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const newChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      expect(result.current.chatHistory).toHaveLength(3);
      expect(result.current.chatHistory[0].id).toBe(result.current.activeChatId);
      expect(result.current.chatHistory[1].id).toBe(newChatId);
    });
  });

  describe('setActiveChatId', () => {
    it('should change the active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      act(() => {
        result.current.setActiveChatId(secondChatId!);
      });

      expect(result.current.activeChatId).toBe(secondChatId);
      expect(result.current.activeChat?.id).toBe(secondChatId);
    });

    it('should handle non-existent chat IDs gracefully', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setActiveChatId('non-existent-id');
      });

      expect(result.current.activeChatId).toBe('non-existent-id');
      expect(result.current.activeChat).toBeUndefined();
    });
  });

  describe('deleteChat', () => {
    it('should delete a chat that is not active', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      const thirdChatId = result.current.activeChatId;

      act(() => {
        result.current.deleteChat(secondChatId!);
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).toBe(thirdChatId);
      expect(result.current.chatHistory.find(chat => chat.id === secondChatId)).toBeUndefined();
    });

    it('should switch to the first remaining chat when deleting active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.createNewChat();
      });

      const secondChatId = result.current.activeChatId;

      act(() => {
        result.current.createNewChat();
      });

      const thirdChatId = result.current.activeChatId;

      act(() => {
        result.current.deleteChat(thirdChatId!);
      });

      expect(result.current.chatHistory).toHaveLength(2);
      expect(result.current.activeChatId).toBe(secondChatId);
    });

    it('should create a new empty chat when deleting the last chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });
      const onlyChatId = result.current.activeChatId;

      act(() => {
        result.current.deleteChat(onlyChatId!);
      });

      expect(result.current.chatHistory).toHaveLength(1);
      expect(result.current.activeChatId).not.toBe(onlyChatId);
      expect(result.current.chatHistory[0].messages).toHaveLength(0);
      expect(result.current.chatHistory[0].title).toBe('New Conversation');
    });
  });

  describe('addMessageToActiveChat', () => {
    it('should add a user message to active chat', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'Test user message',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0]).toEqual(userMessage);
    });

    it('should update chat title from first user message', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: 'What is the best bet for tonight?',
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.title).toBe('What is the best bet for tonight?');
    });

    it('should truncate long titles to 60 characters', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const longContent = 'A'.repeat(100);
      const userMessage: Message = {
        id: 'msg-1',
        role: 'user',
        content: longContent,
      };

      act(() => {
        result.current.addMessageToActiveChat(userMessage);
      });

      expect(result.current.activeChat?.title).toHaveLength(60);
      expect(result.current.activeChat?.title).toBe('A'.repeat(60));
    });

    it('should handle AnalysisResponse content type', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      const analysisResponse: AnalysisResponse = {
        summary: 'Test analysis summary',
        reasoning: [
          {
            step: 1,
            description: 'Step 1 description',
            activatedModules: ['KM_01'],
          },
        ],
        quantitative: {
          expectedValue: 5.5,
          vigRemovedOdds: -105,
          kellyCriterionStake: 1.25,
          confidenceScore: 0.85,
          projectedMean: 288.5,
          projectedStdDev: 15.2,
        },
      };

      const assistantMessage: Message = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisResponse,
      };

      act(() => {
        result.current.addMessageToActiveChat(assistantMessage);
      });

      expect(result.current.activeChat?.messages).toHaveLength(1);
      expect(result.current.activeChat?.messages[0].content).toEqual(analysisResponse);
    });
  });

  describe('isLoading state', () => {
    it('should initialize with isLoading as false', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it('should allow setting isLoading to true', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });

    it('should support functional updates', () => {
      const { result } = renderHook(() => useChatHistory(), { wrapper });

      act(() => {
        result.current.setIsLoading(prev => !prev);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });
});