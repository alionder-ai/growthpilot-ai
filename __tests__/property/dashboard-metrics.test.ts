// @ts-nocheck
/**
 * Feature: growthpilot-ai, Dashboard Metrics Property Tests
 * 
 * Property 13: Financial Metrics Calculation Accuracy
 * Property 14: Dashboard Client Filtering
 * 
 * Validates: Requirements 6.1-6.7
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { calculateCommission } from '@/lib/utils/commission';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid spend amounts
const arbitrarySpend = () =>
  fc.double({ min: 0, max: 100000, noNaN: true });

// Generate valid metric counts
const arbitraryMetricCount = () =>
  fc.integer({ min: 0, max: 10000 });

// Generate valid commission percentage
const arbitraryCommissionPercentage = () =>
  fc.double({ min: 0, max: 100, noNaN: true });

// Generate calculation basis
const arbitraryCalculationBasis = () =>
  fc.constantFrom('sales_revenue', 'total_revenue');

// Generate date within current month
const arbitraryDateThisMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return fc.date({ min: startOfMonth, max: endOfMonth })
    .map(d => d.toISOString().split('T')[0]);
};

// Generate date for today
const arbitraryDateToday = () => {
  const today = new Date();
  return fc.constant(today.toISOString().split('T')[0]);
};


// Generate metrics data
const arbitraryMetricsData = () =>
  fc.record({
    spend: arbitrarySpend(),
    impressions: arbitraryMetricCount(),
    clicks: arbitraryMetricCount(),
    conversions: arbitraryMetricCount(),
    purchases: arbitraryMetricCount(),
    date: arbitraryDateThisMonth()
  });

// Generate client with commission model
const arbitraryClientWithCommission = () =>
  fc.record({
    name: fc.string({ minLength: 2, maxLength: 50 }),
    industry: fc.constantFrom('logistics', 'e-commerce', 'beauty', 'real estate', 'healthcare', 'education'),
    commission_percentage: arbitraryCommissionPercentage(),
    calculation_basis: arbitraryCalculationBasis()
  });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-metrics-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

// Create client with commission model
async function createClientWithCommission(
  userId: string,
  clientData: { name: string; industry: string; commission_percentage: number; calculation_basis: string }
): Promise<{ clientId: string; commissionModelId: string }> {
  // Create client
  const { data: client, error: clientError } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name: clientData.name,
      industry: clientData.industry
    })
    .select()
    .single();

  if (clientError || !client) {
    throw new Error(`Failed to create client: ${clientError?.message}`);
  }

  // Create commission model
  const { data: commissionModel, error: commissionError } = await supabaseAdmin
    .from('commission_models')
    .insert({
      client_id: client.client_id,
      commission_percentage: clientData.commission_percentage,
      calculation_basis: clientData.calculation_basis
    })
    .select()
    .single();

  if (commissionError || !commissionModel) {
    throw new Error(`Failed to create commission model: ${commissionError?.message}`);
  }

  return {
    clientId: client.client_id,
    commissionModelId: commissionModel.model_id
  };
}

// Create campaign structure (campaign -> ad_set -> ad)
async function createCampaignStructure(
  clientId: string
): Promise<{ campaignId: string; adSetId: string; adId: string }> {
  // Create campaign
  const { data: campaign, error: campaignError } = await supabaseAdmin
    .from('campaigns')
    .insert({
      client_id: clientId,
      meta_campaign_id: `test-campaign-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      campaign_name: 'Test Campaign',
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    throw new Error(`Failed to create campaign: ${campaignError?.message}`);
  }

  // Create ad set
  const { data: adSet, error: adSetError } = await supabaseAdmin
    .from('ad_sets')
    .insert({
      campaign_id: campaign.campaign_id,
      meta_ad_set_id: `test-adset-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ad_set_name: 'Test Ad Set',
      budget: 1000,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (adSetError || !adSet) {
    throw new Error(`Failed to create ad set: ${adSetError?.message}`);
  }

  // Create ad
  const { data: ad, error: adError } = await supabaseAdmin
    .from('ads')
    .insert({
      ad_set_id: adSet.ad_set_id,
      meta_ad_id: `test-ad-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      ad_name: 'Test Ad',
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (adError || !ad) {
    throw new Error(`Failed to create ad: ${adError?.message}`);
  }

  return {
    campaignId: campaign.campaign_id,
    adSetId: adSet.ad_set_id,
    adId: ad.ad_id
  };
}

// Create metrics for an ad
async function createMetrics(
  adId: string,
  metricsData: { spend: number; impressions: number; clicks: number; conversions: number; purchases: number; date: string }
): Promise<string> {
  const { data: metrics, error: metricsError } = await supabaseAdmin
    .from('meta_metrics')
    .insert({
      ad_id: adId,
      date: metricsData.date,
      spend: metricsData.spend,
      impressions: metricsData.impressions,
      clicks: metricsData.clicks,
      conversions: metricsData.conversions,
      purchases: metricsData.purchases,
      roas: metricsData.conversions > 0 ? (metricsData.conversions * 100) / metricsData.spend : 0,
      ctr: metricsData.impressions > 0 ? (metricsData.clicks / metricsData.impressions) * 100 : 0,
      cpc: metricsData.clicks > 0 ? metricsData.spend / metricsData.clicks : 0,
      cpm: metricsData.impressions > 0 ? (metricsData.spend / metricsData.impressions) * 1000 : 0,
      cpa: metricsData.conversions > 0 ? metricsData.spend / metricsData.conversions : 0
    })
    .select()
    .single();

  if (metricsError || !metrics) {
    throw new Error(`Failed to create metrics: ${metricsError?.message}`);
  }

  return metrics.metric_id;
}

// Get overview metrics via API
async function getOverviewMetrics(
  accessToken: string,
  clientId?: string
): Promise<any> {
  const url = clientId
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrics/overview?clientId=${clientId}`
    : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/metrics/overview`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get overview metrics: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 13: Financial Metrics Calculation Accuracy
 * 
 * For any time period (current day, current month, last 30 days), the aggregated
 * spend and revenue calculations should equal the sum of individual metric records
 * for that period, and per-client revenue should be calculated correctly based on
 * commission models.
 * 
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
describe('Property 13: Financial Metrics Calculation Accuracy', () => {
  describe('Spend Aggregation Accuracy', () => {
    it('should aggregate spend correctly for current month', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await fc.assert(
          fc.asyncProperty(
            arbitraryClientWithCommission(),
            fc.array(arbitraryMetricsData(), { minLength: 1, maxLength: 10 }),
            async (clientData, metricsArray) => {
              // Create client with commission model
              const { clientId } = await createClientWithCommission(testUser!.userId, clientData);
              createdResources.push(clientId);

              // Create campaign structure
              const { adId } = await createCampaignStructure(clientId);

              // Create metrics
              let expectedTotalSpend = 0;
              for (const metricsData of metricsArray) {
                await createMetrics(adId, metricsData);
                expectedTotalSpend += metricsData.spend;
              }

              // Get overview metrics
              const overview = await getOverviewMetrics(testUser!.accessToken);

              // Verify spend aggregation
              const difference = Math.abs(overview.totalSpendThisMonth - expectedTotalSpend);
              expect(difference).toBeLessThanOrEqual(0.01);

              // Cleanup
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
              createdResources.length = 0;

              return true;
            }
          ),
          { numRuns: 10, timeout: 120000 }
        );
      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 180000);
  });


  describe('Revenue Calculation with Commission Models', () => {
    it('should calculate revenue correctly based on commission percentage', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await fc.assert(
          fc.asyncProperty(
            arbitraryClientWithCommission(),
            fc.array(arbitraryMetricsData(), { minLength: 1, maxLength: 5 }),
            async (clientData, metricsArray) => {
              // Create client with commission model
              const { clientId } = await createClientWithCommission(testUser!.userId, clientData);
              createdResources.push(clientId);

              // Create campaign structure
              const { adId } = await createCampaignStructure(clientId);

              // Create metrics
              let totalSpend = 0;
              let totalPurchases = 0;
              for (const metricsData of metricsArray) {
                await createMetrics(adId, metricsData);
                totalSpend += metricsData.spend;
                totalPurchases += metricsData.purchases;
              }

              // Calculate expected revenue based on calculation basis
              let expectedRevenue = 0;
              if (clientData.calculation_basis === 'sales_revenue') {
                // Using purchases as proxy for revenue (with placeholder calculation)
                const revenue = totalPurchases * 100;
                expectedRevenue = calculateCommission(revenue, clientData.commission_percentage);
              } else {
                // Using spend as proxy for total revenue
                expectedRevenue = calculateCommission(totalSpend, clientData.commission_percentage);
              }

              // Get overview metrics
              const overview = await getOverviewMetrics(testUser!.accessToken);

              // Verify revenue calculation (allow some tolerance due to rounding)
              const difference = Math.abs(overview.totalRevenueThisMonth - expectedRevenue);
              expect(difference).toBeLessThanOrEqual(1);

              // Cleanup
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
              createdResources.length = 0;

              return true;
            }
          ),
          { numRuns: 10, timeout: 120000 }
        );
      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 180000);
  });

  describe('Multiple Clients Aggregation', () => {
    it('should aggregate metrics correctly across multiple clients', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create 3 clients with different commission models
        const client1Data = {
          name: 'Client 1',
          industry: 'e-commerce',
          commission_percentage: 15,
          calculation_basis: 'sales_revenue'
        };

        const client2Data = {
          name: 'Client 2',
          industry: 'logistics',
          commission_percentage: 10,
          calculation_basis: 'total_revenue'
        };

        const client3Data = {
          name: 'Client 3',
          industry: 'beauty',
          commission_percentage: 20,
          calculation_basis: 'sales_revenue'
        };

        const { clientId: clientId1 } = await createClientWithCommission(testUser.userId, client1Data);
        createdResources.push(clientId1);
        const { adId: adId1 } = await createCampaignStructure(clientId1);

        const { clientId: clientId2 } = await createClientWithCommission(testUser.userId, client2Data);
        createdResources.push(clientId2);
        const { adId: adId2 } = await createCampaignStructure(clientId2);

        const { clientId: clientId3 } = await createClientWithCommission(testUser.userId, client3Data);
        createdResources.push(clientId3);
        const { adId: adId3 } = await createCampaignStructure(clientId3);

        // Create metrics for each client
        const today = new Date().toISOString().split('T')[0];
        
        await createMetrics(adId1, { spend: 1000, impressions: 10000, clicks: 500, conversions: 50, purchases: 10, date: today });
        await createMetrics(adId2, { spend: 2000, impressions: 20000, clicks: 1000, conversions: 100, purchases: 20, date: today });
        await createMetrics(adId3, { spend: 1500, impressions: 15000, clicks: 750, conversions: 75, purchases: 15, date: today });

        // Calculate expected totals
        const expectedTotalSpend = 1000 + 2000 + 1500;
        const expectedTotalClients = 3;
        const expectedActiveCampaigns = 3;

        // Get overview metrics
        const overview = await getOverviewMetrics(testUser.accessToken);

        // Verify aggregations
        expect(overview.totalClients).toBe(expectedTotalClients);
        expect(overview.activeCampaigns).toBe(expectedActiveCampaigns);
        
        const spendDifference = Math.abs(overview.totalSpendThisMonth - expectedTotalSpend);
        expect(spendDifference).toBeLessThanOrEqual(0.01);

        // Verify revenue is positive (exact calculation depends on implementation)
        expect(overview.totalRevenueThisMonth).toBeGreaterThan(0);

        // Cleanup
        for (const clientId of createdResources) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
        createdResources.length = 0;

      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 90000);
  });


  describe('Today vs Month Spend Differentiation', () => {
    it('should correctly differentiate between today and month spend', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        const clientData = {
          name: 'Test Client',
          industry: 'e-commerce',
          commission_percentage: 15,
          calculation_basis: 'sales_revenue'
        };

        const { clientId } = await createClientWithCommission(testUser.userId, clientData);
        createdResources.push(clientId);
        const { adId } = await createCampaignStructure(clientId);

        // Create metrics for today
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        await createMetrics(adId, { spend: 500, impressions: 5000, clicks: 250, conversions: 25, purchases: 5, date: todayStr });

        // Create metrics for earlier this month (if not first day of month)
        if (today.getDate() > 1) {
          const earlierDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
          const earlierDateStr = earlierDate.toISOString().split('T')[0];
          await createMetrics(adId, { spend: 1000, impressions: 10000, clicks: 500, conversions: 50, purchases: 10, date: earlierDateStr });
        }

        // Get overview metrics
        const overview = await getOverviewMetrics(testUser.accessToken);

        // Verify today's spend
        const todayDifference = Math.abs(overview.totalSpendToday - 500);
        expect(todayDifference).toBeLessThanOrEqual(0.01);

        // Verify month spend includes both days
        if (today.getDate() > 1) {
          const monthDifference = Math.abs(overview.totalSpendThisMonth - 1500);
          expect(monthDifference).toBeLessThanOrEqual(0.01);
          expect(overview.totalSpendThisMonth).toBeGreaterThan(overview.totalSpendToday);
        } else {
          // First day of month, should be equal
          expect(overview.totalSpendThisMonth).toBe(overview.totalSpendToday);
        }

        // Cleanup
        await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        createdResources.length = 0;

      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 60000);
  });

  describe('Zero Metrics Handling', () => {
    it('should return zero metrics when no data exists', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get overview metrics without creating any clients
        const overview = await getOverviewMetrics(testUser.accessToken);

        // Verify all metrics are zero
        expect(overview.totalClients).toBe(0);
        expect(overview.totalSpendThisMonth).toBe(0);
        expect(overview.totalSpendToday).toBe(0);
        expect(overview.totalRevenueThisMonth).toBe(0);
        expect(overview.activeCampaigns).toBe(0);

      } finally {
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 30000);
  });
});

/**
 * Property 14: Dashboard Client Filtering
 * 
 * For any client selection on the dashboard, all displayed metrics should belong
 * exclusively to that client, with no data from other clients appearing.
 * 
 * Validates: Requirements 6.7
 */
