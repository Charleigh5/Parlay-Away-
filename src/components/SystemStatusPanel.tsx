import React, { useState, useCallback } from 'react';
import { SystemUpdate } from '../types';
import { proposeModelUpdate, sendUpdateFeedback } from '../services/geminiService';
import { ZapIcon } from '@/components/icons/ZapIcon';
import { CheckCircleIcon } from '@/components/icons/CheckCircleIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { RefreshCwIcon } from '../assets/icons/RefreshCwIcon';
import { Settings2Icon } from '@/components/icons/Settings2Icon';
import { XCircleIcon } from '@/components/icons/XCircleIcon';
import { CheckIcon } from '@/components/icons/CheckIcon';
import { XIcon } from '@/components/icons/XIcon';


const SystemStatusPanel: React.FC = () => {
  const [updates, setUpdates] = useState<SystemUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUpdate = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newUpdate = await proposeModelUpdate();
      // Simulate a mix of statuses for demonstration
      const randomStatus = Math.random();
      if (randomStatus > 0.7) {
        newUpdate.status = 'Approved & Deployed';
      } else if (randomStatus < 0.1) {
        newUpdate.status = 'Backtesting Failed';
      }
      setUpdates(prev => [newUpdate, ...prev].slice(0, 5)); // Keep last 5 updates
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching AI model updates.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFeedback = (update: SystemUpdate, decision: 'accepted' | 'rejected') => {
    // Fire