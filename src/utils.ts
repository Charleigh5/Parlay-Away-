// FIX: Corrected types import to be more explicit.
import { LineOdds, PlayerProp, RankedPlayerProp, ParlayAnalysis } from './types/index';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const americanToDecimal = (odds: number): number => {
  if (odds > 0) {
    return (odds / 100) + 1;
  }
  return (100 / Math.abs(odds)) + 1;
};

export const decimalToAmerican = (odds: number): number => {
  if (odds >= 2) {
    return (odds - 1) * 100;
  }
  return -100 / (odds - 1);
};

export const calculateParlayOdds = (legs: { marketOdds: number }[]): number => {
  if (legs.length === 0) return 0;

  const totalDecimal = legs.reduce((acc, leg) => {
    return acc * americanToDecimal(leg.marketOdds);
  }, 1);
  
  if (totalDecimal === 1) return 0;

  return Math.round(decimalToAmerican(totalDecimal));
};

export const formatAmericanOdds = (odds: number): string => {
  const roundedOdds = Math.round(odds);
  return roundedOdds > 0 ? `+${roundedOdds}` : `${roundedOdds}`;
};

interface LegForEV {
  marketOdds: number;
  analysis: {
    quantitative: {
      vigRemovedOdds: number;
    }
  }
}

export const calculateParlayEV = (legs: LegForEV[]): number => {
  if (legs.length < 1) return 0;

  const marketDecimalParlayOdds = legs.reduce((acc, leg) => acc * americanToDecimal(leg.marketOdds), 1);
  
  const trueParlayProbability = legs.reduce((acc, leg) => {
    const trueDecimalOdds = americanToDecimal(leg.analysis.quantitative.vigRemovedOdds);
    if (trueDecimalOdds <= 1) return 0; // Invalid odds would lead to >100% prob, so treat as impossible.
    return acc * (1 / trueDecimalOdds);
  }, 1);

  if (trueParlayProbability === 0) return -100; // 100% loss if any leg is impossible

  const parlayEV = (trueParlayProbability * (marketDecimalParlayOdds - 1)) - (1 - trueParlayProbability);
  return parlayEV * 100; // Return as percentage
};

export const calculateCompoundedWinProbability = (legs: { trueProbability: number }[]): number => {
    if (legs.length === 0) return 0;
    const probability = legs.reduce((acc, leg) => acc * leg.trueProbability, 1);
    return probability * 100; // Return as percentage
};

export const calculateParlayEVFromTrueProbs = (legs: { trueProbability: number, marketOdds: number }[]): number => {
    if (legs.length === 0) return 0;

    const totalDecimalOdds = legs.reduce((acc, leg) => acc * americanToDecimal(leg.marketOdds), 1);
    const totalWinProb = legs.reduce((acc, leg) => acc * leg.trueProbability, 1);

    const ev = (totalWinProb * (totalDecimalOdds - 1)) - (1 - totalWinProb);
    return ev * 100; // Return as percentage
};

interface LegForConfidence {
  analysis: {
    quantitative: {
      confidenceScore: number;
    }
  }
}

export const calculateParlayConfidence = (legs: LegForConfidence[]): number => {
  if (legs.length === 0) return 0;
  
  if (legs.some(leg => leg.analysis.quantitative.confidenceScore <= 0)) return 0;

  // Geometric mean
  const productOfConfidences = legs.reduce((acc, leg) => acc * leg.analysis.quantitative.confidenceScore, 1);
  return Math.pow(productOfConfidences, 1 / legs.length);
};

// Generates plausible-looking historical odds for demonstration
export const generateHistoricalOdds = (currentOdds: number): number[] => {
  const oddsHistory = [currentOdds];
  let lastOdd = currentOdds;
  for (let i = 0; i < 6; i++) {
    const change = (Math.floor(Math.random() * 3) - 1) * 5; // Fluctuate by -5, 0, or 5
    let nextOdd = lastOdd + change;
    if (Math.random() > 0.7) { // Add occasional larger shifts
      nextOdd += (Math.floor(Math.random() * 3) - 1) * 5;
    }
    oddsHistory.unshift(nextOdd);
    lastOdd = nextOdd;
  }
  return oddsHistory; // Returns 7 days of data, ending with current
};

