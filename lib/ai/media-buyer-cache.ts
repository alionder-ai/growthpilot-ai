/**
 * Media Buyer Cache
 * 
 * In-memory cache for analysis results with 5-minute TTL.
 * Improves performance by avoiding redundant AI API calls.
 */

import { MediaBuyerAnalysis } from '@/lib/types/media-buyer';

interface CacheEntry {
  data: MediaBuyerAnalysis;
  timestamp: number;
  campaignId: string;
}

/**
 * Cache configuration
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * In-memory cache storage
 */
const cache = new Map<string, CacheEntry>();

/**
 * Generate cache key for campaign
 */
function getCacheKey(campaignId: string): string {
  return `media-buyer:${campaignId}`;
}

/**
 * Check if cache entry is still fresh
 */
function isFresh(entry: CacheEntry): boolean {
  const now = Date.now();
  return (now - entry.timestamp) < CACHE_TTL;
}

/**
 * Get cached analysis result
 * 
 * @param campaignId - Campaign UUID
 * @returns Cached analysis or null if not found/expired
 */
export function getCachedAnalysis(campaignId: string): MediaBuyerAnalysis | null {
  const key = getCacheKey(campaignId);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (!isFresh(entry)) {
    // Remove expired entry
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store analysis result in cache
 * 
 * @param campaignId - Campaign UUID
 * @param analysis - Analysis result to cache
 */
export function setCachedAnalysis(
  campaignId: string,
  analysis: MediaBuyerAnalysis
): void {
  const key = getCacheKey(campaignId);
  const entry: CacheEntry = {
    data: analysis,
    timestamp: Date.now(),
    campaignId,
  };

  cache.set(key, entry);
}

/**
 * Invalidate cache for specific campaign
 * 
 * @param campaignId - Campaign UUID
 */
export function invalidateCache(campaignId: string): void {
  const key = getCacheKey(campaignId);
  cache.delete(key);
}

/**
 * Invalidate all cache entries
 */
export function invalidateAllCache(): void {
  cache.clear();
}

/**
 * Get cache statistics (for monitoring)
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ campaignId: string; age: number }>;
} {
  const now = Date.now();
  const entries = Array.from(cache.values()).map(entry => ({
    campaignId: entry.campaignId,
    age: Math.floor((now - entry.timestamp) / 1000), // age in seconds
  }));

  return {
    size: cache.size,
    entries,
  };
}

/**
 * Clean up expired entries (can be called periodically)
 */
export function cleanupExpiredEntries(): number {
  let removed = 0;
  const now = Date.now();

  for (const [key, entry] of cache.entries()) {
    if ((now - entry.timestamp) >= CACHE_TTL) {
      cache.delete(key);
      removed++;
    }
  }

  return removed;
}
