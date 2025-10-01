import { Game } from '../types';
import type { SportsDBResponse, SportsDBEvent } from '../types';

// NOTE: A free API key for TheSportsDB can be obtained via their Patreon.
// '1' is a public test key. It is recommended to use your own key and store it
// in an environment variable `process.env.THESPORTSDB_API_KEY`.
const API_KEY = process.env.THESPORTSDB_API_KEY || '1';
const NFL_LEAGUE_ID = '4391';
// Fetching for specific dates at the start of the season is more reliable with the free key
// than fetching the entire season, which was causing a 404 error.
const SEASON_START_DATES = [
    '2024-09-05', // Season Opener
    '2024-09-08', // Week 1 Sunday
    '2024-09-09', // Week 1 Monday
    '2024-09-15', // Week 2 Sunday
    '2024-09-16', // Week 2 Monday
];

const buildApiUrlForDate = (date: string) => `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsday.php?d=${date}&l=${NFL_LEAGUE_ID}`;


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
        players: matchingMockGame ? matchingMockGame.players : [], // Use mock players if available
    };
};

/**
 * Fetches the NFL schedule for the current season from TheSportsDB.
 * This function will throw an error if the underlying fetch calls fail,
 * allowing the calling component to handle the error state and fallback UI.
 */
export const fetchNFLEvents = async (marketData: Game[]): Promise<Game[]> => {
    const fetchPromises = SEASON_START_DATES.map(date => {
        const url = buildApiUrlForDate(date);
        return fetch(url).then(res => {
            if (!res.ok) {
                // By not throwing, but returning null, we allow Promise.all to succeed
                // even if some requests fail. We will check later if all failed.
                console.error(`API request for date ${date} failed with status ${res.status}`);
                return null;
            }
            return res.json();
        });
    });

    // If a fetch promise rejects (e.g., network error), Promise.all will reject.
    // This is the desired behavior to trigger the component's catch block.
    const results = await Promise.all(fetchPromises);
    
    const allEvents: SportsDBEvent[] = results
        .filter((data): data is SportsDBResponse => data !== null && !!data.events)
        .flatMap(data => data.events!);

    // If API calls succeed but return no events, fall back to mocks as a business rule.
    if (allEvents.length === 0) {
         console.warn("No events found for the specified dates. Falling back to market data.");
         return marketData;
    }
    
    const upcomingGames = allEvents.map(event => transformEventToGame(event, marketData));
    
    // Remove duplicates in case API returns same event on different queries
    const uniqueGames = Array.from(new Map(upcomingGames.map(game => [game.id, game])).values());

    return uniqueGames;
};