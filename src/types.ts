// Core Data Structures
export interface KnowledgeModule {
  id: string;
  domain: string;
  description: string;
}

export interface LineOdds {
  line: number;
  overOdds: number;
  underOdds: number;
}

export interface PlayerProp {
  propType: string;
  lines: LineOdds[];
  historicalContext?: {
    seasonAvg: number;
    last5Avg: number;
    gameLog: number[];
  };
}

export interface InjuryStatus {
  status: 'Q' | 'P' | 'O' | string;
  news: string;
  impact: string;
}

export interface StatSplits {
    [stat: string]: number;
}
  
export interface HomeAwaySplits {
    home: StatSplits;
    away: StatSplits;
}

export interface Player {
  name: string;
  position: string;
  team: string;
  props: PlayerProp[];
  injuryStatus?: InjuryStatus;
  homeAwaySplits?: HomeAwaySplits;
  divisionalSplits?: StatSplits;
}

export interface Game {
  id: string;
  name: string;
  date: string;
  players: Player[];
  stadiumLocation?: { lat: number; lon: number };
  gameId?: string;
  status?: string;
  startTimeUTC?: string;
  homeTeam?: { id: string; fullName: string };
  awayTeam?: { id: string; fullName: string };
  venue?: string;
}

// Gemini & Analysis Types
export interface QuantitativeAnalysis {
  expectedValue: number;
  vigRemovedOdds: number;
  kellyCriterionStake: number;
  confidenceScore: number;
  projectedMean: number;
  projectedStdDev: number;
}

export interface AnalysisResponse {
  summary: string;
  reasoning: Array<{
    step: number;
    description: string;
    activatedModules: string[];
  }>;
  quantitative: QuantitativeAnalysis;
}

export interface SystemUpdate {
  id: string;
  status: 'Pending Review' | 'Approved & Deployed' | 'Rejected' | 'Backtesting Failed' | string;
  featureName: string;
  description: string;
  integrationStrategy: string;
  impactAnalysis: string;
  backtestResults: {
    roiChange: number;
    brierScore: number;
    sharpeRatio: number;
  };
}

export interface ExtractedBetLeg {
  player: string;
  propType: string;
  line: number;
  position: 'Over' | 'Under';
  marketOdds: number;
  gameId?: string; // Optional for linking to games
  team?: string;   // Optional for linking to teams
}

export interface AnalyzedBetLeg extends ExtractedBetLeg {
  analysis: AnalysisResponse;
}

export interface CorrelationEdge {
  leg1Index: number;
  leg2Index: number;
  relationship: 'Positive' | 'Negative' | 'Neutral';
  explanation: string;
  rho: number; // Correlation coefficient [-1, 1]
}

export interface ParlayCorrelationAnalysis {
  overallScore: number;
  summary: string;
  analysis: CorrelationEdge[];
}

// Chat & UI Types
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | AnalysisResponse;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export interface PropSelectionDetails {
  game: Game;
  player: Player;
  prop: PlayerProp;
  selectedLine: LineOdds;
  selectedPosition: 'Over' | 'Under';
}

// Service & Deeper Analysis Types
export interface MarketAnalysis {
  lines: Array<{
    line: number;
    overEV: number;
    underEV: number;
  }>;
  optimalBet: {
    line: number;
    position: 'Over' | 'Under';
    ev: number;
  };
}

export type DataFreshnessStatus = 'live' | 'cached' | 'stale' | 'unavailable';
export type CriterionCategory = 'Statistical' | 'Situational' | 'Market' | 'Correlation';

export interface DeepAnalysisCriterion {
  name: string;
  category: CriterionCategory;
  value: string;
  score: number; // e.g., -10 to 10
  rationale: string;
  status: DataFreshnessStatus;
}

export interface DeepAnalysisResult {
  overallScore: number; // 0-100
  breakdown: Array<{
    category: CriterionCategory;
    criteria: DeepAnalysisCriterion[];
  }>;
}

export interface RankedPlayerProp {
    player: Player;
    opponent: { id: string; name: string };
    propType: string;
    threshold: number;
    position: 'Over' | 'Under';
    marketLine: number;
    marketOdds: number;
    trueProbability: number;
    impliedProbability: number;
    ev: number;
    confidence: number;
    rankScore: number;
    deepAnalysisResult: DeepAnalysisResult;
}

export interface ServiceResponse<T> {
  data: T | null;
  status: DataFreshnessStatus;
  lastUpdated?: string;
  error?: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface ParlayNode {
  id: string;
  leg: AnalyzedBetLeg;
  position: { x: number; y: number; };
}

// NFL Data Types
export interface GameLogEntry {
    gameId: string;
    date: string;
    opponent: string;
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    passingTDs?: number;
}

export interface PlayerSeasonStats {
    gamesPlayed: number;
    passingYards: number;
    rushingYards: number;
    receivingYards: number;
}

export interface PlayerSplits {
    home: StatSplits;
    away: StatSplits;
    vsDivisional: StatSplits;
    last5Avg: StatSplits;
    last10Avg: StatSplits;
}

export interface DefensiveStat {
    value: number;
    rank: number;
    unit: string;
}

export interface TeamDefensiveStats {
    overall: { rank: number };
    [key: string]: DefensiveStat | { rank: number };
}

export interface DefensiveRanking {
    position: 'QB' | 'RB' | 'WR' | 'TE';
    yardsAllowedPerGame: number;
    rank: number;
    dvoa: number;
}

export interface WeatherConditions {
    temperature: number;
    windSpeed: number;
    precipitationChance: number;
    summary: string;
}

export interface ParlayAnalysis {
  combinedProbability: number;
  parlayOdds: number;
  expectedValue: number;
  recommendedMaxLegs: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  shouldBet: boolean;
}
