import { ServiceResponse, DataFreshnessStatus } from '../types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * A generic, resilient API client for handling mock data fetching.
 * It encapsulates caching, retry logic, and stale data fallbacks,
 * providing a consistent response format for all data services.
 *
 * @param key A unique key for caching the response.
 * @param mockFetch A function that simulates an API call and returns the desired data.
 * @param ttl The Time-to-Live for the cache entry in milliseconds.
 * @returns A `ServiceResponse` object containing the data and its freshness status.
 */
export const apiClient = async <T>(
  key: string,
  mockFetch: () => Promise<T>,
  ttl: number
): Promise<ServiceResponse<T>> => {
  const now = Date.now();
  const cached = cache.get(key);

  // Return fresh data from cache
  if (cached && now < cached.expires) {
    console.log(`[Cache] HIT for key: ${key}`);
    return {
      data: cached.data,
      status: 'cached',
      lastUpdated: new Date(cached.timestamp).toISOString(),
    };
  }
  
  console.log(`[API] MISS for key: ${key}. Fetching live data...`);

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // TODO: Replace `mockFetch()` with a real `fetch()` call to the live API.
      // const response = await fetch(`https://your-api.com/${key}`);
      // if (!response.ok) throw new Error(`API error: ${response.status}`);
      // const data: T = await response.json();

      const data = await mockFetch(); // Simulates the API call
      
      const newEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        expires: now + ttl,
      };
      cache.set(key, newEntry);
      
      return {
        data,
        status: 'live',
        lastUpdated: new Date(now).toISOString(),
      };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for key ${key}:`, error);
      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
      }
    }
  }

  // If all retries fail, check for stale cache
  if (cached) {
    console.warn(`[API Fallback] All retries failed for key: ${key}. Returning stale data.`);
    return {
      data: cached.data,
      status: 'stale',
      lastUpdated: new Date(cached.timestamp).toISOString(),
      error: 'Live data unavailable; showing last known good data.'
    };
  }

  // If no cache and all retries fail
  console.error(`[API Failure] Could not fetch data for key: ${key}. No cache available.`);
  return {
    data: null,
    status: 'unavailable',
    error: 'Data is currently unavailable. Please try again later.',
  };
};