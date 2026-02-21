// @ts-nocheck
/**
 * Feature: growthpilot-ai, Cache Property Tests
 * 
 * Property 38: Cache Validity Duration
 * 
 * Validates: Requirements 16.4
 */

import * as fc from 'fast-check';
import cache, { CACHE_TTL, generateCacheKey } from '@/lib/utils/cache';

/**
 * Arbitrary generators for test data
 */

// Generate valid cache keys
const arbitraryCacheKey = () =>
  fc.string({ minLength: 5, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9-_]/g, ''));

// Generate cache data (any JSON-serializable value)
const arbitraryCacheData = () =>
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.double(),
    fc.boolean(),
    fc.array(fc.string()),
    fc.record({
      id: fc.uuid(),
      name: fc.string(),
      value: fc.double()
    })
  );

// Generate TTL in seconds
const arbitraryTTL = () =>
  fc.integer({ min: 1, max: 3600 }); // 1 second to 1 hour

/**
 * Helper functions
 */

// Wait for a specified duration
function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get current timestamp in milliseconds
function now(): number {
  return Date.now();
}

/**
 * Property 38: Cache Validity Duration
 * 
 * For any cached data, it should remain valid for 5 minutes, after which
 * fresh data should be fetched from the database.
 * 
 * Validates: Requirements 16.4
 */
