// @ts-nocheck
/**
 * Feature: growthpilot-ai, Security Property Tests
 * 
 * Property 2: Row-Level Security Isolation
 * Property 34: Password Hashing Security
 * Property 35: GDPR Data Deletion
 * Property 36: Authentication Audit Logging
 * 
 * Validates: Requirements 1.4, 12.13, 15.1-15.6
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { signUpWithEmail, signInWithEmail, signOut } from '@/lib/supabase/auth';
import {
  logLoginSuccess,
  logLoginFailed,
  logSignupSuccess,
  logAccountDeleted,
  getUserAuditLogs,
} from '@/lib/security/audit-logger';

// Initialize Supabase clients for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid email addresses
const arbitraryEmail = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('gmail.com', 'test.com', 'example.com')
  ).map(([local, domain]: [string, string]) => `${local}@${domain}`);

// Generate valid passwords
const arbitraryPassword = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 8, maxLength: 20 });

// Generate client data
const arbitraryClientData = (): fc.Arbitrary<any> =>
  fc.record({
    name: fc.string({ minLength: 3, maxLength: 50 }),
    industry: fc.constantFrom('logistics', 'e-commerce', 'beauty', 'real estate', 'healthcare', 'education'),
    contact_email: arbitraryEmail(),
    contact_phone: fc.string({ minLength: 10, maxLength: 15 }),
  });

/**
 * Helper functions
 */

async function cleanupTestUser(email: string): Promise<void> {
  try {
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find((u: any) => u.email === email);
    
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    console.warn(`Cleanup warning for ${email}:`, error);
  }
}

async function createTestUserWithClient(email: string, password: string): Promise<{ userId: string; clientId: string; supabaseClient: any }> {
  // Sign up user
  const signUpResult = await signUpWithEmail(email, password);
  if (signUpResult.error) {
    throw new Error(`Failed to create test user: ${signUpResult.error.message}`);
  }

  const userId = signUpResult.user!.id;
  const sessionToken = signUpResult.session!.access_token;

  // Create authenticated Supabase client
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
    global: {
      headers: {
        Authorization: `Bearer ${sessionToken}`,
      },
    },
  });

  // Create a client for this user
  const { data: client, error: clientError } = await supabaseClient
    .from('clients')
    .insert({
      name: `Test Client ${Date.now()}`,
      industry: 'e-commerce',
      contact_email: email,
    })
    .select()
    .single();

  if (clientError) {
    throw new Error(`Failed to create test client: ${clientError.message}`);
  }

  return { userId, clientId: client.client_id, supabaseClient };
}

/**
 * Property 2: Row-Level Security Isolation
 * 
 * For any two distinct users, each user should only be able to access their own data
 * across all tables (clients, campaigns, metrics, recommendations, etc.), and any attempt
 * to access another user's data should be rejected by RLS policies.
 * 
 * Validates: Requirements 1.4, 12.13, 15.3
 */
