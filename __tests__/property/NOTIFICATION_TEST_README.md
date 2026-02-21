# Notification System Property Tests

## Overview

This test suite validates the notification system's correctness properties using property-based testing with `fast-check`. The tests ensure that notifications are created conditionally based on campaign metrics, read status updates persist correctly, and the database schema is complete.

## Properties Tested

### Property 46: Conditional Notification Creation

**Validates:** Requirements 20.1, 20.2, 20.3

**Description:** For any campaign where ROAS < 1.5, or daily spend > 120% of average daily budget, or Meta API sync fails, the system should create a notification for the user.

**Test Cases:**
- ROAS threshold notifications (creates when ROAS < 1.5, doesn't create when ROAS >= 1.5)
- Budget threshold notifications (creates when spend > 120% of budget, doesn't create when spend <= 120%)
- Meta API sync failure notifications (always creates on sync error)
- Edge cases: ROAS exactly at 1.5, spend exactly at 120%

**Generators:**
- `arbitraryROAS()`: Generates ROAS values between 0.5 and 5.0
- `arbitraryDailySpend()`: Generates daily spend between 100 and 10,000 TRY
- `arbitraryAverageBudget()`: Generates average budget between 100 and 5,000 TRY
- `arbitraryCampaignName()`: Generates campaign names

**Iterations:** 20 runs per test (15 for sync errors)

### Property 47: Notification Read Status Update

**Validates:** Requirements 20.5

**Description:** For any notification, clicking on it should mark its read_status as true.

**Test Cases:**
- Read status update persistence (false → true)
- Idempotency (marking as read multiple times)
- Filtering with `unread_only` parameter
- Authorization (users can only mark their own notifications as read)

**Generators:**
- `arbitraryNotificationMessage()`: Generates notification messages (10-200 chars)
- `arbitraryNotificationType()`: Generates valid notification types

**Iterations:** 20 runs

### Property 48: Notification Schema Completeness

**Validates:** Requirements 20.6

**Description:** For any notification stored in the database, it should have all required fields: user_id, message, type, read_status, and created_at.

**Test Cases:**
- All required fields present and correct types
- Type constraint enforcement (only allowed values)
- Default values (read_status defaults to false)
- Foreign key constraint on user_id
- Cascade delete when user is deleted

**Generators:**
- `arbitraryNotificationMessage()`: Generates notification messages
- `arbitraryNotificationType()`: Generates valid notification types

**Iterations:** 20 runs

## Test Data Generators

### Notification-Specific Generators

```typescript
// ROAS values (can be below or above threshold)
arbitraryROAS(): fc.Arbitrary<number>
// Range: 0.5 to 5.0

// Daily spend values
arbitraryDailySpend(): fc.Arbitrary<number>
// Range: 100 to 10,000 TRY

// Average daily budget
arbitraryAverageBudget(): fc.Arbitrary<number>
// Range: 100 to 5,000 TRY

// Campaign name
arbitraryCampaignName(): fc.Arbitrary<string>
// Format: "Campaign {random_string}"

// Notification type
arbitraryNotificationType(): fc.Arbitrary<string>
// Values: 'roas_alert', 'budget_alert', 'sync_error', 'general'

// Notification message
arbitraryNotificationMessage(): fc.Arbitrary<string>
// Range: 10 to 200 characters
```

## Helper Functions

### User Management
- `createTestUser()`: Creates a test user with authentication
- `cleanupTestUser(userId)`: Deletes test user and cascades to notifications

### Notification Operations
- `createNotificationInDB(userId, message, type)`: Creates notification directly in database
- `getNotificationById(notificationId)`: Fetches notification by ID
- `markNotificationAsRead(accessToken, notificationId)`: Marks notification as read via API
- `getNotifications(accessToken, params)`: Fetches notifications via API with optional filters

## Running the Tests

### Run all notification property tests:
```bash
npm test __tests__/property/notifications.test.ts
```

### Run specific property test:
```bash
npm test __tests__/property/notifications.test.ts -t "Property 46"
npm test __tests__/property/notifications.test.ts -t "Property 47"
npm test __tests__/property/notifications.test.ts -t "Property 48"
```

### Run with verbose output:
```bash
npm test __tests__/property/notifications.test.ts -- --verbose
```

## Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Optional, defaults to localhost:3000
```

## Test Execution Time

- Property 46 tests: ~120 seconds (3 test cases with 15-20 runs each)
- Property 47 tests: ~120 seconds (3 test cases with 20 runs)
- Property 48 tests: ~120 seconds (5 test cases with 20 runs)
- Total: ~6-8 minutes for all notification property tests

## Notification Types

The system supports four notification types:

1. **roas_alert**: Created when campaign ROAS drops below 1.5
2. **budget_alert**: Created when daily spend exceeds 120% of average budget
3. **sync_error**: Created when Meta API sync fails
4. **general**: General purpose notifications

## Conditional Notification Logic

### ROAS Alert
```typescript
if (roas < 1.5) {
  createNotification({
    type: 'roas_alert',
    message: `${campaignName} kampanyasının ROAS değeri ${roas} seviyesine düştü (Eşik: 1.5)`
  });
}
```

### Budget Alert
```typescript
if (dailySpend > averageBudget * 1.2) {
  const percentageOver = ((dailySpend / averageBudget - 1) * 100).toFixed(0);
  createNotification({
    type: 'budget_alert',
    message: `${campaignName} kampanyasının günlük harcaması ortalama bütçenin %${percentageOver} üzerinde`
  });
}
```

### Sync Error
```typescript
createNotification({
  type: 'sync_error',
  message: `Meta API senkronizasyonu başarısız oldu: ${errorMessage}`
});
```

## Database Schema

```sql
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('roas_alert', 'budget_alert', 'sync_error', 'general')),
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

## Row-Level Security (RLS)

Notifications table has RLS enabled:

```sql
CREATE POLICY "Users can only access their own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid());
```

This ensures:
- Users can only see their own notifications
- Users can only mark their own notifications as read
- Cross-user access is prevented at the database level

## API Endpoints Tested

### GET /api/notifications
- Fetches notifications for authenticated user
- Query parameters:
  - `unread_only=true`: Filter to unread notifications only
  - `limit=50`: Limit number of results (default: 50)

### PUT /api/notifications/:id/read
- Marks a notification as read
- Verifies notification belongs to authenticated user
- Returns updated notification

## Common Test Patterns

### Testing Conditional Creation
```typescript
// Generate random values
const roas = arbitraryROAS();
const threshold = 1.5;

// Trigger notification check
await checkROASAndNotify(userId, campaignName, roas, threshold);

// Verify notification created only when condition met
if (roas < threshold) {
  expect(notificationCreated).toBe(true);
} else {
  expect(notificationCreated).toBe(false);
}
```

### Testing Read Status Update
```typescript
// Create notification (read_status = false)
const notificationId = await createNotificationInDB(userId, message, type);

// Mark as read
await markNotificationAsRead(accessToken, notificationId);

// Verify persistence
const notification = await getNotificationById(notificationId);
expect(notification.read_status).toBe(true);
```

### Testing Schema Completeness
```typescript
// Create notification
const notificationId = await createNotificationInDB(userId, message, type);

// Fetch and verify all fields
const notification = await getNotificationById(notificationId);
expect(notification).toHaveProperty('notification_id');
expect(notification).toHaveProperty('user_id');
expect(notification).toHaveProperty('message');
expect(notification).toHaveProperty('type');
expect(notification).toHaveProperty('read_status');
expect(notification).toHaveProperty('created_at');
```

## Edge Cases Covered

1. **ROAS exactly at threshold (1.5)**: Should NOT create notification
2. **Daily spend exactly at 120% threshold**: Should NOT create notification
3. **Zero notifications**: Filtering and counting work correctly
4. **Multiple notifications**: Filtering by read status works correctly
5. **Cross-user access**: Users cannot mark other users' notifications as read
6. **Invalid notification type**: Database constraint prevents invalid types
7. **Invalid user_id**: Foreign key constraint prevents orphaned notifications
8. **User deletion**: Notifications cascade delete when user is deleted
9. **Idempotency**: Marking as read multiple times doesn't cause errors

## Troubleshooting

### Tests timing out
- Increase timeout in test configuration
- Check database connection
- Verify Supabase service is running

### Authentication errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check user creation is successful
- Ensure sufficient delay after user creation

### Notification not found errors
- Verify RLS policies are correctly configured
- Check user_id matches authenticated user
- Ensure notification was created successfully

### Foreign key constraint errors
- Verify test user exists before creating notifications
- Check cascade delete is working correctly
- Ensure cleanup is happening in correct order

## Integration with Notification System

These property tests validate the core notification utilities in `lib/utils/notifications.ts`:

- `createNotification()`: Creates a notification for a user
- `checkROASAndNotify()`: Checks ROAS and creates notification if below threshold
- `checkBudgetAndNotify()`: Checks budget and creates notification if exceeded
- `notifySyncError()`: Creates notification for Meta API sync failures

The tests also validate the API endpoints in:
- `app/api/notifications/route.ts`: GET notifications
- `app/api/notifications/[id]/read/route.ts`: Mark as read

## Related Documentation

- [Notification System Implementation](../../../NOTIFICATION_SYSTEM_IMPLEMENTATION.md)
- [Requirements Document](../../../.kiro/specs/growthpilot-ai/requirements.md) - Requirements 20.1-20.6
- [Design Document](../../../.kiro/specs/growthpilot-ai/design.md) - Properties 46-48
- [NotificationCenter Component](../../../components/dashboard/NotificationCenter.tsx)

## Success Criteria

All tests should pass with:
- ✅ Property 46: All conditional notification creation scenarios work correctly
- ✅ Property 47: Read status updates persist and are isolated by user
- ✅ Property 48: All required schema fields present with correct types and constraints
- ✅ No false positives or false negatives in conditional logic
- ✅ RLS policies prevent cross-user access
- ✅ Cascade delete works correctly
