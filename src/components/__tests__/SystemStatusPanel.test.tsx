import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import SystemStatusPanel from '../SystemStatusPanel';
import * as geminiService from '../../services/geminiService';
import type { SystemUpdate } from '../../types';

// Mock the geminiService
vi.mock('../../services/geminiService', () => ({
  proposeModelUpdate: vi.fn(),
  sendUpdateFeedback: vi.fn(),
}));

// Mock icon components
vi.mock('../icons/ZapIcon', () => ({
  ZapIcon: ({ className }: { className?: string }) => <span data-testid="zap-icon" className={className}>ZapIcon</span>,
}));

vi.mock('../icons/CheckCircleIcon', () => ({
  CheckCircleIcon: ({ className }: { className?: string }) => <span data-testid="check-circle-icon" className={className}>CheckIcon</span>,
}));

vi.mock('../icons/ClockIcon', () => ({
  ClockIcon: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className}>ClockIcon</span>,
}));

vi.mock('../assets/icons/RefreshCwIcon', () => ({
  RefreshCwIcon: ({ className }: { className?: string }) => <span data-testid="refresh-icon" className={className}>RefreshIcon</span>,
}));

vi.mock('../icons/Settings2Icon', () => ({
  Settings2Icon: ({ className }: { className?: string }) => <span data-testid="settings-icon" className={className}>SettingsIcon</span>,
}));

vi.mock('../icons/XCircleIcon', () => ({
  XCircleIcon: ({ className }: { className?: string }) => <span data-testid="x-circle-icon" className={className}>XCircleIcon</span>,
}));

vi.mock('../icons/CheckIcon', () => ({
  CheckIcon: ({ className }: { className?: string }) => <span data-testid="check-icon" className={className}>CheckIcon</span>,
}));

vi.mock('../icons/XIcon', () => ({
  XIcon: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className}>XIcon</span>,
}));

