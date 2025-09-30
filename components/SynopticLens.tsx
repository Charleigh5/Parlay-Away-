import React, { useState } from 'react';
import { AnalyzedBetLeg, ExtractedBetLeg } from '../types';
import { getAnalysis } from '../services/geminiService';
import ImageUpload from './ImageUpload';
import AnalysisTable from './AnalysisTable';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { XIcon } from './icons/XIcon';
import BetBuilder from './BetBuilder';
import { FileUpIcon } from './icons/FileUpIcon';
import { FilePlusIcon } from './icons/FilePlusIcon';


const SynopticLens: React.FC = () => {
  const [analyzedLegs, setAnalyzedLegs] = useState<AnalyzedBetLeg[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [partialError, setPartialError] = useState<string | null>(null);
  const [mode, setMode] = useState<'home' | 'upload' | 'build'>('home');

  const runAnalysisOnLegs = async (legs: ExtractedBetLeg[]) => {
    if (legs.length === 0) {
      setError("The bet slip is empty. Please add at least one leg to analyze.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setPartialError(null);
    setAnalyzedLegs(null);

    try {
      setLoadingMessage(`Analyzing ${legs.length} bet leg(s)...`);
      const analysisPromises = legs.map(async (leg) => {
        const query = `Analyze the prop bet: ${leg.player} ${leg.position} ${leg.line} ${leg.propType} at ${leg.marketOdds} odds.`;
        const analysis = await getAnalysis(query);
        return { ...leg, analysis };
      });

      const settledResults = await Promise.allSettled(analysisPromises);
      
      const successfulAnalyses: AnalyzedBetLeg[] = [];
      const failedReasons: string[] = [];
      settledResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successfulAnalyses.push(result.value);
        } else {
          const leg = legs[index];
          const reason = result.reason instanceof Error ? result.reason.message : 'Unknown analysis error.';
          failedReasons.push(reason);
          console.error(`Failed to analyze leg: ${leg.player} ${leg.propType}`, result.reason);
        }
      });

      if (successfulAnalyses.length === 0) {
        const reason = failedReasons[0] || "All legs failed to analyze due to an unknown issue.";
        throw new Error(`Analysis failed for all legs. The first error was: "${reason}"`);
      }

      setAnalyzedLegs(successfulAnalyses);

      if (failedReasons.length > 0) {
        setPartialError(`Could not analyze ${failedReasons.length} of ${legs.length} leg(s). They have been excluded from the results.`);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const handleImageUpload = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setAnalyzedLegs(null);
    setPartialError(null);
    setLoadingMessage('Extracting bet data from image...');

    try {
      // file to base64 is not a service call, so we can do it before calling runAnalysisOnLegs
      const { fileToBase64 } = await import('../utils');
      const base64Image = await fileToBase64(file);
      const { extractBetsFromImage } = await import('../services/geminiService');
      const extractedLegs = await extractBetsFromImage({
        data: base64Image,
        mimeType: file.type,
      });

      if (extractedLegs.length === 0) {
        throw new Error("No valid bet legs could be extracted from the image. Please check the screenshot quality.");
      }

      await runAnalysisOnLegs(extractedLegs);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReset = () => {
    setAnalyzedLegs(null);
    setError(null);
    setPartialError(null);
    setIsLoading(false);
    setMode('home');
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
            <div className="flex items-center gap-3 rounded-lg bg-gray-800 p-4 max-w-2xl">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <p className="mt-4 text-lg text-gray-300">Analysis in Progress</p>
            <p className="text-gray-400">{loadingMessage}</p>
        </div>
      );
    }
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8">
                <div className="text-red-400 bg-red-500/10 p-4 rounded-lg max-w-md">
                    <h3 className="font-semibold text-lg">Analysis Failed</h3>
                    <p className="text-sm mt-1">{error}</p>
                    <button onClick={handleReset} className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-md hover:bg-cyan-600">Try Again</button>
                </div>
            </div>
        )
    }
    if (analyzedLegs) {
      return (
        <>
          {partialError && (
            <div className="m-4 md:m-6 mb-0 p-3 bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{partialError}</p>
              </div>
              <button onClick={() => setPartialError(null)} className="p-1 rounded-md hover:bg-yellow-500/20 transition-colors" aria-label="Dismiss warning">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
          )}
          <AnalysisTable legs={analyzedLegs} onReset={handleReset} />
        </>
      );
    }

    switch(mode) {
        case 'home':
            return (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 md:p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-gray-100">Synoptic Lens</h2>
                        <p className="text-gray-400">Choose your input method to begin analysis.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
                        <button onClick={() => setMode('build')} className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 p-12 text-center transition-colors hover:border-cyan-500 hover:bg-gray-800/60">
                             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 transition-colors group-hover:bg-cyan-500/20">
                                <FilePlusIcon className="h-8 w-8 text-cyan-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-200">Build a Bet</h3>
                            <p className="mt-2 text-gray-400">Manually construct a parlay from available markets.</p>
                        </button>
                        <button onClick={() => setMode('upload')} className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 p-12 text-center transition-colors hover:border-cyan-500 hover:bg-gray-800/60">
                             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-700 transition-colors group-hover:bg-cyan-500/20">
                                <FileUpIcon className="h-8 w-8 text-cyan-400" />
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-200">Upload a Slip</h3>
                            <p className="mt-2 text-gray-400">Analyze a bet slip via screenshot.</p>
                        </button>
                    </div>
                </div>
            )
        case 'upload':
            return <ImageUpload onImageUpload={handleImageUpload} disabled={isLoading} onBack={() => setMode('home')}/>;
        case 'build':
            return <BetBuilder onAnalyze={runAnalysisOnLegs} onBack={() => setMode('home')} />;
    }
    
  };

  return (
    <div className="flex flex-1 flex-col bg-gray-800/30">
      {renderContent()}
    </div>
  );
};

export default SynopticLens;