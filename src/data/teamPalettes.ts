export interface Palette {
    'team-primary': string;
    'team-primary-foreground': string;
    'team-secondary': string;
    'team-accent': string;
}

export interface TeamPalette {
    base: {
        heroImageDark: string;
        heroImageLight: string;
    };
    light: Palette;
    dark: Palette;
}

const GENERIC_STADIUM_DARK = 'src/assets/images/stadium-hero-dark.jpg';
const GENERIC_STADIUM_LIGHT = 'src/assets/images/stadium-hero-light.jpg';

export const TEAM_PALETTES: Record<string, TeamPalette> = {
    default: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '210 40% 96.1%', 'team-primary-foreground': '222.2 47.4% 11.2%', 'team-secondary': '210 40% 96.1%', 'team-accent': '217.2 91.2% 59.8%' },
        dark: { 'team-primary': '217.2 32.6% 17.5%', 'team-primary-foreground': '210 40% 98%', 'team-secondary': '217.2 32.6% 17.5%', 'team-accent': '217.2 91.2% 59.8%' }
    },
    lions: {
        base: { heroImageDark: 'src/assets/images/stadiums/det-dark.jpg', heroImageLight: 'src/assets/images/stadiums/det-light.jpg' },
        light: { 'team-primary': '199 89% 47%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 5% 65%', 'team-accent': '199 99% 42%' },
        dark: { 'team-primary': '199 99% 42%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 4% 35%', 'team-accent': '199 99% 52%' }
    },
    packers: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '120 61% 25%', 'team-primary-foreground': '48 96% 59%', 'team-secondary': '48 96% 59%', 'team-accent': '48 96% 59%' },
        dark: { 'team-primary': '120 61% 30%', 'team-primary-foreground': '48 96% 59%', 'team-secondary': '48 96% 50%', 'team-accent': '48 96% 69%' }
    },
    chiefs: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '0 84% 60%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '48 96% 59%', 'team-accent': '48 96% 59%' },
        dark: { 'team-primary': '0 84% 65%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '48 96% 50%', 'team-accent': '48 96% 69%' }
    },
    eagles: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '180 100% 25%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 5% 65%', 'team-accent': '180 100% 35%' },
        dark: { 'team-primary': '180 100% 30%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 4% 35%', 'team-accent': '180 100% 40%' }
    },
    niners: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '356 79% 43%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '39 88% 54%', 'team-accent': '39 88% 54%' },
        dark: { 'team-primary': '356 79% 53%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '39 88% 44%', 'team-accent': '39 88% 64%' }
    },
    bills: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '206 100% 41%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 84% 60%', 'team-accent': '0 84% 60%' },
        dark: { 'team-primary': '206 100% 51%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 84% 50%', 'team-accent': '0 84% 70%' }
    },
    cowboys: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '211 100% 21%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 5% 65%', 'team-accent': '211 100% 41%' },
        dark: { 'team-primary': '211 100% 31%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '240 4% 45%', 'team-accent': '211 100% 61%' }
    },
    ravens: {
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '266 100% 27%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '48 96% 59%', 'team-accent': '266 100% 47%' },
        dark: { 'team-primary': '266 100% 47%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '48 96% 50%', 'team-accent': '266 100% 67%' }
    },
    // AFC
    bengals: { // CIN
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '16 96% 52%', 'team-primary-foreground': '0 0% 0%', 'team-secondary': '0 0% 0%', 'team-accent': '16 96% 52%' },
        dark: { 'team-primary': '16 96% 52%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 13%', 'team-accent': '16 96% 62%' }
    },
    browns: { // CLE
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '26 100% 10%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '14 100% 50%', 'team-accent': '14 100% 50%' },
        dark: { 'team-primary': '14 100% 50%', 'team-primary-foreground': '26 100% 10%', 'team-secondary': '26 100% 15%', 'team-accent': '14 100% 60%' }
    },
    broncos: { // DEN
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '16 96% 52%', 'team-primary-foreground': '221 78% 21%', 'team-secondary': '221 78% 21%', 'team-accent': '16 96% 52%' },
        dark: { 'team-primary': '16 96% 52%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '221 78% 21%', 'team-accent': '16 96% 62%' }
    },
    texans: { // HOU
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '202 88% 10%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '350 71% 37%', 'team-accent': '350 71% 37%' },
        dark: { 'team-primary': '202 88% 15%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '350 71% 47%', 'team-accent': '350 71% 57%' }
    },
    colts: { // IND
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '212 100% 28%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '210 6% 68%', 'team-accent': '212 100% 48%' },
        dark: { 'team-primary': '212 100% 48%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '210 6% 28%', 'team-accent': '212 100% 68%' }
    },
    jaguars: { // JAX
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '188 100% 23%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '40 70% 50%', 'team-accent': '40 70% 50%' },
        dark: { 'team-primary': '188 100% 28%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '40 70% 50%', 'team-accent': '40 70% 60%' }
    },
    raiders: { // LV
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '210 6% 68%', 'team-primary-foreground': '0 0% 0%', 'team-secondary': '0 0% 0%', 'team-accent': '210 6% 68%' },
        dark: { 'team-primary': '210 6% 78%', 'team-primary-foreground': '0 0% 0%', 'team-secondary': '0 0% 13%', 'team-accent': '210 6% 88%' }
    },
    chargers: { // LAC
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '201 100% 40%', 'team-primary-foreground': '45 99% 53%', 'team-secondary': '45 99% 53%', 'team-accent': '45 99% 53%' },
        dark: { 'team-primary': '201 100% 50%', 'team-primary-foreground': '45 99% 53%', 'team-secondary': '45 99% 53%', 'team-accent': '45 99% 63%' }
    },
    dolphins: { // MIA
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '183 100% 29%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '16 98% 51%', 'team-accent': '16 98% 51%' },
        dark: { 'team-primary': '183 100% 39%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '16 98% 51%', 'team-accent': '16 98% 61%' }
    },
    patriots: { // NE
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '210 100% 13%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '348 83% 47%', 'team-accent': '348 83% 47%' },
        dark: { 'team-primary': '210 100% 23%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '348 83% 57%', 'team-accent': '348 83% 67%' }
    },
    jets: { // NYJ
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '158 64% 21%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 100%', 'team-accent': '158 64% 31%' },
        dark: { 'team-primary': '158 64% 26%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 100%', 'team-accent': '158 64% 41%' }
    },
    steelers: { // PIT
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '45 93% 53%', 'team-primary-foreground': '0 0% 6%', 'team-secondary': '0 0% 6%', 'team-accent': '45 93% 53%' },
        dark: { 'team-primary': '45 93% 53%', 'team-primary-foreground': '0 0% 6%', 'team-secondary': '0 0% 13%', 'team-accent': '45 93% 63%' }
    },
    titans: { // TEN
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '211 63% 18%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '209 84% 60%', 'team-accent': '209 84% 60%' },
        dark: { 'team-primary': '209 84% 60%', 'team-primary-foreground': '211 63% 18%', 'team-secondary': '211 63% 28%', 'team-accent': '209 84% 70%' }
    },
    // NFC
    cardinals: { // ARI
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '346 63% 37%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 0%', 'team-accent': '346 63% 37%' },
        dark: { 'team-primary': '346 63% 47%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 13%', 'team-accent': '346 63% 57%' }
    },
    falcons: { // ATL
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '350 71% 37%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 0%', 'team-accent': '350 71% 37%' },
        dark: { 'team-primary': '350 71% 42%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 13%', 'team-accent': '350 71% 57%' }
    },
    panthers: { // CAR
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '199 100% 40%', 'team-primary-foreground': '0 0% 0%', 'team-secondary': '0 0% 0%', 'team-accent': '199 100% 40%' },
        dark: { 'team-primary': '199 100% 50%', 'team-primary-foreground': '0 0% 0%', 'team-secondary': '0 0% 13%', 'team-accent': '199 100% 60%' }
    },
    bears: { // CHI
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '215 80% 11%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '17 96% 41%', 'team-accent': '17 96% 41%' },
        dark: { 'team-primary': '215 80% 21%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '17 96% 51%', 'team-accent': '17 96% 61%' }
    },
    rams: { // LAR
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '220 100% 29%', 'team-primary-foreground': '49 100% 50%', 'team-secondary': '49 100% 50%', 'team-accent': '49 100% 50%' },
        dark: { 'team-primary': '220 100% 39%', 'team-primary-foreground': '49 100% 50%', 'team-secondary': '49 100% 50%', 'team-accent': '49 100% 60%' }
    },
    vikings: { // MIN
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '270 51% 33%', 'team-primary-foreground': '48 99% 56%', 'team-secondary': '48 99% 56%', 'team-accent': '48 99% 56%' },
        dark: { 'team-primary': '270 51% 43%', 'team-primary-foreground': '48 99% 56%', 'team-secondary': '48 99% 56%', 'team-accent': '48 99% 66%' }
    },
    saints: { // NO
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '46 39% 68%', 'team-primary-foreground': '0 0% 6%', 'team-secondary': '0 0% 6%', 'team-accent': '46 39% 68%' },
        dark: { 'team-primary': '46 39% 68%', 'team-primary-foreground': '0 0% 6%', 'team-secondary': '0 0% 13%', 'team-accent': '46 39% 78%' }
    },
    giants: { // NYG
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '221 78% 21%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '350 71% 37%', 'team-accent': '350 71% 37%' },
        dark: { 'team-primary': '221 78% 31%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '350 71% 47%', 'team-accent': '350 71% 57%' }
    },
    seahawks: { // SEA
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '210 100% 13%', 'team-primary-foreground': '81 60% 46%', 'team-secondary': '81 60% 46%', 'team-accent': '81 60% 46%' },
        dark: { 'team-primary': '210 100% 23%', 'team-primary-foreground': '81 60% 46%', 'team-secondary': '81 60% 46%', 'team-accent': '81 60% 56%' }
    },
    buccaneers: { // TB
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '0 90% 42%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 20%', 'team-accent': '0 90% 42%' },
        dark: { 'team-primary': '0 90% 52%', 'team-primary-foreground': '0 0% 100%', 'team-secondary': '0 0% 30%', 'team-accent': '0 90% 62%' }
    },
    commanders: { // WAS
        base: { heroImageDark: GENERIC_STADIUM_DARK, heroImageLight: GENERIC_STADIUM_LIGHT },
        light: { 'team-primary': '0 64% 21%', 'team-primary-foreground': '45 93% 53%', 'team-secondary': '45 93% 53%', 'team-accent': '45 93% 53%' },
        dark: { 'team-primary': '0 64% 31%', 'team-primary-foreground': '45 93% 53%', 'team-secondary': '45 93% 53%', 'team-accent': '45 93% 63%' }
    },
};
