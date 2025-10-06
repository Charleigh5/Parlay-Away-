import { Game, Player } from '../types';
import { getMarketData } from './marketDataService';
import { TEAM_NAME_TO_ABBREVIATION, TEAM_ABBREVIATION_TO_NAME } from '../data/mockDefensiveStats';

// This file implements the frontend data service as specified in the architectural blueprint.
// It mocks the backend API calls, returning data in the exact format the frontend expects.

const apiClient = {
  baseURL: 'https://your-api-domain.onrender.com', // The live URL of the future FastAPI server
};

// --- Mock Data Transformation ---
// This section transforms our existing mock data into the format defined by the new API specification.

let scheduleCache: Game[] | null = null;
const getMockSchedule = (): Game[] => {
    if (scheduleCache) return scheduleCache;
    const marketData = getMarketData();
    scheduleCache = marketData.map(game => {
        const teams = game.name.split(' @ ');
        const awayTeamName = teams[0];
        const homeTeamName = teams[1];
        
        return {
            id: game.id,
            name: game.name,
            date: game.date,
            // Per the spec, the schedule endpoint does NOT return players, only team info.
            // Mocking the additional fields from the spec.
            gameId: game.id, 
            status: "scheduled",
            startTimeUTC: new Date(game.date).toISOString(),
            homeTeam: { id: TEAM_NAME_TO_ABBREVIATION[homeTeamName] || 'HOME', fullName: homeTeamName },
            awayTeam: { id: TEAM_NAME_TO_ABBREVIATION[awayTeamName] || 'AWAY', fullName: awayTeamName },
            venue: "Mock Stadium"
        };
    });
    return scheduleCache;
}

const getMockRosterForTeam = (teamId: string): Player[] => {
    const marketData = getMarketData();
    const allPlayers = marketData.flatMap(game => game.players || []);
    return allPlayers.filter(player => player.team.toUpperCase() === teamId.toUpperCase());
}


// --- API Service Implementation ---

/**
 * Fetches the game schedule for a given season and week.
 * Mocks the endpoint: GET /api/v1/nfl/schedule
 */
export const getScheduleByWeek = async (season: number, week: number): Promise<{ season: number; week: number; games: Game[] }> => {
    console.log(`[Mock API] Fetching schedule for Season: ${season}, Week: ${week}`);
    
    // In a real scenario, you'd use fetch:
    // const response = await fetch(`${apiClient.baseURL}/api/v1/nfl/schedule?season=${season}&week=${week}`);
    // if (!response.ok) throw new Error("Failed to fetch schedule");
    // return response.json();
    
    // Simulating API call
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network latency
    
    const allGames = getMockSchedule();
    
    // Simple mock logic: just return all games since we don't have week data.
    // A real backend would filter by week.
    if (!allGames || allGames.length === 0) {
        throw new Error("No games found for this season/week.");
    }
    
    return Promise.resolve({
        season,
        week,
        games: allGames,
    });
};

/**
 * Fetches the full roster for a given team ID.
 * Mocks the endpoint: GET /api/v1/nfl/teams/{teamId}/roster
 */
// FIX: Implemented the function body to return the expected data structure, resolving the TypeScript error.
export const getTeamRoster = async (teamId: string): Promise<{ teamId: string; fullName: string; players: Player[] }> => {
    console.log(`[Mock API] Fetching roster for Team ID: ${teamId}`);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));

    const players = getMockRosterForTeam(teamId);
    const fullName = TEAM_ABBREVIATION_TO_NAME[teamId] || "Unknown Team";
    
    if (players.length === 0) {
        // This is a warning, not an error, as some teams may not have mock data.
        console.warn(`[Mock API] No players found for team ID: ${teamId}.`);
    }

    return {
        teamId,
        fullName,
        players,
    };
};