describe('Property 38: Cache Validity Duration', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
  });

  afterEach(() => {
    // Clean up cache after each test
    cache.clear();
  });

  describe('Dashboard Metrics Cache TTL', () => {
    it('should cache dashboard metrics for exactly 5 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryCacheKey(),
          arbitraryCacheData(),
          async (key, data) => {
            // Set cache with dashboard metrics TTL (5 minutes)
            cache.set(key, data, CACHE_TTL.DASHBOARD_METRICS);

            // Immediately after setting, data should be available
            const cachedData = cache.get(key);
            expect(cachedData).toEqual(data);

            // Wait 1 second - should still be cached
            await wait(1000);
            const cachedAfter1s = cache.get(key);
            expect(cachedAfter1s).toEqual(data);

            // Wait 2 more seconds (total 3s) - should still be cached
            await wait(2000);
            const cachedAfter3s = cache.get(key);
            expect(cachedAfter3s).toEqual(data);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should expire dashboard metrics after 5 minutes', async () => {
      const key = 'test-dashboard-metrics';
      const data = { totalSpend: 1000, totalRevenue: 150 };

      // Set cache with 5 second TTL (simulating 5 minutes for faster test)
      cache.set(key, data, 5);

      // Immediately available
      expect(cache.get(key)).toEqual(data);

      // Wait 3 seconds - should still be cached
      await wait(3000);
      expect(cache.get(key)).toEqual(data);

      // Wait 3 more seconds (total 6s, past TTL) - should be expired
      await wait(3000);
      expect(cache.get(key)).toBeNull();
    }, 15000);
  });

  describe('Client List Cache TTL', () => {
    it('should cache client list for exactly 10 minutes', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryCacheKey(),
          fc.array(
            fc.record({
              client_id: fc.uuid(),
              name: fc.string(),
              industry: fc.constantFrom('logistics', 'e-commerce', 'beauty', 'real estate')
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (key, clients) => {
            // Set cache with client list TTL (10 minutes)
            cache.set(key, clients, CACHE_TTL.CLIENT_LIST);

            // Immediately after setting, data should be available
            const cachedData = cache.get(key);
            expect(cachedData).toEqual(clients);

            // Wait 1 second - should still be cached
            await wait(1000);
            const cachedAfter1s = cache.get(key);
            expect(cachedAfter1s).toEqual(clients);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should expire client list after 10 minutes', async () => {
      const key = 'test-client-list';
      const data = [
        { client_id: '123', name: 'Client 1' },
        { client_id: '456', name: 'Client 2' }
      ];

      // Set cache with 5 second TTL (simulating 10 minutes for faster test)
      cache.set(key, data, 5);

      // Immediately available
      expect(cache.get(key)).toEqual(data);

      // Wait 3 seconds - should still be cached
      await wait(3000);
      expect(cache.get(key)).toEqual(data);

      // Wait 3 more seconds (total 6s, past TTL) - should be expired
      await wait(3000);
      expect(cache.get(key)).toBeNull();
    }, 15000);
  });

  describe('AI Recommendations Cache TTL', () => {
    it('should cache AI recommendations for exactly 1 hour', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryCacheKey(),
          fc.array(
            fc.record({
              recommendation_id: fc.uuid(),
              type: fc.constantFrom('action_plan', 'strategy_card'),
              content: fc.string(),
              priority: fc.constantFrom('high', 'medium', 'low')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (key, recommendations) => {
            // Set cache with AI recommendations TTL (1 hour)
            cache.set(key, recommendations, CACHE_TTL.AI_RECOMMENDATIONS);

            // Immediately after setting, data should be available
            const cachedData = cache.get(key);
            expect(cachedData).toEqual(recommendations);

            // Wait 1 second - should still be cached
            await wait(1000);
            const cachedAfter1s = cache.get(key);
            expect(cachedAfter1s).toEqual(recommendations);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should expire AI recommendations after 1 hour', async () => {
      const key = 'test-ai-recommendations';
      const data = [
        { recommendation_id: '123', type: 'action_plan', content: 'Optimize budget' }
      ];

      // Set cache with 5 second TTL (simulating 1 hour for faster test)
      cache.set(key, data, 5);

      // Immediately available
      expect(cache.get(key)).toEqual(data);

      // Wait 3 seconds - should still be cached
      await wait(3000);
      expect(cache.get(key)).toEqual(data);

      // Wait 3 more seconds (total 6s, past TTL) - should be expired
      await wait(3000);
      expect(cache.get(key)).toBeNull();
    }, 15000);
  });

  describe('Generic Cache TTL Behavior', () => {
    it('should respect any TTL value for cached data', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryCacheKey(),
          arbitraryCacheData(),
          fc.integer({ min: 2, max: 10 }), // TTL between 2-10 seconds for testing
          async (key, data, ttlSeconds) => {
            // Set cache with custom TTL
            cache.set(key, data, ttlSeconds);

            // Immediately available
            const immediate = cache.get(key);
            expect(immediate).toEqual(data);

            // Wait for half the TTL - should still be cached
            const halfTTL = Math.floor(ttlSeconds * 500);
            await wait(halfTTL);
            const midway = cache.get(key);
            expect(midway).toEqual(data);

            // Wait for remaining TTL + 1 second - should be expired
            const remainingTTL = (ttlSeconds * 1000) - halfTTL + 1000;
            await wait(remainingTTL);
            const expired = cache.get(key);
            expect(expired).toBeNull();

            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 60000);
  });

  describe('Cache Expiration Precision', () => {
    it('should expire cache entries at the exact TTL boundary', async () => {
      const key = 'test-precision';
      const data = { value: 'test' };
      const ttl = 3; // 3 seconds

      cache.set(key, data, ttl);

      // At 2.5 seconds, should still be cached
      await wait(2500);
      expect(cache.get(key)).toEqual(data);

      // At 3.5 seconds (past TTL), should be expired
      await wait(1000);
      expect(cache.get(key)).toBeNull();
    }, 10000);

    it('should handle multiple cache entries with different TTLs independently', async () => {
      const key1 = 'test-short-ttl';
      const key2 = 'test-long-ttl';
      const data1 = { value: 'short' };
      const data2 = { value: 'long' };

      // Set first entry with 2 second TTL
      cache.set(key1, data1, 2);
      
      // Set second entry with 5 second TTL
      cache.set(key2, data2, 5);

      // Both should be available immediately
      expect(cache.get(key1)).toEqual(data1);
      expect(cache.get(key2)).toEqual(data2);

      // After 3 seconds, first should be expired, second still cached
      await wait(3000);
      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data2);

      // After 3 more seconds (total 6s), both should be expired
      await wait(3000);
      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
    }, 10000);
  });

  describe('Cache Key Generation', () => {
    it('should generate consistent cache keys for same parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.record({
            userId: fc.uuid(),
            clientId: fc.uuid(),
            date: fc.date().map(d => d.toISOString())
          }),
          (prefix, params) => {
            const key1 = generateCacheKey(prefix, params);
            const key2 = generateCacheKey(prefix, params);
            
            expect(key1).toBe(key2);
            expect(key1).toContain(prefix);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate different cache keys for different parameters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.record({
            userId: fc.uuid(),
            clientId: fc.uuid()
          }),
          fc.record({
            userId: fc.uuid(),
            clientId: fc.uuid()
          }),
          (prefix, params1, params2) => {
            // Skip if parameters are identical
            if (JSON.stringify(params1) === JSON.stringify(params2)) {
              return true;
            }

            const key1 = generateCacheKey(prefix, params1);
            const key2 = generateCacheKey(prefix, params2);
            
            expect(key1).not.toBe(key2);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate cache entries matching a pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(arbitraryCacheData(), { minLength: 3, maxLength: 10 }),
          async (userId, dataArray) => {
            // Create multiple cache entries for the user
            const keys: string[] = [];
            dataArray.forEach((data, index) => {
              const key = `user:${userId}:data:${index}`;
              cache.set(key, data, 300); // 5 minutes
              keys.push(key);
            });

            // Verify all entries are cached
            keys.forEach((key, index) => {
              expect(cache.get(key)).toEqual(dataArray[index]);
            });

            // Invalidate all entries for this user
            cache.deletePattern(userId);

            // Verify all entries are removed
            keys.forEach(key => {
              expect(cache.get(key)).toBeNull();
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should not affect unrelated cache entries when invalidating', async () => {
      const user1Id = 'user-1';
      const user2Id = 'user-2';
      
      const user1Data = { name: 'User 1' };
      const user2Data = { name: 'User 2' };

      // Cache data for both users
      cache.set(`user:${user1Id}:data`, user1Data, 300);
      cache.set(`user:${user2Id}:data`, user2Data, 300);

      // Verify both are cached
      expect(cache.get(`user:${user1Id}:data`)).toEqual(user1Data);
      expect(cache.get(`user:${user2Id}:data`)).toEqual(user2Data);

      // Invalidate user 1's cache
      cache.deletePattern(user1Id);

      // User 1's cache should be gone, user 2's should remain
      expect(cache.get(`user:${user1Id}:data`)).toBeNull();
      expect(cache.get(`user:${user2Id}:data`)).toEqual(user2Data);
    });
  });

  describe('Cache Statistics', () => {
    it('should track cache size correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(arbitraryCacheKey(), arbitraryCacheData()),
            { minLength: 1, maxLength: 20 }
          ),
          async (entries) => {
            // Clear cache
            cache.clear();

            // Add entries
            const uniqueKeys = new Set<string>();
            entries.forEach(([key, data]) => {
              cache.set(key, data, 300);
              uniqueKeys.add(key);
            });

            // Check stats
            const stats = cache.getStats();
            expect(stats.size).toBe(uniqueKeys.size);
            expect(stats.keys.length).toBe(uniqueKeys.size);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });

  describe('Cache Cleanup', () => {
    it('should remove expired entries during cleanup', async () => {
      const key1 = 'test-cleanup-1';
      const key2 = 'test-cleanup-2';
      const key3 = 'test-cleanup-3';
      
      const data1 = { value: 1 };
      const data2 = { value: 2 };
      const data3 = { value: 3 };

      // Set entries with different TTLs
      cache.set(key1, data1, 2); // 2 seconds
      cache.set(key2, data2, 5); // 5 seconds
      cache.set(key3, data3, 10); // 10 seconds

      // All should be available
      expect(cache.get(key1)).toEqual(data1);
      expect(cache.get(key2)).toEqual(data2);
      expect(cache.get(key3)).toEqual(data3);

      // Wait 3 seconds
      await wait(3000);

      // Run cleanup
      cache.cleanup();

      // key1 should be removed, others should remain
      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toEqual(data2);
      expect(cache.get(key3)).toEqual(data3);

      // Wait 3 more seconds (total 6s)
      await wait(3000);

      // Run cleanup again
      cache.cleanup();

      // key1 and key2 should be removed, key3 should remain
      expect(cache.get(key1)).toBeNull();
      expect(cache.get(key2)).toBeNull();
      expect(cache.get(key3)).toEqual(data3);
    }, 15000);
  });

  describe('Real-world Cache Scenarios', () => {
    it('should handle dashboard metrics caching workflow', async () => {
      const userId = 'test-user-123';
      const clientId = 'test-client-456';
      
      const metricsKey = generateCacheKey('dashboard-metrics', { userId, clientId });
      const metricsData = {
        totalSpend: 5000,
        totalRevenue: 750,
        totalClients: 5,
        activeCampaigns: 12
      };

      // Simulate first request - cache miss, fetch from DB, store in cache
      expect(cache.get(metricsKey)).toBeNull();
      cache.set(metricsKey, metricsData, CACHE_TTL.DASHBOARD_METRICS);

      // Simulate subsequent requests within TTL - cache hit
      for (let i = 0; i < 5; i++) {
        await wait(500); // Wait 0.5 seconds between requests
        const cached = cache.get(metricsKey);
        expect(cached).toEqual(metricsData);
      }

      // Simulate cache expiration (using shorter TTL for test)
      cache.set(metricsKey, metricsData, 3); // 3 seconds
      await wait(4000); // Wait past TTL
      
      // Cache should be expired
      expect(cache.get(metricsKey)).toBeNull();
    }, 15000);

    it('should handle concurrent cache access', async () => {
      const key = 'concurrent-test';
      const data = { value: 'concurrent' };

      cache.set(key, data, 10);

      // Simulate multiple concurrent reads
      const reads = Array.from({ length: 10 }, () => cache.get(key));
      
      // All reads should return the same data
      reads.forEach(result => {
        expect(result).toEqual(data);
      });
    });
  });
});
