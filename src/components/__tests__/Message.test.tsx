import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Message from '../Message';
import type { Message as MessageType, AnalysisResponse } from '../../types';

// Mock the icon components
vi.mock('../icons/UserIcon', () => ({
  UserIcon: ({ className }: { className?: string }) => (
    <div data-testid="user-icon" className={className}>UserIcon</div>
  ),
}));

vi.mock('../assets/icons/BrainCircuitIcon', () => ({
  BrainCircuitIcon: ({ className }: { className?: string }) => (
    <div data-testid="brain-circuit-icon" className={className}>BrainCircuitIcon</div>
  ),
}));

vi.mock('../icons/AlertTriangleIcon', () => ({
  AlertTriangleIcon: ({ className }: { className?: string }) => (
    <div data-testid="alert-triangle-icon" className={className}>AlertTriangleIcon</div>
  ),
}));

vi.mock('../icons/BarChartIcon', () => ({
  BarChartIcon: ({ className }: { className?: string }) => (
    <div data-testid="bar-chart-icon" className={className}>BarChartIcon</div>
  ),
}));

vi.mock('../icons/ListChecksIcon', () => ({
  ListChecksIcon: ({ className }: { className?: string }) => (
    <div data-testid="list-checks-icon" className={className}>ListChecksIcon</div>
  ),
}));

