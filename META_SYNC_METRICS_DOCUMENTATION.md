# Meta Sync Metrics Documentation

## Overview
This document details which metrics are fetched from Meta Graph API during synchronization and how they are calculated.

## Meta Graph API Fields Requested

### Campaign Level
```
fields: id,name,status,objective,created_time,updated_time
```

### Ad Set Level
```
fields: id,name,campaign_id,status,daily_budget,lifetime_budget,created_time
```

### Ad Level
```
fields: id,name,adset_id,status,creative{id,thumbnail_url},created_time
```

### Ad Insights (Metrics) Level
```
fields: ad_id,date_start,date_stop,spend,impressions,clicks,actions,action_values,frequency
```

## Raw Metrics from Meta API

The following metrics are fetched directly from Meta Graph API:

1. **spend** - Total amount spent (string, converted to float)
2. **impressions** - Number of times ads were shown (string, converted to int)
3. **clicks** - Number of clicks on ads (string, converted to int)
4. **actions** - Array of action objects containing:
   - `purchase` - Number of purchases
   - `add_to_cart` - Number of add to cart actions
5. **action_values** - Array of action value objects containing:
   - `purchase` - Total purchase value (revenue)
6. **frequency** - Average number of times each person saw the ad (string, converted to float)

## Calculated Metrics

The following metrics are calculated from the raw Meta API data:

### 1. CTR (Click-Through Rate)
```typescript
ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
```
- Formula: (Clicks / Impressions) × 100
- Unit: Percentage
- Precision: 2 decimal places

### 2. CPC (Cost Per Click)
```typescript
cpc = clicks > 0 ? spend / clicks : 0
```
- Formula: Spend / Clicks
- Unit: Turkish Lira (₺)
- Precision: 2 decimal places

### 3. CPM (Cost Per Mille/Thousand Impressions)
```typescript
cpm = impressions > 0 ? (spend / impressions) * 1000 : 0
```
- Formula: (Spend / Impressions) × 1000
- Unit: Turkish Lira (₺)
- Precision: 2 decimal places

### 4. CPA (Cost Per Acquisition/Conversion)
```typescript
cpa = conversions > 0 ? spend / conversions : 0
```
- Formula: Spend / Conversions
- Unit: Turkish Lira (₺)
- Precision: 2 decimal places

### 5. ROAS (Return on Ad Spend)
```typescript
roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0
```
- Formula: Purchase Value / Spend
- Unit: Ratio (e.g., 3.5 means ₺3.50 revenue per ₺1 spent)
- Precision: 2 decimal places

### 6. Conversions
```typescript
conversions = parseInt(purchases, 10)
```
- Extracted from actions array where action_type === 'purchase'
- Unit: Count

### 7. Purchases
```typescript
purchases = conversions
```
- Same as conversions
- Unit: Count

### 8. Add to Cart
```typescript
add_to_cart = parseInt(addToCart, 10)
```
- Extracted from actions array where action_type === 'add_to_cart'
- Unit: Count

## Stored Metrics in Database

All metrics are stored in the `meta_metrics` table with the following structure:

```sql
CREATE TABLE meta_metrics (
  metric_id UUID PRIMARY KEY,
  ad_id UUID REFERENCES ads(ad_id),
  date DATE NOT NULL,
  spend DECIMAL(10,2),
  impressions INTEGER,
  clicks INTEGER,
  conversions INTEGER,
  roas DECIMAL(10,2),
  ctr DECIMAL(5,2),
  cpc DECIMAL(10,2),
  cpm DECIMAL(10,2),
  cpa DECIMAL(10,2),
  frequency DECIMAL(5,2),
  add_to_cart INTEGER,
  purchases INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(ad_id, date)
);
```

## Sync Process Flow

1. **Fetch Campaigns** from Meta API for the ad account
2. **For each Campaign**:
   - Upsert campaign data in database
   - Fetch Ad Sets for the campaign
3. **For each Ad Set**:
   - Upsert ad set data in database
   - Fetch Ads for the ad set
4. **For each Ad**:
   - Upsert ad data in database
   - Fetch Insights (metrics) for the ad
   - Calculate derived metrics (CTR, CPC, CPM, CPA, ROAS)
   - Upsert metrics in database

## Date Range

- Default sync range: Last 7 days
- Format: YYYY-MM-DD
- Configurable via `DateRange` parameter

## Notifications

The sync process triggers notifications for:

1. **ROAS Alerts**: When ROAS > 0 (configurable threshold)
2. **Budget Alerts**: When spend approaches daily budget
3. **Sync Errors**: When sync fails or token expires

## API Endpoint

```
POST /api/campaigns/sync
```

Request body:
```json
{
  "clientId": "optional-client-id" // If omitted, syncs all clients
}
```

## Cron Job

Automated sync runs daily at 00:00 UTC via Vercel Cron:
```
0 0 * * * // Daily at midnight UTC
```

## Error Handling

- Retry logic: 3 attempts with exponential backoff
- Rate limit handling: Automatic retry with backoff
- Authentication errors: No retry, notification sent to user
- Partial success: Continues processing remaining items

## Related Files

- `lib/meta/sync.ts` - Main sync logic
- `lib/meta/client.ts` - Meta API client
- `app/api/campaigns/sync/route.ts` - API endpoint
- `lib/utils/notifications.ts` - Notification triggers
