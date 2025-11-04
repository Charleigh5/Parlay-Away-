import React from 'react';
import { DeepAnalysisResult, DeepAnalysisCriterion, CriterionCategory, DataFreshnessStatus } from '../types';
import { BarChartIcon, LandmarkIcon, LinkIcon, TargetIcon, UsersIcon } from './icons';

const getCategoryIcon = (category: CriterionCategory): React.ReactNode => {
    const props = { className: 'h-5 w-5' };
    switch (category) {
        case 'Statistical': return <BarChartIcon {...props} />;
        case 'Situational': return <LandmarkIcon {...props} />;
        case 'Market': return <UsersIcon {...props} />;
        case 'Correlation': return <LinkIcon {...props} />;
        default: return null;
    }
};

const getStatusIndicator = (status: DataFreshnessStatus) => {
    switch (status) {
        case 'live': return <div className="w-2 h-2 rounded-full bg-green-500" title="Live Data"></div>;
        case 'cached': return <div className="w-2 h-2 rounded-full bg-cyan-500" title="Cached Data (Fresh)"></div>;
        case 'stale': return <div className="w-2 h-2 rounded-full bg-yellow-500" title="Stale Data"></div>;
        case 'unavailable': return <div className="w-2 h-2 rounded-full bg-red-500" title="Data Unavailable"></div>;
    }
};

const CriterionRow: React.FC<{ criterion: DeepAnalysisCriterion }> = ({ criterion }) => {
    const scoreColor = criterion.score > 0 ? 'text-green-400' : 'text-red-400';
    const scoreBg = criterion.score > 0 ? 'bg-green-500/20' : 'bg-red-500/20';
    return (
        <div className="py-3 px-4 even:bg-gray-800/40 rounded-md">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    {getStatusIndicator(criterion.status)}
                    <span className="text-sm text-gray-300">{criterion.name}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-cyan-300">{criterion.value}</span>
                    <span className={`text-sm font-bold font-mono w-12 text-center py-0.5 rounded-md ${scoreBg} ${scoreColor}`}>
                        {criterion.score > 0 ? `+${criterion.score}` : criterion.score}
                    </span>
                </div>
            </div>
            <p className="text-xs text-gray-400 mt-1 pl-4">{criterion.rationale}</p>
        </div>
    );
};

interface DeepAnalysisDrilldownProps {
    analysisResult: DeepAnalysisResult | null;
    isLoading: boolean;
    error: string | null;
}

const DeepAnalysisDrilldown: React.FC<DeepAnalysisDrilldownProps> = ({ analysisResult, isLoading, error }) => {
    if (isLoading) {
        return <div className="p-4 text-center text-gray-400">Performing deep analysis...</div>;
    }
    if (error) {
        return <div className="p-4 text-center text-red-400">{error}</div>;
    }
    if (!analysisResult) {
        return null;
    }

    const { overallScore, breakdown } = analysisResult;
    const scoreColor = overallScore > 50 ? 'text-green-400' : 'text-yellow-400';

    return (
        <div className="rounded-lg bg-gray-900/50 border border-gray-700/50 p-4 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                    <TargetIcon className="h-5 w-5 text-cyan-400" />
                    Deep Analysis Breakdown
                </h3>
                <div className="text-right">
                    <p className="text-sm text-gray-400">Overall Score</p>
                    <p className={`text-3xl font-bold font-mono ${scoreColor}`}>{overallScore.toFixed(0)}</p>
                </div>
            </div>

            <div className="space-y-4">
                {breakdown.map(categoryItem => (
                    <div key={categoryItem.category}>
                        <h4 className={`flex items-center gap-2 text-md font-semibold mb-2 text-cyan-300`}>
                            {getCategoryIcon(categoryItem.category)}
                            {categoryItem.category}
                        </h4>
                        <div className="space-y-1 bg-gray-900/50 rounded-lg border border-gray-700/50">
                            {categoryItem.criteria.map(criterion => (
                                <CriterionRow key={criterion.name} criterion={criterion} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DeepAnalysisDrilldown;
