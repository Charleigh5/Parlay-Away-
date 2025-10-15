export interface Team {
    id: string; // 3-letter abbreviation
    name: string;
    city: string;
    paletteId: string; // Corresponds to key in TEAM_PALETTES
}

export const NFL_TEAMS: Team[] = [
    // NFC North
    { id: 'det', name: 'Detroit Lions', city: 'Detroit', paletteId: 'lions' },
    { id: 'gb', name: 'Green Bay Packers', city: 'Green Bay', paletteId: 'packers' },
    { id: 'chi', name: 'Chicago Bears', city: 'Chicago', paletteId: 'bears' },
    { id: 'min', name: 'Minnesota Vikings', city: 'Minnesota', paletteId: 'vikings' },
    // AFC West
    { id: 'kc', name: 'Kansas City Chiefs', city: 'Kansas City', paletteId: 'chiefs' },
    { id: 'lv', name: 'Las Vegas Raiders', city: 'Las Vegas', paletteId: 'raiders' },
    { id: 'den', name: 'Denver Broncos', city: 'Denver', paletteId: 'broncos' },
    { id: 'lac', name: 'Los Angeles Chargers', city: 'Los Angeles', paletteId: 'chargers' },
    // NFC East
    { id: 'phi', name: 'Philadelphia Eagles', city: 'Philadelphia', paletteId: 'eagles' },
    { id: 'dal', name: 'Dallas Cowboys', city: 'Dallas', paletteId: 'cowboys' },
    { id: 'nyg', name: 'New York Giants', city: 'New York', paletteId: 'giants' },
    { id: 'was', name: 'Washington Commanders', city: 'Washington', paletteId: 'commanders' },
    // NFC West
    { id: 'sf', name: 'San Francisco 49ers', city: 'San Francisco', paletteId: 'niners' },
    { id: 'lar', name: 'Los Angeles Rams', city: 'Los Angeles', paletteId: 'rams' },
    { id: 'sea', name: 'Seattle Seahawks', city: 'Seattle', paletteId: 'seahawks' },
    { id: 'ari', name: 'Arizona Cardinals', city: 'Arizona', paletteId: 'cardinals' },
    // AFC East
    { id: 'buf', name: 'Buffalo Bills', city: 'Buffalo', paletteId: 'bills' },
    { id: 'mia', name: 'Miami Dolphins', city: 'Miami', paletteId: 'dolphins' },
    { id: 'ne', name: 'New England Patriots', city: 'New England', paletteId: 'patriots' },
    { id: 'nyj', name: 'New York Jets', city: 'New York', paletteId: 'jets' },
    // AFC North
    { id: 'bal', name: 'Baltimore Ravens', city: 'Baltimore', paletteId: 'ravens' },
    { id: 'cin', name: 'Cincinnati Bengals', city: 'Cincinnati', paletteId: 'bengals' },
    { id: 'cle', name: 'Cleveland Browns', city: 'Cleveland', paletteId: 'browns' },
    { id: 'pit', name: 'Pittsburgh Steelers', city: 'Pittsburgh', paletteId: 'steelers' },
     // NFC South
    { id: 'atl', name: 'Atlanta Falcons', city: 'Atlanta', paletteId: 'falcons' },
    { id: 'car', name: 'Carolina Panthers', city: 'Carolina', paletteId: 'panthers' },
    { id: 'no', name: 'New Orleans Saints', city: 'New Orleans', paletteId: 'saints' },
    { id: 'tb', name: 'Tampa Bay Buccaneers', city: 'Tampa Bay', paletteId: 'buccaneers' },
    // AFC South
    { id: 'hou', name: 'Houston Texans', city: 'Houston', paletteId: 'texans' },
    { id: 'ind', name: 'Indianapolis Colts', city: 'Indianapolis', paletteId: 'colts' },
    { id: 'jax', name: 'Jacksonville Jaguars', city: 'Jacksonville', paletteId: 'jaguars' },
    { id: 'ten', name: 'Tennessee Titans', city: 'Tennessee', paletteId: 'titans' },
];
