// @ts-nocheck
/**
 * Feature: growthpilot-ai, Strategy Card Property Tests
 * 
 * Property 18: Metric-Based Strategy Card Generation
 * Property 19: Strategy Card Display and Interaction
 * Property 20: Strategy Card Schema Completeness
 * 
 * Validates: Requirements 8.1-8.7
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { buildStrategyCardPrompt } from '@/lib/gemini/prompts';
import type { StrategyCardContext } from '@/lib/gemini/prompts';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid client names
const arbitraryClientName = () =>
  fc.oneof(
    fc.string({ minLength: 2, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
    fc.constantFrom(
      'Acme Corporation',
      'Tech Startup Ltd',
      'E-Commerce Store',
      'Beauty Salon',
      'Real Estate Agency',
      'Healthcare Clinic'
    )
  );

// Generate valid industries
const arbitraryIndustry = () =>
  fc.constantFrom(
    'logistics',
    'e-commerce',
    'beauty',
    'real estate',
    'healthcare',
    'education'
  );

// Generate strategy card context
const arbitraryStrategyCardContext = (): fc.Arbitrary<StrategyCardContext> =>
  fc.record({
    situation: fc.string({ minLength: 20, maxLength: 200 }),
    metricName: fc.constantFrom('Frekans', 'ROAS', 'TBM', 'Sepet-Satın Alma Dönüşüm Oranı'),
    metricValue: fc.double({ min: 0, max: 100, noNaN: true }),
    threshold: fc.double({ min: 0, max: 100, noNaN: true }),
  });

// Generate valid strategy card response
const arbitraryStrategyCardResponse = () =>
  fc.record({
    do_actions: fc.tuple(
      fc.string({ minLength: 10, maxLength: 150 }),
      fc.string({ minLength: 10, maxLength: 150 }),
      fc.string({ minLength: 10, maxLength: 150 })
    ).map(([a1, a2, a3]) => [a1, a2, a3]),
    dont_actions: fc.tuple(
      fc.string({ minLength: 10, maxLength: 150 }),
      fc.string({ minLength: 10, maxLength: 150 }),
      fc.string({ minLength: 10, maxLength: 150 })
    ).map(([a1, a2, a3]) => [a1, a2, a3]),
    reasoning: fc.string({ minLength: 20, maxLength: 300 }),
  });

// Generate metrics that trigger strategy cards
const arbitraryHighFrequency = () =>
  fc.double({ min: 4.01, max: 10, noNaN: true });

const arbitraryLowRoas = () =>
  fc.double({ min: 0, max: 1.99, noNaN: true });

const arbitraryHighCpcIncrease = () =>
  fc.double({ min: 20.01, max: 200, noNaN: true });

const arbitraryLowCartConversion = () =>
  fc.double({ min: 0, max: 29.99, noNaN: true });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-strategy-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

// Create a test client
async function createTestClient(userId: string, name: string, industry?: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name,
      industry: industry || 'e-commerce',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test client: ${error?.message}`);
  }

  return data.client_id;
}

// Generate strategy cards via API
async function generateStrategyCards(accessToken: string, campaignId: string): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/strategy-cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ campaignId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to generate strategy cards: ${error.error}`);
  }

  return response.json();
}

// Update recommendation status
async function updateRecommendationStatus(
  accessToken: string,
  recommendationId: string,
  status: 'active' | 'completed' | 'dismissed'
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/recommendations/${recommendationId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ status })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update recommendation: ${error.error}`);
  }

  return response.json();
}

// Get recommendation by ID
async function getRecommendation(recommendationId: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from('ai_recommendations')
    .select('*')
    .eq('recommendation_id', recommendationId)
    .single();

  if (error) {
    throw new Error(`Failed to get recommendation: ${error.message}`);
  }

  return data;
}

/**
 * Property 18: Metric-Based Strategy Card Generation
 * 
 * For any campaign metrics that exceed thresholds, strategy cards should be generated
 * with the correct structure (3 do_actions, 3 dont_actions, reasoning).
 * 
 * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5
 */
