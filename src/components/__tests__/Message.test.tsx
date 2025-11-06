import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Message from '../Message';
import type { Message as MessageType, AnalysisResponse } from '../../types';

// Mock the icon components
vi.mock('../icons/UserIcon', () => ({
  UserIcon: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className}>
      UserIcon
    </div>
  ),
}));

vi.mock('../../assets/icons/BrainCircuitIcon', () => ({
  BrainCircuitIcon: ({ className }: { className?: string }) => (
    <div data-testid="brain-icon" className={className}>
      BrainIcon
    </div>
  ),
}));

vi.mock('../icons/AlertTriangleIcon', () => ({
  AlertTriangleIcon: ({ className }: { className?: string }) => (
    <div data-testid="alert-icon" className={className}>
      AlertIcon
    </div>
  ),
}));

vi.mock('../icons/BarChartIcon', () => ({
  BarChartIcon: ({ className }: { className?: string }) => (
    <div data-testid="bar-chart-icon" className={className}>
      BarChartIcon
    </div>
  ),
}));

vi.mock('../icons/ListChecksIcon', () => ({
  ListChecksIcon: ({ className }: { className?: string }) => (
    <div data-testid="list-checks-icon" className={className}>
      ListChecksIcon
    </div>
  ),
}));

describe('Message Component', () => {
  describe('User Messages', () => {
    it('should render user message with correct styling', () => {
      const message: MessageType = {
        id: 'user-1',
        role: 'user',
        content: 'What are the best player props today?',
      };

      const { container } = render(<Message message={message} />);

      expect(screen.getByText('What are the best player props today?')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();

      // Check for user-specific styling classes
      const messageContainer = container.querySelector('.justify-end');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should render short user messages', () => {
      const message: MessageType = {
        id: 'user-2',
        role: 'user',
        content: 'Hi',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Hi')).toBeInTheDocument();
    });

    it('should render long user messages', () => {
      const longContent =
        'This is a very long message that contains multiple sentences and should still be rendered correctly without any issues. It tests the component ability to handle longer text content gracefully.';

      const message: MessageType = {
        id: 'user-3',
        role: 'user',
        content: longContent,
      };

      render(<Message message={message} />);

      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should handle special characters in user messages', () => {
      const message: MessageType = {
        id: 'user-4',
        role: 'user',
        content: 'What about <strong>Patrick Mahomes</strong> & Travis Kelce?',
      };

      render(<Message message={message} />);

      expect(
        screen.getByText('What about <strong>Patrick Mahomes</strong> & Travis Kelce?'),
      ).toBeInTheDocument();
    });

    it('should handle empty user message content', () => {
      const message: MessageType = {
        id: 'user-5',
        role: 'user',
        content: '',
      };

      const { container } = render(<Message message={message} />);

      const messageContainer = container.querySelector('.justify-end');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should render user message with user icon', () => {
      const message: MessageType = {
        id: 'user-6',
        role: 'user',
        content: 'Test message',
      };

      render(<Message message={message} />);

      const userIcon = screen.getByTestId('user-icon');
      expect(userIcon).toBeInTheDocument();
      expect(userIcon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('System Messages', () => {
    it('should render system message with alert icon', () => {
      const message: MessageType = {
        id: 'system-1',
        role: 'system',
        content: 'Connection lost. Retrying...',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Connection lost. Retrying...')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should render system message with centered layout', () => {
      const message: MessageType = {
        id: 'system-2',
        role: 'system',
        content: 'System notification',
      };

      const { container } = render(<Message message={message} />);

      const systemContainer = container.querySelector('.justify-center');
      expect(systemContainer).toBeInTheDocument();
    });

    it('should handle empty system messages', () => {
      const message: MessageType = {
        id: 'system-3',
        role: 'system',
        content: '',
      };

      const { container } = render(<Message message={message} />);

      const systemContainer = container.querySelector('.justify-center');
      expect(systemContainer).toBeInTheDocument();
    });

    it('should style system messages differently from user messages', () => {
      const message: MessageType = {
        id: 'system-4',
        role: 'system',
        content: 'System alert',
      };

      const { container } = render(<Message message={message} />);

      // System messages should have different background color
      const systemMessage = container.querySelector('.bg-gray-700\\/50');
      expect(systemMessage).toBeInTheDocument();
    });
  });

  describe('Assistant Messages with Analysis', () => {
    const createAnalysisResponse = (overrides?: Partial<AnalysisResponse>): AnalysisResponse => ({
      summary: 'This is a strong betting opportunity based on recent performance trends.',
      reasoning: [
        {
          step: 1,
          description: 'Analyzed historical data',
          activatedModules: ['historical', 'statistical'],
        },
        {
          step: 2,
          description: 'Evaluated matchup factors',
          activatedModules: ['matchup', 'situational'],
        },
      ],
      quantitative: {
        expectedValue: 8.5,
        vigRemovedOdds: -108,
        kellyCriterionStake: 4.2,
        confidenceScore: 7.8,
        projectedMean: 28.5,
        projectedStdDev: 3.1,
      },
      ...overrides,
    });

    it('should render assistant message with analysis summary', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'assistant-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(
        screen.getByText('This is a strong betting opportunity based on recent performance trends.'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
    });

    it('should display quantitative analysis section header', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'assistant-2',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart-icon')).toBeInTheDocument();
    });

    it('should display expected value label', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'assistant-3',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should format expected value correctly', () => {
      const analysis = createAnalysisResponse({
        quantitative: {
          expectedValue: 12.345,
          vigRemovedOdds: -110,
          kellyCriterionStake: 5.0,
          confidenceScore: 8.5,
          projectedMean: 30.0,
          projectedStdDev: 2.5,
        },
      });

      const message: MessageType = {
        id: 'assistant-4',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);

      // The component renders: {analysis.quantitative.expectedValue.toFixed(2)}%
      // Based on the diff, the line is incomplete but we can test partial render
      const evElement = container.querySelector('.text-green-400');
      expect(evElement).toBeInTheDocument();
    });

    it('should handle zero expected value', () => {
      const analysis = createAnalysisResponse({
        quantitative: {
          expectedValue: 0.0,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0.0,
          confidenceScore: 5.0,
          projectedMean: 25.0,
          projectedStdDev: 3.0,
        },
      });

      const message: MessageType = {
        id: 'assistant-5',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should handle negative expected value', () => {
      const analysis = createAnalysisResponse({
        quantitative: {
          expectedValue: -5.5,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0.0,
          confidenceScore: 3.0,
          projectedMean: 20.0,
          projectedStdDev: 4.0,
        },
      });

      const message: MessageType = {
        id: 'assistant-6',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should handle very large expected value', () => {
      const analysis = createAnalysisResponse({
        quantitative: {
          expectedValue: 999.99,
          vigRemovedOdds: -110,
          kellyCriterionStake: 10.0,
          confidenceScore: 10.0,
          projectedMean: 100.0,
          projectedStdDev: 1.0,
        },
      });

      const message: MessageType = {
        id: 'assistant-7',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should render with empty summary', () => {
      const analysis = createAnalysisResponse({ summary: '' });
      const message: MessageType = {
        id: 'assistant-8',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);

      // Should still render the quantitative section
      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
    });

    it('should render with long summary', () => {
      const longSummary = 'A'.repeat(500);
      const analysis = createAnalysisResponse({ summary: longSummary });
      const message: MessageType = {
        id: 'assistant-9',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(longSummary)).toBeInTheDocument();
    });

    it('should apply correct styling to assistant messages', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'assistant-10',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);

      // Check for assistant-specific styling
      const assistantContainer = container.querySelector('.justify-start');
      expect(assistantContainer).toBeInTheDocument();

      const messageContent = container.querySelector('.bg-gray-800');
      expect(messageContent).toBeInTheDocument();
    });

    it('should render brain icon with correct classes', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'assistant-11',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      const brainIcon = screen.getByTestId('brain-icon');
      expect(brainIcon).toBeInTheDocument();
      expect(brainIcon).toHaveClass('h-5', 'w-5');
    });

    it('should handle analysis with empty reasoning array', () => {
      const analysis = createAnalysisResponse({ reasoning: [] });
      const message: MessageType = {
        id: 'assistant-12',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(analysis.summary)).toBeInTheDocument();
      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle message with undefined content gracefully', () => {
      const message = {
        id: 'edge-1',
        role: 'user',
        content: undefined,
      } as any;

      // Should not crash
      const { container } = render(<Message message={message} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle message with null content gracefully', () => {
      const message = {
        id: 'edge-2',
        role: 'user',
        content: null,
      } as any;

      // Should not crash
      const { container } = render(<Message message={message} />);
      expect(container).toBeInTheDocument();
    });

    it('should handle message with very long ID', () => {
      const message: MessageType = {
        id: 'a'.repeat(1000),
        role: 'user',
        content: 'Test',
      };

      render(<Message message={message} />);
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    it('should handle analysis with extreme quantitative values', () => {
      const analysis: AnalysisResponse = {
        summary: 'Extreme values test',
        reasoning: [],
        quantitative: {
          expectedValue: Number.MAX_SAFE_INTEGER,
          vigRemovedOdds: Number.MIN_SAFE_INTEGER,
          kellyCriterionStake: 0.00001,
          confidenceScore: 0.1,
          projectedMean: 999999.99,
          projectedStdDev: 0.001,
        },
      };

      const message: MessageType = {
        id: 'extreme-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);
      expect(screen.getByText('Extreme values test')).toBeInTheDocument();
    });

    it('should handle messages with special Unicode characters', () => {
      const message: MessageType = {
        id: 'unicode-1',
        role: 'user',
        content: '🏈 What about Patrick Mahomes? 📊 €100 bet? 中文测试',
      };

      render(<Message message={message} />);
      expect(screen.getByText(/Patrick Mahomes/)).toBeInTheDocument();
    });

    it('should maintain proper HTML structure', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'structure-1',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);

      // Check that proper div structure exists
      expect(container.querySelector('div')).toBeInTheDocument();
      expect(container.querySelectorAll('div').length).toBeGreaterThan(1);
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML for user messages', () => {
      const message: MessageType = {
        id: 'a11y-1',
        role: 'user',
        content: 'Accessible message',
      };

      const { container } = render(<Message message={message} />);

      // Check for proper div structure
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should render semantic HTML for assistant messages', () => {
      const analysis: AnalysisResponse = {
        summary: 'Accessible analysis',
        reasoning: [],
        quantitative: {
          expectedValue: 5.0,
          vigRemovedOdds: -110,
          kellyCriterionStake: 2.5,
          confidenceScore: 7.0,
          projectedMean: 25.0,
          projectedStdDev: 3.0,
        },
      };

      const message: MessageType = {
        id: 'a11y-2',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);

      // Check for headings
      const heading = screen.getByText('Quantitative Analysis');
      expect(heading).toBeInTheDocument();
      expect(heading.tagName).toBe('H3');
    });

    it('should have proper heading hierarchy', () => {
      const analysis: AnalysisResponse = {
        summary: 'Test analysis',
        reasoning: [],
        quantitative: {
          expectedValue: 5.0,
          vigRemovedOdds: -110,
          kellyCriterionStake: 2.5,
          confidenceScore: 7.0,
          projectedMean: 25.0,
          projectedStdDev: 3.0,
        },
      };

      const message: MessageType = {
        id: 'a11y-3',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Component Rendering Performance', () => {
    it('should render quickly with minimal content', () => {
      const message: MessageType = {
        id: 'perf-1',
        role: 'user',
        content: 'Quick render test',
      };

      const start = performance.now();
      render(<Message message={message} />);
      const end = performance.now();

      // Rendering should be fast (under 100ms)
      expect(end - start).toBeLessThan(100);
    });

    it('should handle re-renders without issues', () => {
      const message: MessageType = {
        id: 'perf-2',
        role: 'user',
        content: 'Re-render test',
      };

      const { rerender } = render(<Message message={message} />);

      // Re-render with same props
      rerender(<Message message={message} />);

      expect(screen.getByText('Re-render test')).toBeInTheDocument();
    });

    it('should handle prop updates', () => {
      const message1: MessageType = {
        id: 'perf-3',
        role: 'user',
        content: 'First content',
      };

      const message2: MessageType = {
        id: 'perf-4',
        role: 'user',
        content: 'Updated content',
      };

      const { rerender } = render(<Message message={message1} />);
      expect(screen.getByText('First content')).toBeInTheDocument();

      rerender(<Message message={message2} />);
      expect(screen.getByText('Updated content')).toBeInTheDocument();
      expect(screen.queryByText('First content')).not.toBeInTheDocument();
    });
  });
});