export interface AdvancedStat {
  name: string;
  abbreviation: string;
  value: number;
  rank: number;
  percentile: number; // 0-100
  description: string;
}

export const ADVANCED_STATS: Record<string, Record<string, AdvancedStat[]>> = {
  'Patrick Mahomes': {
    'Passing Yards': [
      {
        name: 'Expected Points Added per Play',
        abbreviation: 'EPA/Play',
        value: 0.281,
        rank: 2,
        percentile: 98,
        description: "Measures a player's contribution to the score on a per-play basis."
      },
      {
        name: 'Completion % Over Expected',
        abbreviation: 'CPOE',
        value: 4.7,
        rank: 3,
        percentile: 95,
        description: "Measures a QB's completion percentage compared to the likelihood of completion for each throw."
      },
    ],
    'Passing Touchdowns': [
      {
        name: 'Red Zone Passing TD Rate',
        abbreviation: 'RZ TD%',
        value: 35.2,
        rank: 4,
        percentile: 92,
        description: "Percentage of passing attempts inside the opponent's 20-yard line that result in a touchdown."
      }
    ]
  },
  'Lamar Jackson': {
    'Passing Yards': [
       {
        name: 'Expected Points Added per Play',
        abbreviation: 'EPA/Play',
        value: 0.195,
        rank: 7,
        percentile: 88,
        description: "Measures a player's contribution to the score on a per-play basis."
      },
    ],
    'Rushing Yards': [
       {
        name: 'Yards After Contact per Attempt',
        abbreviation: 'YAC/Att',
        value: 3.8,
        rank: 1, // QB rank
        percentile: 99,
        description: 'Average yards gained after the first contact from a defender.'
       },
    ]
  },
  'Travis Kelce': {
    'Receiving Yards': [
      {
        name: 'Yards Per Route Run',
        abbreviation: 'YPRR',
        value: 2.85,
        rank: 1, // TE rank
        percentile: 99,
        description: 'Measures receiving efficiency by dividing receiving yards by the number of routes run.'
      },
      {
        name: 'Average Depth of Target',
        abbreviation: 'aDOT',
        value: 8.9,
        rank: 12, // TE rank
        percentile: 75,
        description: "The average distance downfield of a player's targets."
      },
    ],
    'Receptions': [
       {
        name: 'Target Share',
        abbreviation: 'TGT %',
        value: 28.1,
        rank: 1, // TE rank
        percentile: 99,
        description: 'The percentage of team pass attempts that were targeted to this player.'
       }
    ]
  },
  'Zay Flowers': {
      'Receiving Yards': [
        {
          name: 'Yards Per Route Run',
          abbreviation: 'YPRR',
          value: 1.95,
          rank: 25, // WR rank
          percentile: 78,
          description: 'Measures receiving efficiency by dividing receiving yards by the number of routes run.'
        }
      ]
  },
  'Chris Jones': {
    'Sacks': [
        {
            name: 'Pass Rush Win Rate',
            abbreviation: 'PRWR',
            value: 21.5,
            rank: 2, // DT rank
            percentile: 98,
            description: "Percentage of pass rush snaps where the defender beats their block within 2.5 seconds."
        },
        {
            name: 'Pressure Percentage',
            abbreviation: 'Pres %',
            value: 15.8,
            rank: 1, // DT rank
            percentile: 99,
            description: "Percentage of pass rush snaps that result in a QB hurry, hit, or sack."
        }
    ]
  }
};