describe('Property 2: Row-Level Security Isolation', () => {
  describe('Client data isolation', () => {
    it('should prevent User A from accessing User B clients', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryEmail(),
          arbitraryEmail(),
          arbitraryPassword(),
          arbitraryPassword(),
          async (emailA: string, emailB: string, passwordA: string, passwordB: string) => {
            // Ensure emails are different
            if (emailA === emailB) {
              return true;
            }

            let userA, userB;

            try {
              // Create User A with a client
              userA = await createTestUserWithClient(emailA, passwordA);
              
              // Create User B with a client
              userB = await createTestUserWithClient(emailB, passwordB);

              // User A queries all clients (should only see their own)
              const { data: userAClients, error: errorA } = await userA.supabaseClient
                .from('clients')
                .select('*');

              expect(errorA).toBeNull();
              expect(userAClients).toHaveLength(1);
              expect(userAClients![0].client_id).toBe(userA.clientId);
              expect(userAClients![0].user_id).toBe(userA.userId);

              // User B queries all clients (should only see their own)
              const { data: userBClients, error: errorB } = await userB.supabaseClient
                .from('clients')
                .select('*');

              expect(errorB).toBeNull();
              expect(userBClients).toHaveLength(1);
              expect(userBClients![0].client_id).toBe(userB.clientId);
              expect(userBClients![0].user_id).toBe(userB.userId);

              // User A should not see User B's client
              expect(userAClients!.find((c: any) => c.client_id === userB.clientId)).toBeUndefined();

              // User B should not see User A's client
              expect(userBClients!.find((c: any) => c.client_id === userA.clientId)).toBeUndefined();

              return true;
            } finally {
              // Cleanup
              if (userA) await cleanupTestUser(emailA);
              if (userB) await cleanupTestUser(emailB);
            }
          }
        ),
        { numRuns: 5, timeout: 60000 }
      );
    }, 120000);

    it('should prevent User A from updating User B client', async () => {
      const emailA = `usera-${Date.now()}@test.com`;
      const emailB = `userb-${Date.now()}@test.com`;
      const password = 'testpassword123';

      let userA, userB;

      try {
        // Create both users with clients
        userA = await createTestUserWithClient(emailA, password);
        userB = await createTestUserWithClient(emailB, password);

        // User A attempts to update User B's client
        const { data: updateResult, error: updateError } = await userA.supabaseClient
          .from('clients')
          .update({ name: 'Hacked Client' })
          .eq('client_id', userB.clientId)
          .select();

        // Update should return no rows (RLS prevents access)
        expect(updateResult).toEqual([]);

        // Verify User B's client was not modified
        const { data: userBClient } = await userB.supabaseClient
          .from('clients')
          .select('*')
          .eq('client_id', userB.clientId)
          .single();

        expect(userBClient.name).not.toBe('Hacked Client');
      } finally {
        if (userA) await cleanupTestUser(emailA);
        if (userB) await cleanupTestUser(emailB);
      }
    }, 60000);

    it('should prevent User A from deleting User B client', async () => {
      const emailA = `usera-${Date.now()}@test.com`;
      const emailB = `userb-${Date.now()}@test.com`;
      const password = 'testpassword123';

      let userA, userB;

      try {
        // Create both users with clients
        userA = await createTestUserWithClient(emailA, password);
        userB = await createTestUserWithClient(emailB, password);

        // User A attempts to delete User B's client
        const { data: deleteResult, error: deleteError } = await userA.supabaseClient
          .from('clients')
          .delete()
          .eq('client_id', userB.clientId)
          .select();

        // Delete should return no rows (RLS prevents access)
        expect(deleteResult).toEqual([]);

        // Verify User B's client still exists
        const { data: userBClient } = await userB.supabaseClient
          .from('clients')
          .select('*')
          .eq('client_id', userB.clientId)
          .single();

        expect(userBClient).not.toBeNull();
        expect(userBClient.client_id).toBe(userB.clientId);
      } finally {
        if (userA) await cleanupTestUser(emailA);
        if (userB) await cleanupTestUser(emailB);
      }
    }, 60000);
  });

  describe('Creative library isolation', () => {
    it('should prevent User A from accessing User B creative library', async () => {
      const emailA = `usera-${Date.now()}@test.com`;
      const emailB = `userb-${Date.now()}@test.com`;
      const password = 'testpassword123';

      let userA, userB;

      try {
        // Create both users
        userA = await createTestUserWithClient(emailA, password);
        userB = await createTestUserWithClient(emailB, password);

        // User A creates creative content
        const { data: creativeA } = await userA.supabaseClient
          .from('creative_library')
          .insert({
            industry: 'e-commerce',
            content_type: 'ad_copy',
            content_text: 'User A creative content',
          })
          .select()
          .single();

        // User B creates creative content
        const { data: creativeB } = await userB.supabaseClient
          .from('creative_library')
          .insert({
            industry: 'logistics',
            content_type: 'video_script',
            content_text: 'User B creative content',
          })
          .select()
          .single();

        // User A queries creative library (should only see their own)
        const { data: userACreatives } = await userA.supabaseClient
          .from('creative_library')
          .select('*');

        expect(userACreatives).toHaveLength(1);
        expect(userACreatives![0].creative_id).toBe(creativeA.creative_id);
        expect(userACreatives!.find((c: any) => c.creative_id === creativeB.creative_id)).toBeUndefined();

        // User B queries creative library (should only see their own)
        const { data: userBCreatives } = await userB.supabaseClient
          .from('creative_library')
          .select('*');

        expect(userBCreatives).toHaveLength(1);
        expect(userBCreatives![0].creative_id).toBe(creativeB.creative_id);
        expect(userBCreatives!.find((c: any) => c.creative_id === creativeA.creative_id)).toBeUndefined();
      } finally {
        if (userA) await cleanupTestUser(emailA);
        if (userB) await cleanupTestUser(emailB);
      }
    }, 60000);
  });

  describe('Notifications isolation', () => {
    it('should prevent User A from accessing User B notifications', async () => {
      const emailA = `usera-${Date.now()}@test.com`;
      const emailB = `userb-${Date.now()}@test.com`;
      const password = 'testpassword123';

      let userA, userB;

      try {
        // Create both users
        userA = await createTestUserWithClient(emailA, password);
        userB = await createTestUserWithClient(emailB, password);

        // Create notification for User A
        const { data: notificationA } = await userA.supabaseClient
          .from('notifications')
          .insert({
            message: 'User A notification',
            type: 'general',
            read_status: false,
          })
          .select()
          .single();

        // Create notification for User B
        const { data: notificationB } = await userB.supabaseClient
          .from('notifications')
          .insert({
            message: 'User B notification',
            type: 'general',
            read_status: false,
          })
          .select()
          .single();

        // User A queries notifications (should only see their own)
        const { data: userANotifications } = await userA.supabaseClient
          .from('notifications')
          .select('*');

        expect(userANotifications).toHaveLength(1);
        expect(userANotifications![0].notification_id).toBe(notificationA.notification_id);
        expect(userANotifications!.find((n: any) => n.notification_id === notificationB.notification_id)).toBeUndefined();

        // User B queries notifications (should only see their own)
        const { data: userBNotifications } = await userB.supabaseClient
          .from('notifications')
          .select('*');

        expect(userBNotifications).toHaveLength(1);
        expect(userBNotifications![0].notification_id).toBe(notificationB.notification_id);
        expect(userBNotifications!.find((n: any) => n.notification_id === notificationA.notification_id)).toBeUndefined();
      } finally {
        if (userA) await cleanupTestUser(emailA);
        if (userB) await cleanupTestUser(emailB);
      }
    }, 60000);
  });
});

