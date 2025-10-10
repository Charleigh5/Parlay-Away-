import { ServiceResponse, WeatherConditions } from '../types';
import { apiClient } from './apiClient';

// --- MOCK DATA GENERATION ---

const generateMockWeather = (stadiumLocation: { lat: number; lon: number }): WeatherConditions => {
    // Use latitude to simulate different climates for variety
    if (stadiumLocation.lat > 40) { // Northern/cold city
        return {
            temperature: 38,
            windSpeed: 12,
            precipitationChance: 15,
            summary: 'Cloudy'
        };
    }
    if (stadiumLocation.lat < 35) { // Southern/warm city or dome
        return {
            temperature: 72, // Dome or warm weather
            windSpeed: 0,
            precipitationChance: 0,
            summary: 'Clear'
        };
    }
    // Mid-range city
    return {
        temperature: 55,
        windSpeed: 8,
        precipitationChance: 5,
        summary: 'Clear'
    };
};

// --- SERVICE IMPLEMENTATIONS ---

const WEATHER_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches the weather forecast for a given game.
 */
export const getGameWeather = (
    gameId: string, 
    stadiumLocation: { lat: number; lon: number }
): Promise<ServiceResponse<WeatherConditions>> => {
  return apiClient(`weather:${gameId}`, async () => {
    // TODO: Replace with OpenWeatherMap API call: GET /data/3.0/onecall?lat={lat}&lon={lon}&...
    console.log(`Simulating fetch for weather for game ${gameId}`);
    await new Promise(res => setTimeout(res, 300));

    if (!stadiumLocation) {
        throw new Error(`No location data for game ${gameId} to fetch weather.`);
    }
    return generateMockWeather(stadiumLocation);
  }, WEATHER_TTL);
};

/**
 * Fetches historical performance data for a player in similar weather conditions.
 * NOTE: This is a complex analytical feature. In a real system, this would likely be
 * a dedicated endpoint on our own backend that has pre-computed this data.
 */
export const getHistoricalWeatherImpact = (
    playerId: string,
    conditions: WeatherConditions
): Promise<ServiceResponse<{ performanceDelta: number }>> => {
    return apiClient(`weather-impact:${playerId}:${conditions.summary}`, async () => {
        // TODO: Replace with custom backend endpoint: GET /analysis/weather-impact?playerId={playerId}&...
        console.log(`Simulating fetch for weather impact for player ${playerId}`);
        await new Promise(res => setTimeout(res, 400));
        
        // Simple simulation
        let delta = 0;
        if (conditions.summary === 'Rain' || conditions.summary === 'Snow') delta = -0.08; // 8% performance drop
        if (conditions.windSpeed > 15) delta -= 0.05; // Additional 5% drop for high winds

        return { performanceDelta: delta };
    }, WEATHER_TTL * 2); // Can cache this for longer
};
