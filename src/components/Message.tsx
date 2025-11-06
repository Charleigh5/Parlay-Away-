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
  const { quantitative, reasoning } = analysis;

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
              <div className="font-mono text-green-400 text-right">
                {quantitative.expectedValue.toFixed(2)}%
              </div>
              <div className="text-gray-400">Vig-Removed Odds</div>
              <div className="font-mono text-gray-200 text-right">
                {quantitative.vigRemovedOdds.toFixed(2)}
              </div>
              <div className="text-gray-400">Kelly Criterion Stake</div>
              <div className="font-mono text-gray-200 text-right">
                {quantitative.kellyCriterionStake.toFixed(2)}%
              </div>
              <div className="text-gray-400">Confidence Score</div>
              <div className="font-mono text-cyan-300 text-right">
                {quantitative.confidenceScore.toFixed(1)} / 10
              </div>
              <div className="text-gray-400">Projected Mean</div>
              <div className="font-mono text-gray-200 text-right">
                {quantitative.projectedMean.toFixed(2)}
              </div>
              <div className="text-gray-400">Projected Std Dev</div>
              <div className="font-mono text-gray-200 text-right">
                {quantitative.projectedStdDev.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
              <ListChecksIcon className="h-5 w-5" />
              Reasoning Trace
            </h3>
            <ol className="space-y-3 text-sm text-gray-300">
              {reasoning.map((step) => (
                <li key={step.step} className="rounded-md border border-gray-700/40 bg-gray-800/50 p-3">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                    <span className="font-medium text-gray-300">Step {step.step}</span>
                    {step.activatedModules.length > 0 && (
                      <span className="flex flex-wrap gap-1">
                        {step.activatedModules.map((module) => (
                          <span
                            key={module}
                            className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-cyan-300"
                          >
                            {module}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>
                  <p>{step.description}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;