// FIX: Imported `useState` from React to resolve a reference error for the hook and a related JSX namespace issue.
import React, { useState, Fragment, useMemo } from 'react';
import { AnalyzedBetLeg, QuantitativeAnalysis, ReasoningStep } from '../types';
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


interface AnalysisTableProps {
  legs: AnalyzedBetLeg[];
  onReset: () => void;
}

// Helper function to format American odds
const formatAmericanOdds = (odds: number): string => {
  const roundedOdds = Math.round(odds);
  return roundedOdds > 0 ? `+${roundedOdds}` : `${roundedOdds}`;
};

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

// Generates plausible-looking historical odds for demonstration
const generateHistoricalOdds = (currentOdds: number): number[] => {
  const oddsHistory = [currentOdds];
  let lastOdd = currentOdds;
  for (let i = 0; i < 6; i++) {
    const change = (Math.floor(Math.random() * 3) - 1) * 5; // Fluctuate by -5, 0, or 5
    let nextOdd = lastOdd + change;
    if (Math.random() > 0.7) { // Add occasional larger shifts
      nextOdd += (Math.floor(Math.random() * 3) - 1) * 5;
    }
    oddsHistory.unshift(nextOdd);
    lastOdd = nextOdd;
  }
  return oddsHistory; // Returns 7 days of data, ending with current
};

const OddsLineChart: React.FC<{ data: number[] }> = ({ data }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: number; index: number } | null>(null);
  const width = 200;
  const height = 60;
  const paddingTop = 10;
  const paddingBottom = 15;
  const paddingX = 5;

  const points = useMemo(() => {
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const valueRange = maxVal - minVal;

    return data.map((d, i) => {
      const x = (i / (data.length - 1)) * (width - paddingX * 2) + paddingX;
      const y = height - (((d - minVal) / (valueRange || 1)) * (height - paddingTop - paddingBottom) + paddingBottom);
      return { x, y, value: d };
    });
  }, [data]);

  const path = points.map(p => `${p.x},${p.y}`).join(' ');
  
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const svgX = (mouseX / rect.width) * width; // Convert to SVG coordinate space

    let closestPointIndex = -1;
    let minDistance = Infinity;

    points.forEach((point, index) => {
        const distance = Math.abs(point.x - svgX);
        if (distance < minDistance) {
            minDistance = distance;
            closestPointIndex = index;
        }
    });

    if (closestPointIndex !== -1) {
        const p = points[closestPointIndex];
        setTooltip({ x: p.x, y: p.y, value: p.value, index: closestPointIndex });
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };
  
  const getDayLabel = (index: number) => {
    const daysAgo = data.length - 1 - index;
    if (daysAgo === 0) return "Today";
    if (daysAgo === 1) return "1d ago";
    return `${daysAgo}d ago`;
  };

  return (
    <div className="relative">
      {tooltip && (
        <div 
          className="absolute z-10 p-2 text-xs font-semibold text-gray-200 bg-gray-950 border border-gray-700 rounded-md shadow-lg pointer-events-none"
          style={{
            left: `${(tooltip.x / width) * 100}%`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -120%)',
          }}
        >
            <div className="font-mono text-cyan-400">{formatAmericanOdds(tooltip.value)}</div>
            <div className="text-gray-500 text-center">{getDayLabel(tooltip.index)}</div>
        </div>
      )}
      <svg 
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-auto cursor-crosshair text-cyan-500"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.25" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          fill="url(#sparkline-gradient)"
          points={`${points[0].x},${height} ${path} ${points[points.length - 1].x},${height}`}
        />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points={path}
        />
        {tooltip ? (
            <circle cx={tooltip.x} cy={tooltip.y} r="3" fill="currentColor" className="text-cyan-300" stroke="rgba(107, 222, 237, 0.3)" strokeWidth="2" />
        ) : (
            <circle cx={points[points.length-1].x} cy={points[points.length-1].y} r="2.5" fill="currentColor" className="text-cyan-400" />
        )}
      </svg>
      <div className="flex justify-between text-xs text-gray-500 font-mono" style={{ paddingLeft: `${paddingX}px`, paddingRight: `${paddingX}px` }}>
        <span>{formatAmericanOdds(Math.min(...data))}</span>
        <span>{formatAmericanOdds(Math.max(...data))}</span>
      </div>
    </div>
  );
};


