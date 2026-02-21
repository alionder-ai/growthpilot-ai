# Notification System Implementation

## Overview

The notification system has been successfully implemented for GrowthPilot AI. It automatically creates notifications for critical events and displays them in a user-friendly notification center in the dashboard header.

## Components Implemented

### 1. Notification Utility Functions (`lib/utils/notifications.ts`)

Core functions for creating and managing notifications:

- `createNotification()` - Creates a notification for a user
- `checkROASAndNotify()` - Checks ROAS and creates notification if below 1.5 threshold
- `checkBudgetAndNotify()` - Checks daily spend against budget and creates notification if exceeds 120%
- `notifySyncError()` - Creates notification for Meta API sync failures

### 2. Notification API Routes

#### GET `/api/notifications`
- Fetches all notifications for authenticated user
- Supports query parameters:
  - `unread_only=true` - Filter to show only unread notifications
  - `limit=50` - Limit number of results (default: 50)
- Returns notifications ordered by creation date (newest first)

#### PUT `/api/notifications/:id/read`
- Marks a specific notification as read
- Verifies notification belongs to authenticated user
- Returns updated notification

### 3. NotificationCenter Component (`components/dashboard/NotificationCenter.tsx`)

Interactive dropdown component in the dashboard header:

**Features:**
- Bell icon with unread count badge
- Dropdown showing recent notifications (up to 20)
- Color-coded icons by notification type:
  - ROAS Alert: Red circle icon
  - Budget Alert: Orange warning icon
  - Sync Error: Red circle icon
  - General: Blue info icon
- Click to mark as read
- Relative time display (e.g., "5 dakika önce", "2 saat önce")
- Empty state when no notifications
- Auto-refresh when dropdown opens

### 4. Notification Cleanup Cron Job (`app/api/notifications/cron/cleanup/route.ts`)

Scheduled task that runs daily at 02:00 UTC:
- Deletes read notifications older than 30 days
- Uses service role key to bypass RLS
- Logs deletion count for monitoring

## Integration Points

### Meta Sync Integration (`lib/meta/sync.ts`)

The sync logic now includes automatic notification triggers:

1. **ROAS Monitoring**: After storing metrics, checks if ROAS < 1.5 and creates alert
2. **Budget Monitoring**: Checks if daily spend exceeds 120% of budget and creates alert
3. **Sync Failure**: Creates notification when Meta API sync fails
4. **Token Expiration**: Creates notification when Meta access token expires

### Dashboard Layout (`components/dashboard/DashboardLayout.tsx`)

NotificationCenter component added to header between menu and logout button.

## Notification Types

| Type | Description | Trigger Condition |
|------|-------------|-------------------|
| `roas_alert` | ROAS below threshold | ROAS < 1.5 |
| `budget_alert` | Budget exceeded | Daily spend > 120% of average daily budget |
| `sync_error` | Meta API sync failure | Sync operation fails or token expires |
| `general` | General notifications | Manual creation |

## Database Schema

The `notifications` table (already exists in database):

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('roas_alert', 'budget_alert', 'sync_error', 'general')),
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Cron Job Configuration

Updated `vercel.json` to include notification cleanup:

```json
{
  "crons": [
    {
      "path": "/api/meta/sync",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/ai/cron/generate-action-plans",
      "schedule": "0 1 * * *"
    },
    {
      "path": "/api/notifications/cron/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## Turkish Localization

All user-facing text is in Turkish:

- Notification messages in Turkish
- UI labels: "Bildirimler", "Henüz bildirim yok", "Yükleniyor..."
- Time formatting: "dakika önce", "saat önce", "gün önce"
- Date formatting: DD.MM.YYYY format

## Example Notification Messages

- **ROAS Alert**: "Kampanya Adı kampanyasının ROAS değeri 1.20 seviyesine düştü (Eşik: 1.5)"
- **Budget Alert**: "Kampanya Adı kampanyasının günlük harcaması ortalama bütçenin %35 üzerinde (1.350,00 TRY / 1.000,00 TRY)"
- **Sync Error**: "Meta API senkronizasyonu başarısız oldu: [error message]"
- **Token Expiration**: "Meta erişim tokenınızın süresi doldu. Lütfen yeniden bağlanın."

## Testing Recommendations

1. **Unit Tests**: Test notification creation functions with various inputs
2. **API Tests**: Test notification API endpoints with authentication
3. **Integration Tests**: Test notification triggers during sync operations
4. **UI Tests**: Test NotificationCenter component interactions

## Environment Variables Required

- `CRON_SECRET` - Secret token for authenticating cron job requests (production only)
- `SUPABASE_SERVICE_ROLE_KEY` - Required for cron job to bypass RLS

## Deployment Notes

1. Ensure `CRON_SECRET` environment variable is set in Vercel
2. Cron jobs will automatically run on Vercel deployment
3. In development, cron endpoints can be called directly without secret
4. Monitor cron job execution in Vercel dashboard

## Future Enhancements

Potential improvements for future iterations:

1. Email notifications for critical alerts
2. Push notifications for mobile app
3. Notification preferences/settings per user
4. Bulk mark as read functionality
5. Notification categories/filtering
6. Real-time notifications using Supabase subscriptions
7. Notification sound/visual alerts
8. Snooze/remind me later functionality