const PROP_TYPE_CONFIG: Record<string, { step: number; oddsShift: number, numLines: number }> = {
    'Passing Yards': { step: 10, oddsShift: 20, numLines: 4 },
    'Rushing Yards': { step: 5, oddsShift: 25, numLines: 4 },
    'Receiving Yards': { step: 5, oddsShift: 25, numLines: 4 },
    'Passing Touchdowns': { step: 1, oddsShift: 150, numLines: 2 },
    'Receptions': { step: 1, oddsShift: 40, numLines: 2 },
    'Sacks': { step: 1, oddsShift: 200, numLines: 1 },
    'Tackles + Assists': { step: 1, oddsShift: 30, numLines: 2 },
    'default': { step: 5, oddsShift: 20, numLines: 3 },
};

export const generateAlternateLines = (prop: PlayerProp): LineOdds[] => {
    if (!prop.lines || prop.lines.length === 0) {
        return [];
    }
    const primaryLine = prop.lines[0];
    const config = PROP_TYPE_CONFIG[prop.propType] || PROP_TYPE_CONFIG.default;
    const allLines: LineOdds[] = [primaryLine];

    // Generate lower lines
    let currentLine = primaryLine;
    for (let i = 0; i < config.numLines; i++) {
        const newLineValue = currentLine.line - config.step;
        const newOverOdds = currentLine.overOdds - config.oddsShift;
        const newUnderOdds = currentLine.underOdds + config.oddsShift;
        const newLine = { line: newLineValue, overOdds: newOverOdds, underOdds: newUnderOdds };
        allLines.unshift(newLine);
        currentLine = newLine;
    }

    // Generate higher lines
    currentLine = primaryLine;
    for (let i = 0; i < config.numLines; i++) {
        const newLineValue = currentLine.line + config.step;
        const newOverOdds = currentLine.overOdds + config.oddsShift;
        const newUnderOdds = currentLine.underOdds - config.oddsShift;
        const newLine = { line: newLineValue, overOdds: newOverOdds, underOdds: newUnderOdds };
        allLines.push(newLine);
        currentLine = newLine;
    }

    return allLines;
};

// --- STATISTICAL FUNCTIONS FOR EV CALCULATION ---

// Standard Normal Cumulative Distribution Function (CDF) using the Error Function approximation
const standardNormalCdf = (x: number): number => {
  const erf = (z: number): number => {
    const t = 1.0 / (1.0 + 0.5 * Math.abs(z));
    const ans = 1 - t * Math.exp(-z * z - 1.26551223 +
      t * (1.00002368 +
      t * (0.37409196 +
      t * (0.09678418 +
      t * (-0.18628806 +
      t * (0.27886807 +
      t * (-1.13520398 +
      t * (1.48851587 +
      t * (-0.82215223 +
      t * 0.17087277)))))))));
    return z >= 0 ? ans : -ans;
  };
  return 0.5 * (1.0 + erf(x / Math.sqrt(2.0)));
};

// General Normal CDF for any mean and stdDev
export const normalCdf = (x: number, mean: number, stdDev: number): number => {
  if (stdDev <= 0) return x < mean ? 0 : 1;
  return standardNormalCdf((x - mean) / stdDev);
};

// Calculates EV for a single bet given true probability and market odds
export const calculateSingleLegEV = (trueProbability: number, marketOdds: number): number => {
    if (trueProbability < 0 || trueProbability > 1) return -100;
    const decimalOdds = americanToDecimal(marketOdds);
    const ev = (trueProbability * (decimalOdds - 1)) - (1 - trueProbability);
    return ev * 100; // Return as percentage
};

