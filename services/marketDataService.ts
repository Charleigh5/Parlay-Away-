import { Game, PlayerProp } from '../types';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';
import { generateAlternateLines } from '../utils';

let marketDataCache: Game[] | null = null;

const processGameData = (sourceData: Game[]): Game[] => {
    return sourceData.map(game => ({
        ...game,
        players: game.players.map(player => ({
            ...player,
            props: player.props.map(prop => ({
                ...prop,
                lines: generateAlternateLines(prop)
            }))
        }))
    }));
};


/**
 * Processes the raw source game data to generate a full set of alternate lines for each prop.
 * This function is memoized to avoid redundant calculations.
 * @returns A deep copy of the game data with all alternate lines populated.
 */
export const getMarketData = (): Game[] => {
    if (marketDataCache) {
        return JSON.parse(JSON.stringify(marketDataCache));
    }
    const processedGames = processGameData(MOCK_GAMES_SOURCE);
    marketDataCache = processedGames;
    return JSON.parse(JSON.stringify(processedGames)); // Return a deep copy
};
