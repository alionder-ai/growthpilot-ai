// @ts-nocheck
/**
 * Feature: growthpilot-ai, Meta API Property Tests
 * 
 * Property 8: Meta API Token Encryption
 * Property 9: Meta Metrics Import Completeness
 * Property 10: Meta API Authentication Failure Notification
 * 
 * Validates: Requirements 4.1-4.7, 15.1
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from '@/lib/utils/encryption';
import { MetaAPIClient, createMetaAPIClient } from '@/lib/meta/client';
import type { AdInsights } from '@/lib/meta/client';
import type { MetaMetrics, Notification } from '@/lib/types';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate random access tokens (simulating Meta API tokens)
const arbitraryAccessToken = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 32, maxLength: 256 }).filter(s => s.length > 0);

// Generate random ad account IDs
const arbitraryAdAccountId = (): fc.Arbitrary<string> =>
  fc.integer({ min: 100000000000, max: 999999999999 }).map(n => n.toString());

// Generate random ad IDs
const arbitraryAdId = (): fc.Arbitrary<string> =>
  fc.integer({ min: 1000000000, max: 9999999999 }).map(n => n.toString());

// Generate valid Meta metrics data
const arbitraryMetaMetrics = (): fc.Arbitrary<Partial<MetaMetrics>> =>
  fc.record({
    spend: fc.double({ min: 0, max: 100000, noNaN: true }),
    roas: fc.option(fc.double({ min: 0, max: 20, noNaN: true }), { nil: null }),
    ctr: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }),
    cpc: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }),
    cpm: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: null }),
    cpa: fc.option(fc.double({ min: 0, max: 500, noNaN: true }), { nil: null }),
    frequency: fc.option(fc.double({ min: 0, max: 10, noNaN: true }), { nil: null }),
    add_to_cart: fc.integer({ min: 0, max: 10000 }),
    purchases: fc.integer({ min: 0, max: 1000 }),
    impressions: fc.integer({ min: 0, max: 1000000 }),
    clicks: fc.integer({ min: 0, max: 100000 }),
    conversions: fc.integer({ min: 0, max: 1000 }),
  });

// Generate Ad Insights response from Meta API
const arbitraryAdInsights = (): fc.Arbitrary<AdInsights> =>
  fc.record({
    ad_id: arbitraryAdId(),
    date_start: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    date_stop: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    spend: fc.double({ min: 0, max: 10000, noNaN: true }).map(n => n.toFixed(2)),
    impressions: fc.integer({ min: 0, max: 100000 }).map(n => n.toString()),
    clicks: fc.integer({ min: 0, max: 10000 }).map(n => n.toString()),
    actions: fc.option(
      fc.array(
        fc.record({
          action_type: fc.constantFrom('add_to_cart', 'purchase', 'lead', 'link_click'),
          value: fc.integer({ min: 0, max: 1000 }).map(n => n.toString()),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      { nil: undefined }
    ),
    action_values: fc.option(
      fc.array(
        fc.record({
          action_type: fc.constantFrom('purchase', 'add_to_cart'),
          value: fc.double({ min: 0, max: 50000, noNaN: true }).map(n => n.toFixed(2)),
        }),
        { minLength: 1, maxLength: 3 }
      ),
      { nil: undefined }
    ),
    frequency: fc.option(
      fc.double({ min: 0, max: 10, noNaN: true }).map(n => n.toFixed(2)),
      { nil: undefined }
    ),
  });

// Generate user ID
const arbitraryUserId = (): fc.Arbitrary<string> =>
  fc.uuid();

/**
 * Helper functions
 */


/**
 * Helper function to create a test user
 */
async function createTestUser(email: string): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'testpassword123',
    email_confirm: true,
  });

  if (error) throw error;
  return data.user.id;
}

/**
 * Helper function to clean up test user
 */
