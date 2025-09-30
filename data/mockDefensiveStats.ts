interface DefensiveStat {
  value: number;
  rank: number;
  unit: string;
}

// FIX: Redefined TeamDefensiveStats to properly type the `overall` property and other string-indexed stats.
// The index signature now allows for either a `DefensiveStat` or the shape of the `overall` property,
// resolving the original type conflict. This is consistent with usage in BetBuilder.tsx where
// a type guard is used to differentiate between stat types.
interface TeamDefensiveStats {
  overall: { rank: number };
  [propType: string]: DefensiveStat | { rank: number };
}

export const TEAM_ABBREVIATION_TO_NAME: Record<string, string> = {
    'KC': 'Kansas City Chiefs',
    'BAL': 'Baltimore Ravens',
    'GB': 'Green Bay Packers',
    'PHI': 'Philadelphia Eagles',
};

export const TEAM_NAME_TO_ABBREVIATION: Record<string, string> = Object.fromEntries(
    Object.entries(TEAM_ABBREVIATION_TO_NAME).map(([abbr, name]) => [name, abbr])
);

export const DEFENSIVE_STATS: Record<string, TeamDefensiveStats> = {
  'Kansas City Chiefs': {
    overall: { rank: 5 },
    'Passing Yards': { value: 199.8, rank: 2, unit: 'YPG' },
    'Passing Touchdowns': { value: 1.1, rank: 3, unit: 'PG' },
    'Rushing Yards': { value: 112.9, rank: 18, unit: 'YPG' },
    'Receiving Yards': { value: 205.1, rank: 4, unit: 'YPG' },
    'Receptions': { value: 15.3, rank: 2, unit: 'Allowed PG' },
  },
  'Baltimore Ravens': {
    overall: { rank: 1 },
    'Passing Yards': { value: 215.5, rank: 5, unit: 'YPG' },
    'Passing Touchdowns': { value: 0.9, rank: 1, unit: 'PG' },
    'Rushing Yards': { value: 105.2, rank: 12, unit: 'YPG' },
    'Receiving Yards': { value: 220.4, rank: 6, unit: 'YPG' },
    'Receptions': { value: 16.1, rank: 5, unit: 'Allowed PG' },
  },
  'Green Bay Packers': {
    overall: { rank: 22 },
    'Passing Yards': { value: 231.2, rank: 15, unit: 'YPG' },
    'Rushing Yards': { value: 128.9, rank: 28, unit: 'YPG' },
  },
  'Philadelphia Eagles': {
    overall: { rank: 17 },
    'Passing Yards': { value: 252.7, rank: 29, unit: 'YPG' },
    'Rushing Yards': { value: 92.4, rank: 8, unit: 'YPG' },
  },
};
