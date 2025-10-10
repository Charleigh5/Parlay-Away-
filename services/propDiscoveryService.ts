import { Player, Game } from '../types';
import { getScheduleByWeek, getTeamRoster } from './nflDataService';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';

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
 * This function now fetches the live schedule and rosters for the given week, then merges that
 * data with the available mock prop market data.
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

    // 1. Fetch live schedule for the selected week
    const scheduleResponse = await getScheduleByWeek(2024, week);
    const liveGames = scheduleResponse.games;
    if (!liveGames || liveGames.length === 0) {
        // Fallback to mock data for week 1 if API fails or no games are scheduled
        if (week === 1) {
            console.warn(`No live games found for week ${week}. Falling back to mock data.`);
            const allPlayers = MOCK_GAMES_SOURCE.flatMap(game => game.players);
            const eligiblePlayers = allPlayers.filter(player => {
                const hasMarket = player.props.some(p => p.propType === propType);
                const hasPosition = positions.includes(player.position);
                return hasMarket && hasPosition;
            });
            return { eligiblePlayers, games: MOCK_GAMES_SOURCE };
        }
        return { eligiblePlayers: [], games: [] };
    }

    // 2. Create a lookup map for mock player props and historical data from our limited mock source
    const mockPlayersData = new Map<string, Player>();
    MOCK_GAMES_SOURCE.forEach(game => {
        game.players.forEach(player => {
            mockPlayersData.set(player.name, player);
        });
    });

    // 3. Fetch all rosters for the live games
    const teamIds = new Set<string>();
    liveGames.forEach(game => {
        if (game.homeTeam) teamIds.add(game.homeTeam.id);
        if (game.awayTeam) teamIds.add(game.awayTeam.id);
    });

    const rosterPromises = Array.from(teamIds).map(id => getTeamRoster(id).catch(e => {
        console.error(`Failed to fetch roster for team ${id}`, e);
        return null; // Don't fail the whole process if one roster fails
    }));
    
    const rosters = (await Promise.all(rosterPromises)).filter((r): r is Exclude<typeof r, null> => r !== null);
    const allLivePlayersByTeam = new Map<string, Player[]>();
    rosters.forEach(roster => {
        if(roster) allLivePlayersByTeam.set(roster.teamId, roster.players);
    });

    // 4. Merge live player data with mock prop data and reconstruct games
    const mergedPlayersByName = new Map<string, Player>();
    
    const gamesWithPlayers = liveGames.map(game => {
        const gamePlayers: Player[] = [];
        const processTeam = (teamId?: string) => {
            if (!teamId) return;
            const teamPlayers = allLivePlayersByTeam.get(teamId);
            teamPlayers?.forEach(livePlayer => {
                // Only process if we haven't already seen this player
                if (!mergedPlayersByName.has(livePlayer.name)) {
                    const mockData = mockPlayersData.get(livePlayer.name);
                    // We only care about players who have prop markets in our mock data
                    if (mockData) {
                        // Create a merged player object: live data is the base, mock data provides props/context
                        // FIX: The `historicalContext` property does not exist on the `Player` type.
                        // It exists on `PlayerProp` and is correctly merged via `mockData.props`. This assignment was incorrect.
                        const mergedPlayer: Player = {
                            ...livePlayer,
                            props: mockData.props,
                            homeAwaySplits: mockData.homeAwaySplits,
                            divisionalSplits: mockData.divisionalSplits,
                        };
                        mergedPlayersByName.set(livePlayer.name, mergedPlayer);
                        gamePlayers.push(mergedPlayer);
                    }
                } else {
                    // Player already processed, just add to this game's list
                    gamePlayers.push(mergedPlayersByName.get(livePlayer.name)!);
                }
            });
        };

        processTeam(game.homeTeam?.id);
        processTeam(game.awayTeam?.id);

        return { ...game, players: gamePlayers };
    });

    // 5. Filter for eligible players from the complete list of merged players
    const eligiblePlayers = Array.from(mergedPlayersByName.values()).filter(player => {
        const hasMarket = player.props.some(p => p.propType === propType);
        const hasPosition = positions.includes(player.position);
        // Ensure player is considered starting (has markets in our mock system)
        return hasMarket && hasPosition;
    });
    
    return { eligiblePlayers, games: gamesWithPlayers };
};