describe('Property 14: Dashboard Client Filtering', () => {
  describe('Single Client Filtering', () => {
    it('should filter metrics to show only selected client data', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create two clients with different metrics
        const client1Data = {
          name: 'Client 1',
          industry: 'e-commerce',
          commission_percentage: 15,
          calculation_basis: 'sales_revenue'
        };

        const client2Data = {
          name: 'Client 2',
          industry: 'logistics',
          commission_percentage: 10,
          calculation_basis: 'total_revenue'
        };

        const { clientId: clientId1 } = await createClientWithCommission(testUser.userId, client1Data);
        createdResources.push(clientId1);
        const { adId: adId1 } = await createCampaignStructure(clientId1);

        const { clientId: clientId2 } = await createClientWithCommission(testUser.userId, client2Data);
        createdResources.push(clientId2);
        const { adId: adId2 } = await createCampaignStructure(clientId2);

        // Create different metrics for each client
        const today = new Date().toISOString().split('T')[0];
        
        await createMetrics(adId1, { spend: 1000, impressions: 10000, clicks: 500, conversions: 50, purchases: 10, date: today });
        await createMetrics(adId2, { spend: 2000, impressions: 20000, clicks: 1000, conversions: 100, purchases: 20, date: today });

        // Get metrics for client 1 only
        const client1Overview = await getOverviewMetrics(testUser.accessToken, clientId1);

        // Verify only client 1 data is included
        expect(client1Overview.totalClients).toBe(1);
        expect(client1Overview.activeCampaigns).toBe(1);
        
        const client1SpendDifference = Math.abs(client1Overview.totalSpendThisMonth - 1000);
        expect(client1SpendDifference).toBeLessThanOrEqual(0.01);

        // Get metrics for client 2 only
        const client2Overview = await getOverviewMetrics(testUser.accessToken, clientId2);

        // Verify only client 2 data is included
        expect(client2Overview.totalClients).toBe(1);
        expect(client2Overview.activeCampaigns).toBe(1);
        
        const client2SpendDifference = Math.abs(client2Overview.totalSpendThisMonth - 2000);
        expect(client2SpendDifference).toBeLessThanOrEqual(0.01);

        // Verify client 1 and client 2 metrics are different
        expect(client1Overview.totalSpendThisMonth).not.toBe(client2Overview.totalSpendThisMonth);

        // Get unfiltered metrics (all clients)
        const allClientsOverview = await getOverviewMetrics(testUser.accessToken);

        // Verify unfiltered includes both clients
        expect(allClientsOverview.totalClients).toBe(2);
        expect(allClientsOverview.activeCampaigns).toBe(2);
        
        const totalSpendDifference = Math.abs(allClientsOverview.totalSpendThisMonth - 3000);
        expect(totalSpendDifference).toBeLessThanOrEqual(0.01);

        // Cleanup
        for (const clientId of createdResources) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
        createdResources.length = 0;

      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 90000);
  });


  describe('Client Isolation', () => {
    it('should not leak data between clients when filtering', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await fc.assert(
          fc.asyncProperty(
            fc.tuple(arbitraryClientWithCommission(), arbitraryClientWithCommission()),
            fc.tuple(
              fc.array(arbitraryMetricsData(), { minLength: 1, maxLength: 3 }),
              fc.array(arbitraryMetricsData(), { minLength: 1, maxLength: 3 })
            ),
            async ([client1Data, client2Data], [metrics1Array, metrics2Array]) => {
              // Create two clients
              const { clientId: clientId1 } = await createClientWithCommission(testUser!.userId, {
                ...client1Data,
                name: 'Client A'
              });
              createdResources.push(clientId1);
              const { adId: adId1 } = await createCampaignStructure(clientId1);

              const { clientId: clientId2 } = await createClientWithCommission(testUser!.userId, {
                ...client2Data,
                name: 'Client B'
              });
              createdResources.push(clientId2);
              const { adId: adId2 } = await createCampaignStructure(clientId2);

              // Create metrics for client 1
              let client1TotalSpend = 0;
              for (const metricsData of metrics1Array) {
                await createMetrics(adId1, metricsData);
                client1TotalSpend += metricsData.spend;
              }

              // Create metrics for client 2
              let client2TotalSpend = 0;
              for (const metricsData of metrics2Array) {
                await createMetrics(adId2, metricsData);
                client2TotalSpend += metricsData.spend;
              }

              // Get filtered metrics for client 1
              const client1Overview = await getOverviewMetrics(testUser!.accessToken, clientId1);

              // Verify client 1 metrics don't include client 2 data
              const client1Difference = Math.abs(client1Overview.totalSpendThisMonth - client1TotalSpend);
              expect(client1Difference).toBeLessThanOrEqual(0.01);
              expect(client1Overview.totalClients).toBe(1);

              // Get filtered metrics for client 2
              const client2Overview = await getOverviewMetrics(testUser!.accessToken, clientId2);

              // Verify client 2 metrics don't include client 1 data
              const client2Difference = Math.abs(client2Overview.totalSpendThisMonth - client2TotalSpend);
              expect(client2Difference).toBeLessThanOrEqual(0.01);
              expect(client2Overview.totalClients).toBe(1);

              // Verify the two filtered views are independent
              if (Math.abs(client1TotalSpend - client2TotalSpend) > 0.01) {
                expect(client1Overview.totalSpendThisMonth).not.toBe(client2Overview.totalSpendThisMonth);
              }

              // Cleanup
              for (const clientId of createdResources) {
                await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
              }
              createdResources.length = 0;

              return true;
            }
          ),
          { numRuns: 5, timeout: 120000 }
        );
      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 180000);
  });

  describe('Invalid Client Filter', () => {
    it('should return zero metrics for non-existent client ID', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use a random UUID that doesn't exist
        const nonExistentClientId = '00000000-0000-0000-0000-000000000000';

        // Get metrics for non-existent client
        const overview = await getOverviewMetrics(testUser.accessToken, nonExistentClientId);

        // Verify all metrics are zero
        expect(overview.totalClients).toBe(0);
        expect(overview.totalSpendThisMonth).toBe(0);
        expect(overview.totalSpendToday).toBe(0);
        expect(overview.totalRevenueThisMonth).toBe(0);
        expect(overview.activeCampaigns).toBe(0);

      } finally {
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 30000);
  });

  describe('Multiple Clients with Filtering', () => {
    it('should correctly filter when user has many clients', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdResources: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create 5 clients with different spend amounts
        const clientSpends: { clientId: string; expectedSpend: number }[] = [];

        for (let i = 0; i < 5; i++) {
          const clientData = {
            name: `Client ${i + 1}`,
            industry: 'e-commerce',
            commission_percentage: 15,
            calculation_basis: 'sales_revenue'
          };

          const { clientId } = await createClientWithCommission(testUser.userId, clientData);
          createdResources.push(clientId);
          const { adId } = await createCampaignStructure(clientId);

          const spend = (i + 1) * 1000; // 1000, 2000, 3000, 4000, 5000
          const today = new Date().toISOString().split('T')[0];
          await createMetrics(adId, { 
            spend, 
            impressions: 10000, 
            clicks: 500, 
            conversions: 50, 
            purchases: 10, 
            date: today 
          });

          clientSpends.push({ clientId, expectedSpend: spend });
        }

        // Verify each client's filtered metrics
        for (const { clientId, expectedSpend } of clientSpends) {
          const overview = await getOverviewMetrics(testUser.accessToken, clientId);
          
          expect(overview.totalClients).toBe(1);
          expect(overview.activeCampaigns).toBe(1);
          
          const difference = Math.abs(overview.totalSpendThisMonth - expectedSpend);
          expect(difference).toBeLessThanOrEqual(0.01);
        }

        // Verify unfiltered metrics include all clients
        const allOverview = await getOverviewMetrics(testUser.accessToken);
        expect(allOverview.totalClients).toBe(5);
        expect(allOverview.activeCampaigns).toBe(5);
        
        const totalExpectedSpend = 1000 + 2000 + 3000 + 4000 + 5000;
        const totalDifference = Math.abs(allOverview.totalSpendThisMonth - totalExpectedSpend);
        expect(totalDifference).toBeLessThanOrEqual(0.01);

        // Cleanup
        for (const clientId of createdResources) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
        createdResources.length = 0;

      } finally {
        if (testUser) {
          for (const clientId of createdResources) {
            try {
              await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);
  });
});

