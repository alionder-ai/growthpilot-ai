/**
 * Cache management for AI recommendations
 * Provides fallback when Gemini API is unavailable
 */

interface CachedRecommendation {
  content: any;
  timestamp: number;
  type: 'action_plan' | 'strategy_card' | 'creative';
}

// In-memory cache (in production, use Redis or similar)
const cache = new Map<string, CachedRecommendation>();

// Cache TTL: 1 hour
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Generate cache key from context
 */
function generateCacheKey(type: string, context: any): string {
  const contextStr = JSON.stringify(context);
  return `${type}:${contextStr}`;
}

/**
 * Store recommendation in cache
 */
export function cacheRecommendation(
  type: 'action_plan' | 'strategy_card' | 'creative',
  context: any,
  content: any
): void {
  const key = generateCacheKey(type, context);
  cache.set(key, {
    content,
    timestamp: Date.now(),
    type,
  });
}

/**
 * Retrieve cached recommendation if available and not expired
 */
export function getCachedRecommendation(
  type: 'action_plan' | 'strategy_card' | 'creative',
  context: any
): any | null {
  const key = generateCacheKey(type, context);
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }

  return cached.content;
}

/**
 * Clear all cached recommendations
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Clear expired cache entries
 */
export function clearExpiredCache(): void {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL_MS) {
      cache.delete(key);
    }
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.entries()).map(([key, value]) => ({
      key,
      type: value.type,
      age: Date.now() - value.timestamp,
    })),
  };
}