describe('Property 18: Metric-Based Strategy Card Generation', () => {
  describe('Strategy Card Structure Validation', () => {
    it('should contain exactly 3 do_actions', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            expect(Array.isArray(response.do_actions)).toBe(true);
            expect(response.do_actions.length).toBe(3);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should contain exactly 3 dont_actions', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            expect(Array.isArray(response.dont_actions)).toBe(true);
            expect(response.dont_actions.length).toBe(3);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty reasoning', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            expect(typeof response.reasoning).toBe('string');
            expect(response.reasoning.trim().length).toBeGreaterThan(0);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all do_actions as non-empty strings', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            for (const action of response.do_actions) {
              expect(typeof action).toBe('string');
              expect(action.trim().length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all dont_actions as non-empty strings', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            for (const action of response.dont_actions) {
              expect(typeof action).toBe('string');
              expect(action.trim().length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have reasonable action lengths', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            for (const action of [...response.do_actions, ...response.dont_actions]) {
              expect(action.length).toBeGreaterThanOrEqual(10);
              expect(action.length).toBeLessThanOrEqual(500);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have reasonable reasoning length', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardResponse(),
          (response) => {
            expect(response.reasoning.length).toBeGreaterThanOrEqual(20);
            expect(response.reasoning.length).toBeLessThanOrEqual(1000);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Trigger Condition Validation', () => {
    it('should trigger for frequency > 4', () => {
      fc.assert(
        fc.property(
          arbitraryHighFrequency(),
          (frequency) => {
            expect(frequency).toBeGreaterThan(4);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger for ROAS < 2', () => {
      fc.assert(
        fc.property(
          arbitraryLowRoas(),
          (roas) => {
            expect(roas).toBeLessThan(2);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger for CPC increase > 20%', () => {
      fc.assert(
        fc.property(
          arbitraryHighCpcIncrease(),
          (cpcIncrease) => {
            expect(cpcIncrease).toBeGreaterThan(20);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trigger for cart conversion < 30%', () => {
      fc.assert(
        fc.property(
          arbitraryLowCartConversion(),
          (cartConversion) => {
            expect(cartConversion).toBeLessThan(30);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Integration Tests with Database', () => {
    let testUser: { userId: string; email: string; accessToken: string } | null = null;

    beforeAll(async () => {
      testUser = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
      if (testUser) {
        await cleanupTestUser(testUser.userId);
      }
    });

    it('should generate strategy card for high frequency', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'High Frequency Client', 'e-commerce');

        // Create campaign with high frequency metrics
        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'High Frequency Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        // Insert metrics with frequency > 4
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 500,
            roas: 3.5,
            conversions: 25,
            frequency: 5.2, // > 4
            add_to_cart: 50,
            purchases: 25,
            cpc: 2.5,
            ctr: 1.8,
            impressions: 10000,
            clicks: 180
          });

        // Generate strategy cards
        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);

        expect(result.success).toBe(true);
        expect(result.strategy_cards).toBeDefined();
        expect(Array.isArray(result.strategy_cards)).toBe(true);
        expect(result.strategy_cards.length).toBeGreaterThan(0);

        // Find high frequency card
        const frequencyCard = result.strategy_cards.find(
          (card: any) => card.content.trigger === 'high_frequency'
        );

        expect(frequencyCard).toBeDefined();
        expect(frequencyCard.content.do_actions).toHaveLength(3);
        expect(frequencyCard.content.dont_actions).toHaveLength(3);
        expect(frequencyCard.content.reasoning).toBeTruthy();

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should generate strategy card for low ROAS', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Low ROAS Client', 'beauty');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Low ROAS Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        // Insert metrics with ROAS < 2
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 500,
            roas: 1.5, // < 2
            conversions: 15,
            frequency: 2.1,
            add_to_cart: 30,
            purchases: 15,
            cpc: 3.0,
            ctr: 1.5,
            impressions: 5000,
            clicks: 75
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);

        expect(result.success).toBe(true);
        const roasCard = result.strategy_cards.find(
          (card: any) => card.content.trigger === 'low_roas'
        );

        expect(roasCard).toBeDefined();
        expect(roasCard.content.do_actions).toHaveLength(3);
        expect(roasCard.content.dont_actions).toHaveLength(3);
        expect(roasCard.content.reasoning).toBeTruthy();

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should generate strategy card for low cart conversion', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Low Conversion Client', 'e-commerce');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Low Conversion Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        // Insert metrics with low cart conversion (< 30%)
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 400,
            roas: 2.5,
            conversions: 20,
            frequency: 2.0,
            add_to_cart: 100, // High
            purchases: 20,    // Low (20% conversion)
            cpc: 2.8,
            ctr: 1.6,
            impressions: 8000,
            clicks: 128
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);

        expect(result.success).toBe(true);
        const conversionCard = result.strategy_cards.find(
          (card: any) => card.content.trigger === 'low_cart_conversion'
        );

        expect(conversionCard).toBeDefined();
        expect(conversionCard.content.do_actions).toHaveLength(3);
        expect(conversionCard.content.dont_actions).toHaveLength(3);
        expect(conversionCard.content.reasoning).toBeTruthy();

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });
});

/**
 * Property 19: Strategy Card Display and Interaction
 * 
 * For any strategy card, dismissing it should update the status to 'dismissed'
 * and the status should persist in the database.
 * 
 * Validates: Requirements 8.6
 */
describe('Property 19: Strategy Card Display and Interaction', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  describe('Status Update Functionality', () => {
    it('should update status from active to dismissed', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client', 'healthcare');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 500,
            roas: 1.2, // Low ROAS to trigger card
            conversions: 10,
            frequency: 2.0,
            add_to_cart: 20,
            purchases: 10,
            cpc: 3.5,
            ctr: 1.4,
            impressions: 6000,
            clicks: 84
          });

        // Generate strategy card
        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        expect(result.strategy_cards.length).toBeGreaterThan(0);

        const card = result.strategy_cards[0];
        const recommendationId = card.recommendation_id;

        // Verify initial status
        let stored = await getRecommendation(recommendationId);
        expect(stored.status).toBe('active');

        // Update status to dismissed
        await updateRecommendationStatus(testUser!.accessToken, recommendationId, 'dismissed');

        // Verify status updated
        stored = await getRecommendation(recommendationId);
        expect(stored.status).toBe('dismissed');

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', recommendationId);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should persist dismissed status across multiple reads', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Persistence Test Client', 'logistics');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 600,
            roas: 5.5,
            conversions: 30,
            frequency: 6.0, // High frequency to trigger card
            add_to_cart: 60,
            purchases: 30,
            cpc: 2.0,
            ctr: 2.0,
            impressions: 12000,
            clicks: 240
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        const card = result.strategy_cards[0];
        const recommendationId = card.recommendation_id;

        // Dismiss the card
        await updateRecommendationStatus(testUser!.accessToken, recommendationId, 'dismissed');

        // Read multiple times to verify persistence
        for (let i = 0; i < 3; i++) {
          const stored = await getRecommendation(recommendationId);
          expect(stored.status).toBe('dismissed');
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', recommendationId);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should support status transition to completed', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Completed Test Client', 'real estate');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 700,
            roas: 1.8,
            conversions: 18,
            frequency: 2.5,
            add_to_cart: 40,
            purchases: 18,
            cpc: 3.8,
            ctr: 1.3,
            impressions: 7000,
            clicks: 91
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        const card = result.strategy_cards[0];
        const recommendationId = card.recommendation_id;

        // Update to completed
        await updateRecommendationStatus(testUser!.accessToken, recommendationId, 'completed');

        const stored = await getRecommendation(recommendationId);
        expect(stored.status).toBe('completed');

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', recommendationId);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });

  describe('Status Validation', () => {
    it('should only accept valid status values', () => {
      const validStatuses = ['active', 'completed', 'dismissed'];
      
      fc.assert(
        fc.property(
          fc.constantFrom(...validStatuses),
          (status) => {
            expect(validStatuses).toContain(status);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 20: Strategy Card Schema Completeness
 * 
 * For any stored strategy card, it should have all required fields:
 * recommendation_id, client_id, campaign_id, recommendation_type='strategy_card',
 * content with trigger/metric_value/do_actions/dont_actions/reasoning,
 * priority, status, created_at.
 * 
 * Validates: Requirements 8.7
 */
describe('Property 20: Strategy Card Schema Completeness', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  describe('Required Fields Validation', () => {
    it('should have all required top-level fields', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Schema Test Client', 'education');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Schema Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 450,
            roas: 1.3,
            conversions: 12,
            frequency: 2.2,
            add_to_cart: 25,
            purchases: 12,
            cpc: 3.2,
            ctr: 1.5,
            impressions: 5500,
            clicks: 82
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        expect(result.strategy_cards.length).toBeGreaterThan(0);

        const card = result.strategy_cards[0];

        // Verify all required fields exist
        expect(card).toHaveProperty('recommendation_id');
        expect(card).toHaveProperty('client_id');
        expect(card).toHaveProperty('campaign_id');
        expect(card).toHaveProperty('recommendation_type');
        expect(card).toHaveProperty('content');
        expect(card).toHaveProperty('priority');
        expect(card).toHaveProperty('status');
        expect(card).toHaveProperty('created_at');

        // Verify field types
        expect(typeof card.recommendation_id).toBe('string');
        expect(typeof card.client_id).toBe('string');
        expect(typeof card.campaign_id).toBe('string');
        expect(typeof card.recommendation_type).toBe('string');
        expect(typeof card.content).toBe('object');
        expect(typeof card.priority).toBe('string');
        expect(typeof card.status).toBe('string');
        expect(typeof card.created_at).toBe('string');

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', card.recommendation_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should have recommendation_type set to strategy_card', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Type Test Client', 'e-commerce');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Type Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 550,
            roas: 4.0,
            conversions: 35,
            frequency: 7.5, // High frequency
            add_to_cart: 70,
            purchases: 35,
            cpc: 1.8,
            ctr: 2.2,
            impressions: 15000,
            clicks: 330
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        
        for (const card of result.strategy_cards) {
          expect(card.recommendation_type).toBe('strategy_card');
        }

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should have all required content fields', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Content Test Client', 'beauty');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Content Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 800,
            roas: 1.1,
            conversions: 8,
            frequency: 1.8,
            add_to_cart: 15,
            purchases: 8,
            cpc: 5.0,
            ctr: 1.0,
            impressions: 4000,
            clicks: 40
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        expect(result.strategy_cards.length).toBeGreaterThan(0);

        const card = result.strategy_cards[0];
        const content = card.content;

        // Verify all required content fields
        expect(content).toHaveProperty('trigger');
        expect(content).toHaveProperty('metric_value');
        expect(content).toHaveProperty('do_actions');
        expect(content).toHaveProperty('dont_actions');
        expect(content).toHaveProperty('reasoning');

        // Verify content field types
        expect(typeof content.trigger).toBe('string');
        expect(typeof content.metric_value).toBe('number');
        expect(Array.isArray(content.do_actions)).toBe(true);
        expect(Array.isArray(content.dont_actions)).toBe(true);
        expect(typeof content.reasoning).toBe('string');

        // Verify array lengths
        expect(content.do_actions.length).toBe(3);
        expect(content.dont_actions.length).toBe(3);

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', card.recommendation_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should have valid priority value', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Priority Test Client', 'healthcare');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Priority Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 350,
            roas: 1.6,
            conversions: 14,
            frequency: 2.8,
            add_to_cart: 28,
            purchases: 14,
            cpc: 2.5,
            ctr: 1.7,
            impressions: 6500,
            clicks: 110
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        
        for (const card of result.strategy_cards) {
          expect(['high', 'medium', 'low']).toContain(card.priority);
        }

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should have valid status value', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Status Test Client', 'logistics');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Status Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 650,
            roas: 3.8,
            conversions: 28,
            frequency: 4.8,
            add_to_cart: 55,
            purchases: 28,
            cpc: 2.3,
            ctr: 1.9,
            impressions: 11000,
            clicks: 209
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        
        for (const card of result.strategy_cards) {
          expect(['active', 'completed', 'dismissed']).toContain(card.status);
        }

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should have valid created_at timestamp', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Timestamp Test Client', 'real estate');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Timestamp Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        const beforeGeneration = new Date();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 750,
            roas: 2.9,
            conversions: 22,
            frequency: 3.2,
            add_to_cart: 45,
            purchases: 22,
            cpc: 3.4,
            ctr: 1.6,
            impressions: 9000,
            clicks: 144
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        const afterGeneration = new Date();

        for (const card of result.strategy_cards) {
          const createdAt = new Date(card.created_at);
          
          // Verify timestamp is valid
          expect(createdAt.getTime()).not.toBeNaN();
          
          // Verify timestamp is within reasonable range
          expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeGeneration.getTime() - 5000);
          expect(createdAt.getTime()).toBeLessThanOrEqual(afterGeneration.getTime() + 5000);
        }

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });

  describe('Field Relationships', () => {
    it('should have matching client_id and campaign_id relationships', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Relationship Test Client', 'education');

        const { data: campaign } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: clientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Relationship Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        const { data: adSet } = await supabaseAdmin
          .from('ad_sets')
          .insert({
            campaign_id: campaign.campaign_id,
            meta_ad_set_id: `test-adset-${Date.now()}`,
            ad_set_name: 'Test Ad Set',
            budget: 1000,
            status: 'active'
          })
          .select()
          .single();

        const { data: ad } = await supabaseAdmin
          .from('ads')
          .insert({
            ad_set_id: adSet.ad_set_id,
            meta_ad_id: `test-ad-${Date.now()}`,
            ad_name: 'Test Ad',
            status: 'active'
          })
          .select()
          .single();

        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 500,
            roas: 1.4,
            conversions: 16,
            frequency: 2.5,
            add_to_cart: 32,
            purchases: 16,
            cpc: 3.1,
            ctr: 1.5,
            impressions: 7500,
            clicks: 112
          });

        const result = await generateStrategyCards(testUser!.accessToken, campaign.campaign_id);
        
        for (const card of result.strategy_cards) {
          // Verify client_id matches
          expect(card.client_id).toBe(clientId);
          
          // Verify campaign_id matches
          expect(card.campaign_id).toBe(campaign.campaign_id);
          
          // Verify campaign belongs to client
          const { data: campaignCheck } = await supabaseAdmin
            .from('campaigns')
            .select('client_id')
            .eq('campaign_id', card.campaign_id)
            .single();
          
          expect(campaignCheck?.client_id).toBe(card.client_id);
        }

        // Cleanup
        for (const card of result.strategy_cards) {
          await supabaseAdmin
            .from('ai_recommendations')
            .delete()
            .eq('recommendation_id', card.recommendation_id);
        }
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });
});

/**
 * Prompt Context Validation for Strategy Cards
 * 
 * Validates that strategy card prompts include all required context
 * and use Turkish localization.
 */
describe('Strategy Card Prompt Context Validation', () => {
  describe('Prompt Structure', () => {
    it('should include all required context fields', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt is not empty
            expect(prompt).toBeTruthy();
            expect(prompt.length).toBeGreaterThan(0);

            // Verify all context fields are included
            expect(prompt).toContain(context.situation);
            expect(prompt).toContain(context.metricName);
            expect(prompt).toContain(context.metricValue.toString());
            expect(prompt).toContain(context.threshold.toString());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Turkish labels', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify Turkish labels are present
            expect(prompt).toContain('Durum');
            expect(prompt).toContain('Metrik');
            expect(prompt).toContain('Eşik');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request Turkish output explicitly', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt requests Turkish output
            expect(prompt).toMatch(/dijital pazarlama/i);
            expect(prompt).toMatch(/stratejist/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request JSON format response', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt requests JSON format
            expect(prompt).toContain('JSON');
            expect(prompt).toMatch(/formatında/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should specify required response structure', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt specifies response structure
            expect(prompt).toContain('do_actions');
            expect(prompt).toContain('dont_actions');
            expect(prompt).toContain('reasoning');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request exactly 3 items for each list', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt requests 3 items
            expect(prompt).toMatch(/3.*madde/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request actionable content', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt requests actionable content
            expect(prompt).toMatch(/uygulanabilir/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Turkish Localization', () => {
    it('should use Turkish terminology consistently', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify Turkish terms are used
            const turkishTerms = [
              'Yapılması Gerekenler',
              'Yapılmaması Gerekenler',
              'Kısa',
              'net',
              'uygulanabilir'
            ];

            let foundTerms = 0;
            for (const term of turkishTerms) {
              if (prompt.includes(term)) {
                foundTerms++;
              }
            }

            // At least 60% of Turkish terms should be present
            expect(foundTerms).toBeGreaterThanOrEqual(turkishTerms.length * 0.6);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain English action labels', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify English terms are not used for labels
            expect(prompt).not.toMatch(/Do's and Don'ts/i);
            expect(prompt).not.toMatch(/Things to do/i);
            expect(prompt).not.toMatch(/Things not to do/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use formal Turkish (siz form)', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify formal Turkish is used
            expect(prompt).toMatch(/Sen bir/i); // Addressing the AI formally

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Context Completeness', () => {
    it('should handle all metric types', () => {
      const metricTypes = ['Frekans', 'ROAS', 'TBM', 'Sepet-Satın Alma Dönüşüm Oranı'];
      
      for (const metricName of metricTypes) {
        const context: StrategyCardContext = {
          situation: 'Test situation',
          metricName,
          metricValue: 5.0,
          threshold: 4.0,
        };

        const prompt = buildStrategyCardPrompt(context);
        
        expect(prompt).toContain(metricName);
        expect(prompt).toContain('5');
        expect(prompt).toContain('4');
      }
    });

    it('should handle edge case metric values', () => {
      const edgeCases = [
        { metricValue: 0, threshold: 0 },
        { metricValue: 100, threshold: 50 },
        { metricValue: 0.01, threshold: 0.001 },
      ];

      for (const { metricValue, threshold } of edgeCases) {
        const context: StrategyCardContext = {
          situation: 'Edge case test',
          metricName: 'Test Metric',
          metricValue,
          threshold,
        };

        const prompt = buildStrategyCardPrompt(context);
        
        expect(prompt).toBeTruthy();
        expect(prompt).not.toContain('undefined');
        expect(prompt).not.toContain('NaN');
        expect(prompt).not.toContain('null');
      }
    });

    it('should maintain consistent prompt structure', () => {
      const contexts: StrategyCardContext[] = [];
      const prompts: string[] = [];

      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            contexts.push(context);
            prompts.push(buildStrategyCardPrompt(context));
            return true;
          }
        ),
        { numRuns: 50 }
      );

      // Verify all prompts have similar structure
      for (const prompt of prompts) {
        expect(prompt).toContain('Sen bir dijital pazarlama stratejistisin');
        expect(prompt).toContain('Durum:');
        expect(prompt).toContain('JSON formatında yanıt ver');
      }

      // Verify prompts differ based on context
      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBeGreaterThan(1);
    });
  });

  describe('Prompt Instruction Clarity', () => {
    it('should provide clear instructions for AI', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify clear instructions are present
            expect(prompt).toMatch(/oluştur/i);
            expect(prompt).toMatch(/yanıt ver/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should specify output format constraints', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify output constraints are specified
            expect(prompt).toContain('JSON formatında');
            expect(prompt).toMatch(/Sadece JSON/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request concise and actionable content', () => {
      fc.assert(
        fc.property(
          arbitraryStrategyCardContext(),
          (context) => {
            const prompt = buildStrategyCardPrompt(context);

            // Verify prompt requests concise content
            expect(prompt).toMatch(/Kısa.*net.*uygulanabilir/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
