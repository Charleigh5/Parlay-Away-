import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Message from '../Message';
import type { Message as MessageType, AnalysisResponse } from '../../types';

// Mock the icon components
vi.mock('../icons/UserIcon', () => ({
  UserIcon: ({ className }: { className?: string }) => <span data-testid="user-icon" className={className}>UserIcon</span>,
}));

vi.mock('../assets/icons/BrainCircuitIcon', () => ({
  BrainCircuitIcon: ({ className }: { className?: string }) => <span data-testid="brain-icon" className={className}>BrainIcon</span>,
}));

vi.mock('../icons/AlertTriangleIcon', () => ({
  AlertTriangleIcon: ({ className }: { className?: string }) => <span data-testid="alert-icon" className={className}>AlertIcon</span>,
}));

vi.mock('../icons/BarChartIcon', () => ({
  BarChartIcon: ({ className }: { className?: string }) => <span data-testid="chart-icon" className={className}>ChartIcon</span>,
}));

vi.mock('../icons/ListChecksIcon', () => ({
  ListChecksIcon: ({ className }: { className?: string }) => <span data-testid="list-icon" className={className}>ListIcon</span>,
}));

describe('Message Component', () => {
  describe('User Messages', () => {
    it('should render user message with content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Analyze Patrick Mahomes passing yards over 285.5',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Analyze Patrick Mahomes passing yards over 285.5')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should render user message with correct styling classes', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      const { container } = render(<Message message={message} />);
      const messageDiv = container.querySelector('.bg-cyan-500\\/10');
      
      expect(messageDiv).toBeInTheDocument();
    });

    it('should handle empty user message', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      const { container } = render(<Message message={message} />);
      expect(container.querySelector('.prose')).toBeInTheDocument();
    });

    it('should handle long user message', () => {
      const longContent = 'A'.repeat(1000);
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: longContent,
      };

      render(<Message message={message} />);
      expect(screen.getByText(longContent)).toBeInTheDocument();
    });

    it('should render user message aligned to the right', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const { container } = render(<Message message={message} />);
      const wrapper = container.querySelector('.flex.justify-end');
      
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('System Messages', () => {
    it('should render system message with content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification: Analysis complete',
      };

      render(<Message message={message} />);

      expect(screen.getByText('System notification: Analysis complete')).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('should render system message centered', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System message',
      };

      const { container } = render(<Message message={message} />);
      const wrapper = container.querySelector('.flex.justify-center');
      
      expect(wrapper).toBeInTheDocument();
    });

    it('should render system message with correct styling', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System message',
      };

      const { container } = render(<Message message={message} />);
      const messageDiv = container.querySelector('.bg-gray-700\\/50');
      
      expect(messageDiv).toBeInTheDocument();
    });

    it('should handle special characters in system message', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'Error: <script>alert("test")</script>',
      };

      render(<Message message={message} />);
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });
  });

  describe('Assistant Messages with Analysis Response', () => {
    const createAnalysisResponse = (overrides?: Partial<AnalysisResponse>): AnalysisResponse => ({
      summary: 'Strong bet with positive expected value based on recent performance',
      reasoning: [
        {
          step: 1,
          description: 'Analyzed historical performance data',
          activatedModules: ['KM_01', 'KM_02'],
        },
        {
          step: 2,
          description: 'Evaluated matchup conditions',
          activatedModules: ['KM_03'],
        },
      ],
      quantitative: {
        expectedValue: 5.5,
        vigRemovedOdds: -105,
        kellyCriterionStake: 1.25,
        confidenceScore: 0.85,
        projectedMean: 288.5,
        projectedStdDev: 42.3,
      },
      ...overrides,
    });

    it('should render assistant message with summary', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(analysis.summary)).toBeInTheDocument();
      expect(screen.getByTestId('brain-icon')).toBeInTheDocument();
    });

    it('should render quantitative analysis section', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
      expect(screen.getByTestId('chart-icon')).toBeInTheDocument();
    });

    it('should display expected value correctly', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: 7.25,
          vigRemovedOdds: -110,
          kellyCriterionStake: 1.5,
          confidenceScore: 0.9,
          projectedMean: 300,
          projectedStdDev: 45,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('7.25%')).toBeInTheDocument();
    });

    it('should handle zero expected value', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: 0,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0,
          confidenceScore: 0.5,
          projectedMean: 285,
          projectedStdDev: 40,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('0.00%')).toBeInTheDocument();
    });

    it('should handle negative expected value', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: -3.5,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0,
          confidenceScore: 0.4,
          projectedMean: 280,
          projectedStdDev: 38,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('-3.50%')).toBeInTheDocument();
    });

    it('should render with empty reasoning array', () => {
      const analysis = createAnalysisResponse({ reasoning: [] });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(analysis.summary)).toBeInTheDocument();
    });

    it('should render assistant message aligned to the left', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);
      const wrapper = container.querySelector('.flex.justify-start');
      
      expect(wrapper).toBeInTheDocument();
    });

    it('should handle very large quantitative values', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: 999.99,
          vigRemovedOdds: -999,
          kellyCriterionStake: 99.99,
          confidenceScore: 1.0,
          projectedMean: 9999.99,
          projectedStdDev: 999.99,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('999.99%')).toBeInTheDocument();
    });

    it('should handle very small quantitative values', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: 0.01,
          vigRemovedOdds: -110,
          kellyCriterionStake: 0.01,
          confidenceScore: 0.01,
          projectedMean: 0.01,
          projectedStdDev: 0.01,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('0.01%')).toBeInTheDocument();
    });

    it('should render with long summary text', () => {
      const longSummary = 'This is a very long summary that contains a lot of detailed information about the analysis. '.repeat(10);
      const analysis = createAnalysisResponse({ summary: longSummary });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(longSummary)).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle message with special characters in user content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test & <div>HTML</div> "quotes" \'apostrophes\'',
      };

      render(<Message message={message} />);

      expect(screen.getByText(/Test &/)).toBeInTheDocument();
    });

    it('should handle message with newlines in user content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(<Message message={message} />);

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
    });

    it('should render without crashing when quantitative values are at boundaries', () => {
      const analysis = createAnalysisResponse({ 
        quantitative: { 
          expectedValue: Number.MAX_SAFE_INTEGER,
          vigRemovedOdds: Number.MIN_SAFE_INTEGER,
          kellyCriterionStake: 0,
          confidenceScore: 0,
          projectedMean: 0,
          projectedStdDev: 0,
        } 
      });
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      expect(() => render(<Message message={message} />)).not.toThrow();
    });

    it('should handle Unicode characters in content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test 你好 مرحبا Здравствуй 🎉',
      };

      render(<Message message={message} />);

      expect(screen.getByText(/Test 你好/)).toBeInTheDocument();
    });
  });

  describe('Component Structure and Styling', () => {
    it('should apply correct container classes for user message', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const { container } = render(<Message message={message} />);
      const contentDiv = container.querySelector('.prose.prose-invert');
      
      expect(contentDiv).toBeInTheDocument();
    });

    it('should apply correct container classes for assistant message', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);
      const contentDiv = container.querySelector('.bg-gray-800');
      
      expect(contentDiv).toBeInTheDocument();
    });

    it('should render with responsive max-width classes', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const { container } = render(<Message message={message} />);
      const messageContainer = container.querySelector('.max-w-full');
      
      expect(messageContainer).toBeInTheDocument();
    });

    it('should maintain proper component hierarchy', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      const { container } = render(<Message message={message} />);
      
      // Check for proper nesting
      expect(container.querySelector('.flex.justify-start')).toBeInTheDocument();
      expect(container.querySelector('.flex-1')).toBeInTheDocument();
    });
  });

  describe('Content Type Handling', () => {
    it('should correctly identify and render string content as user message', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Simple string content',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Simple string content')).toBeInTheDocument();
    });

    it('should correctly identify and render object content as analysis', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(analysis.summary)).toBeInTheDocument();
      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
    });

    it('should handle system message with string content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification',
      };

      render(<Message message={message} />);

      expect(screen.getByText('System notification')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render semantic HTML structure', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test message',
      };

      const { container } = render(<Message message={message} />);
      
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should include proper icon components', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      render(<Message message={message} />);

      const icon = screen.getByTestId('user-icon');
      expect(icon).toHaveClass('h-5', 'w-5');
    });

    it('should render icons with consistent sizing', () => {
      const analysis = createAnalysisResponse();
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysis,
      };

      render(<Message message={message} />);

      const brainIcon = screen.getByTestId('brain-icon');
      const chartIcon = screen.getByTestId('chart-icon');
      
      expect(brainIcon).toHaveClass('h-5', 'w-5');
      expect(chartIcon).toHaveClass('h-5', 'w-5');
    });
  });
});