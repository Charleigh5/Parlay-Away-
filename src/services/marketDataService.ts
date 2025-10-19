import { Game } from '../types';
import { MOCK_GAMES_SOURCE } from '../data/mockSportsData';
import { generateAlternateLines } from '../utils';
import { apiClient } from './apiClient';
import { ServiceResponse } from '../types';

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

const MARKET_DATA_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Fetches and processes the raw source game data to generate a full set of alternate lines.
 * This function now uses the standard apiClient for caching and data retrieval.
 * @returns A promise that resolves to an array of Game data with all alternate lines populated.
 */
export const getMarketData = async (): Promise<Game[]> => {
    const response: ServiceResponse<Game[]> = await apiClient(
        'market-data:all',
        async () => {
            console.log('[API] Simulating fetch for all market data.');
            await new Promise(res => setTimeout(res, 200));
            // In a real app, this would fetch the raw data from a live API.
            // We return the raw source here to be processed later.
            return MOCK_GAMES_SOURCE;
        },
        MARKET_DATA_TTL
    );
    
    if (response.data) {
        // Process the data (generate alternate lines) after it's fetched.
        return processGameData(response.data);
    }
    
    return []; // Return empty array if data is unavailable.
};
