
import {
  PropSelectionDetails,
  ServiceResponse,
  MarketAnalysis,
  DeepAnalysisResult,
  DeepAnalysisCriterion,
} from '../types';
import { apiClient } from './apiClient';
import { normalCdf, calculateSingleLegEV } from '../utils';

// MOCK IMPLEMENTATION: Simulates a backend that performs complex analysis.
const ANALYSIS_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Performs a market analysis across a range of alternate lines for a given prop.
 * This simulates a backend process that calculates EV for each available line.
 * @param propDetails The details of the selected prop.
 * @returns A `ServiceResponse` containing the market analysis.
 */
export const getMarketAnalysis = (
  propDetails: PropSelectionDetails
): Promise<ServiceResponse<MarketAnalysis>> => {
  const key = `market-analysis:${propDetails.player.name}:${propDetails.prop.propType}`;

  return apiClient(key, async () => {
    // In a real backend, this would involve a sophisticated pricing model.
    // Here, we simulate it based on a mock "true" projection.
    const mockTrueMean = propDetails.selectedLine.line * 1.02; // Assume model projects 2% higher than line
    const mockStdDev = mockTrueMean * 0.25; // Assume 25% variance

    const marketLines = propDetails.prop.lines;

    const analysisLines = marketLines.map(line => {
      // Probability of going OVER
      const trueProbOver = 1 - normalCdf(line.line, mockTrueMean, mockStdDev);
      // Probability of going UNDER
      const trueProbUnder = normalCdf(line.line, mockTrueMean, mockStdDev);

      const overEV = calculateSingleLegEV(trueProbOver, line.overOdds);
      const underEV = calculateSingleLegEV(trueProbUnder, line.underOdds);
      
      return { line: line.line, overEV, underEV };
    });

    // Find the single best bet across all lines
    let optimalBet = { line: 0, position: 'Over' as 'Over' | 'Under', ev: -100 };
    analysisLines.forEach(l => {
        if (l.overEV > optimalBet.ev) {
            optimalBet = { line: l.line, position: 'Over', ev: l.overEV };
        }
        if (l.underEV > optimalBet.ev) {
            optimalBet = { line: l.line, position: 'Under', ev: l.underEV };
        }
    });

    if (optimalBet.ev === -100) {
        // Fallback if no positive EV found
        optimalBet.line = propDetails.selectedLine.line;
    }

    return {
      lines: analysisLines,
      optimalBet,
    };
  }, ANALYSIS_TTL);
};

/**
 * Performs a deep, multi-faceted analysis of a single prop bet.
 * This simulates a backend service that aggregates data from multiple sources
 * and generates a weighted score and rationale.
 * @param propDetails The details of the selected prop.
 * @returns A `ServiceResponse` containing the deep analysis result.
 */
export const getDeepAnalysis = (
  propDetails: PropSelectionDetails
): Promise<ServiceResponse<DeepAnalysisResult>> => {
  const key = `deep-analysis:${propDetails.player.name}:${propDetails.prop.propType}:${propDetails.selectedLine.line}:${propDetails.selectedPosition}`;
  
  return apiClient(key, async () => {
      // This is a complex mock simulating a sophisticated backend process.
      const criteria: DeepAnalysisCriterion[] = [];
      let totalScore = 0;
      let totalWeight = 0;

      // Helper to add a criterion and update the score
      const addCriterion = (
        name: string,
        category: DeepAnalysisCriterion['category'],
        value: string,
        score: number, // -10 to 10
        rationale: string,
        weight: number = 1
      ) => {
        criteria.push({ name, category, value, score, rationale, status: 'live' });
        totalScore += score * weight;
        totalWeight += weight;
      };

      // 1. Statistical Analysis
      addCriterion(
        'Player Season Avg', 'Statistical', `> ${propDetails.selectedLine.line}`, 3,
        `${propDetails.player.name} averages higher than the line this season.`, 1.5
      );
      addCriterion(
        'Recent Form (L5)', 'Statistical', '< Line', -2,
        `Performance over the last 5 games has trended below the line.`, 2
      );

      // 2. Situational Analysis
      addCriterion(
        'Home/Away Split', 'Situational', 'Favorable', 4,
        `This player historically performs better in this venue type.`, 1
      );
       addCriterion(
        'Opponent DVOA', 'Situational', 'Top 5 Matchup', 5,
        `The opponent ranks in the bottom 5 defensively against this position.`, 2.5
      );

      // 3. Market Analysis
      addCriterion(
        'Line Movement', 'Market', 'Stable', 1,
        `The line has remained stable, indicating market agreement.`, 1
      );
      addCriterion(
        'Public Betting %', 'Market', 'Contrarian', 3,
        `Over 70% of public bets are on the other side, creating potential value.`, 1.5
      );
      
      const overallScore = Math.max(0, Math.min(100, 50 + (totalScore / totalWeight) * 5));

      return {
          overallScore,
          breakdown: [
              { category: 'Statistical', criteria: criteria.filter(c => c.category === 'Statistical') },
              { category: 'Situational', criteria: criteria.filter(c => c.category === 'Situational') },
              { category: 'Market', criteria: criteria.filter(c => c.category === 'Market') },
          ]
      };
  }, ANALYSIS_TTL);
};
