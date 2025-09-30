
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

// Data structures for Bet Builder
export interface LineOdds {
  line: number;
  overOdds: number;
  underOdds: number;
}

export interface PlayerProp {
  propType: string;
  lines: LineOdds[];
  historicalContext?: {
    last5Avg: number;
    seasonAvg: number;
    gameLog?: number[];
  };
}

export interface Player {
  name: string;
  position: string;
  team: string;
  props: PlayerProp[];
}

export interface Game {
  id: string;
  name: string; // e.g., "Kansas City Chiefs @ Baltimore Ravens"
  players: Player[];
}

// Types for TheSportsDB API
export interface SportsDBEvent {
  idEvent: string;
  strEvent: string;
  idHomeTeam: string;
  strHomeTeam: string;
  idAwayTeam: string;
  strAwayTeam: string;
  intHomeScore: string | null;
  intAwayScore: string | null;
  strStatus: string;
  dateEvent: string;
  strTime: string;
}

export interface SportsDBResponse {
  events: SportsDBEvent[] | null;
}