const AnalysisTable: React.FC<AnalysisTableProps> = ({ legs, onReset }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [highlightedSteps, setHighlightedSteps] = useState<Set<number>>(new Set());
  
  const historicalOddsData = useMemo(() => {
    return legs.map(leg => generateHistoricalOdds(leg.marketOdds));
  }, [legs]);

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
        <h2 className="text-xl font-semibold text-gray-200">Synoptic Lens Analysis</h2>
        <button
          onClick={onReset}
          className="flex items-center gap-2 rounded-md bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
        >
          <RotateCwIcon className="h-4 w-4" />
          New Analysis
        </button>
      </div>

      <div className="w-full min-w-[700px] rounded-lg border border-gray-700 bg-gray-900/50">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b border-gray-700 p-3 text-xs font-semibold uppercase text-gray-400">
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
              {/* Collapsed Row */}
              <div
                onClick={() => handleToggleRow(index)}
                className={`grid cursor-pointer grid-cols-12 items-center gap-4 p-3 transition-colors ${
                  !expandedRows.has(index) ? 'hover:bg-gray-800/50' : 'bg-gray-800/60'
                } ${index < legs.length - 1 ? 'border-b border-gray-700/70' : ''}`}
              >
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
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.ev.title}</strong><p>{metricDefinitions.ev.content}</p>
                               </div>
                           </div>
                           <div className="group relative">
                               <div className="flex justify-between items-center text-sm">
                                   <span className="text-gray-400 flex items-center">Kelly Stake <InfoIcon className="h-3 w-3 ml-1.5" /></span>
                                   <span className="font-mono text-yellow-400">{leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</span>
                               </div>
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.kelly.title}</strong><p>{metricDefinitions.kelly.content}</p>
                               </div>
                           </div>
                           <div className="group relative">
                                <div className="text-sm text-gray-400 mb-1 flex items-center">Confidence <InfoIcon className="h-3 w-3 ml-1.5" /></div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
                                </div>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-950 text-xs text-gray-300 border border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                   <strong className="font-semibold text-cyan-400">{metricDefinitions.confidence.title}</strong><p>{metricDefinitions.confidence.content}</p>
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
                                        <p className="mb-2">{tooltipData.description}</p>
                                        <div className="space-y-1.5">
                                            {tooltipData.steps.map(step => (
                                                <div key={step.step}>
                                                    <button onClick={(e) => { e.stopPropagation(); handleJumpToStep(index, step.step); }} className="font-semibold text-gray-200 hover:underline">
                                                        Step {step.step}:
                                                    </button>
                                                    <p className="text-gray-400 text-xs">{step.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Column 3: Reasoning Deep-Dive */}
                     <div id={`reasoning-section-${index}`} className="col-span-1 bg-gray-800 p-4 flex flex-col">
                        <h3 className="text-md font-semibold text-cyan-400 mb-3 shrink-0">Reasoning Deep-Dive</h3>
                        <div className="overflow-y-auto space-y-3 pr-2 flex-grow max-h-96">
                            {leg.analysis.reasoning.map(step => {
                                const isHighlighted = highlightedSteps.has(step.step);
                                return (
                                    <div key={step.step} id={`step-${index}-${step.step}`} className={`p-2 rounded-md transition-colors duration-300 ${isHighlighted ? 'bg-cyan-900/50' : 'bg-gray-900/50'}`}>
                                        <div className="text-sm text-gray-300 leading-relaxed">
                                            <strong className="text-gray-300 block mb-1">Step {step.step}:</strong>
                                            <RenderReasoningText 
                                                text={step.description}
                                                legIndex={index}
                                                onModuleClick={handleScrollToDriver}
                                            />
                                            {step.activatedModules.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {step.activatedModules.map(modId => (
                                                        <button
                                                            key={modId}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleScrollToDriver(index, modId);
                                                            }}
                                                            className="text-xs font-mono bg-gray-700 text-cyan-300 px-2 py-0.5 rounded-full transition-colors hover:bg-gray-600 hover:text-cyan-200 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                                                            title={`Jump to driver ${modId}`}
                                                        >
                                                            {modId}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              )}
            </Fragment>
          )})}
        </div>
      </div>
    </div>
  );
};

export default AnalysisTable;