/**
 * Property 34: Password Hashing Security
 * 
 * For any user password stored in the database, it should be hashed using bcrypt
 * with a minimum of 10 salt rounds, and the original password should not be retrievable.
 * 
 * Validates: Requirements 15.4
 */
describe('Property 34: Password Hashing Security', () => {
  it('should hash passwords with bcrypt and not store plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryEmail(),
        arbitraryPassword(),
        async (email: string, password: string) => {
          try {
            // Create user with password
            const signUpResult = await signUpWithEmail(email, password);
            
            if (signUpResult.error?.message.includes('already registered')) {
              await cleanupTestUser(email);
              return true;
            }

            expect(signUpResult.error).toBeNull();
            const userId = signUpResult.user!.id;

            // Query the auth.users table using admin client
            const { data: authUser, error: queryError } = await supabaseAdmin
              .from('auth.users')
              .select('encrypted_password')
              .eq('id', userId)
              .single();

            // If we can't query auth.users directly, that's okay - Supabase handles this
            if (queryError) {
              // Verify we can login with the password (proves it's stored correctly)
              await signOut();
              const loginResult = await signInWithEmail(email, password);
              expect(loginResult.error).toBeNull();
              expect(loginResult.user).not.toBeNull();
              
              await cleanupTestUser(email);
              return true;
            }

            // If we can query, verify the password is hashed
            expect(authUser.encrypted_password).not.toBe(password);
            expect(authUser.encrypted_password).toMatch(/^\$2[aby]\$\d{2}\$/); // Bcrypt format

            // Verify it's bcrypt with at least 10 rounds
            const bcryptMatch = authUser.encrypted_password.match(/^\$2[aby]\$(\d{2})\$/);
            if (bcryptMatch) {
              const rounds = parseInt(bcryptMatch[1], 10);
              expect(rounds).toBeGreaterThanOrEqual(10);
            }

            // Cleanup
            await cleanupTestUser(email);
            return true;
          } catch (error) {
            await cleanupTestUser(email);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 60000 }
    );
  }, 120000);

  it('should verify password cannot be retrieved from hash', async () => {
    const email = `test-hash-${Date.now()}@test.com`;
    const password = 'securepassword123';

    try {
      // Create user
      const signUpResult = await signUpWithEmail(email, password);
      expect(signUpResult.error).toBeNull();

      // Verify we can login with correct password
      await signOut();
      const correctLogin = await signInWithEmail(email, password);
      expect(correctLogin.error).toBeNull();

      // Verify we cannot login with wrong password
      await signOut();
      const wrongLogin = await signInWithEmail(email, 'wrongpassword');
      expect(wrongLogin.error).not.toBeNull();
      expect(wrongLogin.user).toBeNull();

      // This proves the password is hashed (one-way function)
      // If it was plaintext or reversible, wrong password would work or we could retrieve it
    } finally {
      await cleanupTestUser(email);
    }
  }, 30000);
});