export const kellyCalculator = (
  winProbability: number,
  odds: number,
  bankroll: number,
  fractionalKelly: number = 0.25 // Use 1/4 Kelly for safety
): number => {
  if (winProbability <= 0 || winProbability >= 1) return 0;
  const decimalOdds = americanToDecimal(odds);
  const b = decimalOdds - 1;
  if (b <= 0) return 0;
  const p = winProbability;
  const q = 1 - p;
  
  const kellyFraction = (b * p - q) / b;
  
  const adjustedFraction = kellyFraction * fractionalKelly;
  
  // Never bet more than 5% of bankroll regardless of Kelly
  const maxBet = Math.min(adjustedFraction, 0.05);
  
  if (maxBet <= 0) return 0;
  
  return bankroll * maxBet;
};

export const kellyForParlay = (
  combinedProbability: number,
  parlayOdds: number,
  bankroll: number,
  numberOfLegs: number
): number => {
  if (numberOfLegs <= 0) return 0;
  // Reduce Kelly fraction based on number of legs
  const riskAdjustment = 1 / Math.sqrt(numberOfLegs);
  const conservativeKelly = 0.1 * riskAdjustment;
  
  return kellyCalculator(
    combinedProbability,
    parlayOdds,
    bankroll,
    conservativeKelly
  );
};

export const analyzeParlayValue = (
  legs: Array<{ odds: number; estimatedWinProb: number }>
): ParlayAnalysis => {
  const probabilities = legs.map(leg => leg.estimatedWinProb);
  const odds = legs.map(leg => leg.odds);
  
  const combinedProb = probabilities.reduce((acc, prob) => acc * prob, 1);
  const parlayOdds = calculateParlayOdds(odds.map(o => ({marketOdds: o})));
  // FIX: Map legs to the correct structure for calculateParlayEVFromTrueProbs
  const ev = calculateParlayEVFromTrueProbs(legs.map(l => ({ trueProbability: l.estimatedWinProb, marketOdds: l.odds })));
  
  let riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  if (combinedProb > 0.5) riskLevel = 'low';
  else if (combinedProb > 0.3) riskLevel = 'medium';
  else if (combinedProb > 0.15) riskLevel = 'high';
  else riskLevel = 'extreme';
  
  const avgProb = probabilities.length > 0 ? probabilities.reduce((a, b) => a + b, 0) / probabilities.length : 0;
  const recommendedMaxLegs = avgProb > 0 && avgProb < 1 ? Math.max(
    3,
    Math.floor(Math.log(0.2) / Math.log(avgProb)) // Target 20% combined probability
  ) : 3;
  
  return {
    combinedProbability: combinedProb,
    parlayOdds,
    expectedValue: ev,
    recommendedMaxLegs,
    riskLevel,
    shouldBet: ev > 0 && combinedProb > 0.15 // Only bet if +EV and >15% win chance
  };
};


// --- EXPORT FUNCTIONALITY ---

export const exportToCsv = (data: RankedPlayerProp[], propType: string, threshold: number) => {
    const headers = [
        'Player', 'Team', 'Opponent', 'Prop', 'Threshold', 'Position', 'Market Line', 'Market Odds',
        'True Prob %', 'Implied Prob %', 'EV %', 'Confidence %', 'Rank Score'
    ];
    const rows = data.map(row => [
        row.player.name,
        row.player.team,
        row.opponent.name,
        row.propType,
        row.threshold,
        row.position,
        row.marketLine,
        formatAmericanOdds(row.marketOdds),
        (row.trueProbability * 100).toFixed(2),
        (row.impliedProbability * 100).toFixed(2),
        row.ev.toFixed(2),
        (row.confidence * 100).toFixed(1),
        row.rankScore.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
        + headers.join(",") + "\n"
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const safePropType = propType.replace(/ /g, '_');
    link.setAttribute("download", `synoptic_edge_ranker_${safePropType}_${threshold}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};