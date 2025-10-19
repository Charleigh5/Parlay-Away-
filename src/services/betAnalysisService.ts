import {
  PropSelectionDetails,
  ServiceResponse,
  MarketAnalysis,
  DeepAnalysisResult,
  DeepAnalysisCriterion,
  Player,
  Game,
  RankedPlayerProp,
} from '../types';
import { apiClient } from './apiClient';
import { americanToDecimal, normalCdf, calculateSingleLegEV } from '../utils';
import * as playerDataService from './playerDataService';
import * as defensiveStatsService from './defensiveStatsService';
import * as weatherService from './weatherService';


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


// --- BATCH ANALYSIS FOR PROP RANKER ---

const analyzeSinglePlayerProp = async (
    player: Player,
    games: Game[],
    propType: string,
    threshold: number,
    position: 'Over' | 'Under'
): Promise<RankedPlayerProp> => {
    // 1. Find the player's game and opponent
    const game = games.find(g => g.players.some(p => p.name === player.name));
    if (!game) throw new Error(`Could not find game for ${player.name}`);
    
    const opponent = game.homeTeam?.id === player.team ? game.awayTeam : game.homeTeam;
    if (!opponent) throw new Error(`Could not determine opponent for ${player.name}`);

    // 2. Find the market prop
    const marketProp = player.props.find(p => p.propType === propType);
    if (!marketProp || !marketProp.lines || marketProp.lines.length === 0) {
        throw new Error(`No market for ${propType} for ${player.name}`);
    }
    const primaryLine = marketProp.lines.find(l => Math.abs(l.overOdds) < 200 && Math.abs(l.underOdds) < 200) || marketProp.lines[0];
    
    // 3. Fetch all necessary data concurrently
    const [gameLogRes, splitsRes, injuryRes, defenseRes, weatherRes] = await Promise.all([
        playerDataService.getPlayerGameLog(player.name),
        playerDataService.getPlayerSplits(player.name),
        playerDataService.getInjuryStatus(player.name),
        defensiveStatsService.getTeamDefensiveRanking(opponent.id, player.position as any),
        game.stadiumLocation ? weatherService.getGameWeather(game.id, game.stadiumLocation) : Promise.resolve({ data: null, status: 'unavailable' as const })
    ]);

    // 4. Mock a projection model
    let projectedMean = marketProp.historicalContext?.seasonAvg ?? primaryLine.line;
    let projectedStdDev = projectedMean * 0.3; // Default variance
    const criteria: DeepAnalysisCriterion[] = [];
    let totalScore = 0, totalWeight = 0;

    const addCriterion = (name: string, category: any, value: string, score: number, rationale: string, weight: number = 1, status: any = 'live') => {
        criteria.push({ name, category, value, score, rationale, status });
        totalScore += score * weight;
        totalWeight += weight;
    };

    if (marketProp.historicalContext?.last5Avg) {
        const diff = marketProp.historicalContext.last5Avg - projectedMean;
        projectedMean = (projectedMean * 0.6) + (marketProp.historicalContext.last5Avg * 0.4);
        addCriterion('Recent Form (L5)', 'Statistical', `${diff.toFixed(1)} vs SZN`, Math.round(diff / projectedStdDev * 5), `Last 5 avg is ${Math.abs(diff).toFixed(1)} ${diff > 0 ? 'above' : 'below'} season avg.`, 2);
    }

    if (defenseRes.data) {
        const rankModifier = (defenseRes.data.rank - 16) / 16;
        const impact = (1 - (rankModifier * 0.1));
        projectedMean *= impact;
        addCriterion('Opponent Rank', 'Situational', `#${defenseRes.data.rank} vs ${player.position}`, Math.round(rankModifier * -10), `Opponent is ranked #${defenseRes.data.rank} vs ${player.position}, modifying projection by ${(impact*100-100).toFixed(1)}%.`, 2.5);
    }
    
    if (weatherRes.data && weatherRes.data.windSpeed > 15 && propType.includes('Passing')) {
        projectedMean *= 0.95;
        addCriterion('Weather', 'Situational', `${weatherRes.data.windSpeed}mph wind`, -3, 'High winds negatively impact passing game.', 1.5);
    }

    // 5. Calculate probabilities and EV
    const trueProbThreshold = position === 'Over' ? 1 - normalCdf(threshold, projectedMean, projectedStdDev) : normalCdf(threshold, projectedMean, projectedStdDev);
    const trueProbMarketOver = 1 - normalCdf(primaryLine.line, projectedMean, projectedStdDev);
    
    const marketOdds = position === 'Over' ? primaryLine.overOdds : primaryLine.underOdds;
    const ev = calculateSingleLegEV(position === 'Over' ? trueProbMarketOver : (1 - trueProbMarketOver), marketOdds);
    
    const impliedProb = 1 / americanToDecimal(marketOdds);

    // 6. Confidence score
    const dataFreshnessScore = [gameLogRes, splitsRes, injuryRes, defenseRes, weatherRes].filter(res => res.status === 'live' || res.status === 'cached').length / 5;
    const confidence = dataFreshnessScore * 0.85;

    // 7. Finalize deep analysis object and rank score
    const overallScore = Math.max(0, Math.min(100, 50 + (totalScore / (totalWeight || 1)) * 5));
    const deepAnalysisResult: DeepAnalysisResult = {
        overallScore,
        breakdown: [{ category: 'Statistical', criteria: criteria.filter(c=>c.category==='Statistical') }, { category: 'Situational', criteria: criteria.filter(c=>c.category==='Situational') }]
    };
    const rankScore = ev * confidence;

    return {
        player, opponent: { id: opponent.id, name: opponent.fullName }, propType, threshold, position,
        marketLine: primaryLine.line, marketOdds, trueProbability: trueProbThreshold, impliedProbability: impliedProb, ev,
        confidence, rankScore, deepAnalysisResult
    };
};

/**
 * Analyzes a batch of players for a specific prop and ranks them.
 */
export const batchAnalyzeProps = async (
  players: Player[],
  games: Game[],
  propType: string,
  threshold: number,
  position: 'Over' | 'Under',
  onProgress: (p: number) => void
): Promise<RankedPlayerProp[]> => {
    let completed = 0;
    const total = players.length;
    
    const analysisPromises = players.map(player =>
        analyzeSinglePlayerProp(player, games, propType, threshold, position)
            .then(result => {
                completed++;
                onProgress(completed / total);
                return { status: 'fulfilled' as const, value: result };
            })
            .catch(error => {
                completed++;
                onProgress(completed / total);
                console.error(`Analysis failed for ${player.name}:`, error);
                return { status: 'rejected' as const, reason: error };
            })
    );
    
    const results = await Promise.all(analysisPromises);
    
    const successfulAnalyses = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as { status: 'fulfilled', value: RankedPlayerProp }).value);

    return successfulAnalyses.sort((a, b) => b.rankScore - a.rankScore);
};