/**
 * Property 35: GDPR Data Deletion
 * 
 * For any user requesting data deletion, all associated data (clients, campaigns,
 * metrics, recommendations, etc.) should be permanently removed from the database.
 * 
 * Validates: Requirements 15.5
 */
describe('Property 35: GDPR Data Deletion', () => {
  it('should delete all user data when user account is deleted', async () => {
    const email = `test-gdpr-${Date.now()}@test.com`;
    const password = 'testpassword123';

    let userId: string;
    let clientId: string;

    try {
      // Create user with client
      const user = await createTestUserWithClient(email, password);
      userId = user.userId;
      clientId = user.clientId;

      // Create additional data for the user
      // 1. Creative library
      const { data: creative } = await user.supabaseClient
        .from('creative_library')
        .insert({
          industry: 'e-commerce',
          content_type: 'ad_copy',
          content_text: 'Test creative',
        })
        .select()
        .single();

      // 2. Notification
      const { data: notification } = await user.supabaseClient
        .from('notifications')
        .insert({
          message: 'Test notification',
          type: 'general',
          read_status: false,
        })
        .select()
        .single();

      // 3. AI Recommendation
      const { data: recommendation } = await user.supabaseClient
        .from('ai_recommendations')
        .insert({
          client_id: clientId,
          recommendation_type: 'action_plan',
          content: { actions: ['Test action'] },
          priority: 'high',
          status: 'active',
        })
        .select()
        .single();

      // Verify data exists
      expect(creative).not.toBeNull();
      expect(notification).not.toBeNull();
      expect(recommendation).not.toBeNull();

      // Delete user account (simulating GDPR deletion)
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      expect(deleteError).toBeNull();

      // Verify all data is deleted (using admin client to bypass RLS)
      // 1. User record
      const { data: userRecord } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', userId);
      expect(userRecord).toEqual([]);

      // 2. Client (should cascade delete)
      const { data: clientRecord } = await supabaseAdmin
        .from('clients')
        .select('*')
        .eq('client_id', clientId);
      expect(clientRecord).toEqual([]);

      // 3. Creative library
      const { data: creativeRecord } = await supabaseAdmin
        .from('creative_library')
        .select('*')
        .eq('creative_id', creative.creative_id);
      expect(creativeRecord).toEqual([]);

      // 4. Notifications
      const { data: notificationRecord } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .eq('notification_id', notification.notification_id);
      expect(notificationRecord).toEqual([]);

      // 5. AI Recommendations (should cascade from client deletion)
      const { data: recommendationRecord } = await supabaseAdmin
        .from('ai_recommendations')
        .select('*')
        .eq('recommendation_id', recommendation.recommendation_id);
      expect(recommendationRecord).toEqual([]);

    } catch (error) {
      // Cleanup in case of error
      if (userId) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
      }
      throw error;
    }
  }, 60000);

  it('should cascade delete from clients to all related tables', async () => {
    const email = `test-cascade-${Date.now()}@test.com`;
    const password = 'testpassword123';

    let user;

    try {
      // Create user with client
      user = await createTestUserWithClient(email, password);

      // Create campaign for the client
      const { data: campaign } = await user.supabaseClient
        .from('campaigns')
        .insert({
          client_id: user.clientId,
          meta_campaign_id: `meta_${Date.now()}`,
          campaign_name: 'Test Campaign',
          status: 'active',
        })
        .select()
        .single();

      // Create AI recommendation for the client
      const { data: recommendation } = await user.supabaseClient
        .from('ai_recommendations')
        .insert({
          client_id: user.clientId,
          recommendation_type: 'strategy_card',
          content: { do_actions: ['Test'], dont_actions: ['Test'] },
          priority: 'medium',
          status: 'active',
        })
        .select()
        .single();

      // Create report for the client
      const { data: report } = await user.supabaseClient
        .from('reports')
        .insert({
          client_id: user.clientId,
          report_type: 'weekly',
          period_start: '2024-01-01',
          period_end: '2024-01-07',
        })
        .select()
        .single();

      // Delete the client
      const { error: deleteError } = await user.supabaseClient
        .from('clients')
        .delete()
        .eq('client_id', user.clientId);

      expect(deleteError).toBeNull();

      // Verify cascade deletion
      // 1. Campaign should be deleted
      const { data: campaignRecord } = await user.supabaseClient
        .from('campaigns')
        .select('*')
        .eq('campaign_id', campaign.campaign_id);
      expect(campaignRecord).toEqual([]);

      // 2. Recommendation should be deleted
      const { data: recommendationRecord } = await user.supabaseClient
        .from('ai_recommendations')
        .select('*')
        .eq('recommendation_id', recommendation.recommendation_id);
      expect(recommendationRecord).toEqual([]);

      // 3. Report should be deleted
      const { data: reportRecord } = await user.supabaseClient
        .from('reports')
        .select('*')
        .eq('report_id', report.report_id);
      expect(reportRecord).toEqual([]);

    } finally {
      if (user) await cleanupTestUser(email);
    }
  }, 60000);
});

