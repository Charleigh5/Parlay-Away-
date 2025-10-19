// FIX: Corrected import path for types
import { Game, Player } from '../types/index';
import { apiClient } from './apiClient';

// This file is updated to use the live ESPN API, replacing the previous mock data implementation.

const ESPN_API_BASE = 'http://site.api.espn.com/apis/site/v2/sports/football/nfl';

// --- API Data Transformation Functions ---

// Transforms a single event from the ESPN Scoreboard API into our application's `Game` type.
const transformEspnEventToGame = (event: any): Game => {
    const competition = event.competitions[0];
    const homeCompetitor = competition.competitors.find((c: any) => c.homeAway === 'home');
    const awayCompetitor = competition.competitors.find((c: any) => c.homeAway === 'away');

    return {
        id: event.id,
        gameId: event.id,
        name: event.name,
        date: event.date,
        status: event.status.type.name,
        startTimeUTC: event.date,
        homeTeam: { id: homeCompetitor.team.abbreviation, fullName: homeCompetitor.team.displayName },
        awayTeam: { id: awayCompetitor.team.abbreviation, fullName: awayCompetitor.team.displayName },
        venue: competition.venue.fullName,
        stadiumLocation: {
            lat: competition.venue.address?.latitude || 0,
            lon: competition.venue.address?.longitude || 0,
        },
        players: [], // Rosters are fetched separately per team
    };
};

// Transforms a player from the ESPN Roster API into our application's `Player` type.
const transformEspnAthleteToPlayer = (athlete: any, teamAbbr: string): Player => {
    // Note: The free ESPN roster endpoint does not provide prop markets.
    // The `props` array will be populated by market data services later in the data flow.
    return {
        name: athlete.displayName,
        position: athlete.position.abbreviation,
        team: teamAbbr,
        props: [], // Prop odds are sourced from odds providers, not this endpoint.
        injuryStatus: athlete.injuries && athlete.injuries.length > 0 ? {
            status: athlete.injuries[0].status,
            news: athlete.injuries[0].description,
            impact: 'See latest reports for details.'
        } : undefined,
    };
};


// --- API Service Implementation ---

/**
 * Fetches the game schedule for a given season and week from the live ESPN API.
 * Replaces the mock endpoint: GET /api/v1/nfl/schedule
 */
export const getScheduleByWeek = async (season: number, week: number): Promise<{ season: number; week: number; games: Game[] }> => {
    console.log(`[Live API] Fetching schedule for Season: ${season}, Week: ${week} from ESPN`);
    
    // The apiClient handles caching and retries automatically.
    const key = `schedule:${season}:${week}`;
    const response = await apiClient(key, async () => {
        const url = `${ESPN_API_BASE}/scoreboard?seasontype=2&week=${week}&season=${season}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to fetch schedule from ESPN API");
        return res.json();
    }, 60 * 60 * 1000); // Cache schedule for 1 hour

    const games = response.data?.events.map(transformEspnEventToGame) || [];

    return {
        season,
        week,
        games,
    };
};

/**
 * Fetches the full roster for a given team ID from the live ESPN API.
 * Replaces the mock endpoint: GET /api/v1/nfl/teams/{teamId}/roster
 */
export const getTeamRoster = async (teamId: string): Promise<{ teamId: string; fullName: string; players: Player[] }> => {
    console.log(`[Live API] Fetching roster for Team ID: ${teamId} from ESPN`);
    
    const key = `roster:${teamId}`;
    const response = await apiClient(key, async () => {
        // We need the numeric ID for the teams endpoint. A real app would have a mapping.
        // For now, we'll try to find it from the scoreboard. This is inefficient but works for a demo.
        const schedule = await fetch(`${ESPN_API_BASE}/scoreboard`).then(res => res.json());
        const event = schedule.events.find((e: any) => 
            e.competitions[0].competitors.some((c: any) => c.team.abbreviation.toUpperCase() === teamId.toUpperCase())
        );
        if (!event) throw new Error(`Could not find numeric ID for team ${teamId}`);
        const competitor = event.competitions[0].competitors.find((c: any) => c.team.abbreviation.toUpperCase() === teamId.toUpperCase());
        const numericId = competitor.team.id;

        const url = `${ESPN_API_BASE}/teams/${numericId}?enable=roster`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch roster for team ${teamId}`);
        return res.json();
    }, 6 * 60 * 60 * 1000); // Cache roster for 6 hours

    const teamData = response.data?.team;
    if (!teamData) {
        throw new Error(`No team data returned for ID ${teamId}`);
    }

    const players = teamData.athletes.map((athlete: any) => transformEspnAthleteToPlayer(athlete, teamData.abbreviation));

    return {
        teamId: teamData.abbreviation,
        fullName: teamData.displayName,
        players,
    };
};