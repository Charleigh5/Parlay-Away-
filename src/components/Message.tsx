import React from 'react';
import { Message as MessageType, AnalysisResponse } from '../types';
import { UserIcon } from './icons/UserIcon';
import { BrainCircuitIcon } from '../assets/icons/BrainCircuitIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { BarChartIcon } from './icons/BarChartIcon';
import { ListChecksIcon } from './icons/ListChecksIcon';

const Message: React.FC<{ message: MessageType }> = ({ message }) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-3 rounded-lg bg-cyan-500/10 p-4 max-w-full sm:max-w-xl md:max-w-2xl border border-cyan-500/30">
          <div className="prose prose-invert text-gray-200">{message.content as string}</div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
            <UserIcon className="h-5 w-5" />
          </div>
        </div>
      </div>
    );
  }

  if (message.role === 'system') {
    return (
      <div className="flex justify-center">
        <div className="flex items-center gap-3 rounded-lg bg-gray-700/50 p-3 text-sm text-gray-400">
          <AlertTriangleIcon className="h-4 w-4" />
          <span>{message.content as string}</span>
        </div>
      </div>
    );
  }

  const analysis = message.content as AnalysisResponse;

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-4 w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-cyan-400">
          <BrainCircuitIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4 rounded-lg bg-gray-800 p-4 border border-gray-700">
          <p className="text-gray-300">{analysis.summary}</p>
          
          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
              <BarChartIcon className="h-5 w-5" />
              Quantitative Analysis
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-gray-400">Expected Value (+EV)</div>
              <div className="font-mono text-green-400 text-right">{analysis.quantitative.expectedValue.toFixed(2)}%