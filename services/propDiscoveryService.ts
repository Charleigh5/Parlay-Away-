import { Player } from '../types';
import { getScheduleByWeek, getTeamRoster } from './nflDataService';

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
 * @param propType The type of prop to find players for (e.g., "Passing Yards").
 * @param week The NFL week to search.
 * @returns A promise that resolves to an array of eligible Player objects.
 */
export const getAllEligiblePlayers = async (propType: string, week: number): Promise<Player[]> => {
    const positions = PROP_TYPE_TO_POSITIONS[propType];
    if (!positions) {
        console.warn(`No position mapping for prop type: ${propType}`);
        return [];
    }

    // In a real app, week would be passed to the service. Our mock service ignores it for now.
    const scheduleResponse = await getScheduleByWeek(2024, week);
    const allGames = scheduleResponse.games;

    const rosterPromises = allGames.flatMap(game => [
        game.homeTeam ? getTeamRoster(game.homeTeam.id) : Promise.resolve(null),
        game.awayTeam ? getTeamRoster(game.awayTeam.id) : Promise.resolve(null)
    ]).filter(p => p !== null);

    const rosters = await Promise.all(rosterPromises);
    const allPlayers = rosters.flatMap(roster => roster?.players || []);

    // Filter for unique players who have the relevant prop and match the position
    const uniquePlayers = new Map<string, Player>();
    allPlayers.forEach(player => {
        if (!uniquePlayers.has(player.name) && positions.includes(player.position)) {
            // Also check if they actually have this prop market available
            if (player.props.some(p => p.propType === propType)) {
                 uniquePlayers.set(player.name, player);
            }
        }
    });

    return Array.from(uniquePlayers.values());
};
