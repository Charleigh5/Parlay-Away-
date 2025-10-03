import { Game, PlayerProp } from '../types';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';
import { DRAFTKINGS_ODDS_SOURCE } from '../data/mockDraftKingsOdds';
import { generateAlternateLines } from '../utils';

let marketDataCache: Game[] | null = null;
let draftKingsDataCache: Game[] | null = null;

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

/**
 * Processes and caches DraftKings-specific odds data.
 * @returns A deep copy of the DraftKings game data with all alternate lines populated.
 */
export const getDraftKingsMarketData = (): Game[] => {
    if (draftKingsDataCache) {
        return JSON.parse(JSON.stringify(draftKingsDataCache));
    }
    const processedGames = processGameData(DRAFTKINGS_ODDS_SOURCE);
    draftKingsDataCache = processedGames;
    return JSON.parse(JSON.stringify(processedGames));
};