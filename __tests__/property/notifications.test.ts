// @ts-nocheck
/**
 * Feature: growthpilot-ai, Notification System Property Tests
 * 
 * Property 46: Conditional Notification Creation
 * Property 47: Notification Read Status Update
 * Property 48: Notification Schema Completeness
 * 
 * Validates: Requirements 20.1-20.6
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate ROAS values (can be below or above threshold)
const arbitraryROAS = () => fc.float({ min: 0.5, max: 5.0, noNaN: true });

// Generate daily spend values
const arbitraryDailySpend = () => fc.float({ min: 100, max: 10000, noNaN: true });

// Generate average daily budget
const arbitraryAverageBudget = () => fc.float({ min: 100, max: 5000, noNaN: true });

// Generate campaign name
const arbitraryCampaignName = () =>
  fc.string({ minLength: 5, maxLength: 50 }).map(s => `Campaign ${s}`);

// Generate notification type
const arbitraryNotificationType = () =>
  fc.constantFrom('roas_alert', 'budget_alert', 'sync_error', 'general');

// Generate notification message
const arbitraryNotificationMessage = () =>
  fc.string({ minLength: 10, maxLength: 200 });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-notif-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'testpassword123';

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  return {
    userId: data.user.id,
    email,
    accessToken: signInData.session.access_token
  };
}

// Clean up test user and all associated data
async function cleanupTestUser(userId: string): Promise<void> {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Cleanup warning for user ${userId}:`, error);
  }
}

// Create notification directly in database
async function createNotificationInDB(
  userId: string,
  message: string,
  type: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id: userId,
      message,
      type,
      read_status: false
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create notification: ${error?.message}`);
  }

  return data.notification_id;
}

// Get notification by ID
async function getNotificationById(notificationId: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('notification_id', notificationId)
    .single();

  if (error) {
    throw new Error(`Failed to get notification: ${error.message}`);
  }

  return data;
}

// Mark notification as read via API
async function markNotificationAsRead(
  accessToken: string,
  notificationId: string
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/${notificationId}/read`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to mark notification as read: ${error.error}`);
  }

  return response.json();
}

// Get notifications via API
async function getNotifications(
  accessToken: string,
  params?: { unread_only?: boolean; limit?: number }
): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.unread_only) queryParams.append('unread_only', 'true');
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get notifications: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 46: Conditional Notification Creation
 * 
 * For any campaign where ROAS < 1.5, or daily spend > 120% of average daily budget,
 * or Meta API sync fails, the system should create a notification for the user.
 * 
 * Validates: Requirements 20.1, 20.2, 20.3
 */
