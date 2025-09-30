// FIX: Imported `useState` from React to resolve a reference error for the hook and a related JSX namespace issue.
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
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
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


const metricDefinitions = {
  ev: {
    title: 'Expected Value (EV)',
    content: "EV represents the average amount a bettor can expect to win or lose per bet in the long run. A positive EV (+EV) indicates a profitable bet where the odds are in your favor. This is a core concept from our 'Financial Theory' (KM_01) module.",
  },
  kelly: {
    title: 'Kelly Criterion Stake',
    content: "The Kelly Criterion is a formula used to determine the optimal size of a bet to maximize long-term bankroll growth. Our model uses a fractional Kelly to recommend a more conservative stake. This is derived from our 'Financial Theory' (KM_01) module.",
  },
  confidence: {
    title: 'Confidence Score',
    content: "This score (0.0 to 1.0) reflects the model's certainty in its analysis, considering data availability, market liquidity, and model consensus. It leverages principles from 'Advanced Player Metrics' (KM_02).",
  },
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
  const [highlightedSteps, setHighlightedSteps] = useState<Set<number>>(new Set());
  
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
        // Add highlight classes. The transition classes are on the base element for better performance.
        element.classList.add('rounded-md', 'ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-gray-950');
        setTimeout(() => {
            // Remove highlight classes after the animation.
            element.classList.remove('rounded-md', 'ring-2', 'ring-cyan-400', 'ring-offset-2', 'ring-offset-gray-950');
        }, 1500);
    }
  };

  const handleJumpToStep = (legIndex: number, stepNumber: number) => {
    const element = document.getElementById(`step-${legIndex}-${stepNumber}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        element.classList.add('ring-2', 'ring-cyan-400', 'ring-offset-1', 'ring-offset-gray-800');
        setTimeout(() => {
            element.classList.remove('ring-2', 'ring-cyan-400', 'ring-offset-1', 'ring-offset-gray-800');
        }, 1500);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-200">Synoptic Lens Analysis</h2>
            {imageUrl && onViewImage && (
                <button 
                    onClick={onViewImage} 
                    className="group relative flex-shrink-0"
                    aria-label="View uploaded image"
                >
                    <img src={imageUrl} alt="Bet slip thumbnail" className="h-14 w-14 rounded-md border-2 border-gray-600 object-cover transition-all group-hover:border-cyan-400" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                        <MaximizeIcon className="h-6 w-6 text-white" />
                    </div>
                </button>
            )}
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
        >
          <RotateCwIcon className="h-4 w-4" />
          New Analysis
        </button>
      </div>

      {parlayMetrics && (
        <div className="mb-6 rounded-lg border border-cyan-500/30 bg-gray-950 p-4">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-cyan-400">
            <LayersIcon className="h-5 w-5" />
            Parlay Analysis Summary ({legs.length} Analyzed Legs)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Metrics */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              {parlayMetrics.originalOdds !== null && (
                <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800/50 p-4">
                    <span className="text-sm text-gray-400">Original Slip Odds</span>
                    <span className="font-mono text-xl font-bold text-gray-300">{formatAmericanOdds(parlayMetrics.originalOdds)}</span>
                </div>
              )}
              <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800/50 p-4">
                <span className="text-sm text-gray-400">Analyzed Parlay Odds</span>
                <span className="font-mono text-3xl font-bold text-yellow-300">{formatAmericanOdds(parlayMetrics.odds)}</span>
              </div>
              <div className="flex flex-col items-center justify-center rounded-lg bg-gray-800/50 p-4">
                <span className="text-sm text-gray-400">Combined +EV</span>
                <span className={`font-mono text-3xl font-bold ${parlayMetrics.ev > 0 ? 'text-green-400' : 'text-red-400'}`}>{parlayMetrics.ev.toFixed(2)}%</span>
              </div>
              <div className="col-span-2 text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg">
                <strong className="text-gray-200">Model Verdict:</strong> {parlayMetrics.summary}
              </div>
            </div>

            {/* Confidence */}
            <div className="flex flex-col items-center justify-center gap-2">
                <span className="text-sm font-semibold text-gray-300 flex items-center gap-2"><TargetIcon className="h-4 w-4 text-cyan-400"/> Parlay Confidence</span>
                <RadialProgress progress={parlayMetrics.confidence} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full rounded-lg border border-gray-700 bg-gray-900/50">
        {/* Table Header for Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 border-b border-gray-700 p-3 text-xs font-semibold uppercase text-gray-400">
          <div className="col-span-4">Proposition</div>
          <div className="col-span-2 text-center">Market Odds</div>
          <div className="col-span-2 text-center">+EV</div>
          <div className="col-span-2 text-center">Kelly Stake</div>
          <div className="col-span-2 text-center">Verdict</div>
        </div>

        {/* Table Body */}
        <div>
          {legs.map((leg, index) => {
            const status = getStatus(leg.analysis.quantitative);
            const verdictDef = verdictDefinitions[status.label];
            
            return (
            <Fragment key={index}>
              <div
                onClick={() => handleToggleRow(index)}
                className={`cursor-pointer transition-colors ${
                  !expandedRows.has(index) ? 'hover:bg-gray-800/50' : 'bg-gray-800/60'
                } ${index < legs.length - 1 ? 'border-b border-gray-700/70' : ''}`}
              >
                {/* Mobile Card Layout */}
                <div className="p-3 md:hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-semibold text-gray-100">{leg.player}</p>
                            <p className="text-sm text-gray-400">{leg.position} {leg.line} {leg.propType}</p>
                        </div>
                         <div className="group relative flex items-center">
                             <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}>
                               {status.label}
                             </span>
                         </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs border-t border-gray-700/50 pt-2 mt-2">
                        <div>
                            <p className="text-gray-500 uppercase">Odds</p>
                            <p className="font-mono text-gray-200 mt-1">{formatAmericanOdds(leg.marketOdds)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 uppercase">+EV</p>
                            <p className={`font-mono font-semibold mt-1 ${leg.analysis.quantitative.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {leg.analysis.quantitative.expectedValue.toFixed(2)}%
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 uppercase">Kelly</p>
                            <p className="font-mono text-yellow-400 mt-1">{leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</p>
                        </div>
                    </div>
                </div>
                
                {/* Desktop Grid Layout */}
                <div className="hidden md:grid grid-cols-12 items-center gap-4 p-3">
                    <div className="col-span-4">
                      <p className="font-semibold text-gray-100">{leg.player}</p>
                      <p className="text-sm text-gray-400">
                        {leg.position} {leg.line} {leg.propType}
                      </p>
                    </div>
                    <div className="col-span-2 text-center font-mono text-gray-200">{formatAmericanOdds(leg.marketOdds)}</div>
                    <div className={`col-span-2 text-center font-mono font-semibold ${leg.analysis.quantitative.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {leg.analysis.quantitative.expectedValue.toFixed(2)}%
                    </div>
                    <div className="col-span-2 text-center font-mono text-yellow-400">
                      {leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%
                    </div>
                    <div className="col-span-2 flex justify-center">
                      <div className="group relative flex items-center">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${status.className}`}>
                          {status.label}
                        </span>
                        {verdictDef && (
                            <div className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-md border border-gray-700 bg-gray-950 p-2 text-xs text-gray-300 shadow-lg opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                                <strong className="font-semibold text-cyan-400">{verdictDef.title}</strong>
                                <p>{verdictDef.content}</p>
                            </div>
                        )}
                      </div>
                    </div>
                </div>
              </div>

              {/* Expanded Row Content */}
              {expandedRows.has(index) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-700/70 border-b border-gray-700/70">
                    {/* Column 1: Summary & Metrics */}
                    <div className="col-span-1 bg-gray-800 p-4">
                         <h3 className="text-md font-semibold text-cyan-400 mb-3">Analysis Summary</h3>
                         <p className="text-sm text-gray-300 mb-4">{leg.analysis.summary}</p>

                        <div className="space-y-3">
                           <div className="group relative">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-gray-400 flex items-center">Expected Value <InfoIcon className="h-3 w-3 ml-1.5" /></span>
                                   <span className="font-mono text-green-400">{leg.analysis.quantitative.expectedValue.toFixed(2)}%</span>
                               </div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.ev.title}</strong>
                                   <p>
                                     {metricDefinitions.ev.content.split(/(KM_\d{2})/).map((part, i) =>
                                       /KM_\d{2}/.test(part) ? (
                                         <span key={i} className="inline rounded font-mono bg-gray-700 text-cyan-300 px-1.5 py-0.5 mx-0.5">{part}</span>
                                       ) : (
                                         <Fragment key={i}>{part}</Fragment>
                                       )
                                     )}
                                   </p>
                               </div>
                           </div>
                           <div className="group relative">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-gray-400 flex items-center">Kelly Stake <InfoIcon className="h-3 w-3 ml-1.5" /></span>
                                   <span className="font-mono text-yellow-400">{leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</span>
                               </div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.kelly.title}</strong>
                                   <p>
                                     {metricDefinitions.kelly.content.split(/(KM_\d{2})/).map((part, i) =>
                                       /KM_\d{2}/.test(part) ? (
                                         <span key={i} className="inline rounded font-mono bg-gray-700 text-cyan-300 px-1.5 py-0.5 mx-0.5">{part}</span>
                                       ) : (
                                         <Fragment key={i}>{part}</Fragment>
                                       )
                                     )}
                                   </p>
                               </div>
                           </div>
                           <div className="group relative">
                                <div className="text-sm text-gray-400 mb-1 flex items-center">Confidence <InfoIcon className="h-3 w-3 ml-1.5" /></div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.confidence.title}</strong>
                                   <p>
                                     {metricDefinitions.confidence.content.split(/(KM_\d{2})/).map((part, i) =>
                                       /KM_\d{2}/.test(part) ? (
                                         <span key={i} className="inline rounded font-mono bg-gray-700 text-cyan-300 px-1.5 py-0.5 mx-0.5">{part}</span>
                                       ) : (
                                         <Fragment key={i}>{part}</Fragment>
                                       )
                                     )}
                                   </p>
                               </div>
                           </div>
                        </div>

                         <div className="mt-4">
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-400 mb-2">
                                <LineChartIcon className="h-4 w-4" />
                                7-Day Odds Movement
                            </h4>
                            <OddsLineChart data={historicalOddsData[index]} />
                        </div>
                    </div>

                    {/* Column 2: Key Drivers */}
                    <div className="col-span-1 bg-gray-800 p-4">
                        <h3 className="text-md font-semibold text-cyan-400 mb-3">Key Analytical Drivers</h3>
                        <div className="space-y-3">
                           {getKeyDrivers(leg).map(({ icon, tooltipData }) => (
                                <div 
                                    key={tooltipData.id} 
                                    id={`driver-${index}-${tooltipData.id}`} 
                                    className="group relative flex items-start gap-3 p-2 rounded-md hover:bg-gray-900/50 transition-all duration-300 cursor-pointer"
                                    onMouseEnter={() => {
                                        const stepsToHighlight = new Set(tooltipData.steps.map(s => s.step));
                                        setHighlightedSteps(stepsToHighlight);
                                    }}
                                    onMouseLeave={() => setHighlightedSteps(new Set())}
                                    onClick={() => {
                                        if (tooltipData.steps.length > 0) {
                                            handleJumpToStep(index, tooltipData.steps[0].step);
                                        }
                                    }}
                                >
                                    <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-md bg-gray-700 text-cyan-400">
                                       {icon}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-300">{tooltipData.domain}</p>
                                        <p className="text-xs text-gray-500">{tooltipData.description}</p>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute left-full top-0 ml-2 w-72 p-3 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                        <strong className="font-semibold text-cyan-400 flex items-center gap-2 mb-2 border-b border-gray-700 pb-1">
                                            {icon} {tooltipData.domain} ({tooltipData.id})
                                        </strong>
                                        <p className="mb-2 text-gray-400">{tooltipData.description}</p>
                                        <div className="space-y-1">
                                            {tooltipData.steps.map(step => (
                                                <div key={step.step}>
                                                    <button
                                                      onMouseEnter={() => setHighlightedSteps(new Set([step.step]))}
                                                      onMouseLeave={() => setHighlightedSteps(new Set(tooltipData.steps.map(s => s.step)))}
                                                      onClick={(e) => {
                                                          e.stopPropagation();
                                                          e.preventDefault();
                                                          handleJumpToStep(index, step.step);
                                                      }}
                                                      className="text-left w-full pointer-events-auto p-1 -m-1 rounded transition-colors hover:bg-gray-800"
                                                    >
                                                        <strong className="font-semibold text-cyan-400 hover:underline">Step {step.step}:</strong> <span className="text-gray-400">{step.description.substring(0, 40)}...</span>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                           ))}
                        </div>
                    </div>

                    {/* Column 3: Reasoning Deep-Dive */}
                    <div className="col-span-1 bg-gray-800 p-4 overflow-y-auto" style={{maxHeight: '400px'}}>
                        <h3 className="text-md font-semibold text-cyan-400 mb-3">Reasoning Deep-Dive</h3>
                         <div className="relative">
                            {/* Dotted line connecting steps */}
                            <div className="absolute left-4 top-2 bottom-2 w-px bg-gray-600 border-l border-dashed border-gray-600"></div>

                            <ul className="space-y-4">
                            {leg.analysis.reasoning.slice().reverse().map(step => (
                                <li 
                                    key={step.step}
                                    id={`step-${index}-${step.step}`}
                                    className={`relative pl-10 text-sm transition-all duration-300 rounded-md p-2 -ml-2
                                        ${highlightedSteps.has(step.step) ? 'bg-cyan-500/10' : ''}
                                    `}
                                >
                                <div className={`absolute left-4 top-4 -translate-x-1/2 h-2 w-2 rounded-full bg-gray-500 ring-4 ring-gray-800 transition-colors duration-300 ${highlightedSteps.has(step.step) ? 'bg-cyan-400' : ''}`}></div>
                                <strong className="text-gray-300">Step {step.step}:</strong> 
                                <span className="text-gray-400">
                                    <RenderReasoningText text={step.description} legIndex={index} onModuleClick={handleScrollToDriver} />
                                </span>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </div>
                </div>
              )}
            </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisTable;