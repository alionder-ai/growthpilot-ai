// @ts-nocheck
/**
 * Feature: growthpilot-ai, Lead Management Property Tests
 * 
 * Property 27: Lead Status Update and Persistence
 * Property 28: Lead Foreign Key Relationship
 * Property 29: Lead Conversion Rate Calculation
 * Property 30: Lead Quality in AI Context
 * 
 * Validates: Requirements 11.1-11.6
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

// Generate valid email addresses
const arbitraryEmail = () =>
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'test.com')
  ).map(([local, domain]: [string, string]) => `${local}@${domain}`);

// Generate boolean for conversion status
const arbitraryConversionStatus = () => fc.boolean();

// Generate lead source
const arbitraryLeadSource = () =>
  fc.constantFrom('facebook', 'instagram', 'website', 'landing_page', 'form');

// Generate contact info (JSONB)
const arbitraryContactInfo = () =>
  fc.record({
    email: fc.option(arbitraryEmail(), { nil: null }),
    phone: fc.option(
      fc.tuple(
        fc.constantFrom('+90', '+1'),
        fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 10, maxLength: 10 })
      ).map(([code, number]: [string, string]) => `${code}${number}`),
      { nil: null }
    ),
    name: fc.option(fc.string({ minLength: 2, maxLength: 50 }), { nil: null })
  });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-lead-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

// Create test client
async function createTestClient(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name: `Test Client ${Date.now()}`,
      industry: 'e-commerce'
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test client: ${error?.message}`);
  }

  return data.client_id;
}

// Create test campaign structure (client -> campaign -> ad_set -> ad)
async function createTestCampaignStructure(clientId: string): Promise<{
  campaignId: string;
  adSetId: string;
  adId: string;
}> {
  // Create campaign
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .insert({
      client_id: clientId,
      meta_campaign_id: `test-campaign-${Date.now()}`,
      campaign_name: `Test Campaign ${Date.now()}`,
      status: 'active'
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Failed to create test campaign: ${campaignError?.message}`);
  }

  // Create ad set
  const { data: adSet, error: adSetError } = await supabaseAdmin
    .from('ad_sets')
    .insert({
      campaign_id: campaign.campaign_id,
      meta_ad_set_id: `test-adset-${Date.now()}`,
      ad_set_name: `Test Ad Set ${Date.now()}`,
      budget: 1000,
      status: 'active'
    })
    .select()
    .single();

  if (adSetError || !adSet) {
    throw new Error(`Failed to create test ad set: ${adSetError?.message}`);
  }

  // Create ad
  const { data: ad, error: adError } = await supabaseAdmin
    .from('ads')
    .insert({
      ad_set_id: adSet.ad_set_id,
      meta_ad_id: `test-ad-${Date.now()}`,
      ad_name: `Test Ad ${Date.now()}`,
      status: 'active'
    })
    .select()
    .single();

  if (adError || !ad) {
    throw new Error(`Failed to create test ad: ${adError?.message}`);
  }

  return {
    campaignId: campaign.campaign_id,
    adSetId: adSet.ad_set_id,
    adId: ad.ad_id
  };
}

// Update lead status via API
async function updateLeadStatus(
  accessToken: string,
  leadId: string,
  convertedStatus: boolean
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leads/${leadId}/status`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ converted_status: convertedStatus })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update lead status: ${error.error}`);
  }

  return response.json();
}

// Get lead by ID from database
async function getLeadById(leadId: string): Promise<any> {
  const { data, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error) {
    throw new Error(`Failed to get lead: ${error.message}`);
  }

  return data;
}

// Get conversion rates via API
async function getConversionRates(
  accessToken: string,
  params: { ad_id?: string; campaign_id?: string }
): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params.ad_id) queryParams.append('ad_id', params.ad_id);
  if (params.campaign_id) queryParams.append('campaign_id', params.campaign_id);

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/leads/conversion-rates?${queryParams.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get conversion rates: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 27: Lead Status Update and Persistence
 * 
 * For any lead, toggling its conversion status should update the converted_status
 * field in the Leads table.
 * 
 * Validates: Requirements 11.1, 11.2
 */