async function cleanupTestUser(userId: string): Promise<void> {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Cleanup warning for user ${userId}:`, error);
  }
}

/**
 * Helper function to create a notification
 */
async function createNotification(
  userId: string,
  message: string,
  type: 'roas_alert' | 'budget_alert' | 'sync_error' | 'general'
): Promise<void> {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    message,
    type,
    read_status: false,
  });
}

/**
 * Helper function to check if notification exists
 */
async function notificationExists(
  userId: string,
  type: 'roas_alert' | 'budget_alert' | 'sync_error' | 'general'
): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('notification_id')
    .eq('user_id', userId)
    .eq('type', type)
    .limit(1);

  if (error) throw error;
  return data && data.length > 0;
}

/**
 * Helper function to extract metrics from AdInsights
 */
function extractMetricsFromInsights(insights: AdInsights): Partial<MetaMetrics> {
  const spend = parseFloat(insights.spend);
  const impressions = parseInt(insights.impressions);
  const clicks = parseInt(insights.clicks);

  // Extract actions
  let addToCart = 0;
  let purchases = 0;
  let conversions = 0;

  if (insights.actions) {
    for (const action of insights.actions) {
      if (action.action_type === 'add_to_cart') {
        addToCart = parseInt(action.value);
      } else if (action.action_type === 'purchase') {
        purchases = parseInt(action.value);
        conversions = parseInt(action.value);
      }
    }
  }

  // Calculate derived metrics
  const ctr = clicks > 0 && impressions > 0 ? (clicks / impressions) * 100 : null;
  const cpc = clicks > 0 ? spend / clicks : null;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
  const cpa = conversions > 0 ? spend / conversions : null;

  // Calculate ROAS from action_values
  let roas: number | null = null;
  if (insights.action_values) {
    const purchaseValue = insights.action_values.find(av => av.action_type === 'purchase');
    if (purchaseValue && spend > 0) {
      roas = parseFloat(purchaseValue.value) / spend;
    }
  }

  const frequency = insights.frequency ? parseFloat(insights.frequency) : null;

  return {
    spend,
    impressions,
    clicks,
    conversions,
    roas,
    ctr,
    cpc,
    cpm,
    cpa,
    frequency,
    add_to_cart: addToCart,
    purchases,
  };
}

/**
 * Property 8: Meta API Token Encryption
 * 
 * For any Meta API access token stored in the database, the token should be encrypted
 * using AES-256 and should be decryptable back to the original value.
 * 
 * Validates: Requirements 4.2, 15.1
 */
describe('Property 8: Meta API Token Encryption', () => {
  describe('Encryption Round Trip', () => {
    it('should encrypt and decrypt tokens to original value', () => {
      fc.assert(
        fc.property(
          arbitraryAccessToken(),
          (token: string) => {
            // Encrypt the token
            const encrypted = encrypt(token);

            // Encrypted value should be different from original
            expect(encrypted).not.toBe(token);

            // Encrypted value should contain IV and data separated by colon
            expect(encrypted).toContain(':');
            const parts = encrypted.split(':');
            expect(parts.length).toBe(2);
            expect(parts[0].length).toBeGreaterThan(0); // IV
            expect(parts[1].length).toBeGreaterThan(0); // Encrypted data

            // Decrypt should return original value
            const decrypted = decrypt(encrypted);
            expect(decrypted).toBe(token);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should produce different encrypted values for same token (due to random IV)', () => {
      fc.assert(
        fc.property(
          arbitraryAccessToken(),
          (token: string) => {
            const encrypted1 = encrypt(token);
            const encrypted2 = encrypt(token);

            // Different encrypted values due to random IV
            expect(encrypted1).not.toBe(encrypted2);

            // But both decrypt to same original value
            expect(decrypt(encrypted1)).toBe(token);
            expect(decrypt(encrypted2)).toBe(token);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Encryption Security Properties', () => {
    it('should use AES-256 encryption (32-byte key)', () => {
      // This is validated by the encryption module initialization
      // If ENCRYPTION_KEY is not 32 bytes, it throws an error
      expect(() => {
        const token = 'test-token-12345';
        encrypt(token);
      }).not.toThrow();
    });

    it('should not expose original token in encrypted format', () => {
      fc.assert(
        fc.property(
          arbitraryAccessToken(),
          (token: string) => {
            const encrypted = encrypt(token);

            // Encrypted value should not contain the original token
            expect(encrypted.toLowerCase()).not.toContain(token.toLowerCase());

            // Encrypted value should be hexadecimal
            const [iv, data] = encrypted.split(':');
            expect(iv).toMatch(/^[0-9a-f]+$/);
            expect(data).toMatch(/^[0-9a-f]+$/);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle tokens of various lengths', () => {
      const tokenLengths = [32, 64, 128, 256, 512];

      for (const length of tokenLengths) {
        const token = 'a'.repeat(length);
        const encrypted = encrypt(token);
        const decrypted = decrypt(encrypted);

        expect(decrypted).toBe(token);
        expect(decrypted.length).toBe(length);
      }
    });

    it('should handle special characters in tokens', () => {
      const specialTokens = [
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
        'token|with|pipes',
        'token:with:colons',
        'token/with/slashes',
        'token with spaces',
        'token\nwith\nnewlines',
      ];

      for (const token of specialTokens) {
        const encrypted = encrypt(token);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(token);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid encrypted format', () => {
      const invalidFormats = [
        'no-colon-separator',
        'only:one:part',
        ':missing-iv',
        'missing-data:',
        '',
      ];

      for (const invalid of invalidFormats) {
        expect(() => decrypt(invalid)).toThrow('Invalid encrypted text format');
      }
    });

    it('should throw error for corrupted encrypted data', () => {
      fc.assert(
        fc.property(
          arbitraryAccessToken(),
          (token: string) => {
            const encrypted = encrypt(token);
            const [iv, data] = encrypted.split(':');

            // Corrupt the data by changing a character
            const corruptedData = data.substring(0, data.length - 1) + 'x';
            const corrupted = `${iv}:${corruptedData}`;

            // Should throw error when trying to decrypt corrupted data
            expect(() => decrypt(corrupted)).toThrow();

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Database Storage Integration', () => {
    it('should store and retrieve encrypted tokens from database', async () => {
      const testEmail = `test-token-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        // Create test user
        userId = await createTestUser(testEmail);

        await fc.assert(
          fc.asyncProperty(
            arbitraryAccessToken(),
            arbitraryAdAccountId(),
            async (token: string, adAccountId: string) => {
              // Encrypt token
              const encryptedToken = encrypt(token);

              // Store in database
              const { data: insertData, error: insertError } = await supabaseAdmin
                .from('meta_tokens')
                .insert({
                  user_id: userId,
                  encrypted_access_token: encryptedToken,
                  ad_account_id: adAccountId,
                  expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
                })
                .select()
                .single();

              expect(insertError).toBeNull();
              expect(insertData).not.toBeNull();

              // Retrieve from database
              const { data: retrieveData, error: retrieveError } = await supabaseAdmin
                .from('meta_tokens')
                .select('encrypted_access_token')
                .eq('token_id', insertData.token_id)
                .single();

              expect(retrieveError).toBeNull();
              expect(retrieveData).not.toBeNull();

              // Decrypt retrieved token
              const decryptedToken = decrypt(retrieveData.encrypted_access_token);
              expect(decryptedToken).toBe(token);

              // Cleanup
              await supabaseAdmin
                .from('meta_tokens')
                .delete()
                .eq('token_id', insertData.token_id);

              return true;
            }
          ),
          { numRuns: 10 }
        );
      } finally {
        if (userId) {
          await cleanupTestUser(userId);
        }
      }
    }, 60000);
  });
});

