import { Game } from '../types';

export const MOCK_GAMES: Game[] = [
  {
    id: 'game1',
    name: 'Kansas City Chiefs @ Baltimore Ravens',
    players: [
      {
        name: 'Patrick Mahomes',
        position: 'QB',
        team: 'KC',
        injuryStatus: {
          status: 'Healthy',
          news: 'No recent injury concerns reported. Participated fully in all recent practices.',
          impact: 'Player is at full capacity. No negative performance impact is expected from an injury standpoint. (KM_05)'
        },
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 275.5, overOdds: -115, underOdds: -115 },
              { line: 285.5, overOdds: 105, underOdds: -135 },
              { line: 295.5, overOdds: 125, underOdds: -160 },
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
              { line: 1.5, overOdds: -180, underOdds: 150 },
              { line: 2.5, overOdds: 120, underOdds: -150 },
            ],
            historicalContext: {
              seasonAvg: 2.1,
              last5Avg: 1.8,
              gameLog: [2, 2, 1, 2, 3, 2, 1, 3, 2, 2],
            }
          },
        ],
      },
      {
        name: 'Lamar Jackson',
        position: 'QB',
        team: 'BAL',
        injuryStatus: {
          status: 'Healthy',
          news: 'Cleared from the injury report this week after dealing with a minor calf issue.',
          impact: 'Returns to 100% health. No physical limitations anticipated, which is critical for his dual-threat ability. (KM_05)'
        },
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 220.5, overOdds: -110, underOdds: -110 },
              { line: 230.5, overOdds: 115, underOdds: -145 },
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
              { line: 60.5, overOdds: 105, underOdds: -125 },
            ],
            historicalContext: {
              seasonAvg: 51.5,
              last5Avg: 62.8,
              gameLog: [70, 45, 58, 81, 62, 51, 49, 68, 55, 39],
            }
          },
        ],
      },
      {
          name: 'Travis Kelce',
          position: 'TE',
          team: 'KC',
          injuryStatus: {
              status: 'Questionable',
              news: 'Listed as questionable with a minor ankle sprain sustained in last week\'s game.',
              impact: 'Practiced in a limited capacity this week. While expected to play, explosiveness might be slightly hampered on deep routes. Monitor in-game usage. (KM_05)'
          },
          props: [
              {
                  propType: 'Receiving Yards',
                  lines: [
                      { line: 70.5, overOdds: -112, underOdds: -112 },
                      { line: 75.5, overOdds: 110, underOdds: -130 },
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
                      { line: 7.5, overOdds: 140, underOdds: -170 },
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
        name: 'Zay Flowers',
        position: 'WR',
        team: 'BAL',
        props: [
          {
            propType: 'Receiving Yards',
            lines: [
              { line: 55.5, overOdds: -115, underOdds: -105 },
              { line: 60.5, overOdds: 110, underOdds: -140 },
            ],
            historicalContext: {
              seasonAvg: 58.2,
              last5Avg: 65.4,
              gameLog: [45, 78, 53, 112, 60, 58, 41, 73, 25, 99],
            }
          }
        ]
      }
    ],
  },
  {
    id: 'game2',
    name: 'Green Bay Packers @ Philadelphia Eagles',
    players: [
      {
        name: 'Jordan Love',
        position: 'QB',
        team: 'GB',
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 255.5, overOdds: -110, underOdds: -110 }
            ],
            historicalContext: {
              seasonAvg: 265.1,
              last5Avg: 272.9,
              gameLog: [280, 250, 311, 268, 291, 245, 220, 322, 289, 253]
            }
          }
        ]
      },
      {
        name: 'Jalen Hurts',
        position: 'QB',
        team: 'PHI',
        props: [
          {
            propType: 'Passing Yards',
            lines: [
              { line: 240.5, overOdds: -115, underOdds: -115 }
            ],
            historicalContext: {
              seasonAvg: 242.3,
              last5Avg: 233.1,
              gameLog: [210, 255, 199, 277, 201, 260, 238, 222, 290, 249]
            }
          }
        ]
      }
    ]
  }
];