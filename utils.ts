
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
