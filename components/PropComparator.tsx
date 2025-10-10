import React, { useState, useEffect } from 'react';
import { PropSelectionDetails, QuantitativeAnalysis } from '../types';
import { getAnalysis, getComparativeAnalysis } from '../services/geminiService';
import PropSelectorModal from './PropSelectorModal';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { formatAmericanOdds } from '../utils';
import { BrainCircuitIcon } from './icons/BrainCircuitIcon';

type Slot = 'A' | 'B';

// PropSlot component to display individual prop information and analysis
const PropSlot: React.FC<{
  prop: PropSelectionDetails | null;
  analysis: QuantitativeAnalysis | null;
  isLoading: boolean;
  error: string | null;
  onSelect: () => void;
}> = ({ prop, analysis, isLoading, error, onSelect }) => {
  // Render the "Select Prop" button if no prop is selected
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

  // Render the detailed prop view with analysis
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

// Main PropComparator component
const PropComparator: React.FC = () => {
  // State for Prop A
  const [propA, setPropA] = useState<PropSelectionDetails | null>(null);
  const [analysisA, setAnalysisA] = useState<QuantitativeAnalysis | null>(null);
  const [isLoadingA, setIsLoadingA] = useState(false);
  const [errorA, setErrorA] = useState<string | null>(null);

  // State for Prop B
  const [propB, setPropB] = useState<PropSelectionDetails | null>(null);
  const [analysisB, setAnalysisB] = useState<QuantitativeAnalysis | null>(null);
  const [isLoadingB, setIsLoadingB] = useState(false);
  const [errorB, setErrorB] = useState<string | null>(null);

  // State for comparative analysis
  const [comparativeAnalysis, setComparativeAnalysis] = useState<string | null>(null);
  const [isComparativeLoading, setIsComparativeLoading] = useState(false);
  const [comparativeError, setComparativeError] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<Slot | null>(null);

  const handleSelectClick = (slot: Slot) => {
    setActiveSlot(slot);
    setIsModalOpen(true);
  };

  // This handler is called from the modal when a prop is selected.
  // It is responsible for setting the prop details for the correct slot (A or B),
  // resetting any previous analysis for that slot, and triggering a new analysis.
  const handlePropSelected = async (selection: PropSelectionDetails) => {
    setIsModalOpen(false);
    
    // Crucially, reset the *comparative* analysis state whenever a prop changes
    // to prevent displaying a stale or irrelevant verdict.
    setComparativeAnalysis(null);
    setComparativeError(null);
    setIsComparativeLoading(false);

    const { player, prop, selectedLine, selectedPosition } = selection;
    const marketOdds = selectedPosition === 'Over' ? selectedLine.overOdds : selectedLine.underOdds;
    const query = `Analyze the prop bet: ${player.name} ${selectedPosition} ${selectedLine.line} ${prop.propType} at ${formatAmericanOdds(marketOdds)} odds.`;

    // Process analysis for Slot A
    if (activeSlot === 'A') {
      setPropA(selection);
      setAnalysisA(null);
      setErrorA(null);
      setIsLoadingA(true);
      try {
        const result = await getAnalysis(query);
        setAnalysisA(result.quantitative);
      } catch (err) {
        setErrorA(err instanceof Error ? err.message : 'Analysis failed.');
      } finally {
        setIsLoadingA(false);
      }
    } 
    // Process analysis for Slot B
    else if (activeSlot === 'B') {
      setPropB(selection);
      setAnalysisB(null);
      setErrorB(null);
      setIsLoadingB(true);
      try {
        const result = await getAnalysis(query);
        setAnalysisB(result.quantitative);
      } catch (err) {
        setErrorB(err instanceof Error ? err.message : 'Analysis failed.');
      } finally {
        setIsLoadingB(false);
      }
    }
  };

  // This effect orchestrates the comparative analysis between the two props.
  // It runs automatically whenever either prop or its corresponding analysis results change.
  useEffect(() => {
    const runComparativeAnalysis = async () => {
      // The guard clause is critical: it ensures the comparative analysis only proceeds
      // when both props have been selected AND their individual analyses have successfully completed.
      // This prevents unnecessary API calls and handles the asynchronous nature of the analyses.
      if (!propA || !analysisA || !propB || !analysisB) {
        return;
      }

      setIsComparativeLoading(true);
      setComparativeError(null);
      setComparativeAnalysis(null);

      try {
        const formatPropDetails = (prop: PropSelectionDetails, analysis: QuantitativeAnalysis) => {
          const { player, prop: propData, selectedLine, selectedPosition } = prop;
          const marketOdds = selectedPosition === 'Over' ? selectedLine.overOdds : selectedLine.underOdds;
          return `${player.name} ${selectedPosition} ${selectedLine.line} ${propData.propType} at ${formatAmericanOdds(marketOdds)}. Quantitative analysis results: Expected Value of ${analysis.expectedValue.toFixed(2)}% and a Confidence Score of ${(analysis.confidenceScore * 100).toFixed(0)}%.`;
        };

        const propADetails = formatPropDetails(propA, analysisA);
        const propBDetails = formatPropDetails(propB, analysisB);

        const verdict = await getComparativeAnalysis(propADetails, propBDetails);
        setComparativeAnalysis(verdict);

      } catch (err) {
        setComparativeError(err instanceof Error ? err.message : 'Failed to get comparative analysis.');
      } finally {
        setIsComparativeLoading(false);
      }
    };

    runComparativeAnalysis();
  }, [propA, analysisA, propB, analysisB]);
  
  // ArbiterPanel component to display the comparative verdict
  const ArbiterPanel = () => {
      // Initial state before both props are selected
      if (!propA || !propB) {
          return (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <SparklesIcon className="h-8 w-8 text-gray-600" />
              <p className="mt-2 text-sm font-semibold text-gray-500">The Arbiter</p>
              <p className="text-xs text-gray-600">Select two props to begin comparison.</p>
            </div>
          );
      }

      // Loading state for the comparative analysis
      if (isComparativeLoading) {
          return (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
                <p className="mt-2 text-sm text-gray-300">Arbiter is thinking...</p>
              </div>
          );
      }

      // Error state for the comparative analysis
      if (comparativeError) {
          return (
              <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-semibold text-red-300">Comparison Failed</p>
                  <p className="text-xs text-red-400 mt-1">{comparativeError}</p>
              </div>
          );
      }

      // Success state with the AI's verdict
      if (comparativeAnalysis) {
        return (
            <div className="p-4 rounded-lg bg-gray-800/70 border border-gray-700/50 h-full flex flex-col">
              <h4 className="flex items-center gap-2 text-md font-semibold text-cyan-400 mb-3 shrink-0">
                <BrainCircuitIcon className="h-5 w-5" />
                AI Arbiter's Verdict
              </h4>
              <div className="text-sm text-gray-300 overflow-y-auto prose prose-sm prose-invert max-w-none">
                {comparativeAnalysis.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  // Highlight the recommendation line
                  if (trimmedLine.startsWith('Recommendation:')) {
                    return (
                      <p key={index} className="font-bold text-cyan-300">{trimmedLine}</p>
                    );
                  }
                  // Render paragraphs for each line, handling empty lines as breaks
                  return (
                    <p key={index}>{trimmedLine ? trimmedLine : <br/>}</p>
                  )
                })}
              </div>
            </div>
        )
      }

      // State when both props are analyzed but comparison hasn't run/finished
      if (analysisA && analysisB) {
         return (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <SparklesIcon className="h-8 w-8 text-cyan-400" />
              <p className="mt-2 text-sm font-semibold text-gray-400">Ready for Comparison</p>
              <p className="text-xs text-gray-500">Analysis for both props is complete.</p>
            </div>
          );
      }
      
      // Default state while waiting for one or both analyses
      return (
         <div className="flex flex-col items-center justify-center text-center p-4">
           <div className="text-5xl font-black text-gray-700/50">VS</div>
        </div>
      )
  };

  const existingSelections = [propA, propB].filter(Boolean) as PropSelectionDetails[];

  return (
    <div className="flex h-full w-full flex-col p-4 md:p-8">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-100">Prop Comparator</h2>
        <p className="text-gray-400">Side-by-side quantitative analysis of two different props.</p>
      </div>
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 items-stretch">
        <PropSlot
          prop={propA}
          analysis={analysisA}
          isLoading={isLoadingA}
          error={errorA}
          onSelect={() => handleSelectClick('A')}
        />

        <div className="flex items-center justify-center w-full lg:w-80">
          <ArbiterPanel />
        </div>

        <PropSlot
          prop={propB}
          analysis={analysisB}
          isLoading={isLoadingB}
          error={errorB}
          onSelect={() => handleSelectClick('B')}
        />
      </div>

      <PropSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handlePropSelected}
        existingSelections={existingSelections}
      />
    </div>
  );
};

export default PropComparator;