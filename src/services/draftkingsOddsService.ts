import { Game } from '../types';
import { generateAlternateLines } from '../utils';
import { apiClient } from './apiClient';
import { ServiceResponse } from '../types';

const DRAFTKINGS_ODDS_SOURCE: Game[] = [
  {
    id: 'game1',
    name: 'Kansas City Chiefs @ Baltimore Ravens',
    date: '2024-09-05',
    players: [
      { name: 'Patrick Mahomes', position: 'QB', team: 'KC', props: [
          { propType: 'Passing Yards', lines: [{ line: 275.5, overOdds: -120, underOdds: -110 }] },
          { propType: 'Passing Touchdowns', lines: [{ line: 2.5, overOdds: 125, underOdds: -160 }] },
      ]},
      { name: 'Lamar Jackson', position: 'QB', team: 'BAL', props: [
          { propType: 'Passing Yards', lines: [{ line: 222.5, overOdds: -110, underOdds: -120 }] },
          { propType: 'Rushing Yards', lines: [{ line: 54.5, overOdds: -125, underOdds: -105 }] },
      ]},
      { name: 'Travis Kelce', position: 'TE', team: 'KC', props: [
          { propType: 'Receiving Yards', lines: [{ line: 69.5, overOdds: -115, underOdds: -115 }] },
          { propType: 'Receptions', lines: [{ line: 6.5, overOdds: -110, underOdds: -120 }] },
      ]},
    ],
  },
];

const processGameData = (sourceData: Game): Game => {
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

const ODDS_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches live odds for a specific game, now using the standard apiClient.
 * @param gameId The unique identifier for the game.
 * @returns A promise that resolves to the game data, or null if not found.
 */
export const getOddsForGame = async (gameId: string): Promise<Game | null> => {
  const response: ServiceResponse<Game> = await apiClient(
    `draftkings-odds:${gameId}`,
    async () => {
        console.log(`[API] Simulating fetch for DraftKings odds, gameId: ${gameId}.`);
        await new Promise(resolve => setTimeout(resolve, 450));
        
        const rawApiData = DRAFTKINGS_ODDS_SOURCE.find(g => g.id === gameId);
        if (!rawApiData) {
            throw new Error(`No DraftKings market found for gameId: ${gameId}`);
        }
        return rawApiData;
    },
    ODDS_TTL
  );

  if (response.data) {
    // Transform data after fetching, before returning
    return processGameData(response.data);
  }

  return null;
};
