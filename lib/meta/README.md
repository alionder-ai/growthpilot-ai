# Meta API Integration

This directory contains the complete Meta Ads API integration for GrowthPilot AI.

## Features

- **OAuth 2.0 Authentication**: Secure token exchange with Meta
- **AES-256 Encryption**: All access tokens encrypted at rest
- **Automatic Data Sync**: Fetches campaigns, ad sets, ads, and metrics
- **Retry Logic**: Exponential backoff (1s, 2s, 4s) for failed requests
- **Rate Limit Handling**: Queues requests when rate limits are reached
- **Error Notifications**: Automatic user notifications on failures

## Architecture

### Files

- `client.ts` - Meta Graph API client with retry logic
- `metrics.ts` - Metrics parsing and storage utilities
- `sync.ts` - Full sync orchestration with error handling
- `status.ts` - Connection status checking utilities
- `index.ts` - Public API exports

### API Routes

- `POST /api/meta/connect` - Initiates OAuth flow
- `GET /api/meta/callback` - Handles OAuth callback
- `POST /api/meta/sync` - Triggers manual sync

## Usage

### Connecting a Meta Account

```typescript
// Frontend: Initiate OAuth
const response = await fetch('/api/meta/connect', { method: 'POST' });
const { authUrl } = await response.json();
window.location.href = authUrl;
```

### Manual Sync

```typescript
// Trigger sync for authenticated user
const response = await fetch('/api/meta/sync', { method: 'POST' });
const result = await response.json();
console.log(`Synced ${result.stats.metricsStored} metrics`);
```

### Checking Connection Status

```typescript
import { getMetaConnectionStatus } from '@/lib/meta';

const status = await getMetaConnectionStatus(supabase, userId);
if (!status.isConnected) {
  // Prompt user to reconnect
}
```

## Data Flow

1. **OAuth Flow**:
   - User clicks "Connect Meta"
   - Redirected to Meta OAuth
   - Callback receives access token
   - Token encrypted with AES-256
   - Stored in `meta_tokens` table

2. **Sync Process**:
   - Fetch campaigns from Meta API
   - For each campaign, fetch ad sets
   - For each ad set, fetch ads
   - For each ad, fetch insights (metrics)
   - Parse and calculate derived metrics (ROAS, CTR, etc.)
   - Store in database with upsert (prevents duplicates)

3. **Error Handling**:
   - Authentication errors → Notify user to reconnect
   - Rate limits → Queue and retry after window
   - Server errors → Exponential backoff retry
   - All errors logged and user notified

## Metrics Calculated

### Direct from Meta API
- Spend
- Impressions
- Clicks
- Conversions (purchases)
- Add to cart
- Frequency

### Derived Metrics
- **ROAS**: Return on Ad Spend (revenue / spend)
- **CTR**: Click-Through Rate (clicks / impressions × 100)
- **CPC**: Cost Per Click (spend / clicks)
- **CPM**: Cost Per Mille (spend / impressions × 1000)
- **CPA**: Cost Per Acquisition (spend / conversions)

## Security

- Access tokens encrypted with AES-256-CBC
- Encryption key stored in environment variable
- Tokens never exposed in API responses
- RLS policies restrict access to user's own tokens

## Rate Limits

Meta API limits: 200 calls per hour per user

Handling:
- Batch processing with delays between batches
- Exponential backoff on rate limit errors
- User notification when limits reached

## Error Messages (Turkish)

- "Meta API kimlik doğrulaması başarısız oldu" - Auth failure
- "Meta API senkronizasyonu başarısız oldu" - Sync failure
- "Meta API istek limiti aşıldı" - Rate limit reached
- "Meta hesabı bağlı değil" - No connected account

## Testing

See `__tests__/unit/meta/` for unit tests and `__tests__/property/` for property-based tests validating:
- Token encryption/decryption round-trip
- Metrics calculation accuracy
- Error notification creation