describe('Property 27: Lead Status Update and Persistence', () => {
  let testUser: { userId: string; email: string; accessToken: string };
  let clientId: string;
  let adId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clientId = await createTestClient(testUser.userId);
    const structure = await createTestCampaignStructure(clientId);
    adId = structure.adId;
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should persist lead status updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryConversionStatus(),
        arbitraryLeadSource(),
        arbitraryContactInfo(),
        async (initialStatus, leadSource, contactInfo) => {
          let leadId: string | null = null;

          try {
            // Step 1: Create lead with initial status
            const { data: lead, error } = await supabaseAdmin
              .from('leads')
              .insert({
                ad_id: adId,
                lead_source: leadSource,
                contact_info: contactInfo,
                converted_status: initialStatus
              })
              .select()
              .single();

            if (error || !lead) {
              throw new Error(`Failed to create lead: ${error?.message}`);
            }

            leadId = lead.lead_id;

            // Step 2: Verify initial status
            const initialLead = await getLeadById(leadId);
            expect(initialLead.converted_status).toBe(initialStatus);

            // Step 3: Toggle status
            const newStatus = !initialStatus;
            const updateResponse = await updateLeadStatus(
              testUser.accessToken,
              leadId,
              newStatus
            );

            expect(updateResponse.lead).toBeDefined();
            expect(updateResponse.lead.converted_status).toBe(newStatus);

            // Step 4: Verify persistence by fetching from database
            const updatedLead = await getLeadById(leadId);
            expect(updatedLead.converted_status).toBe(newStatus);
            expect(updatedLead.updated_at).toBeTruthy();
            expect(new Date(updatedLead.updated_at).getTime()).toBeGreaterThan(
              new Date(updatedLead.created_at).getTime()
            );

            // Step 5: Toggle back to original status
            const finalUpdateResponse = await updateLeadStatus(
              testUser.accessToken,
              leadId,
              initialStatus
            );

            expect(finalUpdateResponse.lead.converted_status).toBe(initialStatus);

            // Verify final persistence
            const finalLead = await getLeadById(leadId);
            expect(finalLead.converted_status).toBe(initialStatus);

            // Cleanup
            await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);

            return true;
          } catch (error) {
            if (leadId) {
              try {
                await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
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
});

/**
 * Property 28: Lead Foreign Key Relationship
 * 
 * For any lead in the database, it should have a valid ad_id foreign key
 * linking it to a specific ad.
 * 
 * Validates: Requirements 11.3
 */
describe('Property 28: Lead Foreign Key Relationship', () => {
  let testUser: { userId: string; email: string; accessToken: string };
  let clientId: string;
  let adId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clientId = await createTestClient(testUser.userId);
    const structure = await createTestCampaignStructure(clientId);
    adId = structure.adId;
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should enforce valid ad_id foreign key constraint', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryConversionStatus(),
        arbitraryLeadSource(),
        arbitraryContactInfo(),
        async (convertedStatus, leadSource, contactInfo) => {
          let leadId: string | null = null;

          try {
            // Step 1: Create lead with valid ad_id
            const { data: lead, error } = await supabaseAdmin
              .from('leads')
              .insert({
                ad_id: adId,
                lead_source: leadSource,
                contact_info: contactInfo,
                converted_status: convertedStatus
              })
              .select()
              .single();

            if (error || !lead) {
              throw new Error(`Failed to create lead: ${error?.message}`);
            }

            leadId = lead.lead_id;

            // Step 2: Verify lead has valid ad_id
            expect(lead.ad_id).toBe(adId);

            // Step 3: Verify foreign key relationship by joining with ads table
            const { data: leadWithAd, error: joinError } = await supabaseAdmin
              .from('leads')
              .select(`
                lead_id,
                ad_id,
                ads!inner (
                  ad_id,
                  ad_name,
                  meta_ad_id
                )
              `)
              .eq('lead_id', leadId)
              .single();

            if (joinError) {
              throw new Error(`Failed to join lead with ad: ${joinError.message}`);
            }

            expect(leadWithAd).toBeDefined();
            expect(leadWithAd.ads).toBeDefined();
            expect(leadWithAd.ads.ad_id).toBe(adId);

            // Cleanup
            await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);

            return true;
          } catch (error) {
            if (leadId) {
              try {
                await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
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

  it('should reject leads with invalid ad_id', async () => {
    const invalidAdId = '00000000-0000-0000-0000-000000000000';

    // Attempt to create lead with non-existent ad_id
    const { data, error } = await supabaseAdmin
      .from('leads')
      .insert({
        ad_id: invalidAdId,
        lead_source: 'facebook',
        contact_info: { email: 'test@test.com' },
        converted_status: false
      })
      .select()
      .single();

    // Should fail due to foreign key constraint
    expect(error).toBeDefined();
    expect(data).toBeNull();
  }, 30000);
});

/**
 * Property 29: Lead Conversion Rate Calculation
 * 
 * For any ad with N leads where M are converted, the conversion rate should
 * equal M/N, and this should be correctly calculated and displayed per ad
 * and per campaign.
 * 
 * Validates: Requirements 11.4, 11.6
 */
describe('Property 29: Lead Conversion Rate Calculation', () => {
  let testUser: { userId: string; email: string; accessToken: string };
  let clientId: string;
  let campaignId: string;
  let adId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clientId = await createTestClient(testUser.userId);
    const structure = await createTestCampaignStructure(clientId);
    campaignId = structure.campaignId;
    adId = structure.adId;
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should calculate correct conversion rate for any N leads with M converted', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 20 }), // Total leads
        fc.integer({ min: 0, max: 20 }), // Converted leads
        async (totalLeads, convertedLeads) => {
          // Ensure convertedLeads <= totalLeads
          const actualConverted = Math.min(convertedLeads, totalLeads);
          const leadIds: string[] = [];

          try {
            // Step 1: Create N leads with M converted
            for (let i = 0; i < totalLeads; i++) {
              const isConverted = i < actualConverted;
              
              const { data: lead, error } = await supabaseAdmin
                .from('leads')
                .insert({
                  ad_id: adId,
                  lead_source: 'facebook',
                  contact_info: { email: `test${i}@test.com` },
                  converted_status: isConverted
                })
                .select()
                .single();

              if (error || !lead) {
                throw new Error(`Failed to create lead: ${error?.message}`);
              }

              leadIds.push(lead.lead_id);
            }

            // Step 2: Calculate expected conversion rate
            const expectedRate = totalLeads > 0 ? (actualConverted / totalLeads) * 100 : 0;

            // Step 3: Get conversion rate via API
            const response = await getConversionRates(testUser.accessToken, { ad_id: adId });

            expect(response.conversionRate).toBeDefined();
            expect(response.conversionRate.totalLeads).toBe(totalLeads);
            expect(response.conversionRate.convertedLeads).toBe(actualConverted);
            expect(response.conversionRate.conversionRate).toBeCloseTo(expectedRate, 1);

            // Step 4: Verify campaign-level aggregation
            const campaignResponse = await getConversionRates(
              testUser.accessToken,
              { campaign_id: campaignId }
            );

            expect(campaignResponse.conversionRate).toBeDefined();
            expect(campaignResponse.conversionRate.totalLeads).toBe(totalLeads);
            expect(campaignResponse.conversionRate.convertedLeads).toBe(actualConverted);
            expect(campaignResponse.conversionRate.conversionRate).toBeCloseTo(expectedRate, 1);

            // Cleanup
            for (const leadId of leadIds) {
              await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
            }

            return true;
          } catch (error) {
            // Cleanup on error
            for (const leadId of leadIds) {
              try {
                await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 15, timeout: 90000 }
    );
  }, 180000);

  it('should handle edge case: zero leads', async () => {
    // Create a new ad with no leads
    const { data: newClient } = await supabaseAdmin
      .from('clients')
      .insert({
        user_id: testUser.userId,
        name: 'Zero Leads Client',
        industry: 'technology'
      })
      .select()
      .single();

    const newStructure = await createTestCampaignStructure(newClient!.client_id);

    const response = await getConversionRates(testUser.accessToken, { ad_id: newStructure.adId });

    expect(response.conversionRate.totalLeads).toBe(0);
    expect(response.conversionRate.convertedLeads).toBe(0);
    expect(response.conversionRate.conversionRate).toBe(0);
  }, 30000);

  it('should handle edge case: 100% conversion rate', async () => {
    const leadIds: string[] = [];

    try {
      // Create 5 leads, all converted
      for (let i = 0; i < 5; i++) {
        const { data: lead } = await supabaseAdmin
          .from('leads')
          .insert({
            ad_id: adId,
            lead_source: 'facebook',
            contact_info: { email: `converted${i}@test.com` },
            converted_status: true
          })
          .select()
          .single();

        leadIds.push(lead!.lead_id);
      }

      const response = await getConversionRates(testUser.accessToken, { ad_id: adId });

      expect(response.conversionRate.totalLeads).toBe(5);
      expect(response.conversionRate.convertedLeads).toBe(5);
      expect(response.conversionRate.conversionRate).toBe(100);

      // Cleanup
      for (const leadId of leadIds) {
        await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
      }
    } catch (error) {
      for (const leadId of leadIds) {
        try {
          await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
      throw error;
    }
  }, 30000);
});

/**
 * Property 30: Lead Quality in AI Context
 * 
 * For any AI recommendation generation (action plan or strategy card), if lead
 * quality feedback data exists for the relevant campaigns, it should be included
 * in the prompt context.
 * 
 * Validates: Requirements 11.5
 */
describe('Property 30: Lead Quality in AI Context', () => {
  let testUser: { userId: string; email: string; accessToken: string };
  let clientId: string;
  let campaignId: string;
  let adId: string;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    clientId = await createTestClient(testUser.userId);
    const structure = await createTestCampaignStructure(clientId);
    campaignId = structure.campaignId;
    adId = structure.adId;
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should include lead quality data in action plan prompt when leads exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 15 }), // Total leads
        fc.float({ min: 0, max: 1 }), // Conversion rate (0-100%)
        async (totalLeads, conversionRatio) => {
          const convertedLeads = Math.floor(totalLeads * conversionRatio);
          const leadIds: string[] = [];

          try {
            // Step 1: Create leads with specific conversion rate
            for (let i = 0; i < totalLeads; i++) {
              const isConverted = i < convertedLeads;
              
              const { data: lead } = await supabaseAdmin
                .from('leads')
                .insert({
                  ad_id: adId,
                  lead_source: 'facebook',
                  contact_info: { email: `ai-test${i}@test.com` },
                  converted_status: isConverted
                })
                .select()
                .single();

              leadIds.push(lead!.lead_id);
            }

            // Step 2: Import prompt builder to verify context
            const { buildActionPlanPrompt, buildStrategyCardPrompt } = await import('@/lib/gemini/prompts');

            // Step 3: Build action plan prompt with lead quality
            const actionPlanContext = {
              clientName: 'Test Client',
              industry: 'e-commerce',
              totalSpend: 5000,
              roas: 2.5,
              conversions: 50,
              budgetUtilization: 80,
              frequency: 3.2,
              addToCart: 100,
              purchases: 50,
              cpc: 1.5,
              ctr: 2.3,
              leadQuality: {
                totalLeads,
                convertedLeads,
                conversionRate: (convertedLeads / totalLeads) * 100
              }
            };

            const actionPlanPrompt = buildActionPlanPrompt(actionPlanContext);

            // Step 4: Verify lead quality is included in prompt
            expect(actionPlanPrompt).toContain('Lead Kalitesi');
            expect(actionPlanPrompt).toContain(`${totalLeads} potansiyel müşteri`);
            expect(actionPlanPrompt).toContain(`${convertedLeads} tanesi dönüşüm`);
            expect(actionPlanPrompt).toContain('Dönüşüm Oranı');

            // Step 5: Build strategy card prompt with lead quality
            const strategyCardContext = {
              situation: 'Yüksek frekans',
              metricName: 'Frekans',
              metricValue: 5.2,
              threshold: 4.0,
              leadQuality: {
                totalLeads,
                convertedLeads,
                conversionRate: (convertedLeads / totalLeads) * 100
              }
            };

            const strategyCardPrompt = buildStrategyCardPrompt(strategyCardContext);

            // Step 6: Verify lead quality is included in strategy card prompt
            expect(strategyCardPrompt).toContain('Lead Kalitesi');
            expect(strategyCardPrompt).toContain(`${totalLeads} potansiyel müşteri`);
            expect(strategyCardPrompt).toContain(`${convertedLeads} tanesi dönüşüm`);

            // Cleanup
            for (const leadId of leadIds) {
              await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
            }

            return true;
          } catch (error) {
            // Cleanup on error
            for (const leadId of leadIds) {
              try {
                await supabaseAdmin.from('leads').delete().eq('lead_id', leadId);
              } catch (cleanupError) {
                // Ignore cleanup errors
              }
            }
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 60000 }
    );
  }, 120000);

  it('should handle AI prompts when no lead data exists', async () => {
    const { buildActionPlanPrompt, buildStrategyCardPrompt } = await import('@/lib/gemini/prompts');

    // Action plan without lead quality
    const actionPlanContext = {
      clientName: 'Test Client',
      industry: 'e-commerce',
      totalSpend: 5000,
      roas: 2.5,
      conversions: 50,
      budgetUtilization: 80,
      frequency: 3.2,
      addToCart: 100,
      purchases: 50,
      cpc: 1.5,
      ctr: 2.3
      // No leadQuality field
    };

    const actionPlanPrompt = buildActionPlanPrompt(actionPlanContext);

    // Should not contain lead quality text
    expect(actionPlanPrompt).not.toContain('Lead Kalitesi');

    // Strategy card without lead quality
    const strategyCardContext = {
      situation: 'Yüksek frekans',
      metricName: 'Frekans',
      metricValue: 5.2,
      threshold: 4.0
      // No leadQuality field
    };

    const strategyCardPrompt = buildStrategyCardPrompt(strategyCardContext);

    // Should not contain lead quality text
    expect(strategyCardPrompt).not.toContain('Lead Kalitesi');
  }, 10000);

  it('should provide actionable recommendations when conversion rate is low', async () => {
    const { buildActionPlanPrompt } = await import('@/lib/gemini/prompts');

    // Low conversion rate scenario
    const lowConversionContext = {
      clientName: 'Test Client',
      industry: 'e-commerce',
      totalSpend: 5000,
      roas: 1.8,
      conversions: 20,
      budgetUtilization: 90,
      frequency: 4.5,
      addToCart: 150,
      purchases: 20,
      cpc: 2.5,
      ctr: 1.8,
      leadQuality: {
        totalLeads: 100,
        convertedLeads: 5,
        conversionRate: 5.0 // Very low conversion rate
      }
    };

    const prompt = buildActionPlanPrompt(lowConversionContext);

    // Verify prompt includes guidance for low conversion
    expect(prompt).toContain('Lead kalite verilerini dikkate alarak');
    expect(prompt).toContain('düşük dönüşüm oranı');
    expect(prompt).toContain('hedef kitle');
    expect(prompt).toContain('reklam kreatifleri');
  }, 10000);
});
