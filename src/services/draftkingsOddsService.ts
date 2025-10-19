import { Game, PlayerProp } from '../types';
import { generateAlternateLines } from '../utils';

// This data is now internal to the service, acting as the source for our mock API response.
// In a real application, this would be replaced by a live API endpoint.
const DRAFTKINGS_ODDS_SOURCE: Game[] = [
  {
    id: 'game1',
    name: 'Kansas City Chiefs @ Baltimore Ravens',
    date: '2024-09-05',
    players: [
      {
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        props: [
          {
            propType: 'Passing Yards',
            lines: [{ line: 275.5, overOdds: -120, underOdds: -110 }],
          },
          {
            propType: 'Passing Touchdowns',
            lines: [{ line: 2.5, overOdds: 125, underOdds: -160 }],
          },
        ],
      },
      {
        name: 'Lamar Jackson',
        position: 'QB',
        team: 'BAL',
        props: [
          {
            propType: 'Passing Yards',
            lines: [{ line: 222.5, overOdds: -110, underOdds: -120 }],
          },
          {
            propType: 'Rushing Yards',
            lines: [{ line: 54.5, overOdds: -125, underOdds: -105 }],
          },
        ],
      },
      {
        name: 'Travis Kelce',
        position: 'TE',
        team: 'KC',
        props: [
          {
            propType: 'Receiving Yards',
            lines: [{ line: 69.5, overOdds: -115, underOdds: -115 }],
          },
          {
            propType: 'Receptions',
            lines: [{ line: 6.5, overOdds: -110, underOdds: -120 }],
          },
        ],
      },
    ],
  },
];


// --- Caching Layer ---
interface CacheEntry {
  data: Game;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// --- Data Transformation ---
const processGameData = (sourceData: Game): Game => {
    // This function will transform the raw API response into our application's data structure.
    // It also generates the alternate lines for each prop.
    return {
        ...sourceData,
        players: sourceData.players.map(player => ({
            ...player,
            props: player.props.map(prop => ({
                ...prop,
                lines: generateAlternateLines(prop)
            }))
        }))
    };
};

/**
 * Fetches and caches live odds for a specific game from a third-party aggregator.
 * This function simulates the full lifecycle: cache check, API call, data transformation, and caching.
 * @param gameId The unique identifier for the game.
 * @returns A promise that resolves to the processed game data, or null if not found.
 */
export const getOddsForGame = async (gameId: string): Promise<Game | null> => {
  const cachedEntry = cache.get(gameId);
  if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_TTL_MS) {
    console.log(`[Cache] HIT for DraftKings odds, gameId: ${gameId}`);
    return JSON.parse(JSON.stringify(cachedEntry.data)); // Return deep copy
  }
  
  console.log(`[API] MISS for DraftKings odds, gameId: ${gameId}. Fetching live data...`);

  try {
    // --- REAL IMPLEMENTATION ---
    // const apiKey = process.env.ODDS_API_KEY;
    // const response = await fetch(`https://api.odds-aggregator.com/v1/sports/americanfootball_nfl/events/${gameId}/odds?apiKey=${apiKey}&bookmakers=draftkings`);
    // if (!response.ok) throw new Error(`Failed to fetch odds, status: ${response.status}`);
    // const rawApiData = await response.json();
    
    // --- MOCK IMPLEMENTATION ---
    await new Promise(resolve => setTimeout(resolve, 450)); // Simulate network latency
    const rawApiData = DRAFTKINGS_ODDS_SOURCE.find(g => g.id === gameId);
    if (!rawApiData) {
        // This simulates the API returning a 404 Not Found.
        throw new Error(`No DraftKings market found for gameId: ${gameId}`);
    }

    // Transform the raw data into our standardized format and generate alternate lines
    const processedData = processGameData(rawApiData);

    // Store the processed data in the cache
    cache.set(gameId, { data: processedData, timestamp: Date.now() });

    return JSON.parse(JSON.stringify(processedData)); // Return deep copy

  } catch (error) {
    console.error("Error fetching or processing DraftKings odds:", error);
    // In a real app, you might want to handle this more gracefully, e.g., by returning stale cache data or null.
    return null;
  }
};