describe('Property 46: Conditional Notification Creation', () => {
  let testUser: { userId: string; email: string; accessToken: string };

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should create notification when ROAS < 1.5', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryROAS(),
        arbitraryCampaignName(),
        async (roas, campaignName) => {
          const threshold = 1.5;
          let notificationId: string | null = null;

          try {
            // Import notification utility
            const { checkROASAndNotify } = await import('@/lib/utils/notifications');

            // Get initial notification count
            const initialResponse = await getNotifications(testUser.accessToken);
            const initialCount = initialResponse.notifications.length;

            // Step 1: Check ROAS and create notification if needed
            await checkROASAndNotify(testUser.userId, campaignName, roas, threshold);

            // Step 2: Verify notification creation based on condition
            const finalResponse = await getNotifications(testUser.accessToken);
            const finalCount = finalResponse.notifications.length;

            if (roas < threshold) {
              // Should have created a notification
              expect(finalCount).toBe(initialCount + 1);

              // Find the new notification
              const newNotification = finalResponse.notifications.find(
                (n: any) => n.type === 'roas_alert' && n.message.includes(campaignName)
              );

              expect(newNotification).toBeDefined();
              expect(newNotification.message).toContain(campaignName);
              expect(newNotification.message).toContain(roas.toFixed(2));
              expect(newNotification.message).toContain(threshold.toString());
              expect(newNotification.type).toBe('roas_alert');
              expect(newNotification.read_status).toBe(false);

              notificationId = newNotification.notification_id;
            } else {
              // Should NOT have created a notification
              expect(finalCount).toBe(initialCount);
            }

            // Cleanup
            if (notificationId) {
              await supabaseAdmin
                .from('notifications')
                .delete()
                .eq('notification_id', notificationId);
            }

            return true;
          } catch (error) {
            if (notificationId) {
              try {
                await supabaseAdmin
                  .from('notifications')
                  .delete()
                  .eq('notification_id', notificationId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 120000);

  it('should create notification when daily spend > 120% of budget', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryDailySpend(),
        arbitraryAverageBudget(),
        arbitraryCampaignName(),
        async (dailySpend, averageBudget, campaignName) => {
          const threshold = 1.2;
          let notificationId: string | null = null;

          try {
            // Import notification utility
            const { checkBudgetAndNotify } = await import('@/lib/utils/notifications');

            // Get initial notification count
            const initialResponse = await getNotifications(testUser.accessToken);
            const initialCount = initialResponse.notifications.length;

            // Step 1: Check budget and create notification if needed
            await checkBudgetAndNotify(
              testUser.userId,
              campaignName,
              dailySpend,
              averageBudget,
              threshold
            );

            // Step 2: Verify notification creation based on condition
            const finalResponse = await getNotifications(testUser.accessToken);
            const finalCount = finalResponse.notifications.length;

            const budgetThreshold = averageBudget * threshold;

            if (dailySpend > budgetThreshold) {
              // Should have created a notification
              expect(finalCount).toBe(initialCount + 1);

              // Find the new notification
              const newNotification = finalResponse.notifications.find(
                (n: any) => n.type === 'budget_alert' && n.message.includes(campaignName)
              );

              expect(newNotification).toBeDefined();
              expect(newNotification.message).toContain(campaignName);
              expect(newNotification.message).toContain('bütçe');
              expect(newNotification.type).toBe('budget_alert');
              expect(newNotification.read_status).toBe(false);

              notificationId = newNotification.notification_id;
            } else {
              // Should NOT have created a notification
              expect(finalCount).toBe(initialCount);
            }

            // Cleanup
            if (notificationId) {
              await supabaseAdmin
                .from('notifications')
                .delete()
                .eq('notification_id', notificationId);
            }

            return true;
          } catch (error) {
            if (notificationId) {
              try {
                await supabaseAdmin
                  .from('notifications')
                  .delete()
                  .eq('notification_id', notificationId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 120000);

  it('should create notification for Meta API sync failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }),
        async (errorMessage) => {
          let notificationId: string | null = null;

          try {
            // Import notification utility
            const { notifySyncError } = await import('@/lib/utils/notifications');

            // Get initial notification count
            const initialResponse = await getNotifications(testUser.accessToken);
            const initialCount = initialResponse.notifications.length;

            // Step 1: Create sync error notification
            await notifySyncError(testUser.userId, errorMessage);

            // Step 2: Verify notification was created
            const finalResponse = await getNotifications(testUser.accessToken);
            const finalCount = finalResponse.notifications.length;

            expect(finalCount).toBe(initialCount + 1);

            // Find the new notification
            const newNotification = finalResponse.notifications.find(
              (n: any) => n.type === 'sync_error' && n.message.includes('Meta API')
            );

            expect(newNotification).toBeDefined();
            expect(newNotification.message).toContain('Meta API senkronizasyonu başarısız');
            expect(newNotification.message).toContain(errorMessage);
            expect(newNotification.type).toBe('sync_error');
            expect(newNotification.read_status).toBe(false);

            notificationId = newNotification.notification_id;

            // Cleanup
            if (notificationId) {
              await supabaseAdmin
                .from('notifications')
                .delete()
                .eq('notification_id', notificationId);
            }

            return true;
          } catch (error) {
            if (notificationId) {
              try {
                await supabaseAdmin
                  .from('notifications')
                  .delete()
                  .eq('notification_id', notificationId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 15, timeout: 60000 }
    );
  }, 120000);

  it('should handle edge case: ROAS exactly at threshold (1.5)', async () => {
    const roas = 1.5;
    const campaignName = 'Edge Case Campaign';
    const threshold = 1.5;

    const { checkROASAndNotify } = await import('@/lib/utils/notifications');

    const initialResponse = await getNotifications(testUser.accessToken);
    const initialCount = initialResponse.notifications.length;

    await checkROASAndNotify(testUser.userId, campaignName, roas, threshold);

    const finalResponse = await getNotifications(testUser.accessToken);
    const finalCount = finalResponse.notifications.length;

    // Should NOT create notification when ROAS equals threshold
    expect(finalCount).toBe(initialCount);
  }, 30000);

  it('should handle edge case: daily spend exactly at 120% threshold', async () => {
    const averageBudget = 1000;
    const dailySpend = 1200; // Exactly 120%
    const campaignName = 'Edge Case Campaign';
    const threshold = 1.2;

    const { checkBudgetAndNotify } = await import('@/lib/utils/notifications');

    const initialResponse = await getNotifications(testUser.accessToken);
    const initialCount = initialResponse.notifications.length;

    await checkBudgetAndNotify(
      testUser.userId,
      campaignName,
      dailySpend,
      averageBudget,
      threshold
    );

    const finalResponse = await getNotifications(testUser.accessToken);
    const finalCount = finalResponse.notifications.length;

    // Should NOT create notification when spend equals threshold
    expect(finalCount).toBe(initialCount);
  }, 30000);
});

/**
 * Property 47: Notification Read Status Update
 * 
 * For any notification, clicking on it should mark its read_status as true.
 * 
 * Validates: Requirements 20.5
 */
describe('Property 47: Notification Read Status Update', () => {
  let testUser: { userId: string; email: string; accessToken: string };

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should update read_status to true when notification is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryNotificationMessage(),
        arbitraryNotificationType(),
        async (message, type) => {
          let notificationId: string | null = null;

          try {
            // Step 1: Create notification with read_status = false
            notificationId = await createNotificationInDB(testUser.userId, message, type);

            // Step 2: Verify initial read_status is false
            const initialNotification = await getNotificationById(notificationId);
            expect(initialNotification.read_status).toBe(false);

            // Step 3: Mark notification as read via API
            const updateResponse = await markNotificationAsRead(
              testUser.accessToken,
              notificationId
            );

            expect(updateResponse.notification).toBeDefined();
            expect(updateResponse.notification.read_status).toBe(true);
            expect(updateResponse.notification.notification_id).toBe(notificationId);

            // Step 4: Verify persistence by fetching from database
            const updatedNotification = await getNotificationById(notificationId);
            expect(updatedNotification.read_status).toBe(true);

            // Step 5: Verify idempotency - marking as read again should still work
            const secondUpdateResponse = await markNotificationAsRead(
              testUser.accessToken,
              notificationId
            );

            expect(secondUpdateResponse.notification.read_status).toBe(true);

            // Cleanup
            await supabaseAdmin
              .from('notifications')
              .delete()
              .eq('notification_id', notificationId);

            return true;
          } catch (error) {
            if (notificationId) {
              try {
                await supabaseAdmin
                  .from('notifications')
                  .delete()
                  .eq('notification_id', notificationId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 120000);

  it('should filter notifications correctly with unread_only parameter', async () => {
    const notificationIds: string[] = [];

    try {
      // Create 5 notifications: 3 unread, 2 read
      for (let i = 0; i < 5; i++) {
        const notificationId = await createNotificationInDB(
          testUser.userId,
          `Test notification ${i}`,
          'general'
        );
        notificationIds.push(notificationId);

        // Mark first 2 as read
        if (i < 2) {
          await supabaseAdmin
            .from('notifications')
            .update({ read_status: true })
            .eq('notification_id', notificationId);
        }
      }

      // Get all notifications
      const allResponse = await getNotifications(testUser.accessToken);
      expect(allResponse.notifications.length).toBeGreaterThanOrEqual(5);

      // Get only unread notifications
      const unreadResponse = await getNotifications(testUser.accessToken, { unread_only: true });
      
      // Should have at least 3 unread notifications
      const unreadCount = unreadResponse.notifications.filter(
        (n: any) => notificationIds.includes(n.notification_id)
      ).length;
      expect(unreadCount).toBe(3);

      // All returned notifications should be unread
      unreadResponse.notifications.forEach((n: any) => {
        if (notificationIds.includes(n.notification_id)) {
          expect(n.read_status).toBe(false);
        }
      });

      // Cleanup
      for (const notificationId of notificationIds) {
        await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('notification_id', notificationId);
      }
    } catch (error) {
      // Cleanup on error
      for (const notificationId of notificationIds) {
        try {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('notification_id', notificationId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }, 30000);

  it('should reject marking notification as read for different user', async () => {
    let notificationId: string | null = null;
    let otherUser: { userId: string; email: string; accessToken: string } | null = null;

    try {
      // Create another user
      otherUser = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create notification for testUser
      notificationId = await createNotificationInDB(
        testUser.userId,
        'Test notification',
        'general'
      );

      // Try to mark as read using otherUser's token (should fail)
      try {
        await markNotificationAsRead(otherUser.accessToken, notificationId);
        fail('Should have thrown an error');
      } catch (error: any) {
        // Should fail with 404 or 403 error
        expect(error.message).toContain('Failed to mark notification as read');
      }

      // Verify notification is still unread
      const notification = await getNotificationById(notificationId);
      expect(notification.read_status).toBe(false);

      // Cleanup
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('notification_id', notificationId);

      if (otherUser) {
        await cleanupTestUser(otherUser.userId);
      }
    } catch (error) {
      if (notificationId) {
        try {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('notification_id', notificationId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      if (otherUser) {
        try {
          await cleanupTestUser(otherUser.userId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }, 60000);
});

/**
 * Property 48: Notification Schema Completeness
 * 
 * For any notification stored in the database, it should have all required fields:
 * user_id, message, type, read_status, and created_at.
 * 
 * Validates: Requirements 20.6
 */
describe('Property 48: Notification Schema Completeness', () => {
  let testUser: { userId: string; email: string; accessToken: string };

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should have all required fields for any notification', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryNotificationMessage(),
        arbitraryNotificationType(),
        async (message, type) => {
          let notificationId: string | null = null;

          try {
            // Step 1: Create notification
            notificationId = await createNotificationInDB(testUser.userId, message, type);

            // Step 2: Fetch notification and verify schema
            const notification = await getNotificationById(notificationId);

            // Verify all required fields exist
            expect(notification).toHaveProperty('notification_id');
            expect(notification).toHaveProperty('user_id');
            expect(notification).toHaveProperty('message');
            expect(notification).toHaveProperty('type');
            expect(notification).toHaveProperty('read_status');
            expect(notification).toHaveProperty('created_at');

            // Verify field types and values
            expect(typeof notification.notification_id).toBe('string');
            expect(notification.user_id).toBe(testUser.userId);
            expect(typeof notification.message).toBe('string');
            expect(notification.message).toBe(message);
            expect(typeof notification.type).toBe('string');
            expect(notification.type).toBe(type);
            expect(typeof notification.read_status).toBe('boolean');
            expect(notification.created_at).toBeTruthy();

            // Verify type is one of the allowed values
            expect(['roas_alert', 'budget_alert', 'sync_error', 'general']).toContain(
              notification.type
            );

            // Verify created_at is a valid timestamp
            const createdAt = new Date(notification.created_at);
            expect(createdAt.getTime()).not.toBeNaN();
            expect(createdAt.getTime()).toBeLessThanOrEqual(Date.now());

            // Cleanup
            await supabaseAdmin
              .from('notifications')
              .delete()
              .eq('notification_id', notificationId);

            return true;
          } catch (error) {
            if (notificationId) {
              try {
                await supabaseAdmin
                  .from('notifications')
                  .delete()
                  .eq('notification_id', notificationId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 20, timeout: 60000 }
    );
  }, 120000);

  it('should enforce type constraint (only allowed values)', async () => {
    // Try to create notification with invalid type
    const { error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: testUser.userId,
        message: 'Test notification',
        type: 'invalid_type', // Invalid type
        read_status: false
      });

    // Should fail due to CHECK constraint
    expect(error).toBeDefined();
    expect(error?.message).toContain('violates check constraint');
  }, 30000);

  it('should have default values for optional fields', async () => {
    let notificationId: string | null = null;

    try {
      // Create notification without explicitly setting read_status
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: testUser.userId,
          message: 'Test notification',
          type: 'general'
          // read_status not provided - should default to false
        })
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to create notification: ${error?.message}`);
      }

      notificationId = data.notification_id;

      // Verify default values
      expect(data.read_status).toBe(false);
      expect(data.created_at).toBeTruthy();

      // Cleanup
      await supabaseAdmin
        .from('notifications')
        .delete()
        .eq('notification_id', notificationId);
    } catch (error) {
      if (notificationId) {
        try {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('notification_id', notificationId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }, 30000);

  it('should enforce foreign key constraint on user_id', async () => {
    const invalidUserId = '00000000-0000-0000-0000-000000000000';

    // Try to create notification with non-existent user_id
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: invalidUserId,
        message: 'Test notification',
        type: 'general',
        read_status: false
      })
      .select()
      .single();

    // Should fail due to foreign key constraint
    expect(error).toBeDefined();
    expect(data).toBeNull();
  }, 30000);

  it('should cascade delete notifications when user is deleted', async () => {
    let tempUser: { userId: string; email: string; accessToken: string } | null = null;
    const notificationIds: string[] = [];

    try {
      // Create temporary user
      tempUser = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create multiple notifications for this user
      for (let i = 0; i < 3; i++) {
        const notificationId = await createNotificationInDB(
          tempUser.userId,
          `Test notification ${i}`,
          'general'
        );
        notificationIds.push(notificationId);
      }

      // Verify notifications exist
      for (const notificationId of notificationIds) {
        const notification = await getNotificationById(notificationId);
        expect(notification).toBeDefined();
      }

      // Delete user (should cascade delete notifications)
      await supabaseAdmin.auth.admin.deleteUser(tempUser.userId);

      // Wait for cascade delete to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify notifications are deleted
      for (const notificationId of notificationIds) {
        const { data, error } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('notification_id', notificationId)
          .single();

        expect(data).toBeNull();
      }
    } catch (error) {
      // Cleanup on error
      if (tempUser) {
        try {
          await cleanupTestUser(tempUser.userId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }, 60000);
});