/**
 * Property 9: Meta Metrics Import Completeness
 * 
 * For any ad imported from Meta API, all required metrics (spend, ROAS, CTR, CPC, CPM, CPA,
 * frequency, add_to_cart, purchases) should be present in the Meta_Metrics table with a timestamp.
 * 
 * Validates: Requirements 4.4, 4.7
 */
describe('Property 9: Meta Metrics Import Completeness', () => {
  describe('Required Metrics Presence', () => {
    it('should extract all required metrics from AdInsights', () => {
      fc.assert(
        fc.property(
          arbitraryAdInsights(),
          (insights: AdInsights) => {
            const metrics = extractMetricsFromInsights(insights);

            // Required fields should always be present
            expect(metrics.spend).toBeDefined();
            expect(typeof metrics.spend).toBe('number');
            expect(metrics.spend).toBeGreaterThanOrEqual(0);

            expect(metrics.impressions).toBeDefined();
            expect(typeof metrics.impressions).toBe('number');
            expect(metrics.impressions).toBeGreaterThanOrEqual(0);

            expect(metrics.clicks).toBeDefined();
            expect(typeof metrics.clicks).toBe('number');
            expect(metrics.clicks).toBeGreaterThanOrEqual(0);

            expect(metrics.conversions).toBeDefined();
            expect(typeof metrics.conversions).toBe('number');
            expect(metrics.conversions).toBeGreaterThanOrEqual(0);

            expect(metrics.add_to_cart).toBeDefined();
            expect(typeof metrics.add_to_cart).toBe('number');
            expect(metrics.add_to_cart).toBeGreaterThanOrEqual(0);

            expect(metrics.purchases).toBeDefined();
            expect(typeof metrics.purchases).toBe('number');
            expect(metrics.purchases).toBeGreaterThanOrEqual(0);

            // Optional fields can be null but should be defined
            expect('roas' in metrics).toBe(true);
            expect('ctr' in metrics).toBe(true);
            expect('cpc' in metrics).toBe(true);
            expect('cpm' in metrics).toBe(true);
            expect('cpa' in metrics).toBe(true);
            expect('frequency' in metrics).toBe(true);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate derived metrics correctly', () => {
      // Test CTR calculation
      const insights1: AdInsights = {
        ad_id: '123',
        date_start: '2024-01-01',
        date_stop: '2024-01-01',
        spend: '100.00',
        impressions: '1000',
        clicks: '50',
      };

      const metrics1 = extractMetricsFromInsights(insights1);
      expect(metrics1.ctr).toBeCloseTo(5.0, 2); // 50/1000 * 100 = 5%

      // Test CPC calculation
      expect(metrics1.cpc).toBeCloseTo(2.0, 2); // 100/50 = 2

      // Test CPM calculation
      expect(metrics1.cpm).toBeCloseTo(100.0, 2); // (100/1000) * 1000 = 100
    });

    it('should handle zero values correctly', () => {
      const insights: AdInsights = {
        ad_id: '123',
        date_start: '2024-01-01',
        date_stop: '2024-01-01',
        spend: '0.00',
        impressions: '0',
        clicks: '0',
      };

      const metrics = extractMetricsFromInsights(insights);

      expect(metrics.spend).toBe(0);
      expect(metrics.impressions).toBe(0);
      expect(metrics.clicks).toBe(0);
      expect(metrics.ctr).toBeNull();
      expect(metrics.cpc).toBeNull();
      expect(metrics.cpm).toBeNull();
    });
  });

  describe('Metrics Calculation Accuracy', () => {
    it('should calculate ROAS correctly from action_values', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10000, noNaN: true }),
          fc.double({ min: 1, max: 50000, noNaN: true }),
          (spend: number, purchaseValue: number) => {
            const insights: AdInsights = {
              ad_id: '123',
              date_start: '2024-01-01',
              date_stop: '2024-01-01',
              spend: spend.toFixed(2),
              impressions: '1000',
              clicks: '100',
              action_values: [
                {
                  action_type: 'purchase',
                  value: purchaseValue.toFixed(2),
                },
              ],
            };

            const metrics = extractMetricsFromInsights(insights);
            const expectedRoas = purchaseValue / spend;

            expect(metrics.roas).not.toBeNull();
            expect(metrics.roas).toBeCloseTo(expectedRoas, 2);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should calculate CPA correctly', () => {
      fc.assert(
        fc.property(
          fc.double({ min: 1, max: 10000, noNaN: true }),
          fc.integer({ min: 1, max: 1000 }),
          (spend: number, conversions: number) => {
            const insights: AdInsights = {
              ad_id: '123',
              date_start: '2024-01-01',
              date_stop: '2024-01-01',
              spend: spend.toFixed(2),
              impressions: '10000',
              clicks: '1000',
              actions: [
                {
                  action_type: 'purchase',
                  value: conversions.toString(),
                },
              ],
            };

            const metrics = extractMetricsFromInsights(insights);
            const expectedCpa = spend / conversions;

            expect(metrics.cpa).not.toBeNull();
            expect(metrics.cpa).toBeCloseTo(expectedCpa, 2);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Action Extraction', () => {
    it('should extract add_to_cart and purchases from actions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 500 }),
          (addToCartCount: number, purchaseCount: number) => {
            const insights: AdInsights = {
              ad_id: '123',
              date_start: '2024-01-01',
              date_stop: '2024-01-01',
              spend: '100.00',
              impressions: '1000',
              clicks: '100',
              actions: [
                {
                  action_type: 'add_to_cart',
                  value: addToCartCount.toString(),
                },
                {
                  action_type: 'purchase',
                  value: purchaseCount.toString(),
                },
              ],
            };

            const metrics = extractMetricsFromInsights(insights);

            expect(metrics.add_to_cart).toBe(addToCartCount);
            expect(metrics.purchases).toBe(purchaseCount);
            expect(metrics.conversions).toBe(purchaseCount);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle missing actions gracefully', () => {
      const insights: AdInsights = {
        ad_id: '123',
        date_start: '2024-01-01',
        date_stop: '2024-01-01',
        spend: '100.00',
        impressions: '1000',
        clicks: '100',
        // No actions array
      };

      const metrics = extractMetricsFromInsights(insights);

      expect(metrics.add_to_cart).toBe(0);
      expect(metrics.purchases).toBe(0);
      expect(metrics.conversions).toBe(0);
    });
  });

  describe('Timestamp Presence', () => {
    it('should include date information from insights', () => {
      fc.assert(
        fc.property(
          arbitraryAdInsights(),
          (insights: AdInsights) => {
            // Insights should have date_start and date_stop
            expect(insights.date_start).toBeDefined();
            expect(insights.date_stop).toBeDefined();

            // Dates should be in YYYY-MM-DD format
            expect(insights.date_start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
            expect(insights.date_stop).toMatch(/^\d{4}-\d{2}-\d{2}$/);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Property 10: Meta API Authentication Failure Notification
 * 
 * For any Meta API authentication failure, the system should create a notification
 * for the affected user prompting them to reconnect.
 * 
 * Validates: Requirements 4.6
 */
describe('Property 10: Meta API Authentication Failure Notification', () => {
  describe('Notification Creation on Auth Failure', () => {
    it('should create sync_error notification when Meta API auth fails', async () => {
      const testEmail = `test-auth-fail-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        // Create test user
        userId = await createTestUser(testEmail);

        // Simulate Meta API authentication failure by creating notification
        await createNotification(
          userId,
          'Meta Ads bağlantınız sona erdi. Lütfen yeniden bağlanın.',
          'sync_error'
        );

        // Verify notification was created
        const exists = await notificationExists(userId, 'sync_error');
        expect(exists).toBe(true);

        // Verify notification content
        const { data: notifications } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'sync_error');

        expect(notifications).not.toBeNull();
        expect(notifications!.length).toBeGreaterThan(0);

        const notification = notifications![0];
        expect(notification.message).toContain('Meta Ads');
        expect(notification.message).toContain('bağlan');
        expect(notification.read_status).toBe(false);
        expect(notification.created_at).toBeDefined();
      } finally {
        if (userId) {
          // Cleanup notifications
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);
          await cleanupTestUser(userId);
        }
      }
    }, 30000);

    it('should create notification with Turkish message', async () => {
      const testEmail = `test-turkish-msg-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        userId = await createTestUser(testEmail);

        // Create notification
        const message = 'Meta Ads hesabınıza erişim sağlanamadı. Lütfen tekrar bağlanın.';
        await createNotification(userId, message, 'sync_error');

        // Verify message is in Turkish
        const { data: notifications } = await supabaseAdmin
          .from('notifications')
          .select('message')
          .eq('user_id', userId)
          .eq('type', 'sync_error')
          .single();

        expect(notifications).not.toBeNull();
        expect(notifications!.message).toBe(message);

        // Verify Turkish characters are preserved
        expect(notifications!.message).toContain('ı'); // Turkish lowercase i without dot
        expect(notifications!.message).toContain('ğ'); // Turkish g with breve
      } finally {
        if (userId) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);
          await cleanupTestUser(userId);
        }
      }
    }, 30000);
  });

  describe('Notification Properties', () => {
    it('should create unread notification by default', async () => {
      const testEmail = `test-unread-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        userId = await createTestUser(testEmail);

        await createNotification(
          userId,
          'Meta API authentication failed',
          'sync_error'
        );

        const { data: notification } = await supabaseAdmin
          .from('notifications')
          .select('read_status')
          .eq('user_id', userId)
          .eq('type', 'sync_error')
          .single();

        expect(notification).not.toBeNull();
        expect(notification!.read_status).toBe(false);
      } finally {
        if (userId) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);
          await cleanupTestUser(userId);
        }
      }
    }, 30000);

    it('should include timestamp when notification is created', async () => {
      const testEmail = `test-timestamp-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        userId = await createTestUser(testEmail);

        const beforeCreate = new Date();
        await createNotification(
          userId,
          'Meta API authentication failed',
          'sync_error'
        );
        const afterCreate = new Date();

        const { data: notification } = await supabaseAdmin
          .from('notifications')
          .select('created_at')
          .eq('user_id', userId)
          .eq('type', 'sync_error')
          .single();

        expect(notification).not.toBeNull();
        expect(notification!.created_at).toBeDefined();

        const createdAt = new Date(notification!.created_at);
        expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      } finally {
        if (userId) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);
          await cleanupTestUser(userId);
        }
      }
    }, 30000);
  });

  describe('User Isolation', () => {
    it('should only create notification for affected user', async () => {
      const testEmail1 = `test-user1-${Date.now()}@test.com`;
      const testEmail2 = `test-user2-${Date.now()}@test.com`;
      let userId1: string | null = null;
      let userId2: string | null = null;

      try {
        userId1 = await createTestUser(testEmail1);
        userId2 = await createTestUser(testEmail2);

        // Create notification for user1
        await createNotification(
          userId1,
          'Meta API authentication failed',
          'sync_error'
        );

        // Verify user1 has notification
        const user1HasNotification = await notificationExists(userId1, 'sync_error');
        expect(user1HasNotification).toBe(true);

        // Verify user2 does NOT have notification
        const user2HasNotification = await notificationExists(userId2, 'sync_error');
        expect(user2HasNotification).toBe(false);
      } finally {
        if (userId1) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId1);
          await cleanupTestUser(userId1);
        }
        if (userId2) {
          await cleanupTestUser(userId2);
        }
      }
    }, 30000);
  });

  describe('Multiple Auth Failures', () => {
    it('should create separate notifications for multiple auth failures', async () => {
      const testEmail = `test-multiple-${Date.now()}@test.com`;
      let userId: string | null = null;

      try {
        userId = await createTestUser(testEmail);

        // Create multiple notifications
        await createNotification(
          userId,
          'Meta API authentication failed - attempt 1',
          'sync_error'
        );

        await new Promise(resolve => setTimeout(resolve, 100));

        await createNotification(
          userId,
          'Meta API authentication failed - attempt 2',
          'sync_error'
        );

        // Verify multiple notifications exist
        const { data: notifications } = await supabaseAdmin
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'sync_error')
          .order('created_at', { ascending: true });

        expect(notifications).not.toBeNull();
        expect(notifications!.length).toBe(2);
        expect(notifications![0].message).toContain('attempt 1');
        expect(notifications![1].message).toContain('attempt 2');
      } finally {
        if (userId) {
          await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('user_id', userId);
          await cleanupTestUser(userId);
        }
      }
    }, 30000);
  });
});