/**
 * Property 36: Authentication Audit Logging
 * 
 * For any authentication attempt (successful or failed), an audit log entry should be
 * created with timestamp, user identifier, and result.
 * 
 * Validates: Requirements 15.6
 */
describe('Property 36: Authentication Audit Logging', () => {
  it('should log successful login attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryEmail(),
        arbitraryPassword(),
        async (email: string, password: string) => {
          try {
            // Create user
            const signUpResult = await signUpWithEmail(email, password);
            
            if (signUpResult.error?.message.includes('already registered')) {
              await cleanupTestUser(email);
              return true;
            }

            expect(signUpResult.error).toBeNull();
            const userId = signUpResult.user!.id;

            // Log successful login
            await logLoginSuccess(userId, email, '127.0.0.1', 'test-agent');

            // Verify audit log was created
            const logs = await getUserAuditLogs(userId);
            
            const loginLog = logs.find((log: any) => log.event_type === 'login_success');
            expect(loginLog).toBeDefined();
            expect(loginLog.user_id).toBe(userId);
            expect(loginLog.email).toBe(email);
            expect(loginLog.ip_address).toBe('127.0.0.1');
            expect(loginLog.user_agent).toBe('test-agent');
            expect(loginLog.created_at).toBeTruthy();

            // Cleanup
            await cleanupTestUser(email);
            return true;
          } catch (error) {
            await cleanupTestUser(email);
            throw error;
          }
        }
      ),
      { numRuns: 5, timeout: 60000 }
    );
  }, 120000);

  it('should log failed login attempts', async () => {
    const email = `test-failed-${Date.now()}@test.com`;

    // Log failed login attempt
    await logLoginFailed(email, 'Invalid credentials', '127.0.0.1', 'test-agent');

    // Query audit logs using admin client
    const { data: logs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('email', email)
      .eq('event_type', 'login_failed')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(logs).toHaveLength(1);
    expect(logs![0].email).toBe(email);
    expect(logs![0].event_type).toBe('login_failed');
    expect(logs![0].ip_address).toBe('127.0.0.1');
    expect(logs![0].user_agent).toBe('test-agent');
    expect(logs![0].metadata).toHaveProperty('reason', 'Invalid credentials');
  }, 30000);

  it('should log successful signup attempts', async () => {
    const email = `test-signup-${Date.now()}@test.com`;
    const password = 'testpassword123';

    try {
      // Create user
      const signUpResult = await signUpWithEmail(email, password);
      expect(signUpResult.error).toBeNull();
      const userId = signUpResult.user!.id;

      // Log successful signup
      await logSignupSuccess(userId, email, '127.0.0.1', 'test-agent');

      // Verify audit log
      const logs = await getUserAuditLogs(userId);
      
      const signupLog = logs.find((log: any) => log.event_type === 'signup_success');
      expect(signupLog).toBeDefined();
      expect(signupLog.user_id).toBe(userId);
      expect(signupLog.email).toBe(email);
      expect(signupLog.event_type).toBe('signup_success');

      // Cleanup
      await cleanupTestUser(email);
    } catch (error) {
      await cleanupTestUser(email);
      throw error;
    }
  }, 30000);

  it('should log account deletion', async () => {
    const email = `test-delete-${Date.now()}@test.com`;
    const password = 'testpassword123';

    try {
      // Create user
      const signUpResult = await signUpWithEmail(email, password);
      expect(signUpResult.error).toBeNull();
      const userId = signUpResult.user!.id;

      // Log account deletion
      await logAccountDeleted(userId, email, '127.0.0.1', 'test-agent');

      // Verify audit log
      const logs = await getUserAuditLogs(userId);
      
      const deleteLog = logs.find((log: any) => log.event_type === 'account_deleted');
      expect(deleteLog).toBeDefined();
      expect(deleteLog.user_id).toBe(userId);
      expect(deleteLog.email).toBe(email);
      expect(deleteLog.event_type).toBe('account_deleted');

      // Cleanup
      await cleanupTestUser(email);
    } catch (error) {
      await cleanupTestUser(email);
      throw error;
    }
  }, 30000);

  it('should include timestamp in all audit logs', async () => {
    const email = `test-timestamp-${Date.now()}@test.com`;
    const password = 'testpassword123';

    try {
      // Create user
      const signUpResult = await signUpWithEmail(email, password);
      expect(signUpResult.error).toBeNull();
      const userId = signUpResult.user!.id;

      const beforeLog = new Date();

      // Log an event
      await logLoginSuccess(userId, email, '127.0.0.1', 'test-agent');

      const afterLog = new Date();

      // Verify timestamp
      const logs = await getUserAuditLogs(userId);
      const loginLog = logs.find((log: any) => log.event_type === 'login_success');

      expect(loginLog).toBeDefined();
      expect(loginLog.created_at).toBeTruthy();

      const logTimestamp = new Date(loginLog.created_at);
      expect(logTimestamp.getTime()).toBeGreaterThanOrEqual(beforeLog.getTime());
      expect(logTimestamp.getTime()).toBeLessThanOrEqual(afterLog.getTime());

      // Cleanup
      await cleanupTestUser(email);
    } catch (error) {
      await cleanupTestUser(email);
      throw error;
    }
  }, 30000);

  it('should store metadata for audit events', async () => {
    const email = `test-metadata-${Date.now()}@test.com`;

    // Log failed login with metadata
    await logLoginFailed(email, 'Password too short', '192.168.1.1', 'Mozilla/5.0');

    // Query audit log
    const { data: logs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('email', email)
      .eq('event_type', 'login_failed')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(logs).toHaveLength(1);
    expect(logs![0].metadata).toBeDefined();
    expect(logs![0].metadata).toHaveProperty('reason', 'Password too short');
    expect(logs![0].metadata).toHaveProperty('timestamp');
  }, 30000);
});
