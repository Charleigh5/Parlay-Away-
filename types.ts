
// --- Generic & System Types ---

export type DataFreshnessStatus = 'live' | 'cached' | 'stale' | 'unavailable';

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


// --- Gemini Service & AI Analysis Types ---

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
  projectedMean: number;
  projectedStdDev: number;
}

export interface AnalysisResponse {
  summary: string;
  reasoning: ReasoningStep[];
  quantitative: QuantitativeAnalysis;
}

export interface SystemUpdate {
  id: string;
  status: 'Pending Review' | 'Approved & Deployed' | 'Rejected' | 'Backtesting Failed';
  featureName: string;
  description: string;
  integrationStrategy: string;
  backtestResults: {
    roiChange: number;
    brierScore: number;
    sharpeRatio: number;
  };
}


// --- Bet & Parlay Types ---

export interface ExtractedBetLeg {
  player: string;
  propType: string;
  line: number;
  position: 'Over' | 'Under';
  marketOdds: number;
  // Optional fields for library grouping
  gameId?: string;
  team?: string;
}

export interface AnalyzedBetLeg extends ExtractedBetLeg {
  analysis: AnalysisResponse;
}

export interface ParlayCorrelationAnalysis {
  overallScore: number;
  summary: string;
  analysis: {
    leg1Index: number;
    leg2Index: number;
    relationship: 'Positive' | 'Negative' | 'Neutral';
    explanation: string;
  }[];
}

export interface ParlayNode {
  id: string;
  leg: AnalyzedBetLeg;
  position: { x: number; y: number };
}


// --- Sports Data Types ---

export interface LineOdds {
  line: number;
  overOdds: number;
  underOdds: number;
}

export interface HistoricalContext {
  seasonAvg: number;
  last5Avg: number;
  gameLog: number[];
}

export interface PlayerProp {
  propType: string;
  lines: LineOdds[];
  historicalContext?: HistoricalContext;
}

export interface InjuryStatus {
  status: 'Q' | 'P' | 'O' | 'D'; // Questionable, Probable, Out, Doubtful
  news: string;
  impact: string;
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
  stadiumLocation?: { lat: number; lon: number };
  players: Player[];
  // Additional fields from API spec
  gameId?: string; 
  status?: string;
  startTimeUTC?: string;
  homeTeam?: { id: string; fullName: string };
  awayTeam?: { id: string; fullName: string };
  venue?: string;
}


// --- UI & Component-Specific Types ---

export interface KnowledgeModule {
  id: string;
  domain: string;
  description: string;
}

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
    player: Player;
    prop: PlayerProp;
    selectedLine: LineOdds;
    selectedPosition: 'Over' | 'Under';
    game: Game;
}


// --- Player Stats & Deep Analysis ---

export interface GameLogEntry {
  gameId: string;
  date: string;
  opponent: string;
  passingYards?: number;
  rushingYards?: number;
  receivingYards?: number;
  passingTDs?: number;
  // ... other stats
}

export interface PlayerSeasonStats {
  gamesPlayed: number;
  passingYards: number;
  rushingYards: number;
  receivingYards: number;
  // ... other stats
}

export type StatSplits = Record<string, number>;

export interface HomeAwaySplits {
    home: StatSplits;
    away: StatSplits;
}

export interface PlayerSplits {
    home: StatSplits;
    away: StatSplits;
    vsDivisional: StatSplits;
    last5Avg: StatSplits;
    last10Avg: StatSplits;
}

export interface InjuryStatusAPI {
    designation: string;
    details: string;
}

export interface DefensiveRanking {
    position: 'QB' | 'RB' | 'WR' | 'TE';
    yardsAllowedPerGame: number;
    rank: number;
    dvoa: number;
}

export interface DefensiveStat {
    value: number;
    rank: number;
    unit: string;
}

export type TeamDefensiveStats = Record<string, { rank: number } | DefensiveStat>;


export interface WeatherConditions {
    temperature: number;
    windSpeed: number;
    precipitationChance: number;
    summary: string;
}

export type CriterionCategory = 'Statistical' | 'Situational' | 'Market' | 'Correlation';

export interface DeepAnalysisCriterion {
    name: string;
    category: CriterionCategory;
    value: string;
    score: number; // e.g., -5 to +5
    rationale: string;
    status: DataFreshnessStatus;
}

export interface DeepAnalysisResult {
    overallScore: number; // 0-100
    breakdown: {
        category: CriterionCategory;
        criteria: DeepAnalysisCriterion[];
    }[];
}


// Market Analysis for EV Chart
export interface MarketLineAnalysis {
  line: number;
  overEV: number;
  underEV: number;
}

export interface OptimalBet {
  line: number;
  position: 'Over' | 'Under';
  ev: number;
}

export interface MarketAnalysis {
  lines: MarketLineAnalysis[];
  optimalBet: OptimalBet;
}
