# Meta Ads Sync Implementation

## Overview

The Meta Ads sync system automatically synchronizes campaign data from Meta Graph API to the GrowthPilot AI database. It supports both automated daily syncs via cron jobs and manual user-triggered syncs.

## Components

### 1. Database Migration
- **File**: `supabase/migrations/20240101000005_add_last_synced_at.sql`
- Adds `last_synced_at` timestamp field to campaigns table
- Creates index for faster sync status queries

### 2. Sync Utility Functions
- **File**: `lib/meta/sync.ts`
- **Functions**:
  - `syncMetaData()`: Syncs data for a single user
  - `syncAllUsers()`: Syncs data for all users (called by cron)
  - `calculateMetrics()`: Calculates derived metrics (ROAS, CTR, CPC, etc.)

### 3. API Routes

#### Daily Cron Sync
- **Endpoint**: `POST /api/meta/sync`
- **Trigger**: Vercel Cron at 00:00 UTC daily
- **Function**: Syncs all users with active Meta tokens
- **Error Handling**: Creates notifications for failed syncs

#### Manual User Sync
- **Endpoint**: `POST /api/campaigns/sync`
- **Trigger**: User clicks "Senkronize Et" button
- **Function**: Syncs authenticated user's campaigns
- **Returns**: Stats (campaigns processed, ads processed, metrics stored)

### 4. UI Components

#### SyncButton
- **File**: `components/campaigns/SyncButton.tsx`
- Client-side button component
- Shows loading state during sync
- Displays success/error messages
- Auto-reloads page after successful sync

#### SyncStatus
- **File**: `components/campaigns/SyncStatus.tsx`
- Displays last sync time in Turkish
- Shows status icon (success/error/pending)
- Calculates time ago without external dependencies

### 5. Vercel Cron Configuration
- **File**: `vercel.json`
- Configures daily cron job at 00:00 UTC
- Calls `/api/meta/sync` endpoint

## Data Flow

### Automated Daily Sync
1. Vercel Cron triggers at 00:00 UTC
2. Calls `POST /api/meta/sync`
3. `syncAllUsers()` fetches all users with Meta tokens
4. For each user:
   - Checks if token is expired
   - Calls `syncMetaData()` with last 7 days date range
   - Creates notification if sync fails
5. Updates `last_synced_at` timestamp for each campaign

### Manual User Sync
1. User clicks "Senkronize Et" button
2. Calls `POST /api/campaigns/sync`
3. Validates user authentication
4. Checks Meta token validity
5. Calls `syncMetaData()` for user
6. Returns sync statistics
7. Page reloads to show updated data

## Sync Process Details

For each user sync:
1. **Fetch Campaigns**: Get all campaigns from Meta API
2. **Upsert Campaigns**: Create or update campaigns in database
3. **Fetch Ad Sets**: Get ad sets for each campaign
4. **Upsert Ad Sets**: Create or update ad sets
5. **Fetch Ads**: Get ads for each ad set
6. **Upsert Ads**: Create or update ads
7. **Fetch Insights**: Get metrics for each ad (last 7 days)
8. **Calculate Metrics**: Compute ROAS, CTR, CPC, CPM, CPA, frequency
9. **Upsert Metrics**: Store metrics with date (unique constraint on ad_id + date)
10. **Update Timestamp**: Set `last_synced_at` for campaign

## Error Handling

### Token Expiration
- Checks token expiry before sync
- Creates notification: "Meta erişim tokenınızın süresi doldu. Lütfen yeniden bağlanın."
- Skips sync for expired tokens

### API Errors
- Retry logic handled by Meta API client (3 retries with exponential backoff)
- Collects errors during sync
- Returns partial success if some campaigns fail
- Creates notification with error count

### Rate Limiting
- Meta API client handles rate limits (200 calls/hour per user)
- Implements request batching (10 ads per batch)
- Adds 500ms delay between batches

## Metrics Calculated

From Meta API insights:
- **spend**: Direct from API
- **impressions**: Direct from API
- **clicks**: Direct from API
- **conversions**: From purchase actions
- **add_to_cart**: From add_to_cart actions
- **purchases**: From purchase actions
- **frequency**: Direct from API

Calculated metrics:
- **ROAS**: Purchase value / spend
- **CTR**: (clicks / impressions) × 100
- **CPC**: spend / clicks
- **CPM**: (spend / impressions) × 1000
- **CPA**: spend / conversions

## Security

### Token Encryption
- Meta access tokens encrypted with AES-256-CBC
- Encryption key from `ENCRYPTION_KEY` environment variable
- Decrypted only when making API calls

### Authentication
- Manual sync requires authenticated user
- Cron sync should be protected with `CRON_SECRET` in production
- RLS policies ensure users only access their own data

## Turkish Localization

All user-facing messages in Turkish:
- "Senkronize Et" - Sync button
- "Senkronize Ediliyor..." - Syncing state
- "Son senkronizasyon" - Last sync
- "Henüz senkronize edilmedi" - Not yet synced
- Error messages in Turkish with actionable guidance

## Future Enhancements

1. **Selective Sync**: Allow syncing specific campaigns
2. **Sync History**: Track sync history with success/failure logs
3. **Webhook Support**: Real-time updates via Meta webhooks
4. **Incremental Sync**: Only sync changed data
5. **Sync Scheduling**: User-configurable sync times
