
import React, { useState } from 'react';
import { PropSelectionDetails, MarketAnalysis, DeepAnalysisResult } from '../types';
import { getMarketAnalysis, getDeepAnalysis } from '../services/betAnalysisService';
import PropSelectorModal from './PropSelectorModal';
import MarketAnalysisChart from './MarketAnalysisChart';
import HistoricalPerformanceChart from './HistoricalPerformanceChart';
import DeepAnalysisDrilldown from './DeepAnalysisDrilldown';
import { TestTubeIcon } from './icons/TestTubeIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { formatAmericanOdds } from '../utils';

const SynopticLens: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProp, setSelectedProp] = useState<PropSelectionDetails | null>(null);

    const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis | null>(null);
    const [isMarketLoading, setIsMarketLoading] = useState(false);
    const [marketError, setMarketError] = useState<string | null>(null);

    const [deepAnalysis, setDeepAnalysis] = useState<DeepAnalysisResult | null>(null);
    const [isDeepLoading, setIsDeepLoading] = useState(false);
    const [deepError, setDeepError] = useState<string | null>(null);

    const handlePropSelected = async (selection: PropSelectionDetails) => {
        setIsModalOpen(false);
        setSelectedProp(selection);

        // Reset analyses
        setMarketAnalysis(null);
        setDeepAnalysis(null);
        setMarketError(null);
        setDeepError(null);

        // Fetch market analysis
        setIsMarketLoading(true);
        const marketResponse = await getMarketAnalysis(selection);
        if (marketResponse.data) {
            setMarketAnalysis(marketResponse.data);
        } else {
            setMarketError(marketResponse.error || 'Failed to fetch market analysis.');
        }
        setIsMarketLoading(false);
    };

    const handleRunDeepAnalysis = async () => {
        if (!selectedProp) return;
        setIsDeepLoading(true);
        setDeepError(null);
        const deepResponse = await getDeepAnalysis(selectedProp);
        if (deepResponse.data) {
            setDeepAnalysis(deepResponse.data);
        } else {
            setDeepError(deepResponse.error || 'Failed to perform deep analysis.');
        }
        setIsDeepLoading(false);
    };

    const renderWelcomeScreen = () => (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-fade-in">
            <TestTubeIcon className="h-16 w-16 text-gray-600" />
            <h2 className="mt-4 text-3xl font-bold text-gray-200">Synoptic Lens</h2>
            <p className="mt-2 max-w-md text-gray-400">
                Select a player prop to begin a comprehensive, multi-layered analysis. The Lens synthesizes market data, statistical trends, and situational factors into a single, actionable view.
            </p>
            <button
                onClick={() => setIsModalOpen(true)}
                className="mt-8 flex items-center gap-2 rounded-md bg-cyan-500 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-cyan-600"
            >
                Select Prop to Analyze
            </button>
        </div>
    );
    
    if (!selectedProp) {
        return (
            <>
                {renderWelcomeScreen()}
                <PropSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handlePropSelected} />
            </>
        );
    }
    
    const { player, prop, selectedLine, selectedPosition } = selectedProp;
    const marketOdds = selectedPosition === 'Over' ? selectedLine.overOdds : selectedLine.underOdds;

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-6">
            <header>
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-sm text-gray-400">{selectedProp.game.name}</p>
                        <h2 className="text-3xl font-bold text-gray-100">{player.name}</h2>
                        <p className="text-xl text-cyan-300">{`${selectedPosition} ${selectedLine.line} ${prop.propType}`}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg text-gray-400">Market Odds</p>
                        <p className="text-4xl font-bold font-mono text-gray-100">{formatAmericanOdds(marketOdds)}</p>
                        <button onClick={() => setIsModalOpen(true)} className="mt-2 text-sm text-cyan-400 hover:underline">
                            Change Selection
                        </button>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Market & Historical */}
                <div className="space-y-6">
                    <div className="rounded-lg bg-gray-900/50 border border-gray-700/50 p-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Market Analysis</h3>
                        {isMarketLoading && <p className="text-gray-400">Loading market data...</p>}
                        {marketError && <p className="text-red-400">{marketError}</p>}
                        {marketAnalysis && <MarketAnalysisChart marketAnalysis={marketAnalysis} />}
                    </div>
                    <div className="rounded-lg bg-gray-900/50 border border-gray-700/50 p-4">
                        <h3 className="text-lg font-semibold text-gray-200 mb-2">Historical Performance (Last 7 Games)</h3>
                        {prop.historicalContext && (
                            <HistoricalPerformanceChart 
                                gameLog={prop.historicalContext.gameLog}
                                selectedLine={selectedLine.line}
                                seasonAvg={prop.historicalContext.seasonAvg}
                                last5Avg={prop.historicalContext.last5Avg}
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: Deep Analysis */}
                <div className="space-y-6">
                    <div className="rounded-lg bg-gray-800/60 border-2 border-dashed border-gray-700 p-6 flex flex-col items-center justify-center text-center">
                        <SparklesIcon className="h-8 w-8 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-gray-200 mt-2">AI Deep Analysis</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-sm">
                            Synthesize all available data points into a single, weighted score and a detailed rationale.
                        </p>
                        <button
                            onClick={handleRunDeepAnalysis}
                            disabled={isDeepLoading}
                            className="mt-4 flex items-center gap-2 rounded-md bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-300 transition-colors hover:bg-cyan-500/30 disabled:opacity-50"
                        >
                            {isDeepLoading ? 'Analyzing...' : 'Run Deep Analysis'}
                        </button>
                    </div>

                    <DeepAnalysisDrilldown
                        analysisResult={deepAnalysis}
                        isLoading={isDeepLoading}
                        error={deepError}
                    />
                </div>
            </div>
            
            <PropSelectorModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSelect={handlePropSelected} />
        </div>
    );
};

export default SynopticLens;
