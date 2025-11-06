import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Message from '../Message';
import type { Message as MessageType, AnalysisResponse } from '../../types';

describe('Message Component', () => {
  describe('User Messages', () => {
    it('should render user message with correct styling', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello, this is a test message',
      };

      render(<Message message={userMessage} />);

      expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    });

    it('should display user icon for user messages', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const { container } = render(<Message message={userMessage} />);
      
      // UserIcon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle empty user message', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      const { container } = render(<Message message={userMessage} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle long user messages', () => {
      const longContent = 'A'.repeat(1000);
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: longContent,
      };

      render(<Message message={userMessage} />);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should preserve whitespace in user messages', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(<Message message={userMessage} />);
      expect(screen.getByText('Line 1\nLine 2\nLine 3')).toBeInTheDocument();
    });
  });

  describe('System Messages', () => {
    it('should render system message with correct styling', () => {
      const systemMessage: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification message',
      };

      render(<Message message={systemMessage} />);

      expect(screen.getByText('System notification message')).toBeInTheDocument();
    });

    it('should display alert icon for system messages', () => {
      const systemMessage: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'Error occurred',
      };

      const { container } = render(<Message message={systemMessage} />);
      
      // AlertTriangleIcon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should handle empty system message', () => {
      const systemMessage: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: '',
      };

      const { container } = render(<Message message={systemMessage} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe('Assistant Messages with Analysis', () => {
    const createMockAnalysis = (overrides?: Partial<AnalysisResponse>): AnalysisResponse => ({
      summary: 'This is a strong +EV opportunity based on historical performance.',
      reasoning: [
        {
          step: 1,
          description: 'Analyzed historical data for player performance',
          activatedModules: ['KM_01', 'KM_02'],
        },
        {
          step: 2,
          description: 'Calculated expected value based on market odds',
          activatedModules: ['KM_03'],
        },
      ],
      quantitative: {
        expectedValue: 5.5,
        vigRemovedOdds: 2.1,
        kellyCriterionStake: 1.25,
        confidenceScore: 8.5,
        projectedMean: 288.5,
        projectedStdDev: 45.2,
      },
      ...overrides,
    });

    it('should render assistant message with analysis summary', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis(),
      };

      render(<Message message={assistantMessage} />);

      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should display brain circuit icon for assistant messages', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis(),
      };

      const { container } = render(<Message message={assistantMessage} />);
      
      // Multiple icons should be present (BrainCircuitIcon, BarChartIcon, etc.)
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(1);
    });

    it('should render quantitative analysis section header', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis(),
      };

      render(<Message message={assistantMessage} />);

      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
    });

    it('should render Expected Value label', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis(),
      };

      render(<Message message={assistantMessage} />);

      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should handle analysis with empty summary', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({ summary: '' }),
      };

      const { container } = render(<Message message={assistantMessage} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle analysis with zero values', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({
          quantitative: {
            expectedValue: 0,
            vigRemovedOdds: 0,
            kellyCriterionStake: 0,
            confidenceScore: 0,
            projectedMean: 0,
            projectedStdDev: 0,
          },
        }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should handle analysis with negative values', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({
          quantitative: {
            expectedValue: -5.5,
            vigRemovedOdds: 1.8,
            kellyCriterionStake: 0,
            confidenceScore: 3.2,
            projectedMean: 250.0,
            projectedStdDev: 50.0,
          },
        }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should handle analysis with very large numbers', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({
          quantitative: {
            expectedValue: 9999.99,
            vigRemovedOdds: 10.5,
            kellyCriterionStake: 25.0,
            confidenceScore: 10.0,
            projectedMean: 500.0,
            projectedStdDev: 100.0,
          },
        }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should handle analysis with empty reasoning array', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({ reasoning: [] }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should handle analysis with single reasoning step', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({
          reasoning: [
            {
              step: 1,
              description: 'Single analysis step',
              activatedModules: ['KM_01'],
            },
          ],
        }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });

    it('should handle analysis with many reasoning steps', () => {
      const manySteps = Array.from({ length: 10 }, (_, i) => ({
        step: i + 1,
        description: `Analysis step ${i + 1}`,
        activatedModules: [`KM_${String(i + 1).padStart(2, '0')}`],
      }));

      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: createMockAnalysis({ reasoning: manySteps }),
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('This is a strong +EV opportunity based on historical performance.')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with special characters in content', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Special chars: <>&"\' \n\t',
      };

      render(<Message message={userMessage} />);
      expect(screen.getByText('Special chars: <>&"\' \n\t')).toBeInTheDocument();
    });

    it('should handle message with HTML-like content', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: '<script>alert("test")</script>',
      };

      render(<Message message={userMessage} />);
      expect(screen.getByText('<script>alert("test")</script>')).toBeInTheDocument();
    });

    it('should handle message with unicode characters', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: '你好 🎉 Emoji test 🚀',
      };

      render(<Message message={userMessage} />);
      expect(screen.getByText('你好 🎉 Emoji test 🚀')).toBeInTheDocument();
    });

    it('should handle analysis with decimal precision', () => {
      const assistantMessage: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: {
          summary: 'Test',
          reasoning: [],
          quantitative: {
            expectedValue: 5.555555,
            vigRemovedOdds: 2.123456,
            kellyCriterionStake: 1.987654,
            confidenceScore: 8.333333,
            projectedMean: 288.888888,
            projectedStdDev: 45.111111,
          },
        },
      };

      render(<Message message={assistantMessage} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render user messages in a semantic structure', () => {
      const userMessage: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Accessible message',
      };

      const { container } = render(<Message message={userMessage} />);
      expect(container.querySelector('.prose')).toBeInTheDocument();
    });

    it('should render system messages with proper structure', () => {
      const systemMessage: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System alert',
      };

      const { container } = render(<Message message={systemMessage} />);
      expect(container.querySelector('span')).toBeInTheDocument();
    });

    it('should provide visual distinction between message types', () => {
      const userMsg: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'User',
      };

      const systemMsg: MessageType = {
        id: 'msg-2',
        role: 'system',
        content: 'System',
      };

      const { container: userContainer } = render(<Message message={userMsg} />);
      const { container: systemContainer } = render(<Message message={systemMsg} />);

      expect(userContainer.innerHTML).not.toBe(systemContainer.innerHTML);
    });
  });
});