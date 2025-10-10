import React, { useState } from 'react';
import { AnalyzedBetLeg, ParlayCorrelationAnalysis } from '../types';
import ImageUpload from './ImageUpload';
import ParlayCanvas from './ParlayCanvas';
import AnalysisTable from './AnalysisTable';
import { fileToBase64 } from '../utils';
import { extractBetsFromImage } from '../services/geminiService';

type BetBuilderStep = 'start' | 'canvas' | 'analysis';

const BetBuilder: React.FC = () => {
    const [step, setStep] = useState<BetBuilderStep>('start');
    const [analyzedLegs, setAnalyzedLegs] = useState<AnalyzedBetLeg[]>([]);
    const [correlation, setCorrelation] = useState<ParlayCorrelationAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const handleImageUpload = async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const base64Data = await fileToBase64(file);
            const mimeType = file.type;
            await extractBetsFromImage({ data: base64Data, mimeType });
            // This is a placeholder; ParlayCanvas will do the real analysis
            // We just need to move to the next step.
            // A more complex implementation might pass these legs to the canvas.
            setStep('canvas'); 
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to process image.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleFinalizeAnalysis = (legs: AnalyzedBetLeg[]) => {
        setAnalyzedLegs(legs);
        setStep('analysis');
        // Correlation analysis would be passed from canvas or re-run here
    };

    const handleBackToCanvas = () => {
        setStep('canvas');
        // Keep analyzedLegs so canvas can be re-hydrated if needed
    };
    
    const handleBackToStart = () => {
        setStep('start');
        setAnalyzedLegs([]);
        setCorrelation(null);
        setError(null);
    };

    const renderContent = () => {
        switch (step) {
            case 'start':
                return (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                        <h2 className="text-2xl font-bold text-gray-300">Bet Builder</h2>
                        <p className="mt-2 text-gray-400 max-w-md">
                            Upload a bet slip to automatically extract legs, or build one from scratch in the Parlay Canvas.
                        </p>
                        {error && <p className="mt-4 text-red-400">{error}</p>}
                        {isLoading ? (
                            <p className="mt-6 text-cyan-400">Processing image...</p>
                        ) : (
                             <ImageUpload onImageUpload={handleImageUpload} disabled={isLoading} onBack={() => {}} />
                        )}
                        <p className="text-gray-500 text-sm my-4">OR</p>
                         <button
                            onClick={() => setStep('canvas')}
                            className="mt-2 flex items-center gap-2 rounded-md bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
                        >
                            Go to Parlay Canvas
                        </button>
                    </div>
                );
            case 'canvas':
                return <ParlayCanvas onAnalyze={handleFinalizeAnalysis} onBack={handleBackToStart} />;
            case 'analysis':
                return <AnalysisTable legs={analyzedLegs} correlation={correlation} onBack={handleBackToCanvas} />;
        }
    };

    // Note: BetBuilder isn't used by any component, so it needs to be integrated into MainPanel or another top-level component to be visible.
    // For this fix, I am only providing the implementation of the component itself.
    return <div className="flex-1 flex flex-col">{renderContent()}</div>;
};

export default BetBuilder;
