import { HomeAwaySplits, StatSplits } from '../types';

interface PlayerSplitsData {
    homeAwaySplits?: HomeAwaySplits;
    divisionalSplits?: StatSplits;
}

export const PLAYER_SPLITS: Record<string, PlayerSplitsData> = {
    'Patrick Mahomes': {
        homeAwaySplits: {
            home: { 'Passing Yards': 310.5, 'Passing Touchdowns': 2.4 },
            away: { 'Passing Yards': 272.9, 'Passing Touchdowns': 1.8 }
        },
        divisionalSplits: { 'Passing Yards': 295.1, 'Passing Touchdowns': 2.2 }
    },
    'Lamar Jackson': {
        homeAwaySplits: {
            home: { 'Passing Yards': 215.8, 'Rushing Yards': 65.2 },
            away: { 'Passing Yards': 244.0, 'Rushing Yards': 37.8 }
        },
        divisionalSplits: { 'Passing Yards': 225.4, 'Rushing Yards': 58.1 }
    },
    'Travis Kelce': {
        homeAwaySplits: {
            home: { 'Receiving Yards': 85.3, 'Receptions': 7.5 },
            away: { 'Receiving Yards': 66.2, 'Receptions': 6.1 }
        },
        divisionalSplits: { 'Receiving Yards': 78.9, 'Receptions': 7.0 }
    }
};
