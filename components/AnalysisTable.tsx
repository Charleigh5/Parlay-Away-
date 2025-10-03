
import React, { useState, Fragment, useMemo } from 'react';
import { AnalyzedBetLeg, QuantitativeAnalysis, ReasoningStep, ExtractedBetLeg, KnowledgeModule } from '../types';
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
import { LayersIcon } from './icons/LayersIcon';
import { OddsLineChart } from './OddsLineChart';
import { MaximizeIcon } from './icons/MaximizeIcon';
import { TargetIcon } from './icons/TargetIcon';
import { CrosshairIcon } from './icons/CrosshairIcon';
import MicroPerformanceChart from './MicroPerformanceChart';


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
    return { label: 'Positive Lean' as const, className: 'bg-cyan-500/10 text-cyan-400' };
  }
  return { label: 'Consider' as const, className: 'bg-gray-700/60 text-gray-300' };
};

// FIX: Refactored `iconMap` to store component references instead of
// instantiated elements. Rendering the component directly is cleaner and more type-safe.
const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  'Financial Theory': DollarSignIcon,
  'Advanced Player Metrics': TrendingUpIcon,
  'Coaching Scheme DNA': UsersIcon,
  'Market Psychology': InfoIcon,
  'Injury Impact Analysis': HeartPulseIcon,
};

const ModuleInfo: React.FC<{ module: KnowledgeModule }> = ({ module }) => {
  const IconComponent = iconMap[module.domain];

  return (
    <div key={module.id} className="group relative flex items-start gap-3 rounded-lg bg-gray-900/40 p-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gray-700/50 text-cyan-400">
        {IconComponent && <IconComponent className="h-5 w-5" />}
      </div>
      <div>
        <p className="font-medium text-gray-200">{module.domain}</p>
        <p className="text-sm text-gray-400">{module.description}</p>
      </div>
    </div>
  );
};


const AnalysisRow: React.FC<{ leg: AnalyzedBetLeg }> = ({ leg }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = getStatus(leg.analysis.quantitative);
  
  const activatedModules = useMemo(() => {
    const moduleIds = new Set(leg.analysis.reasoning.flatMap(step => step.activatedModules));
    return KNOWLEDGE_MODULES.filter(module => moduleIds.has(module.id));
  }, [leg.analysis.reasoning]);

  const historicalOdds = useMemo(() => generateHistoricalOdds(leg.marketOdds), [leg.marketOdds]);

  return (
    <Fragment>
      <tr className="border-b border-gray-700/50 hover:bg-gray-800/40">
        <td className="p-4 align-top">
          <div className="font-semibold text-gray-100">{leg.player}</div>
          <div className="text-sm text-gray-400">{`${leg.position} ${leg.line} ${leg.propType}`}</div>
        </td>
        <td className="p-4 align-top font-mono text-center text-gray-200">{formatAmericanOdds(leg.marketOdds)}</td>
        <td className="p-4 align-top font-mono text-center">
            <span className={`px-2 py-1 text-xs font-semibold rounded-md ${status.className}`}>{status.label}</span>
        </td>
        <td className={`p-4 align-top font-mono text-center font-bold text-lg ${leg.analysis.quantitative.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {leg.analysis.quantitative.expectedValue.toFixed(2)}%
        </td>
        <td className="p-4 align-top text-center">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${leg.analysis.quantitative.confidenceScore * 100}%` }}></div>
            </div>
        </td>
        <td className="p-4 align-top text-center">
          <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 text-gray-400 hover:text-cyan-400">
            <ChevronDownIcon className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-900/30">
          <td colSpan={6} className="p-0">
            <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                {/* Left side: Reasoning and Summary */}
                <div className="lg:col-span-7 space-y-4">
                    <div>
                        <h4 className="flex items-center gap-2 text-md font-semibold text-gray-200 mb-2">
                            <ShieldCheckIcon className="h-5 w-5 text-cyan-400" />
                            Analyst Summary
                        </h4>
                        <p className="text-sm text-gray-400 italic bg-gray-800/50 p-3 rounded-lg">{leg.analysis.summary}</p>
                    </div>
                     <div>
                        <h4 className="flex items-center gap-2 text-md font-semibold text-gray-200 mb-2">
                            <LayersIcon className="h-5 w-5 text-cyan-400" />
                            Activated Knowledge Modules
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {activatedModules.map(mod => <ModuleInfo key={mod.id} module={mod} />)}
                        </div>
                    </div>
                </div>

                {/* Right side: Projections and Market data */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/50">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                            <TargetIcon className="h-4 w-4 text-cyan-400" />
                            Core Projections
                        </h4>
                         <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="text-gray-400">Projected Mean</div>
                            <div className="font-mono text-cyan-300 text-right">{leg.analysis.quantitative.projectedMean?.toFixed(2) ?? 'N/A'}</div>
                            <div className="text-gray-400">Std. Deviation</div>
                            <div className="font-mono text-gray-200 text-right">{leg.analysis.quantitative.projectedStdDev?.toFixed(2) ?? 'N/A'}</div>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/50">
                         <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                            <CrosshairIcon className="h-4 w-4 text-cyan-400" />
                            True Odds & Stake
                        </h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <div className="text-gray-400">Vig-Removed Odds</div>
                            <div className="font-mono text-gray-200 text-right">{formatAmericanOdds(leg.analysis.quantitative.vigRemovedOdds)}</div>
                            <div className="text-gray-400">Kelly Stake</div>
                            <div className="font-mono text-yellow-400 text-right">{leg.analysis.quantitative.kellyCriterionStake.toFixed(2)}%</div>
                        </div>
                    </div>
                     <div className="p-3 rounded-lg border border-gray-700/50 bg-gray-800/50">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-300 mb-2">
                            <LineChartIcon className="h-4 w-4 text-cyan-400" />
                            Odds Movement (7d)
                        </h4>
                        <OddsLineChart data={historicalOdds} />
                    </div>
                </div>
            </div>
          </td>
        </tr>
      )}
    </Fragment>
  );
};

