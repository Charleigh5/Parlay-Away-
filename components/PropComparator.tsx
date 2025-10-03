
import React, { useState, useEffect } from 'react';
import { PropSelectionDetails, QuantitativeAnalysis } from '../types';
import { getAnalysis, getComparativeAnalysis } from '../services/geminiService';
import PropSelectorModal from './PropSelectorModal';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { formatAmericanOdds } from '../utils';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

type Slot = 'A' | 'B';

const PropSlot: React.FC<{
  prop: PropSelectionDetails | null;
  analysis: QuantitativeAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onSelect: () => void;
}> = ({ prop, analysis, isLoading, error, onSelect }) => {
  if (!prop) {
    return (
      <button
        onClick={onSelect}
        className="group flex h-full w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 p-12 text-center transition-colors hover:border-cyan-500 hover:bg-gray-800/60"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 transition-colors group-hover:bg-cyan-500/20">
          <PlusIcon className="h-8 w-8 text-cyan-400" />
        </div>
        <h3 className="mt-4 text-xl font-semibold text-gray-200">Select Prop</h3>
        <p className="mt-2 text-gray-400">Choose a player prop to analyze.</p>
      </button>
    );
  }

  const { player, prop: propData, selectedLine, selectedPosition } = prop;
  const marketOdds = selectedPosition === 'Over' ? selectedLine.overOdds : selectedLine.underOdds;

  return (
    <div className="flex h-full w-full flex-col rounded-xl border border-gray-700/80 bg-gray-900/40 p-6">
      <div className="flex-1">
        <p className="text-sm text-gray-400">{prop.game.name}</p>
        <h3 className="text-2xl font-bold text-gray-100">{player.name}</h3>
        <p className="mt-1 text-lg text-cyan-300">{`${selectedPosition} ${selectedLine.line} ${propData.propType}`}</p>
        <p className="font-mono text-xl font-semibold text-gray-300">{formatAmericanOdds(marketOdds)}</p>
        <button onClick={onSelect} className="mt-3 text-sm text-cyan-400 hover:underline">Change Selection</button>
      </div>

      <div className="mt-6 border-t border-gray-700/50 pt-4">
        <h4 className="text-md font-semibold text-gray-300 mb-3">Quantitative Analysis</h4>
        {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
                Analyzing...
            </div>
        )}
        {error && <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">{error}</div>}
        {analysis && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-400">Expected Value (+EV)</div>
                <div className={`text-right font-mono text-lg font-bold ${analysis.expectedValue > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {analysis.expectedValue.toFixed(2)}%
                </div>
                <div className="text-gray-400">Projected Mean</div>
                <div className="text-right font-mono text-gray-200">{analysis.projectedMean?.toFixed(2) ?? 'N/A'}</div>
                <div className="col-span-2 mt-1 flex justify-between items-baseline">
                    <div className="text-gray-400">Confidence</div>
                    <div className="font-mono text-gray-200">{(analysis.confidenceScore * 100).toFixed(0)}%</div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 col-span-2">
                    <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${analysis.confidenceScore * 100}%` }}></div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const PropComparator: React.FC = () => {
  const [propA, setPropA] = useState<PropSelectionDetails | null>(null);
  const [analysisA, setAnalysisA] = useState<QuantitativeAnalysis | null>(null);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);

  const [propB, setPropB] = useState<PropSelectionDetails | null>(null);
  const [analysisB, setAnalysisB] = useState<QuantitativeAnalysis | null>(null);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [errorB, setErrorB] = useState<string | null>(null);

  const [comparativeAnalysis, setComparativeAnalysis] = useState<string | null>(null);
  const [isComparativeLoading, setIsComparativeLoading] = useState(false);
  const [comparativeError, setComparativeError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

  const handleSelectClick = (slot: Slot) => {
    setActiveSlot(slot);
    setIsModalOpen(true);
  };

  const handlePropSelected = (selection: PropSelectionDetails) => {
    if (activeSlot === 'A') {
      setPropA(selection);
      setAnalysisA(null);
      setErrorA(null);
    } else {
      setPropB(selection);
      setAnalysisB(null);
      setErrorB(null);
    }
    setIsModalOpen(false);
    setActiveSlot(null);
  };

  const runAnalysis = async (prop: PropSelectionDetails, slot: Slot) => {
    if (slot === 'A') setIsLoadingA(true);
    else setIsLoadingB(true);

    try {
      const { player, prop: propData, selectedLine, selectedPosition } = prop;
      const marketOdds = selectedPosition === 'Over' ? selectedLine.overOdds : selectedLine.underOdds;
      const query = `Analyze the prop bet: ${player.name} ${selectedPosition} ${selectedLine.line} ${propData.propType} at ${marketOdds} odds.`;
      const response = await getAnalysis(query);

      if (slot === 'A') setAnalysisA(response.quantitative);
      else setAnalysisB(response.quantitative);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed.";
      if (slot === 'A') setErrorA(message);
      else setErrorB(message);
    } finally {
      if (slot === 'A') setIsLoadingA(false);
      else setIsLoadingB(false);
    }
  };

  useEffect(() => {
    if (propA) runAnalysis(propA, 'A');
  }, [propA]);

  useEffect(() => {
    if (propB) runAnalysis(propB, 'B');
  }, [propB]);

  useEffect(() => {
    setComparativeAnalysis(null);
    setComparativeError(null);
    if (propA && analysisA && propB && analysisB) {
      const runComparativeAnalysis = async () => {
        setIsComparativeLoading(true);
        try {
            const oddsA = propA.selectedPosition === 'Over' ? propA.selectedLine.overOdds : propA.selectedLine.underOdds;
            const propADetails = `${propA.player.name} ${propA.selectedPosition} ${propA.selectedLine.line} ${propA.prop.propType} (${formatAmericanOdds(oddsA)}) with EV ${analysisA.expectedValue.toFixed(2)}% and Confidence: ${(analysisA.confidenceScore * 100).toFixed(0)}%`;
            
            const oddsB = propB.selectedPosition === 'Over' ? propB.selectedLine.overOdds : propB.selectedLine.underOdds;
            const propBDetails = `${propB.player.name} ${propB.selectedPosition} ${propB.selectedLine.line} ${propB.prop.propType} (${formatAmericanOdds(oddsB)}) with EV ${analysisB.expectedValue.toFixed(2)}% and Confidence: ${(analysisB.confidenceScore * 100).toFixed(0)}%`;

            const result = await getComparativeAnalysis(propADetails, propBDetails);
            setComparativeAnalysis(result);
        } catch (err) {
            setComparativeError(err instanceof Error ? err.message : "Failed to get comparative analysis.");
        } finally {
            setIsComparativeLoading(false);
        }
      };
      runComparativeAnalysis();
    }
  }, [analysisA, analysisB, propA, propB]);

  return (
    <div className="flex h-full w-full flex-col p-4 md:p-6 lg:p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-100">Prop Comparator</h2>
        <p className="text-gray-400">Select two props for a side-by-side AI-powered analysis.</p>
      </div>
      <div className="flex flex-1 flex-col lg:flex-row items-stretch gap-6">
        <div className="w-full lg:w-5/12">
          <PropSlot prop={propA} analysis={analysisA} isLoading={isLoadingA} error={errorA} onSelect={() => handleSelectClick('A')} />
        </div>
        
        <div className="flex w-full lg:w-2/12 flex-col items-center justify-center text-center px-4">
            <div className="text-3xl font-bold text-gray-500 mb-4">VS</div>
            {(analysisA && analysisB) && (
                <div className="w-full">
                    {isComparativeLoading && (
                         <div className="flex flex-col items-center gap-2 text-sm text-gray-400">
                            <BrainCircuitIcon className="h-6 w-6 text-cyan-400 animate-pulse" />
                            Arbiter is comparing...
                        </div>
                    )}
                    {comparativeError && <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded-md">{comparativeError}</div>}
                    {comparativeAnalysis && (
                        <div className="p-4 rounded-lg bg-gray-800/70 border border-cyan-500/30 animate-fade-in">
                            <h4 className="flex items-center justify-center gap-2 text-md font-semibold text-cyan-300 mb-2">
                                <SparklesIcon className="h-5 w-5" />
                                AI Arbiter Verdict
                            </h4>
                            <p className="text-sm text-gray-300 whitespace-pre-wrap">{comparativeAnalysis}</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="w-full lg:w-5/12">
          <PropSlot prop={propB} analysis={analysisB} isLoading={isLoadingB} error={errorB} onSelect={() => handleSelectClick('B')} />
        </div>
      </div>
      {isModalOpen && (
        <PropSelectorModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handlePropSelected}
        />
      )}
    </div>
  );
};

export default PropComparator;
