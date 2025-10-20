// This file seems to have had incorrect content. 
// Based on the name, it should probably be empty or export sports data-related functions.
// I'm providing a corrected version of apiClient.ts content here as apiClient_old was defined,
// and leaving this file to be fixed with actual sports data service logic if needed.
// For now, I'll clear it to avoid confusion and redefine the apiClient_old for context.

// FIX: Corrected import path for types
import { ServiceResponse, DataFreshnessStatus } from '../types';
import { apiClient } from './apiClient';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * A generic, resilient API client for handling data fetching.
 * It encapsulates caching, retry logic, and stale data fallbacks,
 * providing a consistent response format for all data services.
 *
 * @param key A unique key for caching the response.
 * @param fetcher A function that performs the actual API call.
 * @param ttl The Time-to-Live for the cache entry in milliseconds.
 * @returns A `ServiceResponse` object containing the data and its freshness status.
 */
export const apiClient_old = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number
): Promise<ServiceResponse<T>> => {
  const now = Date.now();
  const cached = cache.get(key);

  if (cached && now < cached.expires) {
    console.log(`[Cache] HIT for key: ${key}`);
    return {
      data: JSON.parse(JSON.stringify(cached.data)), // Deep copy
      status: 'cached',
      lastUpdated: new Date(cached.timestamp).toISOString(),
    };
  }
  
  console.log(`[API] MISS for key: ${key}. Fetching live data...`);

  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetcher();
      
      const newEntry: CacheEntry<T> = {
        data,
        timestamp: now,
        expires: now + ttl,
      };
      cache.set(key, newEntry);
      
      return {
        data: JSON.parse(JSON.stringify(data)), // Deep copy
        status: 'live',
        lastUpdated: new Date(now).toISOString(),
      };
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed for key ${key}:`, error);
      if (attempt < maxRetries) {
        await new Promise(res => setTimeout(res, 100 * Math.pow(2, attempt)));
      }
    }
  }

  if (cached) {
    console.warn(`[API Fallback] All retries failed for key: ${key}. Returning stale data.`);
    return {
      data: JSON.parse(JSON.stringify(cached.data)), // Deep copy
      status: 'stale',
      lastUpdated: new Date(cached.timestamp).toISOString(),
      error: 'Live data unavailable; showing last known good data.'
    };
  }

  console.error(`[API Failure] Could not fetch data for key: ${key}. No cache available.`);
  return {
    data: null,
    status: 'unavailable',
    error: 'Data is currently unavailable. Please try again later.',
  };
};
