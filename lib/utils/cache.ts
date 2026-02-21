/**
 * Simple in-memory cache implementation with TTL support
 * 
 * This cache is used to reduce database queries for frequently accessed data.
 * Each cache entry has a Time-To-Live (TTL) after which it expires.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private store: Map<string, CacheEntry<any>>;

  constructor() {
    this.store = new Map();
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found or expired
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set a value in cache with TTL
   * @param key Cache key
   * @param data Data to cache
   * @param ttlSeconds Time-to-live in seconds
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { data, expiresAt });
  }

  /**
   * Delete a specific cache entry
   * @param key Cache key
   */
  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Delete all cache entries matching a pattern
   * @param pattern String pattern to match (simple substring match)
   */
  deletePattern(pattern: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.store.delete(key));
  }
}

// Singleton instance
const cache = new Cache();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 5 * 60 * 1000);
}

export default cache;

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  DASHBOARD_METRICS: 5 * 60, // 5 minutes
  CLIENT_LIST: 10 * 60, // 10 minutes
  AI_RECOMMENDATIONS: 60 * 60, // 1 hour
  CAMPAIGN_LIST: 5 * 60, // 5 minutes
  METRICS: 5 * 60, // 5 minutes
} as const;

/**
 * Helper function to generate cache keys
 */
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

/**
 * Invalidate cache entries for a specific user
 */
export function invalidateUserCache(userId: string): void {
  cache.deletePattern(userId);
}

/**
 * Invalidate cache entries for a specific client
 */
export function invalidateClientCache(clientId: string): void {
  cache.deletePattern(clientId);
}
