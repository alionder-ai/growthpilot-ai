# Cache Property Tests - Implementation Guide

## Overview

This test suite validates **Property 38: Cache Validity Duration** from the GrowthPilot AI design document.

**Property Statement**: *For any cached data, it should remain valid for 5 minutes, after which fresh data should be fetched from the database.*

**Validates**: Requirements 16.4

## Test Structure

### Test Categories

1. **Dashboard Metrics Cache TTL**
   - Verifies dashboard metrics are cached for exactly 5 minutes
   - Tests immediate availability and mid-TTL persistence
   - Validates expiration after TTL

2. **Client List Cache TTL**
   - Verifies client list is cached for exactly 10 minutes
   - Tests data persistence within TTL window
   - Validates expiration behavior

3. **AI Recommendations Cache TTL**
   - Verifies AI recommendations are cached for exactly 1 hour
   - Tests long-duration cache behavior
   - Validates expiration after extended TTL

4. **Generic Cache TTL Behavior**
   - Property-based tests with arbitrary TTL values
   - Validates cache respects any TTL configuration
   - Tests expiration at exact TTL boundaries

5. **Cache Expiration Precision**
   - Tests exact timing of cache expiration
   - Validates multiple entries with different TTLs
   - Ensures independent expiration handling

6. **Cache Key Generation**
   - Validates consistent key generation for same parameters
   - Ensures different parameters produce different keys
   - Tests key format and structure

7. **Cache Invalidation**
   - Tests pattern-based cache invalidation
   - Validates selective invalidation without affecting unrelated entries
   - Tests user-specific and client-specific invalidation

8. **Cache Statistics**
   - Validates cache size tracking
   - Tests statistics accuracy with multiple entries

9. **Cache Cleanup**
   - Tests automatic removal of expired entries
   - Validates cleanup preserves non-expired entries
   - Tests periodic cleanup behavior

10. **Real-world Cache Scenarios**
    - Simulates actual dashboard metrics caching workflow
    - Tests concurrent cache access patterns
    - Validates cache hit/miss behavior

## Cache TTL Constants

From `lib/utils/cache.ts`:

```typescript
export const CACHE_TTL = {
  DASHBOARD_METRICS: 5 * 60,      // 5 minutes
  CLIENT_LIST: 10 * 60,            // 10 minutes
  AI_RECOMMENDATIONS: 60 * 60,     // 1 hour
  CAMPAIGN_LIST: 5 * 60,           // 5 minutes
  METRICS: 5 * 60,                 // 5 minutes
}
```

## Test Implementation Details

### Arbitrary Generators

The test suite uses `fast-check` property-based testing with custom generators:

- `arbitraryCacheKey()`: Generates valid cache key strings
- `arbitraryCacheData()`: Generates various JSON-serializable data types
- `arbitraryTTL()`: Generates TTL values between 1 second and 1 hour

### Testing Strategy

**Fast Tests**: Most tests use shortened TTL values (2-10 seconds) to simulate longer durations without excessive test runtime.

**Property-Based Tests**: Run with 5-10 iterations for time-sensitive tests, 100 iterations for non-time-sensitive tests.

**Timing Precision**: Tests use `wait()` helper function with millisecond precision to verify exact expiration boundaries.

## Running the Tests

```bash
# Run all cache property tests
npm test -- __tests__/property/cache.test.ts --run

# Run specific test suite
npm test -- __tests__/property/cache.test.ts -t "Dashboard Metrics Cache TTL" --run

# Run with verbose output
npm test -- __tests__/property/cache.test.ts --run --verbose
```

## Expected Behavior

### Cache Lifecycle

1. **Set**: Data is stored with TTL
2. **Get (within TTL)**: Returns cached data
3. **Get (after TTL)**: Returns null, entry is removed
4. **Cleanup**: Periodic removal of expired entries

### TTL Validation

- Data must be available immediately after caching
- Data must remain available throughout the TTL period
- Data must be expired and return null after TTL
- Multiple entries with different TTLs must expire independently

### Cache Invalidation

- Pattern-based invalidation removes matching entries
- Unrelated entries remain unaffected
- User-specific and client-specific invalidation works correctly

## Performance Considerations

### Test Timeouts

- Individual tests: 10-30 seconds
- Property-based tests: 30-60 seconds
- Full suite: ~3-5 minutes

### Cache Cleanup

The cache implementation runs automatic cleanup every 5 minutes in production. Tests manually trigger cleanup to verify behavior.

## Integration with Application

### Dashboard Metrics Caching

```typescript
// In API route
const cacheKey = generateCacheKey('dashboard-metrics', { userId, clientId });
const cached = cache.get(cacheKey);

if (cached) {
  return cached; // Cache hit
}

// Cache miss - fetch from database
const metrics = await fetchMetricsFromDB();
cache.set(cacheKey, metrics, CACHE_TTL.DASHBOARD_METRICS);
return metrics;
```

### Cache Invalidation on Mutations

```typescript
// After updating client data
await supabase.from('clients').update(data).eq('client_id', clientId);

// Invalidate related cache entries
invalidateClientCache(clientId);
invalidateUserCache(userId);
```

## Common Issues and Solutions

### Issue: Tests Timing Out

**Solution**: Increase test timeout or reduce TTL values in tests.

```typescript
it('should expire cache', async () => {
  // Use shorter TTL for testing
  cache.set(key, data, 3); // 3 seconds instead of 300
  await wait(4000);
  expect(cache.get(key)).toBeNull();
}, 10000); // 10 second timeout
```

### Issue: Flaky Tests Due to Timing

**Solution**: Add buffer time to account for execution delays.

```typescript
// Wait slightly longer than TTL to ensure expiration
await wait(ttlSeconds * 1000 + 500); // Add 500ms buffer
```

### Issue: Cache Not Clearing Between Tests

**Solution**: Use `beforeEach` and `afterEach` hooks.

```typescript
beforeEach(() => {
  cache.clear();
});

afterEach(() => {
  cache.clear();
});
```

## Validation Checklist

- ✅ Dashboard metrics cached for 5 minutes
- ✅ Client list cached for 10 minutes
- ✅ AI recommendations cached for 1 hour
- ✅ Cache expires at exact TTL boundary
- ✅ Multiple entries with different TTLs handled independently
- ✅ Cache key generation is consistent and unique
- ✅ Pattern-based invalidation works correctly
- ✅ Cache statistics are accurate
- ✅ Cleanup removes only expired entries
- ✅ Concurrent access is handled safely

## Related Files

- `lib/utils/cache.ts` - Cache implementation
- `app/api/metrics/overview/route.ts` - Dashboard metrics caching
- `app/api/clients/route.ts` - Client list caching
- `app/api/ai/recommendations/route.ts` - AI recommendations caching
- `lib/gemini/cache.ts` - Gemini API response caching

## References

- Design Document: Property 38 (Cache Validity Duration)
- Requirements: 16.4 (Performance and Scalability)
- Testing Strategy: Property-Based Testing with fast-check