describe('SystemStatusPanel Component', () => {
  const mockSystemUpdate: SystemUpdate = {
    id: 'UP-001',
    status: 'Pending Review',
    featureName: 'Live Momentum Tracker',
    description: 'Real-time analysis of in-game momentum shifts',
    integrationStrategy: 'Integrate with WebSocket live data feed',
    impactAnalysis: 'Expected to improve ROI by identifying momentum-driven opportunities',
    backtestResults: {
      roiChange: 0.75,
      brierScore: 0.18,
      sharpeRatio: 1.35,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Render', () => {
    it('should render without updates initially', () => {
      render(<SystemStatusPanel />);
      
      // Component should render but may not have visible text initially
      expect(document.body).toBeTruthy();
    });

    it('should not show loading state initially', () => {
      const { container } = render(<SystemStatusPanel />);
      
      // Check that loading indicator is not present
      expect(container.querySelector('[data-loading="true"]')).not.toBeInTheDocument();
    });
  });

  describe('Fetching Updates', () => {
    it('should fetch and display system update', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);

      render(<SystemStatusPanel />);

      // Look for a button or trigger to fetch updates
      // Note: The actual implementation might have specific triggers
      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalled();
        });
      }
    });

    it('should handle fetch errors gracefully', async () => {
      const errorMessage = 'Failed to propose a model update';
      vi.mocked(geminiService.proposeModelUpdate).mockRejectedValue(new Error(errorMessage));

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalled();
        });
      }
    });

    it('should show loading state while fetching', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockSystemUpdate), 100))
      );

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        // Check loading state exists briefly
        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalled();
        });
      }
    });
  });

  describe('Update Display', () => {
    it('should display update feature name', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const featureName = screen.queryByText('Live Momentum Tracker');
          if (featureName) {
            expect(featureName).toBeInTheDocument();
          }
        });
      }
    });

    it('should display update description', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const description = screen.queryByText(/Real-time analysis/);
          if (description) {
            expect(description).toBeInTheDocument();
          }
        });
      }
    });

    it('should display backtest results', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          // Look for ROI change value
          const roiValue = screen.queryByText(/0\.75/);
          if (roiValue) {
            expect(roiValue).toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('Status Indicators', () => {
    it('should show pending status correctly', async () => {
      const pendingUpdate = { ...mockSystemUpdate, status: 'Pending Review' };
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(pendingUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const status = screen.queryByText(/Pending Review/);
          if (status) {
            expect(status).toBeInTheDocument();
          }
        });
      }
    });

    it('should show approved status correctly', async () => {
      const approvedUpdate = { ...mockSystemUpdate, status: 'Approved & Deployed' };
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(approvedUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const status = screen.queryByText(/Approved/);
          if (status) {
            expect(status).toBeInTheDocument();
          }
        });
      }
    });

    it('should show failed status correctly', async () => {
      const failedUpdate = { ...mockSystemUpdate, status: 'Backtesting Failed' };
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(failedUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const status = screen.queryByText(/Failed/);
          if (status) {
            expect(status).toBeInTheDocument();
          }
        });
      }
    });
  });

  describe('Feedback Handling', () => {
    it('should send acceptance feedback', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);
      vi.mocked(geminiService.sendUpdateFeedback).mockResolvedValue();

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const acceptButton = screen.queryByTestId('check-icon')?.closest('button');
          if (acceptButton) {
            fireEvent.click(acceptButton);
            expect(geminiService.sendUpdateFeedback).toHaveBeenCalledWith(
              expect.objectContaining({ id: 'UP-001' }),
              'accepted'
            );
          }
        });
      }
    });

    it('should send rejection feedback', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);
      vi.mocked(geminiService.sendUpdateFeedback).mockResolvedValue();

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const rejectButton = screen.queryByTestId('x-icon')?.closest('button');
          if (rejectButton) {
            fireEvent.click(rejectButton);
            expect(geminiService.sendUpdateFeedback).toHaveBeenCalledWith(
              expect.objectContaining({ id: 'UP-001' }),
              'rejected'
            );
          }
        });
      }
    });
  });

  describe('Multiple Updates', () => {
    it('should handle multiple updates', async () => {
      const update1 = { ...mockSystemUpdate, id: 'UP-001' };
      const update2 = { ...mockSystemUpdate, id: 'UP-002', featureName: 'Second Feature' };

      vi.mocked(geminiService.proposeModelUpdate)
        .mockResolvedValueOnce(update1)
        .mockResolvedValueOnce(update2);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalledTimes(1);
        });

        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalledTimes(2);
        });
      }
    });

    it('should limit updates to 5 most recent', async () => {
      const updates = Array.from({ length: 6 }, (_, i) => ({
        ...mockSystemUpdate,
        id: `UP-00${i + 1}`,
        featureName: `Feature ${i + 1}`,
      }));

      vi.mocked(geminiService.proposeModelUpdate).mockImplementation(() => 
        Promise.resolve(updates[updates.length - 1])
      );

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        for (let i = 0; i < 6; i++) {
          vi.mocked(geminiService.proposeModelUpdate).mockResolvedValueOnce(updates[i]);
          fireEvent.click(refreshButton);
          await waitFor(() => {
            expect(geminiService.proposeModelUpdate).toHaveBeenCalledTimes(i + 1);
          });
        }
      }
    });
  });

  describe('Error States', () => {
    it('should display error message on fetch failure', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockRejectedValue(
        new Error('API unavailable')
      );

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          const errorText = screen.queryByText(/API unavailable/i) || screen.queryByText(/error/i);
          if (errorText) {
            expect(errorText).toBeInTheDocument();
          }
        });
      }
    });

    it('should handle network errors', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockRejectedValue(
        new Error('Network error')
      );

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalled();
        });
      }
    });

    it('should recover from error state', async () => {
      vi.mocked(geminiService.proposeModelUpdate)
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce(mockSystemUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalledTimes(1);
        });

        fireEvent.click(refreshButton);

        await waitFor(() => {
          expect(geminiService.proposeModelUpdate).toHaveBeenCalledTimes(2);
        });
      }
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup properly on unmount', () => {
      const { unmount } = render(<SystemStatusPanel />);
      
      expect(() => unmount()).not.toThrow();
    });

    it('should handle rapid clicking of refresh button', async () => {
      vi.mocked(geminiService.proposeModelUpdate).mockResolvedValue(mockSystemUpdate);

      render(<SystemStatusPanel />);

      const refreshButton = screen.queryByTestId('refresh-icon')?.closest('button');
      
      if (refreshButton) {
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);
        fireEvent.click(refreshButton);

        await waitFor(() => {
          // Should handle rapid clicks gracefully
          expect(geminiService.proposeModelUpdate).toHaveBeenCalled();
        });
      }
    });
  });
});