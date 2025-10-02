import React, { useState, Fragment, useMemo } from 'react';
import { AnalyzedBetLeg, QuantitativeAnalysis, ReasoningStep, ExtractedBetLeg } from '../types';
import { RotateCwIcon } from './icons/RotateCwIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { TrendingUpIcon } from './icons/TrendingUpIcon';
import { InfoIcon } from './icons/InfoIcon';
import { UsersIcon } from './icons/UsersIcon';
import { DollarSignIcon } from './icons/DollarSignIcon';
import { HeartPulseIcon } from './icons/HeartPulseIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { KNOWLEDGE_MODULES } from '../constants';
import { LineChartIcon } from './icons/LineChartIcon';
import { formatAmericanOdds, calculateParlayOdds, calculateParlayEV, calculateParlayConfidence, generateHistoricalOdds } from '../utils';
import RadialProgress from './RadialProgress';
import { TargetIcon } from './icons/TargetIcon';
import { LayersIcon } from './icons/LayersIcon';
import { OddsLineChart } from './OddsLineChart';
import { MaximizeIcon } from './icons/MaximizeIcon';


interface AnalysisTableProps {
  legs: AnalyzedBetLeg[];
  originalLegs?: ExtractedBetLeg[];
  imageUrl?: string | null;
  onViewImage?: () => void;
  onReset: () => void;
}

const getStatus = (quantitative: QuantitativeAnalysis) => {
  const { expectedValue, confidenceScore } = quantitative;
  if (expectedValue <= 0) {
    return { label: 'Avoid' as const, className: 'bg-red-500/10 text-red-400' };
  }
  if (expectedValue > 4 && confidenceScore > 0.75) {
    return { label: 'High Value' as const, className: 'bg-green-500/10 text-green-400' };
  }
  if (expectedValue > 1 && confidenceScore > 0.6) {
    return { label: 'Positive Lean' as const, className: 'bg-yellow-500/10 text-yellow-400' };
  }
  return { label: 'Low Confidence' as const, className: 'bg-gray-600/20 text-gray-400' };
};

const keyDriverDefinitions = [
  {
    module: 'KM_01',
    icon: <DollarSignIcon className="h-5 w-5" />,
  },
  {
    module: 'KM_02',
    icon: <TrendingUpIcon className="h-5 w-5" />,
  },
  {
    module: 'KM_03',
    icon: <ShieldCheckIcon className="h-5 w-5" />,
  },
  {
    module: 'KM_04',
    icon: <UsersIcon className="h-5 w-5" />,
  },
  {
    module: 'KM_05',
    icon: <HeartPulseIcon className="h-5 w-5" />,
  }
];

const getKeyDrivers = (leg: AnalyzedBetLeg) => {
    const activatedDrivers = keyDriverDefinitions.map(driverDef => {
        const relevantSteps = leg.analysis.reasoning.filter(step =>
            step.activatedModules.includes(driverDef.module)
        );

        if (relevantSteps.length > 0) {
            const moduleInfo = KNOWLEDGE_MODULES.find(km => km.id === driverDef.module);
            return {
                icon: driverDef.icon,
                tooltipData: {
                    id: driverDef.module,
                    domain: moduleInfo?.domain || 'Unknown Module',
                    description: moduleInfo?.description || 'No description available.',
                    steps: relevantSteps
                }
            };
        }
        return null;
    }).filter((driver): driver is { icon: React.ReactElement; tooltipData: { id: string; domain: string; description: string; steps: ReasoningStep[] } } => driver !== null);
    
    return activatedDrivers;
};


const verdictDefinitions = {
  'High Value': {
    title: 'High Value Verdict',
    content: "Indicates a significant edge. Criteria: Expected Value > 4% and Confidence Score > 0.75. This is a prime betting opportunity according to the model.",
  },
  'Positive Lean': {
    title: 'Positive Lean Verdict',
    content: "Suggests a probable edge, but with less certainty. Criteria: Expected Value > 1% and Confidence Score > 0.6. Warrants consideration, potentially with smaller stakes.",
  },
  'Avoid': {
    title: 'Avoid Verdict',
    content: "The model calculates a negative or zero expected value (EV <= 0%). This bet is likely unprofitable in the long run and should be avoided.",
  },
  'Low Confidence': {
    title: 'Low Confidence Verdict',
    content: "While the EV may be positive, the model's confidence is too low to issue a strong recommendation. This could be due to volatile markets or insufficient data.",
  },
};

// Helper component for rendering reasoning text with clickable module IDs
const RenderReasoningText: React.FC<{ text: string; legIndex: number; onModuleClick: (legIndex: number, moduleId: string) => void; }> = ({ text, legIndex, onModuleClick }) => {
    const parts = text.split(/(KM_\d{2})/g);
    
    const hasModule = parts.some(part => /KM_\d{2}/.test(part));
    if (!hasModule) {
        return <span>{text}</span>;
    }

    return (
        <span>
            {parts.map((part, i) => {
                if (/KM_\d{2}/.test(part)) {
                    return (
                        <button
                            key={i}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent row from collapsing
                                onModuleClick(legIndex, part);
                            }}
                            className="inline rounded font-mono text-cyan-300 transition-all hover:text-cyan-200 hover:underline focus:outline-none focus:ring-1 focus:ring-cyan-400 mx-px"
                        >
                            {part}
                        </button>
                    );
                }
                return <Fragment key={i}>{part}</Fragment>;
            })}
        </span>
    );
};

