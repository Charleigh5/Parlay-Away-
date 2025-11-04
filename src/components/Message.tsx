// Message.tsx
// Renders chat messages for the Analyzer conversation, including assistant analysis output with quantitative metrics and reasoning trace.
import React from 'react';
import { Message as MessageType, AnalysisResponse } from '@/types';
import { UserIcon } from '@/components/icons/UserIcon';
import { BrainCircuitIcon } from '@/components/icons/BrainCircuitIcon';
import { AlertTriangleIcon } from '@/components/icons/AlertTriangleIcon';
import { BarChartIcon } from '@/components/icons/BarChartIcon';
import { ListChecksIcon } from '@/components/icons/ListChecksIcon';

const formatNumber = (value: number, fractionDigits = 2): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return value.toFixed(fractionDigits);
};

const formatPercentage = (value: number, fractionDigits = 2): string => {
  if (!Number.isFinite(value)) {
    return '—';
  }
  return `${value.toFixed(fractionDigits)}%`;
};

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
  const {
    summary,
    reasoning,
    quantitative: {
      expectedValue,
      vigRemovedOdds,
      kellyCriterionStake,
      confidenceScore,
      projectedMean,
      projectedStdDev,
    },
  } = analysis;

  const metrics = [
    {
      label: 'Expected Value (+EV)',
      value: formatPercentage(expectedValue),
      valueClass: expectedValue >= 0 ? 'text-green-400' : 'text-red-400',
    },
    {
      label: 'Vig-Removed Odds',
      value: formatNumber(vigRemovedOdds, 2),
    },
    {
      label: 'Fractional Kelly Stake',
      value: formatPercentage(kellyCriterionStake),
    },
    {
      label: 'Confidence Score',
      value: Number.isFinite(confidenceScore) ? `${(confidenceScore * 100).toFixed(1)}%` : '—',
    },
    {
      label: 'Projected Mean',
      value: formatNumber(projectedMean, 2),
    },
    {
      label: 'Projected Std Dev',
      value: formatNumber(projectedStdDev, 2),
    },
  ];

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-4 w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-700 text-cyan-400">
          <BrainCircuitIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 space-y-4 rounded-lg bg-gray-800 p-4 border border-gray-700">
          <p className="text-gray-300">{summary}</p>

          <div className="rounded-lg border border-gray-700/50 bg-gray-900/30 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
              <BarChartIcon className="h-5 w-5" />
              Quantitative Analysis
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {metrics.map(({ label, value, valueClass }) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-gray-700/40 bg-gray-900/40 px-3 py-2">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-mono text-right text-gray-200 ${valueClass ?? ''}`.trim()}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {Array.isArray(reasoning) && reasoning.length > 0 && (
            <div className="rounded-lg border border-gray-700/50 bg-gray-900/20 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
                <ListChecksIcon className="h-5 w-5" />
                Reasoning Trace
              </h3>
              <ol className="space-y-3">
                {reasoning.map((step) => (
                  <li key={step.step} className="rounded-md border border-gray-700/40 bg-gray-800/60 p-3">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-200">Step {step.step}</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{step.description}</p>
                      </div>
                      {Array.isArray(step.activatedModules) && step.activatedModules.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {step.activatedModules.map((moduleId) => (
                            <span
                              key={moduleId}
                              className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-200"
                            >
                              {moduleId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
