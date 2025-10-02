import { Game } from '../types';
import { PLAYER_SPLITS } from './mockSplitsData';

// NOTE: This file now only contains the PRIMARY line for each prop.
// Alternate lines are generated dynamically by the MarketDataService.

export const MOCK_GAMES_SOURCE: Game[] = [
  {
    id: 'game1',
    name: 'Kansas City Chiefs @ Baltimore Ravens',
    date: '2024-09-05',
    players: [
      {
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        ...PLAYER_SPLITS['Patrick Mahomes'],
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 275.5, overOdds: -115, underOdds: -115 },
            ],
            historicalContext: {
              seasonAvg: 291.7,
              last5Avg: 282.4,
              gameLog: [288, 305, 262, 278, 304, 299, 245, 330, 270, 292],
            }
          },
          {
            propType: 'Passing Touchdowns',
            lines: [
              { line: 2.5, overOdds: 120, underOdds: -150 },
            ],
            historicalContext: {
              seasonAvg: 2.1,
              last5Avg: 1.8,
              gameLog: [2, 2, 1, 2, 3, 2, 1, 3, 2, 2],
            }
          },
          {
            propType: '1st Half Passing Yards',
            lines: [
              { line: 145.5, overOdds: -110, underOdds: -110 }
            ],
            historicalContext: {
              seasonAvg: 151.2,
              last5Avg: 148.8,
              gameLog: [150, 162, 135, 144, 158, 155, 120, 170, 140, 151],
            }
          },
        ],
      },
      {
        name: 'Lamar Jackson',
        position: 'QB',
        team: 'BAL',
        ...PLAYER_SPLITS['Lamar Jackson'],
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 220.5, overOdds: -110, underOdds: -110 },
            ],
             historicalContext: {
              seasonAvg: 229.9,
              last5Avg: 245.1,
              gameLog: [252, 212, 189, 265, 223, 230, 274, 201, 195, 281],
            }
          },
          {
            propType: 'Rushing Yards',
            lines: [
              { line: 55.5, overOdds: -120, underOdds: 100 },
            ],
            historicalContext: {
              seasonAvg: 51.5,
              last5Avg: 62.8,
              gameLog: [70, 45, 58, 81, 62, 51, 49, 68, 55, 39],
            }
          },
          {
            propType: 'Passing + Rushing Yards',
            lines: [
                { line: 280.5, overOdds: -115, underOdds: -115 }
            ],
            historicalContext: {
                seasonAvg: 281.4,
                last5Avg: 307.9,
                gameLog: [322, 257, 247, 346, 285, 281, 323, 269, 250, 320],
            }
          },
        ],
      },
      {
          name: 'Travis Kelce',
          position: 'TE',
          team: 'KC',
          injuryStatus: {
              status: 'Q',
              news: 'Listed as questionable with a minor ankle sprain sustained in last week\'s game.',
              impact: 'Practiced in a limited capacity. Explosiveness might be slightly hampered on deep routes. Monitor in-game usage. (KM_05)'
          },
          ...PLAYER_SPLITS['Travis Kelce'],
          props: [
              {
                  propType: 'Receiving Yards',
                  lines: [
                      { line: 70.5, overOdds: -112, underOdds: -112 },
                  ],
                  historicalContext: {
                    seasonAvg: 75.8,
                    last5Avg: 82.0,
                    gameLog: [81, 93, 68, 75, 102, 55, 88, 71, 99, 64],
                  }
              },
              {
                  propType: 'Receptions',
                  lines: [
                      { line: 6.5, overOdds: -105, underOdds: -115 },
                  ],
                  historicalContext: {
                    seasonAvg: 6.8,
                    last5Avg: 7.2,
                    gameLog: [7, 8, 6, 7, 9, 5, 7, 6, 10, 8],
                  }
              },
          ],
      },
       {
        name: 'Isiah Pacheco',
        position: 'RB',
        team: 'KC',
        injuryStatus: {
            status: 'P',
            news: 'Listed as probable with a bruised shoulder. Was a full participant in Friday\'s practice.',
            impact: 'Expected to play without significant limitations. May see slightly reduced goal-line work as a precaution. (KM_05)'
        },
        props: [
            {
                propType: 'Rushing Yards',
                lines: [{ line: 65.5, overOdds: -115, underOdds: -115 }],
                historicalContext: { seasonAvg: 72.3, last5Avg: 78.1, gameLog: [80, 65, 92, 77, 70, 55, 101, 68, 85, 74] }
            }
        ]
      },
      {
        name: 'Zay Flowers',
        position: 'WR',
        team: 'BAL',
        props: [
          {
            propType: 'Receiving Yards',
            lines: [
              { line: 55.5, overOdds: -110, underOdds: -110 },
            ],
            historicalContext: {
              seasonAvg: 61.2,
              last5Avg: 58.5,
              gameLog: [62, 45, 71, 59, 55, 80, 33, 65, 51, 75],
            }
          },
        ],
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
            lines: [{ line: 240.5, overOdds: -115, underOdds: -115 }],
            historicalContext: { seasonAvg: 235.1, last5Avg: 228.4, gameLog: [250, 210, 222, 280, 195, 240, 215, 230, 255, 205] }
          },
          {
            propType: 'Rushing Yards',
            lines: [{ line: 40.5, overOdds: -125, underOdds: 105 }],
            historicalContext: { seasonAvg: 45.2, last5Avg: 38.1, gameLog: [35, 50, 41, 29, 60, 45, 33, 55, 48, 39] }
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
            lines: [{ line: 255.5, overOdds: -110, underOdds: -110 }],
            historicalContext: { seasonAvg: 265.8, last5Avg: 275.2, gameLog: [280, 310, 250, 266, 290, 270, 285, 260, 295, 255] }
          }
        ],
      },
      {
        name: 'Chris Jones',
        position: 'DT',
        team: 'KC',
        props: [
            {
                propType: 'Sacks',
                lines: [
                    { line: 0.5, overOdds: -140, underOdds: 120 },
                ],
                historicalContext: {
                    seasonAvg: 0.8,
                    last5Avg: 1.0,
                    gameLog: [1, 0, 1.5, 1, 0.5, 2, 0, 1, 0, 1.5],
                }
            }
        ]
      },
    ]
  }
];
