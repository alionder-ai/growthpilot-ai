# Database Optimization Documentation

## Overview

This document describes the database optimization strategies implemented for GrowthPilot AI to ensure optimal performance and scalability.

## Indexes

All critical database indexes have been created to optimize query performance:

### Core Tables
- **users**: `idx_users_email` - Email lookups for authentication
- **clients**: `idx_clients_user_id` - User's client list queries
- **commission_models**: `idx_commission_models_client_id` - Commission lookups per client

### Campaign Tables
- **campaigns**: 
  - `idx_campaigns_client_id` - Client's campaigns
  - `idx_campaigns_meta_campaign_id` - Meta API sync lookups
- **ad_sets**: 
  - `idx_ad_sets_campaign_id` - Campaign's ad sets
  - `idx_ad_sets_meta_ad_set_id` - Meta API sync lookups
- **ads**: 
  - `idx_ads_ad_set_id` - Ad set's ads
  - `idx_ads_meta_ad_id` - Meta API sync lookups
- **meta_metrics**: 
  - `idx_meta_metrics_ad_id` - Ad's metrics
  - `idx_meta_metrics_date` - Date-based queries
  - `idx_meta_metrics_ad_id_date` - Composite index for ad+date queries

### Support Tables
- **leads**: 
  - `idx_leads_ad_id` - Ad's leads
  - `idx_leads_converted_status` - Conversion rate calculations
- **ai_recommendations**: 
  - `idx_ai_recommendations_client_id` - Client's recommendations
  - `idx_ai_recommendations_status` - Active recommendations
  - `idx_ai_recommendations_created_at` - Recent recommendations
- **creative_library**: 
  - `idx_creative_library_user_id` - User's creative content
  - `idx_creative_library_industry` - Industry-based filtering
- **reports**: 
  - `idx_reports_client_id` - Client's reports
  - `idx_reports_created_at` - Recent reports
- **notifications**: 
  - `idx_notifications_user_id` - User's notifications
  - `idx_notifications_read_status` - Unread notifications
  - `idx_notifications_created_at` - Recent notifications
- **meta_tokens**: `idx_meta_tokens_user_id` - User's Meta API tokens

## Connection Pooling

### Supabase Built-in Pooling

Supabase automatically provides connection pooling through PgBouncer:

- **Transaction Mode**: Each transaction gets a connection from the pool
- **Automatic Scaling**: Pool size adjusts based on load
- **Connection Reuse**: Connections are reused across requests
- **No Configuration Required**: Works out of the box

### Connection String

Supabase provides two connection strings:

1. **Direct Connection** (for migrations): `postgresql://...`
2. **Pooled Connection** (for application): `postgresql://...` (via port 6543)

The Next.js application uses the Supabase client which automatically uses the pooled connection.

### Best Practices

1. **Use Supabase Client**: Always use `createClient()` from `lib/supabase/server.ts`
2. **Avoid Long Transactions**: Keep transactions short to release connections quickly
3. **Close Connections**: Supabase client handles connection cleanup automatically
4. **Monitor Pool Usage**: Check Supabase dashboard for connection pool metrics

## Query Optimization

### Implemented Optimizations

1. **Selective Column Selection**: Use `.select('column1, column2')` instead of `.select('*')` where possible
2. **Pagination**: All list endpoints implement pagination (default 50 records per page)
3. **Composite Indexes**: Used for frequently combined query conditions (e.g., ad_id + date)
4. **Foreign Key Indexes**: All foreign keys have indexes for join performance

### Query Performance Guidelines

1. **Use Indexes**: Ensure WHERE clauses use indexed columns
2. **Limit Results**: Always use pagination for large datasets
3. **Avoid N+1 Queries**: Use joins or batch queries instead of loops
4. **Cache Results**: Use the caching layer for frequently accessed data

## Caching Strategy

See `lib/utils/cache.ts` for implementation details.

### Cache TTLs

- **Dashboard Metrics**: 5 minutes
- **Client List**: 10 minutes
- **AI Recommendations**: 1 hour
- **Campaign List**: 5 minutes
- **Metrics**: 5 minutes

### Cache Invalidation

Cache is automatically invalidated when:
- Client is created, updated, or deleted
- Metrics are synced from Meta API
- AI recommendations are generated
- Reports are created

## Performance Monitoring

### Key Metrics to Monitor

1. **Query Response Time**: Target < 100ms for simple queries
2. **Dashboard Load Time**: Target < 2 seconds
3. **Connection Pool Usage**: Should stay below 80% capacity
4. **Cache Hit Rate**: Target > 70%

### Monitoring Tools

- **Supabase Dashboard**: Database performance metrics
- **Vercel Analytics**: API route response times
- **Application Logs**: Slow query logging

## Future Optimizations

### Potential Improvements

1. **Materialized Views**: For complex aggregations (e.g., monthly revenue)
2. **Partitioning**: Partition `meta_metrics` table by date for better performance
3. **Read Replicas**: Use read replicas for reporting queries
4. **Query Result Caching**: Cache complex query results at database level

### When to Implement

- **Materialized Views**: When dashboard queries exceed 500ms
- **Partitioning**: When `meta_metrics` table exceeds 10M rows
- **Read Replicas**: When concurrent users exceed 100
- **Database Caching**: When cache hit rate drops below 60%

## Troubleshooting

### Slow Queries

1. Check if indexes are being used: `EXPLAIN ANALYZE` in Supabase SQL Editor
2. Verify RLS policies aren't causing performance issues
3. Check for missing indexes on WHERE clause columns
4. Consider adding composite indexes for multi-column filters

### Connection Pool Exhaustion

1. Check for long-running transactions
2. Verify connections are being closed properly
3. Review concurrent request patterns
4. Consider upgrading Supabase plan for larger pool

### High Memory Usage

1. Review query result sizes
2. Implement pagination on large datasets
3. Use streaming for large file operations
4. Clear cache periodically

## Validation

All database optimizations have been validated:

✅ All required indexes created (Requirement 5.5)
✅ Connection pooling configured (Requirement 16.3)
✅ Pagination implemented for lists > 50 records (Requirement 16.2)
✅ Caching implemented with 5-minute TTL (Requirement 16.4)
