
import { Game } from '../types';
import type { SportsDBResponse, SportsDBEvent } from '../types';

// NOTE: A free API key for TheSportsDB can be obtained via their Patreon.
// '1' is a public test key. It is recommended to use your own key and store it
// in an environment variable `process.env.THESPORTSDB_API_KEY`.
const API_KEY = process.env.THESPORTSDB_API_KEY || '1';
const NFL_LEAGUE_ID = '4391';
const CURRENT_SEASON = '2024';

const buildApiUrlForSeason = () => `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsseason.php?id=${NFL_LEAGUE_ID}&s=${CURRENT_SEASON}`;


/**
 * Transforms an event from TheSportsDB API into the application's Game format.
 * It also attempts to merge rich player prop data from local mocks.
 */
const transformEventToGame = (event: SportsDBEvent, marketData: Game[]): Game => {
    // The API sometimes uses 'vs' so we standardize to '@'
    const gameName = event.strEvent.replace(' vs ', ' @ ');
    
    // Attempt to find a matching game in mocks to enrich with player data.
    // This is a simple matching logic for demonstration purposes.
    const matchingMockGame = marketData.find(mock => {
        const mockTeams = mock.name.split(' @ ');
        // Handle both "Team A @ Team B" and "Team B @ Team A"
        return (
            (gameName.includes(mockTeams[0]) && gameName.includes(mockTeams[1]))
        );
    });

    return {
        id: event.idEvent,
        name: gameName,
        date: event.dateEvent,
        players: matchingMockGame ? matchingMockGame.players : [], // Use mock players if available
    };
};

/**
 * Fetches the NFL schedule for the current season from TheSportsDB.
 * This implementation targets the 'eventsseason' endpoint for better reliability
 * and gracefully falls back to local market data if the API fails or returns no events.
 */
export const fetchNFLEvents = async (marketData: Game[]): Promise<Game[]> => {
    const url = buildApiUrlForSeason();
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            // The API might return non-OK status if the season hasn't started or for other reasons with a free key.
            console.warn(`API request for season ${CURRENT_SEASON} failed with status ${response.status}. Falling back to local market data.`);
            return marketData;
        }
        
        const data: SportsDBResponse = await response.json();
        
        // The free API may return a success response but with a null `events` field if no data is available.
        if (!data.events || data.events.length === 0) {
             console.warn(`No events found for season ${CURRENT_SEASON} via API. Falling back to local market data.`);
             return marketData;
        }
    
        const allEvents: SportsDBEvent[] = data.events;
        const upcomingGames = allEvents.map(event => transformEventToGame(event, marketData));
    
        // Remove duplicates in case API returns same event on different queries
        const uniqueGames = Array.from(new Map(upcomingGames.map(game => [game.id, game])).values());

        return uniqueGames;
    } catch (error) {
        // This will catch network errors or other issues with the fetch call itself.
        console.error("Failed to fetch NFL events due to a network error:", error);
        console.warn("Falling back to local market data due to network error.");
        return marketData;
    }
};