const ParlaySummary: React.FC<{ legs: AnalyzedBetLeg[] }> = ({ legs }) => {
    const parlayOdds = useMemo(() => calculateParlayOdds(legs), [legs]);
    const parlayEV = useMemo(() => calculateParlayEV(legs), [legs]);
    const parlayConfidence = useMemo(() => calculateParlayConfidence(legs), [legs]);

    return (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700/50">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-200 mb-3">
                <LayersIcon className="h-5 w-5 text-cyan-400" />
                Parlay Analysis
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center bg-gray-800 p-3 rounded-md">
                    <div className="text-sm text-gray-400">Total Odds</div>
                    <div className="text-2xl font-bold font-mono text-cyan-300">{formatAmericanOdds(parlayOdds)}</div>
                </div>
                <div className="text-center bg-gray-800 p-3 rounded-md">
                    <div className="text-sm text-gray-400">Expected Value</div>
                    <div className={`text-2xl font-bold font-mono ${parlayEV > 0 ? 'text-green-400' : 'text-red-400'}`}>{parlayEV.toFixed(2)}%</div>
                </div>
                <div className="text-center bg-gray-800 p-3 rounded-md col-span-2 lg:col-span-1 flex flex-col items-center justify-center">
                    <div className="text-sm text-gray-400 mb-1">Overall Confidence</div>
                    <RadialProgress progress={parlayConfidence} size={60} strokeWidth={6} />
                </div>
                 <div className="text-center bg-gray-800 p-3 rounded-md col-span-2 lg:col-span-1 flex flex-col items-center justify-center">
                    <div className="text-sm text-gray-400">Legs</div>
                    <div className="text-2xl font-bold font-mono text-gray-200">{legs.length}</div>
                </div>
            </div>
        </div>
    )
}

const AnalysisTable: React.FC<AnalysisTableProps> = ({ legs, originalLegs, imageUrl, onViewImage, onReset }) => {
    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-100">Analysis Complete</h2>
                    <p className="text-gray-400">
                        {legs.length} leg(s) analyzed. {originalLegs && originalLegs.length > legs.length && `${originalLegs.length - legs.length} leg(s) failed.`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {imageUrl && onViewImage && (
                        <button onClick={onViewImage} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-gray-700/70 hover:bg-gray-700 text-gray-300 transition-colors">
                            <MaximizeIcon className="h-4 w-4" /> View Slip
                        </button>
                    )}
                    <button onClick={onReset} className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-md bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 transition-colors">
                        <RotateCwIcon className="h-4 w-4" /> New Analysis
                    </button>
                </div>
            </div>
            
            {legs.length > 1 && <div className="mb-4"><ParlaySummary legs={legs} /></div>}

            <div className="overflow-x-auto rounded-lg border border-gray-700/50 bg-gray-800/20">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="bg-gray-800/50 text-xs text-gray-400 uppercase">
                        <tr>
                            <th scope="col" className="p-4">Proposition</th>
                            <th scope="col" className="p-4 text-center">Odds</th>
                            <th scope="col" className="p-4 text-center">Status</th>
                            <th scope="col" className="p-4 text-center">+EV</th>
                            <th scope="col" className="p-4 text-center">Confidence</th>
                            <th scope="col" className="p-4 text-center">Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {legs.map((leg, index) => (
                            <AnalysisRow key={`${leg.player}-${leg.propType}-${index}`} leg={leg} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default AnalysisTable;
