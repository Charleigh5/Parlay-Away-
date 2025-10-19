// FIX: Corrected import path for types
import { ServiceResponse, WeatherConditions } from '../types';
// FIX: Corrected import path for apiClient
import { apiClient } from '../services/apiClient';

// This service is updated to use the live OpenWeatherMap API.
// A free API key can be obtained from https://openweathermap.org/
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY_HERE'; // Fallback for local dev

// --- API Data Transformation ---

const kelvinToFahrenheit = (k: number): number => {
  return Math.round((k - 273.15) * 9/5 + 32);
}

const transformOpenWeatherResponse = (apiResponse: any): WeatherConditions => {
    if (!apiResponse || !apiResponse.main || !apiResponse.wind || !apiResponse.weather) {
        throw new Error('Invalid OpenWeatherMap API response format');
    }
    return {
        temperature: kelvinToFahrenheit(apiResponse.main.temp),
        windSpeed: Math.round(apiResponse.wind.speed),
        precipitationChance: apiResponse.pop ? apiResponse.pop * 100 : (apiResponse.rain ? 100 : 0),
        summary: apiResponse.weather[0].main,
    };
};

// --- SERVICE IMPLEMENTATIONS ---

const WEATHER_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Fetches the weather forecast for a given game from the live OpenWeatherMap API.
 */
export const getGameWeather = (
    gameId: string, 
    stadiumLocation: { lat: number; lon: number }
): Promise<ServiceResponse<WeatherConditions>> => {
  return apiClient(`weather:${gameId}`, async () => {
    console.log(`[Live API] Fetching weather for game ${gameId} from OpenWeatherMap`);
    
    if (!stadiumLocation || !stadiumLocation.lat || !stadiumLocation.lon) {
        throw new Error(`No location data for game ${gameId} to fetch weather.`);
    }

    if (OPENWEATHER_API_KEY === 'YOUR_API_KEY_HERE') {
        console.warn('OpenWeatherMap API key not found. Using mock data. Please set OPENWEATHER_API_KEY.');
        // Fallback to a simple mock if key isn't provided
        return { temperature: 65, windSpeed: 5, precipitationChance: 10, summary: 'Clear' };
    }

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${stadiumLocation.lat}&lon=${stadiumLocation.lon}&appid=${OPENWEATHER_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch weather data. Status: ${response.status}`);
    }
    const data = await response.json();
    return transformOpenWeatherResponse(data);
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
