

export interface KnowledgeModule {
  id: string;
  domain: string;
  description: string;
}

export interface SystemUpdate {
  id:string;
  status: 'Pending Review' | 'Approved & Deployed' | 'Backtesting Failed' | 'Rejected';
  featureName: string;
  description: string;
  integrationStrategy?: string;
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
  projectedMean?: number;
  projectedStdDev?: number;
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

// Represents a stored chat conversation
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string; // ISO string
  messages: Message[];
}

// Represents the raw data extracted from a bet slip image or built by the user, before analysis.
export interface ExtractedBetLeg {
  player: string;
  propType: string; // e.g., "Passing Yards"
  line: number;
  position: 'Over' | 'Under';
  marketOdds: number;
  gameLog?: number[];
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

export interface InjuryStatus {
  status: 'P' | 'Q' | 'O'; // Probable, Questionable, Out
  news: string;
  impact: string;
}

// Performance Splits Data
export type StatSplits = Record<string, number>;

export interface HomeAwaySplits {
  home: StatSplits;
  away: StatSplits;
}

export interface Player {
  name: string;
  position: string;
  team: string;
  props: PlayerProp[];
  injuryStatus?: InjuryStatus; // Optional: undefined implies Healthy
  homeAwaySplits?: HomeAwaySplits;
  divisionalSplits?: StatSplits;
}

export interface Game {
  id: string;
  name: string; // e.g., "Kansas City Chiefs @ Baltimore Ravens"
  date: string; // YYYY-MM-DD
  players?: Player[];
  homeTeam?: { id: string; fullName: string };
  awayTeam?: { id: string; fullName: string };
  startTimeUTC?: string;
  status?: string;
  venue?: string;
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

// Types for Correlation Analysis
export interface CorrelationAnalysisDetail {
  leg1Index: number;
  leg2Index: number;
  relationship: 'Positive' | 'Negative' | 'Neutral';
  explanation: string;
}

export interface ParlayCorrelationAnalysis {
  overallScore: number; // -1 to 1
  summary: string;
  analysis: CorrelationAnalysisDetail[];
}

// Represents a parlay saved by the user in localStorage
export interface SavedParlay {
  id: string;
  name: string;
  odds: number;
  legs: ExtractedBetLeg[];
  createdAt: string;
}

// Types for Market Analysis
export interface MarketLineAnalysis {
    line: number;
    overOdds: number;
    underOdds: number;
    overEV: number;
    underEV: number;
}

export interface MarketAnalysis {
    lines: MarketLineAnalysis[];
    optimalBet: { line: number; position: 'Over' | 'Under'; ev: number; odds: number } | null;
    baseAnalysis: AnalysisResponse;
}

// Represents a full selection for the Prop Comparator
export interface PropSelectionDetails {
  game: Game;
  player: Player;
  prop: PlayerProp;
  selectedLine: LineOdds;
  selectedPosition: 'Over' | 'Under';
}