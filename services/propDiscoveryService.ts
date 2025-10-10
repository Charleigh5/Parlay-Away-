
import { Player, Game } from '../types';
import { getScheduleByWeek, getTeamRoster } from './nflDataService';
import { getOddsForGame } from './draftkingsOddsService';

const PROP_TYPE_TO_POSITIONS: Record<string, string[]> = {
    'Passing Yards': ['QB'],
    'Passing Touchdowns': ['QB'],
    '1st Half Passing Yards': ['QB'],
    'Passing + Rushing Yards': ['QB'],
    'Rushing Yards': ['RB', 'QB'],
    'Receiving Yards': ['WR', 'TE', 'RB'],
    'Receptions': ['WR', 'TE', 'RB'],
    'Sacks': ['DE', 'DT', 'LB'],
    'Tackles + Assists': ['LB', 'S', 'CB', 'DE', 'DT'],
};

/**
 * Discovers all players across all games for a given week who are eligible for a specific prop type.
 * This function now fetches the live schedule, rosters, and prop odds from their respective services,
 * merging them into a comprehensive and up-to-date data set for analysis.
 * @param propType The type of prop to find players for (e.g., "Passing Yards").
 * @param week The NFL week to search.
 * @returns A promise that resolves to an object containing an array of eligible Player objects
 *          and the full Game data structure for that week.
 */
export const getAllEligiblePlayers = async (propType: string, week: number): Promise<{ eligiblePlayers: Player[]; games: Game[] }> => {
    const positions = PROP_TYPE_TO_POSITIONS[propType];
    if (!positions) {
        console.warn(`No position mapping for prop type: ${propType}`);
        return { eligiblePlayers: [], games: [] };
    }

    // 1. Fetch live schedule for the selected week.
    const scheduleResponse = await getScheduleByWeek(2024, week);
    if (!scheduleResponse.games || scheduleResponse.games.length === 0) {
        console.warn(`No live games found for week ${week}.`);
        return { eligiblePlayers: [], games: [] };
    }

    // 2. For each game, concurrently fetch its rosters and odds, then merge them.
    const detailedGamePromises = scheduleResponse.games.map(async (game) => {
        try {
            const homeRosterPromise = game.homeTeam ? getTeamRoster(game.homeTeam.id) : Promise.resolve(null);
            const awayRosterPromise = game.awayTeam ? getTeamRoster(game.awayTeam.id) : Promise.resolve(null);
            const oddsPromise = getOddsForGame(game.id);

            const [homeRoster, awayRoster, gameWithOdds] = await Promise.all([homeRosterPromise, awayRosterPromise, oddsPromise]);

            // Create a map of all players from the live rosters for efficient lookup.
            const livePlayers = [...(homeRoster?.players ?? []), ...(awayRoster?.players ?? [])];
            const livePlayerMap = new Map(livePlayers.map(p => [p.name, p]));

            // If there are no odds for this game, return the game with just roster data.
            if (!gameWithOdds) {
                return { ...game, players: livePlayers };
            }
            
            // Merge odds data into the live roster data.
            const mergedPlayers = gameWithOdds.players.map(playerWithOdds => {
                const livePlayerData = livePlayerMap.get(playerWithOdds.name);
                // If we find a matching player in the live roster, combine their data.
                if (livePlayerData) {
                    return {
                        ...livePlayerData, // Base is the live roster (name, position, injury status)
                        props: playerWithOdds.props, // Add the prop odds from the odds service
                    };
                }
                // If no live roster match, use the player data from the odds service.
                return playerWithOdds;
            });
            
            return { ...game, players: mergedPlayers };
        } catch (error) {
            console.error(`Failed to process game ${game.id}:`, error);
            return { ...game, players: [] }; // Return game with empty players on error
        }
    });

    const gamesWithFullData = await Promise.all(detailedGamePromises);
    
    // 3. Flatten all players from all games and filter for eligibility.
    const allPlayers = gamesWithFullData.flatMap(g => g.players);

    const eligiblePlayers = allPlayers.filter(player => {
        if (!player || !player.props) return false;
        const hasMarket = player.props.some(p => p.propType === propType);
        const hasPosition = positions.includes(player.position);
        return hasMarket && hasPosition;
    });

    // Use a Set to remove duplicate players who might appear in multiple data sources
    const uniquePlayers = Array.from(new Map(eligiblePlayers.map(p => [p.name, p])).values());

    return { eligiblePlayers: uniquePlayers, games: gamesWithFullData };
};
