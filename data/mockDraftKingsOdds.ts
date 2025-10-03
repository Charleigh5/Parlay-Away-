import { Game } from '../types';

// This data represents odds from a different sportsbook (DraftKings)
// Odds are intentionally slightly different from the main mock data to simulate market variance.
export const DRAFTKINGS_ODDS_SOURCE: Game[] = [
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
          {
            propType: '1st Half Passing Yards',
            lines: [{ line: 146.5, overOdds: -115, underOdds: -115 }]
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
      {
        name: 'Zay Flowers',
        position: 'WR',
        team: 'BAL',
        props: [
          {
            propType: 'Receiving Yards',
            lines: [{ line: 56.5, overOdds: -105, underOdds: -125 }],
          },
        ],
      },
       {
        name: 'Chris Jones',
        position: 'DT',
        team: 'KC',
        props: [
            {
                propType: 'Sacks',
                lines: [{ line: 0.5, overOdds: -155, underOdds: 125 }],
            }
        ]
      },
    ],
  },
  {
    id: 'game2',
    name: 'Green Bay Packers @ Philadelphia Eagles',
    date: '2024-09-06',
    players: [
      {
        name: 'Jalen Hurts',
        position: 'QB',
        team: 'PHI',
        props: [
          {
            propType: 'Passing Yards',
            lines: [{ line: 242.5, overOdds: -110, underOdds: -110 }],
          },
          {
            propType: 'Rushing Yards',
            lines: [{ line: 42.5, overOdds: -120, underOdds: 100 }],
          }
        ],
      },
      {
        name: 'Jordan Love',
        position: 'QB',
        team: 'GB',
        props: [
          {
            propType: 'Passing Yards',
            lines: [{ line: 254.5, overOdds: -115, underOdds: -115 }],
          }
        ],
      },
    ]
  }
];
