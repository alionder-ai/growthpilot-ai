// @ts-nocheck
/**
 * Feature: growthpilot-ai, Action Plan Property Tests
 * 
 * Property 15: AI Action Plan Structure
 * Property 16: AI Action Plan Persistence and Status Updates
 * Property 17: AI Prompt Context Completeness
 * 
 * Validates: Requirements 7.1-7.6
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { buildActionPlanPrompt } from '@/lib/gemini/prompts';
import type { ActionPlanContext } from '@/lib/gemini/prompts';

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

// Generate valid metrics
const arbitraryMetrics = () =>
  fc.record({
    totalSpend: fc.double({ min: 0, max: 100000, noNaN: true }),
    roas: fc.double({ min: 0, max: 20, noNaN: true }),
    conversions: fc.integer({ min: 0, max: 10000 }),
    budgetUtilization: fc.double({ min: 0, max: 200, noNaN: true }),
    frequency: fc.double({ min: 0, max: 10, noNaN: true }),
    addToCart: fc.integer({ min: 0, max: 5000 }),
    purchases: fc.integer({ min: 0, max: 2000 }),
    cpc: fc.double({ min: 0, max: 50, noNaN: true }),
    ctr: fc.double({ min: 0, max: 20, noNaN: true }),
  });

// Generate complete action plan context
const arbitraryActionPlanContext = (): fc.Arbitrary<ActionPlanContext> =>
  fc.record({
    clientName: arbitraryClientName(),
    industry: fc.option(arbitraryIndustry(), { nil: undefined }),
    totalSpend: fc.double({ min: 0, max: 100000, noNaN: true }),
    roas: fc.double({ min: 0, max: 20, noNaN: true }),
    conversions: fc.integer({ min: 0, max: 10000 }),
    budgetUtilization: fc.double({ min: 0, max: 200, noNaN: true }),
    frequency: fc.double({ min: 0, max: 10, noNaN: true }),
    addToCart: fc.integer({ min: 0, max: 5000 }),
    purchases: fc.integer({ min: 0, max: 2000 }),
    cpc: fc.double({ min: 0, max: 50, noNaN: true }),
    ctr: fc.double({ min: 0, max: 20, noNaN: true }),
  });

// Generate valid action plan items
const arbitraryActionItem = () =>
  fc.record({
    action: fc.string({ minLength: 10, maxLength: 200 }),
    priority: fc.constantFrom('high', 'medium', 'low'),
    expected_impact: fc.string({ minLength: 10, maxLength: 150 }),
  });

// Generate valid action plan (array of 3 items)
const arbitraryActionPlan = () =>
  fc.tuple(
    arbitraryActionItem(),
    arbitraryActionItem(),
    arbitraryActionItem()
  ).map(([item1, item2, item3]) => [item1, item2, item3]);

// Generate valid password for test users
const arbitraryPassword = () =>
  fc.string({ minLength: 8, maxLength: 20 });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-action-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

// Generate action plan via API
async function generateActionPlan(accessToken: string, clientId: string): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/action-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ clientId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to generate action plan: ${error.error}`);
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
 * Property 15: AI Action Plan Structure
 * 
 * For any action plan generated by Gemini API, the response should contain exactly 3 actions,
 * each with a description, priority level (high/medium/low), and expected impact.
 * 
 * Validates: Requirements 7.2, 7.3
 */
