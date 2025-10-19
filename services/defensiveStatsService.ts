
import { ServiceResponse, DefensiveRanking, TeamDefensiveStats } from '../types';
import { apiClient } from './apiClient';
import { DEFENSIVE_STATS, TEAM_NAME_TO_ABBREVIATION } from '../data/mockDefensiveStats';

// --- MOCK DATA GENERATION ---

const getMockDefensiveStats = (teamId: string): TeamDefensiveStats | null => {
  const teamName = Object.keys(TEAM_NAME_TO_ABBREVIATION).find(
    name => TEAM_NAME_TO_ABBREVIATION[name] === teamId
  );
  return teamName ? DEFENSIVE_STATS[teamName] : null;
};

// --- SERVICE IMPLEMENTATIONS ---

const DEFENSIVE_STATS_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches a team's defensive ranking against a specific offensive position.
 */
export const getTeamDefensiveRanking = (teamId: string, position: 'QB' | 'RB' | 'WR' | 'TE'): Promise<ServiceResponse<DefensiveRanking>> => {
  return apiClient(`defense:${teamId}:${position}:ranking`, async () => {
    // TODO: Replace with SportRadar API call: GET /teams/{teamId}/rankings?position={position}
    console.log(`Simulating fetch for defensive ranking for team ${teamId} vs ${position}`);
    await new Promise(res => setTimeout(res, 200));
    
    const stats = getMockDefensiveStats(teamId);
    if (!stats) throw new Error(`No defensive stats for team ID ${teamId}`);

    // Simplified mapping for mock purposes
    const propTypeMap = {
      'QB': 'Passing Yards',
      'RB': 'Rushing Yards',
      'WR': 'Receiving Yards',
      'TE': 'vsTE',
    };
    const stat = stats[propTypeMap[position]];

    if (stat && 'rank' in stat && 'value' in stat) {
        return {
            position,
            yardsAllowedPerGame: stat.value,
            rank: stat.rank,
            dvoa: (16 - stat.rank) * 2.5, // Simulate a DVOA score based on rank
        };
    }
    throw new Error(`Invalid defensive data for ${teamId} vs ${position}`);
  }, DEFENSIVE_STATS_TTL);
};

/**
 * Fetches a team's overall defensive stats for the season.
 */
export const getTeamDefensiveStats = (teamId: string): Promise<ServiceResponse<TeamDefensiveStats>> => {
  return apiClient(`defense:${teamId}:stats`, async () => {
    // TODO: Replace with SportRadar API call: GET /teams/{teamId}/stats/defense
    console.log(`Simulating fetch for overall defensive stats for team ${teamId}`);
    await new Promise(res => setTimeout(res, 180));

    const stats = getMockDefensiveStats(teamId);
    if (!stats) throw new Error(`No defensive stats for team ID ${teamId}`);
    return stats;
  }, DEFENSIVE_STATS_TTL);
};