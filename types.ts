
export interface KnowledgeModule {
  id: string;
  domain: string;
  description: string;
}

export interface SystemUpdate {
  id:string;
  status: 'Pending Review' | 'Approved & Deployed' | 'Backtesting Failed';
  featureName: string;
  description: string;
  backtestResults: {
    roiChange: number;
    brierScore: number;
    sharpeRatio: number;
  };
}

export interface ReasoningStep {
  step: number;
  description: string;
  activatedModules: string[];
}

export interface QuantitativeAnalysis {
  expectedValue: number;
  vigRemovedOdds: number;
  kellyCriterionStake: number;
  confidenceScore: number;
}

export interface AnalysisResponse {
  summary: string;
  reasoning: ReasoningStep[];
  quantitative: QuantitativeAnalysis;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AnalysisResponse;
}

export interface ExtractedBetLeg {
  player: string;
  propType: string; // e.g., "Passing Yards"
  line: number;
  position: 'Over' | 'Under';
  marketOdds: number;
}

export interface AnalyzedBetLeg extends ExtractedBetLeg {
  analysis: AnalysisResponse;
}