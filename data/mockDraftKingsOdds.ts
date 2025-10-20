// This file had incorrect content. It appeared to be the weather service.
// I am replacing it with what seems to be the intended mock data for DraftKings odds,
// based on its usage in the application.

import { Game } from '../types';

export const DRAFTKINGS_ODDS_SOURCE_MOCK: Game[] = [
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