const AnalysisTable: React.FC<AnalysisTableProps> = ({ legs, originalLegs, imageUrl, onViewImage, onReset }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  const historicalOddsData = useMemo(() => {
    return legs.map(leg => generateHistoricalOdds(leg.marketOdds));
  }, [legs]);

  const parlayMetrics = useMemo(() => {
    if (legs.length < 2 && (!originalLegs || originalLegs.length < 2)) return null;

    const analyzedOdds = calculateParlayOdds(legs);
    const originalOdds = originalLegs ? calculateParlayOdds(originalLegs) : null;
    const parlayEV = calculateParlayEV(legs);
    const parlayConfidence = calculateParlayConfidence(legs);
    
    let summaryText = '';
    if (parlayEV <= 0) {
      summaryText = "The combined odds do not justify the risk. This parlay is likely unprofitable in the long run and should be avoided.";
    } else if (parlayEV > 0 && parlayEV <= 5) {
      summaryText = "This combination shows a slight edge. While profitable long-term, consider the risk associated with multi-leg bets.";
    } else if (parlayEV > 5 && parlayConfidence < 0.65) {
        summaryText = "A potentially valuable parlay, but with moderate uncertainty. The model identifies a significant edge, but confidence is tempered by market factors or data limitations."
    } else {
      summaryText = "A high-value parlay where all legs show a strong analytical edge and high confidence. This represents a prime betting opportunity according to the model.";
    }

    return {
      odds: analyzedOdds,
      originalOdds,
      ev: parlayEV,
      confidence: parlayConfidence,
      summary: summaryText
    };
  }, [legs, originalLegs]);

  const handleToggleRow = (index: number) => {
    setExpandedRows(prevExpandedRows => {
      const newExpandedRows = new Set(prevExpandedRows);
      if (newExpandedRows.has(index)) {
        newExpandedRows.delete(index);
      } else {
        newExpandedRows.add(index);
      }
      return newExpandedRows;
    });
  };

  const handleScrollToDriver = (legIndex: number, moduleId: string) => {
    const element = document.getElementById(`driver-${legIndex}-${moduleId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('rounded-md', 'ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-gray-950');
        setTimeout(() => {
            element.classList.remove('rounded-md', 'ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-gray-950');
        }, 1500);
    }
  };

  const handleJumpToStep = (legIndex: number, stepNumber: number) => {
    const element = document.getElementById(`step-${legIndex}-${stepNumber}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-1', 'ring-offset-gray-800');
        setTimeout(() => {
            element.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-1', 'ring-offset-gray-800');
        }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="flex-shrink-0 p-4 border-b border-gray-700/50 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-200">Analysis Results</h2>
        <div className="flex items-center gap-2">
          {imageUrl && onViewImage && (
             <button
                onClick={onViewImage}
                className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700/60 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                <MaximizeIcon className="h-4 w-4" />
                View Slip
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
          >
            <RotateCwIcon className="h-4 w-4" />
            New Analysis
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {parlayMetrics && (
          <div className="p-4 m-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold text-cyan-400 mb-3">Parlay Analysis Summary</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="md:col-span-1 flex flex-col items-center justify-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-sm text-gray-400 mb-1">Total Odds</div>
                <div className="text-3xl font-bold text-gray-100">{formatAmericanOdds(parlayMetrics.odds)}</div>
                {parlayMetrics.originalOdds && parlayMetrics.originalOdds !== parlayMetrics.odds && (
                  <div className="text-xs text-gray-500 line-through">{formatAmericanOdds(parlayMetrics.originalOdds)}</div>
                )}
              </div>
              <div className="flex justify-around items-center bg-gray-800/50 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Combined EV</div>
                   <div className={`text-2xl font-mono font-bold ${parlayMetrics.ev > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {parlayMetrics.ev.toFixed(2)}%
                   </div>
                </div>
                 <div className="text-center">
                  <div className="text-sm text-gray-400 mb-2">Confidence</div>
                   <div className={`text-2xl font-mono font-bold text-cyan-300`}>
                    {(parlayMetrics.confidence * 100).toFixed(0)}%
                   </div>
                </div>
              </div>
              <div className="md:col-span-3 lg:col-span-1 p-4 bg-gray-800/50 rounded-lg">
                 <p className="text-sm text-gray-300">{parlayMetrics.summary}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-300 sm:pl-6 w-1/3">Player & Prop</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Market Odds</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">EV</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Confidence</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-300">Verdict</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 w-12"><span className="sr-only">Expand</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 bg-gray-900">
                {legs.map((leg, index) => {
                  const status = getStatus(leg.analysis.quantitative);
                  const isExpanded = expandedRows.has(index);
                  const keyDrivers = getKeyDrivers(leg);

                  return (
                    <Fragment key={leg.player + leg.propType + leg.line}>
                      <tr onClick={() => handleToggleRow(index)} className="cursor-pointer hover:bg-gray-800/40 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="font-medium text-gray-200">{leg.player}</div>
                            <div className="text-gray-400">{`${leg.position} ${leg.line} ${leg.propType}`}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300 font-mono">{formatAmericanOdds(leg.marketOdds)}</td>
                        <td className={`whitespace-nowrap px-3 py-4 text-sm font-mono ${leg.analysis.quantitative.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {leg.analysis.quantitative.expectedValue.toFixed(2)}%
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                            <div className="w-24 bg-gray-700 rounded-full h-2">
                                <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
                            </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${status.className}`}>
                                {status.label}
                            </span>
                        </td>
                         <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                           <ChevronDownIcon className={`h-5 w-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                         </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-gray-950/70">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                               {/* Left Column: Quantitative & Drivers */}
                               <div className="lg:col-span-1 space-y-4">
                                  <div className="rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                                     <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
                                        <TargetIcon className="h-5 w-5" />
                                        Quantitative Analysis
                                    </h3>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                      <div className="text-gray-400">Projected Mean</div>
                                      <div className="font-mono text-gray-200 text-right">{leg.analysis.quantitative.projectedMean?.toFixed(2)}</div>
                                      <div className="text-gray-400">Projected Std Dev</div>
                                      <div className="font-mono text-gray-200 text-right">{leg.analysis.quantitative.projectedStdDev?.toFixed(2)}</div>
                                      <div className="text-gray-400">Vig-Removed Odds</div>
                                      <div className="font-mono text-gray-200 text-right">{formatAmericanOdds(leg.analysis.quantitative.vigRemovedOdds)}</div>
                                      <div className="text-gray-400">Kelly Stake</div>
                                      <div className="font-mono text-yellow-400 text-right">{leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</div>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                                    <h3 className="mb-3 flex items-center gap-2 text-md font-semibold text-cyan-400">
                                        <LayersIcon className="h-5 w-5" />
                                        Key Drivers
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {keyDrivers.map(({ icon, tooltipData }) => (
                                          <div key={tooltipData.id} id={`driver-${index}-${tooltipData.id}`} className="group relative text-gray-400 hover:text-cyan-400 transition-colors">
                                            {/* FIX: Cast icon to React.ReactElement to resolve TypeScript error with cloneElement.
                                                This helps TypeScript understand that the element can accept a className prop,
                                                which it fails to infer correctly in this context. */}
                                            {React.cloneElement(icon as React.ReactElement, { className: "h-7 w-7"})}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                <p className="font-bold text-cyan-300 text-sm mb-1">{tooltipData.domain} <span className="font-mono text-xs">({tooltipData.id})</span></p>
                                                <p className="mb-2 italic">{tooltipData.description}</p>
                                                <ul className="space-y-1.5 list-disc list-inside">
                                                    {tooltipData.steps.map(step => (
                                                        <li key={step.step}>
                                                          <button onClick={(e) => { e.stopPropagation(); handleJumpToStep(index, step.step); }} className="hover:underline text-left">
                                                              {step.description.substring(0, 50)}...
                                                          </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                               </div>

                               {/* Middle Column: Reasoning */}
                               <div className="lg:col-span-1 rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                                    <h3 className="mb-3 text-md font-semibold text-cyan-400">Reasoning Steps</h3>
                                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-2">
                                        {leg.analysis.reasoning.map(step => (
                                            <li key={step.step} id={`step-${index}-${step.step}`} className="text-sm text-gray-400 p-2 rounded-md transition-shadow">
                                                <strong className="text-gray-300">Step {step.step}:</strong>{' '}
                                                <RenderReasoningText text={step.description} legIndex={index} onModuleClick={handleScrollToDriver} />
                                            </li>
                                        ))}
                                    </ul>
                               </div>

                               {/* Right Column: Market */}
                               <div className="lg:col-span-1 space-y-4">
                                  <div className="rounded-lg border border-gray-700/50 bg-gray-800 p-4">
                                    <h3 className="mb-2 flex items-center justify-between text-md font-semibold text-cyan-400">
                                      <div className="flex items-center gap-2">
                                        <LineChartIcon className="h-5 w-5" />
                                        Market Odds Analysis
                                      </div>
                                      <div className="group relative">
                                        <InfoIcon className="h-4 w-4 text-gray-500" />
                                        <div className="absolute bottom-full right-0 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            This chart shows the simulated movement of the market odds over the last 7 days for the selected bet.
                                        </div>
                                      </div>
                                    </h3>
                                    <OddsLineChart data={historicalOddsData[index]} />
                                  </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AnalysisTable;