describe('Message Component', () => {
  describe('User Messages', () => {
    it('should render user message with correct styling', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test user message',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Test user message')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    it('should display user icon for user messages', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
      };

      render(<Message message={message} />);

      const icon = screen.getByTestId('user-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-5', 'w-5');
    });

    it('should handle long user messages', () => {
      const longMessage = 'a'.repeat(500);
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: longMessage,
      };

      render(<Message message={message} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty user messages', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: '',
      };

      render(<Message message={message} />);

      const container = screen.getByTestId('user-icon').parentElement?.parentElement;
      expect(container).toBeInTheDocument();
    });

    it('should render with proper layout classes for user messages', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Test',
      };

      const { container } = render(<Message message={message} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'justify-end');
    });
  });

  describe('System Messages', () => {
    it('should render system message with alert icon', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System notification',
      };

      render(<Message message={message} />);

      expect(screen.getByText('System notification')).toBeInTheDocument();
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('should center system messages', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'Error occurred',
      };

      const { container } = render(<Message message={message} />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('flex', 'justify-center');
    });

    it('should display system icon with correct size', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'system',
        content: 'System alert',
      };

      render(<Message message={message} />);

      const icon = screen.getByTestId('alert-triangle-icon');
      expect(icon).toHaveClass('h-4', 'w-4');
    });
  });

  describe('Assistant Messages with Analysis', () => {
    const mockAnalysis: AnalysisResponse = {
      summary: 'This is a comprehensive analysis of the betting opportunity.',
      reasoning: [
        {
          step: 1,
          description: 'Initial statistical analysis shows favorable conditions.',
          activatedModules: ['KM_01', 'KM_02'],
        },
        {
          step: 2,
          description: 'Market analysis indicates value bet potential.',
          activatedModules: ['KM_03'],
        },
      ],
      quantitative: {
        expectedValue: 5.75,
        vigRemovedOdds: -108.5,
        kellyCriterionStake: 2.35,
        confidenceScore: 8.2,
        projectedMean: 285.75,
        projectedStdDev: 18.45,
      },
    };

    it('should render assistant message with analysis summary', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText(mockAnalysis.summary)).toBeInTheDocument();
      expect(screen.getByTestId('brain-circuit-icon')).toBeInTheDocument();
    });

    it('should display quantitative analysis section', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Quantitative Analysis')).toBeInTheDocument();
      expect(screen.getByText('Expected Value (+EV)')).toBeInTheDocument();
    });

    it('should format expected value correctly', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('5.75%')).toBeInTheDocument();
    });

    it('should display all quantitative metrics', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Vig-Removed Odds')).toBeInTheDocument();
      expect(screen.getByText('-108.50')).toBeInTheDocument();

      expect(screen.getByText('Kelly Criterion Stake')).toBeInTheDocument();
      expect(screen.getByText('2.35%')).toBeInTheDocument();

      expect(screen.getByText('Confidence Score')).toBeInTheDocument();
      expect(screen.getByText('8.2 / 10')).toBeInTheDocument();

      expect(screen.getByText('Projected Mean')).toBeInTheDocument();
      expect(screen.getByText('285.75')).toBeInTheDocument();

      expect(screen.getByText('Projected Std Dev')).toBeInTheDocument();
      expect(screen.getByText('18.45')).toBeInTheDocument();
    });

    it('should render reasoning trace section', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Reasoning Trace')).toBeInTheDocument();
      expect(screen.getByTestId('list-checks-icon')).toBeInTheDocument();
    });

    it('should display all reasoning steps', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Step 1')).toBeInTheDocument();
      expect(screen.getByText('Initial statistical analysis shows favorable conditions.')).toBeInTheDocument();

      expect(screen.getByText('Step 2')).toBeInTheDocument();
      expect(screen.getByText('Market analysis indicates value bet potential.')).toBeInTheDocument();
    });

    it('should display activated modules for each step', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      expect(screen.getByText('KM_01')).toBeInTheDocument();
      expect(screen.getByText('KM_02')).toBeInTheDocument();
      expect(screen.getByText('KM_03')).toBeInTheDocument();
    });

    it('should handle reasoning steps without activated modules', () => {
      const analysisWithoutModules: AnalysisResponse = {
        ...mockAnalysis,
        reasoning: [
          {
            step: 1,
            description: 'Basic analysis',
            activatedModules: [],
          },
        ],
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithoutModules,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Basic analysis')).toBeInTheDocument();
      expect(screen.queryByText(/KM_/)).not.toBeInTheDocument();
    });

    it('should format numbers with correct precision', () => {
      const analysisWithPrecision: AnalysisResponse = {
        ...mockAnalysis,
        quantitative: {
          expectedValue: 1.23456,
          vigRemovedOdds: -105.789,
          kellyCriterionStake: 0.987654,
          confidenceScore: 7.654321,
          projectedMean: 299.9999,
          projectedStdDev: 20.1111,
        },
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithPrecision,
      };

      render(<Message message={message} />);

      // expectedValue: 2 decimal places
      expect(screen.getByText('1.23%')).toBeInTheDocument();

      // vigRemovedOdds: 2 decimal places
      expect(screen.getByText('-105.79')).toBeInTheDocument();

      // kellyCriterionStake: 2 decimal places
      expect(screen.getByText('0.99%')).toBeInTheDocument();

      // confidenceScore: 1 decimal place
      expect(screen.getByText('7.7 / 10')).toBeInTheDocument();

      // projectedMean: 2 decimal places
      expect(screen.getByText('300.00')).toBeInTheDocument();

      // projectedStdDev: 2 decimal places
      expect(screen.getByText('20.11')).toBeInTheDocument();
    });

    it('should handle negative expected value', () => {
      const analysisWithNegativeEV: AnalysisResponse = {
        ...mockAnalysis,
        quantitative: {
          ...mockAnalysis.quantitative,
          expectedValue: -2.5,
        },
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithNegativeEV,
      };

      render(<Message message={message} />);

      expect(screen.getByText('-2.50%')).toBeInTheDocument();
    });

    it('should handle multiple reasoning steps', () => {
      const analysisWithManySteps: AnalysisResponse = {
        ...mockAnalysis,
        reasoning: Array.from({ length: 5 }, (_, i) => ({
          step: i + 1,
          description: `Step ${i + 1} description`,
          activatedModules: [`KM_${String(i + 1).padStart(2, '0')}`],
        })),
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithManySteps,
      };

      render(<Message message={message} />);

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByText(`Step ${i}`)).toBeInTheDocument();
        expect(screen.getByText(`Step ${i} description`)).toBeInTheDocument();
      }
    });

    it('should render brain circuit icon for assistant messages', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: mockAnalysis,
      };

      render(<Message message={message} />);

      const icon = screen.getByTestId('brain-circuit-icon');
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass('h-5', 'w-5');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values in quantitative analysis', () => {
      const analysisWithZeros: AnalysisResponse = {
        summary: 'Zero values test',
        reasoning: [],
        quantitative: {
          expectedValue: 0,
          vigRemovedOdds: 0,
          kellyCriterionStake: 0,
          confidenceScore: 0,
          projectedMean: 0,
          projectedStdDev: 0,
        },
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithZeros,
      };

      render(<Message message={message} />);

      expect(screen.getByText('0.00%')).toBeInTheDocument();
      expect(screen.getByText('0.0 / 10')).toBeInTheDocument();
    });

    it('should handle very large numbers', () => {
      const analysisWithLargeNumbers: AnalysisResponse = {
        summary: 'Large numbers test',
        reasoning: [],
        quantitative: {
          expectedValue: 9999.99,
          vigRemovedOdds: -9999.99,
          kellyCriterionStake: 999.99,
          confidenceScore: 10.0,
          projectedMean: 99999.99,
          projectedStdDev: 9999.99,
        },
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithLargeNumbers,
      };

      render(<Message message={message} />);

      expect(screen.getByText('9999.99%')).toBeInTheDocument();
      expect(screen.getByText('-9999.99')).toBeInTheDocument();
    });

    it('should handle empty reasoning array', () => {
      const analysisWithoutReasoning: AnalysisResponse = {
        summary: 'No reasoning steps',
        reasoning: [],
        quantitative: {
          expectedValue: 5.0,
          vigRemovedOdds: -110,
          kellyCriterionStake: 2.0,
          confidenceScore: 7.5,
          projectedMean: 250,
          projectedStdDev: 15,
        },
      };

      const message: MessageType = {
        id: 'msg-1',
        role: 'assistant',
        content: analysisWithoutReasoning,
      };

      render(<Message message={message} />);

      expect(screen.getByText('Reasoning Trace')).toBeInTheDocument();
      expect(screen.queryByText(/Step/)).not.toBeInTheDocument();
    });

    it('should handle special characters in content', () => {
      const message: MessageType = {
        id: 'msg-1',
        role: 'user',
        content: 'Message with <special> & "characters" and \'quotes\'',
      };

      render(<Message message={message} />);

      expect(screen.getByText('Message with <special> & "characters" and \'quotes\'')).toBeInTheDocument();
    });
  });
});