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
const INJURY_TTL = 1 * 60 * 1000;  // 1 minute

/**
 * Fetches the last 10 game logs for a given player.
 */
export const getPlayerGameLog = (playerId: string): Promise<ServiceResponse<GameLogEntry[]>> => {
  return apiClient(`player:${playerId}:gamelog`, async () => {
    // TODO: Replace with SportRadar API call: GET /players/{playerId}/gamelog
    console.log(`Simulating fetch for game log for player ${playerId}`);
    await new Promise(res => setTimeout(res, 250)); // Simulate latency
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
        // TODO: Replace with SportRadar API call: GET /players/{playerId}/season_stats
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
        // TODO: Replace with SportRadar API call: GET /players/{playerId}/splits
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
 * Fetches the current injury status for a player.
 */
export const getInjuryStatus = (playerId: string): Promise<ServiceResponse<InjuryStatus>> => {
    return apiClient(`player:${playerId}:injury`, async () => {
        // TODO: Replace with SportRadar API call: GET /players/{playerId}/injury
        console.log(`Simulating fetch for injury status for player ${playerId}`);
        await new Promise(res => setTimeout(res, 100)); // Fast-moving data
        const playerMarketData = MOCK_GAMES_SOURCE.flatMap(g => g.players).find(p => p.name === playerId);
        
        // FIX: The returned object must match the InjuryStatus type.
        if (playerMarketData?.injuryStatus) {
            // If the player has an injury status in the mock data, return it.
            return playerMarketData.injuryStatus;
        }

        // Otherwise, return a default "Probable" status.
        return {
            status: 'P',
            news: 'No significant injuries reported.',
            impact: 'Expected to play without significant limitations.'
        };
    }, INJURY_TTL);
};
