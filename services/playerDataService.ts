
import { ServiceResponse, GameLogEntry, PlayerSeasonStats, PlayerSplits, InjuryStatus } from '../types';
import { apiClient } from './apiClient';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';

// --- MOCK DATA GENERATION ---
// In a real app, this logic would be on the backend. Here, we simulate it.

const generateMockGameLog = (playerName: string): GameLogEntry[] => {
    const playerMarketData = MOCK_GAMES_SOURCE.flatMap(g => g.players).find(p => p.name === playerName);
    if (!playerMarketData) return [];

    return (playerMarketData.props.find(p => p.propType === 'Passing Yards')?.historicalContext?.gameLog || []).map((val, i) => ({
        gameId: `gm_log_${i}`,
        date: new Date(Date.now() - (10 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        opponent: i % 2 === 0 ? 'DEN' : 'LAC',
        passingYards: val,
        rushingYards: Math.round(val / 10),
        passingTDs: Math.round(val / 100),
    }));
};

const getMockSeasonStats = (playerName: string): PlayerSeasonStats => {
    const log = generateMockGameLog(playerName);
    return log.reduce((acc, game) => ({
        gamesPlayed: acc.gamesPlayed + 1,
        passingYards: acc.passingYards + (game.passingYards || 0),
        rushingYards: acc.rushingYards + (game.rushingYards || 0),
        receivingYards: 0,
    }), { gamesPlayed: 0, passingYards: 0, rushingYards: 0, receivingYards: 0 });
};

// --- SERVICE IMPLEMENTATIONS ---

const STATS_TTL = 10 * 60 * 1000; // 10 minutes
const INJURY_TTL = 2 * 60 * 1000;  // 2 minutes

/**
 * Fetches the last 10 game logs for a given player.
 * NOTE: Historical player game logs are a premium data feature and are not readily available
 * via free APIs. This function retains its mock implementation until a premium data source
 * (e.g., Sportradar, StatsPerform) is integrated.
 */
export const getPlayerGameLog = (playerId: string): Promise<ServiceResponse<GameLogEntry[]>> => {
  return apiClient(`player:${playerId}:gamelog`, async () => {
    console.warn(`[Mock Data] Using mock game log for player ${playerId}. A premium API is required for live data.`);
    await new Promise(res => setTimeout(res, 50)); // Simulate latency
    const log = generateMockGameLog(playerId);
    if (log.length === 0) throw new Error(`No game log data found for ${playerId}`);
    return log;
  }, STATS_TTL);
};

/**
 * Fetches seasonal stats for a given player.
 */
export const getPlayerSeasonStats = (playerId: string): Promise<ServiceResponse<PlayerSeasonStats>> => {
    return apiClient(`player:${playerId}:seasonstats`, async () => {
        // TODO: Replace with live API call. For now, derived from mock game log.
        console.log(`Simulating fetch for season stats for player ${playerId}`);
        await new Promise(res => setTimeout(res, 150));
        const stats = getMockSeasonStats(playerId);
        if (stats.gamesPlayed === 0) throw new Error(`No season stats found for ${playerId}`);
        return stats;
    }, STATS_TTL);
};

/**
 * Fetches situational splits (home/away, etc.) for a player.
 */
export const getPlayerSplits = (playerId: string): Promise<ServiceResponse<PlayerSplits>> => {
     return apiClient(`player:${playerId}:splits`, async () => {
        // TODO: Replace with live API call. This is a premium data feature.
        console.log(`Simulating fetch for splits for player ${playerId}`);
        await new Promise(res => setTimeout(res, 200));
        // This is highly simplified for the mock. A real API would provide richer data.
        return {
            home: { passingYards: 310.5, rushingYards: 25.1 },
            away: { passingYards: 272.9, rushingYards: 19.8 },
            vsDivisional: { passingYards: 295.1 },
            last5Avg: { passingYards: 282.4 },
            last10Avg: { passingYards: 291.7 },
        };
    }, STATS_TTL);
};

/**
 * Fetches the current injury status for a player from the live ESPN Scoreboard API.
 */
export const getInjuryStatus = (playerId: string): Promise<ServiceResponse<InjuryStatus>> => {
    return apiClient(`player:${playerId}:injury`, async () => {
        console.log(`[Live API] Fetching injury status for player ${playerId} from ESPN`);
        const url = `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch scoreboard for injury data');
        const scoreboard = await res.json();
        
        let injuryData = null;
        
        // Search through all games to find the player
        for (const event of scoreboard.events) {
            const competition = event.competitions[0];
            if (competition.injuries) {
                for (const injury of competition.injuries) {
                    if (injury.athlete.displayName.toLowerCase() === playerId.toLowerCase()) {
                        injuryData = {
                            status: injury.status.abbreviation,
                            news: injury.detail,
                            impact: `Listed as ${injury.status.name}.`
                        };
                        break;
                    }
                }
            }
            if (injuryData) break;
        }

        if (injuryData) {
            return injuryData;
        }

        // If no injury is found, return a healthy status.
        return {
            status: 'P', // Probable/Healthy
            news: 'No significant injuries reported.',
            impact: 'Expected to play without significant limitations.'
        };
    }, INJURY_TTL);
};