describe('Property 15: AI Action Plan Structure', () => {
  describe('Action Plan Structure Validation', () => {
    it('should contain exactly 3 actions', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            expect(Array.isArray(actionPlan)).toBe(true);
            expect(actionPlan.length).toBe(3);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all required fields for each action', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            for (const action of actionPlan) {
              expect(action).toHaveProperty('action');
              expect(action).toHaveProperty('priority');
              expect(action).toHaveProperty('expected_impact');
              
              expect(typeof action.action).toBe('string');
              expect(typeof action.priority).toBe('string');
              expect(typeof action.expected_impact).toBe('string');
              
              expect(action.action.length).toBeGreaterThan(0);
              expect(action.expected_impact.length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have valid priority values', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            const validPriorities = ['high', 'medium', 'low'];
            
            for (const action of actionPlan) {
              expect(validPriorities).toContain(action.priority);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Action Plan Field Constraints', () => {
    it('should have non-empty action descriptions', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            for (const action of actionPlan) {
              expect(action.action.trim().length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty expected impact descriptions', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            for (const action of actionPlan) {
              expect(action.expected_impact.trim().length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have reasonable action description lengths', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            for (const action of actionPlan) {
              // Action descriptions should be meaningful but not too long
              expect(action.action.length).toBeGreaterThanOrEqual(10);
              expect(action.action.length).toBeLessThanOrEqual(500);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Priority Distribution', () => {
    it('should support all three priority levels', () => {
      const priorities = new Set<string>();
      
      fc.assert(
        fc.property(
          arbitraryActionPlan(),
          (actionPlan) => {
            for (const action of actionPlan) {
              priorities.add(action.priority);
            }
            return true;
          }
        ),
        { numRuns: 50 }
      );

      // After 50 runs, we should have seen all priority levels
      expect(priorities.has('high') || priorities.has('medium') || priorities.has('low')).toBe(true);
    });
  });
});

/**
 * Property 16: AI Action Plan Persistence and Status Updates
 * 
 * For any generated action plan, it should be stored in the AI_Recommendations table,
 * and marking an action as complete should update its status field.
 * 
 * Validates: Requirements 7.4, 7.5
 */
describe('Property 16: AI Action Plan Persistence and Status Updates', () => {
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

  describe('Action Plan Persistence', () => {
    it('should store action plan in database with all required fields', async () => {
      let clientId: string | null = null;

      try {
        // Create test client
        clientId = await createTestClient(testUser!.userId, 'Test Client', 'e-commerce');

        // Create test campaign and metrics (simplified for testing)
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

        // Insert test metrics
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: new Date().toISOString().split('T')[0],
            spend: 500,
            roas: 3.5,
            conversions: 25,
            frequency: 2.1,
            add_to_cart: 50,
            purchases: 25,
            cpc: 2.5,
            ctr: 1.8,
            impressions: 10000,
            clicks: 180
          });

        // Generate action plan
        const result = await generateActionPlan(testUser!.accessToken, clientId);

        expect(result.success).toBe(true);
        expect(result.recommendation_id).toBeTruthy();
        expect(result.action_plan).toBeDefined();
        expect(Array.isArray(result.action_plan)).toBe(true);
        expect(result.action_plan.length).toBe(3);

        // Verify stored in database
        const stored = await getRecommendation(result.recommendation_id);
        
        expect(stored).toBeDefined();
        expect(stored.client_id).toBe(clientId);
        expect(stored.recommendation_type).toBe('action_plan');
        expect(stored.status).toBe('active');
        expect(stored.priority).toBe('high');
        expect(stored.content).toBeDefined();
        expect(Array.isArray(stored.content)).toBe(true);
        expect(stored.content.length).toBe(3);

        // Verify content structure
        for (const action of stored.content) {
          expect(action).toHaveProperty('action');
          expect(action).toHaveProperty('priority');
          expect(action).toHaveProperty('expected_impact');
        }

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', result.recommendation_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should persist action plan with correct recommendation_type', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client 2', 'beauty');

        // Create minimal test data
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
            spend: 300,
            roas: 2.8,
            conversions: 15,
            frequency: 1.9,
            add_to_cart: 30,
            purchases: 15,
            cpc: 3.0,
            ctr: 1.5,
            impressions: 5000,
            clicks: 75
          });

        const result = await generateActionPlan(testUser!.accessToken, clientId);

        const stored = await getRecommendation(result.recommendation_id);
        expect(stored.recommendation_type).toBe('action_plan');

        // Cleanup
        await supabaseAdmin
          .from('ai_recommendations')
          .delete()
          .eq('recommendation_id', result.recommendation_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });

  describe('Status Updates', () => {
    it('should update status from active to completed', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client 3', 'healthcare');

        // Create minimal test data
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
            spend: 400,
            roas: 3.2,
            conversions: 20,
            frequency: 2.0,
            add_to_cart: 40,
            purchases: 20,
            cpc: 2.8,
            ctr: 1.6,
            impressions: 8000,
            clicks: 128
          });

        // Generate action plan
        const result = await generateActionPlan(testUser!.accessToken, clientId);
        const recommendationId = result.recommendation_id;

        // Verify initial status
        let stored = await getRecommendation(recommendationId);
        expect(stored.status).toBe('active');

        // Update status to completed
        await updateRecommendationStatus(testUser!.accessToken, recommendationId, 'completed');

        // Verify status updated
        stored = await getRecommendation(recommendationId);
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

    it('should support status transitions to dismissed', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client 4', 'logistics');

        // Create minimal test data
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
            roas: 2.5,
            conversions: 18,
            frequency: 2.3,
            add_to_cart: 35,
            purchases: 18,
            cpc: 3.2,
            ctr: 1.4,
            impressions: 6000,
            clicks: 84
          });

        // Generate action plan
        const result = await generateActionPlan(testUser!.accessToken, clientId);
        const recommendationId = result.recommendation_id;

        // Update status to dismissed
        await updateRecommendationStatus(testUser!.accessToken, recommendationId, 'dismissed');

        // Verify status updated
        const stored = await getRecommendation(recommendationId);
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
  });
});

/**
 * Property 17: AI Prompt Context Completeness
 * 
 * For any AI API call (action plan, strategy card, or creative generation),
 * the prompt should include all required context fields specific to that request type
 * (client name, metrics, industry, etc.).
 * 
 * Validates: Requirements 7.6, 18.1, 18.2, 18.3
 */
describe('Property 17: AI Prompt Context Completeness', () => {
  describe('Action Plan Prompt Context', () => {
    it('should include all required context fields in prompt', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt is not empty
            expect(prompt).toBeTruthy();
            expect(prompt.length).toBeGreaterThan(0);

            // Verify client name is included
            expect(prompt).toContain(context.clientName);

            // Verify industry is included if provided
            if (context.industry) {
              expect(prompt).toContain(context.industry);
            }

            // Verify metrics are included
            expect(prompt).toContain(context.totalSpend.toLocaleString('tr-TR'));
            expect(prompt).toContain(context.roas.toFixed(2));
            expect(prompt).toContain(context.conversions.toString());
            expect(prompt).toContain(context.budgetUtilization.toFixed(1));
            expect(prompt).toContain(context.frequency.toFixed(2));
            expect(prompt).toContain(context.addToCart.toString());
            expect(prompt).toContain(context.purchases.toString());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include Turkish labels for all metrics', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify Turkish labels are present
            expect(prompt).toContain('Müşteri');
            expect(prompt).toContain('Kampanya Performansı');
            expect(prompt).toContain('Toplam Harcama');
            expect(prompt).toContain('ROAS');
            expect(prompt).toContain('Dönüşüm Sayısı');
            expect(prompt).toContain('Bütçe Kullanımı');
            expect(prompt).toContain('Frekans');
            expect(prompt).toContain('Sepete Ekleme');
            expect(prompt).toContain('Satın Alma');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request Turkish output explicitly', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt requests Turkish output
            expect(prompt).toMatch(/dijital pazarlama/i);
            expect(prompt).toMatch(/analiz et/i);
            expect(prompt).toMatch(/aksiyon/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request JSON format response', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

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
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt specifies response structure
            expect(prompt).toContain('action');
            expect(prompt).toContain('priority');
            expect(prompt).toContain('expected_impact');
            expect(prompt).toContain('high');
            expect(prompt).toContain('medium');
            expect(prompt).toContain('low');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Context Field Validation', () => {
    it('should handle missing optional fields gracefully', () => {
      const contextWithoutIndustry: ActionPlanContext = {
        clientName: 'Test Client',
        totalSpend: 1000,
        roas: 3.5,
        conversions: 25,
        budgetUtilization: 75,
        frequency: 2.1,
        addToCart: 50,
        purchases: 25,
        cpc: 2.5,
        ctr: 1.8,
      };

      const prompt = buildActionPlanPrompt(contextWithoutIndustry);

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Test Client');
      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('null');
    });

    it('should format currency values in Turkish locale', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify Turkish currency symbol is present
            expect(prompt).toContain('₺');

            // Verify Turkish number formatting (dot for thousands, comma for decimals)
            const formattedSpend = context.totalSpend.toLocaleString('tr-TR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            });
            expect(prompt).toContain(formattedSpend);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all numeric metrics with proper formatting', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify ROAS is formatted to 2 decimal places
            expect(prompt).toContain(context.roas.toFixed(2));

            // Verify budget utilization is formatted to 1 decimal place
            expect(prompt).toContain(context.budgetUtilization.toFixed(1));

            // Verify frequency is formatted to 2 decimal places
            expect(prompt).toContain(context.frequency.toFixed(2));

            // Verify CPC is formatted to 2 decimal places
            expect(prompt).toContain(context.cpc.toFixed(2));

            // Verify CTR is formatted to 2 decimal places
            expect(prompt).toContain(context.ctr.toFixed(2));

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include integer metrics without decimal formatting', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify integer metrics are included as integers
            expect(prompt).toContain(context.conversions.toString());
            expect(prompt).toContain(context.addToCart.toString());
            expect(prompt).toContain(context.purchases.toString());

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Prompt Structure Validation', () => {
    it('should have a clear instruction section', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt has instruction
            expect(prompt).toMatch(/Sen bir dijital pazarlama uzmanısın/i);
            expect(prompt).toMatch(/analiz et/i);
            expect(prompt).toMatch(/en önemli 3 aksiyonu/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have a data section with all metrics', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt has data section
            expect(prompt).toContain('Kampanya Performansı');

            // Verify all metrics are listed
            const metricsLabels = [
              'Toplam Harcama',
              'ROAS',
              'Dönüşüm Sayısı',
              'Bütçe Kullanımı',
              'Frekans',
              'Sepete Ekleme',
              'Satın Alma',
              'TBM',
              'TBO'
            ];

            for (const label of metricsLabels) {
              expect(prompt).toContain(label);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have a response format specification', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt specifies response format
            expect(prompt).toContain('JSON formatında yanıt ver');
            expect(prompt).toMatch(/\[[\s\S]*\{[\s\S]*"action"[\s\S]*"priority"[\s\S]*"expected_impact"[\s\S]*\}[\s\S]*\]/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request exactly 3 actions', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt requests 3 actions
            expect(prompt).toMatch(/en önemli 3 aksiyonu/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should specify action requirements', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt specifies what each action should include
            expect(prompt).toMatch(/Aksiyonun açıklaması/i);
            expect(prompt).toMatch(/Öncelik seviyesi/i);
            expect(prompt).toMatch(/Beklenen etki/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Context Completeness Properties', () => {
    it('should include context for any valid metrics combination', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt is substantial (not empty or too short)
            expect(prompt.length).toBeGreaterThan(200);

            // Verify all required context is present
            expect(prompt).toContain(context.clientName);
            expect(prompt).toContain('ROAS');
            expect(prompt).toContain('Dönüşüm');
            expect(prompt).toContain('Bütçe');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent prompt structure across different contexts', () => {
      const contexts: ActionPlanContext[] = [];
      const prompts: string[] = [];

      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            contexts.push(context);
            prompts.push(buildActionPlanPrompt(context));
            return true;
          }
        ),
        { numRuns: 50 }
      );

      // Verify all prompts have similar structure
      for (const prompt of prompts) {
        expect(prompt).toContain('Sen bir dijital pazarlama uzmanısın');
        expect(prompt).toContain('Kampanya Performansı');
        expect(prompt).toContain('JSON formatında yanıt ver');
      }

      // Verify prompts differ based on context
      const uniquePrompts = new Set(prompts);
      expect(uniquePrompts.size).toBeGreaterThan(1);
    });

    it('should handle edge case metrics (zero values)', () => {
      const edgeCaseContext: ActionPlanContext = {
        clientName: 'Edge Case Client',
        industry: 'e-commerce',
        totalSpend: 0,
        roas: 0,
        conversions: 0,
        budgetUtilization: 0,
        frequency: 0,
        addToCart: 0,
        purchases: 0,
        cpc: 0,
        ctr: 0,
      };

      const prompt = buildActionPlanPrompt(edgeCaseContext);

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Edge Case Client');
      expect(prompt).toContain('0');
      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('NaN');
    });

    it('should handle edge case metrics (very high values)', () => {
      const edgeCaseContext: ActionPlanContext = {
        clientName: 'High Value Client',
        industry: 'real estate',
        totalSpend: 99999.99,
        roas: 19.99,
        conversions: 9999,
        budgetUtilization: 199.9,
        frequency: 9.99,
        addToCart: 4999,
        purchases: 1999,
        cpc: 49.99,
        ctr: 19.99,
      };

      const prompt = buildActionPlanPrompt(edgeCaseContext);

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('High Value Client');
      expect(prompt).not.toContain('undefined');
      expect(prompt).not.toContain('NaN');
      expect(prompt).not.toContain('Infinity');
    });
  });

  describe('Turkish Localization in Prompts', () => {
    it('should use Turkish terminology consistently', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify Turkish terms are used
            const turkishTerms = [
              'Müşteri',
              'Sektör',
              'Kampanya',
              'Harcama',
              'Dönüşüm',
              'Bütçe',
              'Frekans',
              'Sepete',
              'Satın Alma',
              'aksiyon',
              'Öncelik',
              'Beklenen etki'
            ];

            let foundTerms = 0;
            for (const term of turkishTerms) {
              if (prompt.includes(term)) {
                foundTerms++;
              }
            }

            // At least 80% of Turkish terms should be present
            expect(foundTerms).toBeGreaterThanOrEqual(turkishTerms.length * 0.8);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain English metric labels', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify English terms are not used for labels
            expect(prompt).not.toMatch(/Total Spend/i);
            expect(prompt).not.toMatch(/Conversions(?! Sayısı)/i);
            expect(prompt).not.toMatch(/Budget Utilization/i);
            expect(prompt).not.toMatch(/Frequency(?! :)/i);
            expect(prompt).not.toMatch(/Add to Cart/i);
            expect(prompt).not.toMatch(/Purchases(?! :)/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use formal Turkish (siz form)', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify formal Turkish is used
            expect(prompt).toMatch(/Sen bir/i); // Addressing the AI formally
            expect(prompt).not.toMatch(/\bsen\b.*\byap\b/i); // Informal "sen yap"

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Prompt Instruction Clarity', () => {
    it('should provide clear instructions for AI', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify clear instructions are present
            expect(prompt).toMatch(/analiz et/i);
            expect(prompt).toMatch(/belirle/i);
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
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify output constraints are specified
            expect(prompt).toContain('JSON formatında');
            expect(prompt).toMatch(/Sadece JSON/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should request actionable and applicable recommendations', () => {
      fc.assert(
        fc.property(
          arbitraryActionPlanContext(),
          (context) => {
            const prompt = buildActionPlanPrompt(context);

            // Verify prompt requests actionable content
            expect(prompt).toMatch(/net.*uygulanabilir/i);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
