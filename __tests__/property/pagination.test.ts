// @ts-nocheck
/**
 * Feature: growthpilot-ai, Pagination Property Tests
 * 
 * Property 37: Pagination for Large Lists
 * 
 * Validates: Requirements 16.2
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

// Generate valid campaign names
const arbitraryCampaignName = () =>
  fc.oneof(
    fc.string({ minLength: 5, maxLength: 50 }).filter((s: string) => s.trim().length > 0),
    fc.constantFrom(
      'Summer Sale Campaign',
      'Black Friday Promotion',
      'New Product Launch',
      'Brand Awareness Campaign',
      'Lead Generation Campaign',
      'Retargeting Campaign'
    )
  );

// Generate valid campaign status
const arbitraryCampaignStatus = () =>
  fc.constantFrom('active', 'paused', 'archived', 'completed');

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-pagination-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'testpassword123';

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  // Sign in to get access token
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
    // Delete user (cascade will handle clients and related data)
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Cleanup warning for user ${userId}:`, error);
  }
}

// Create client via database (for test setup)
async function createTestClient(userId: string, name: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name,
      industry: 'e-commerce',
      contact_email: null,
      contact_phone: null
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test client: ${error?.message}`);
  }

  return data.client_id;
}

// Create campaign via database (for test setup)
async function createTestCampaign(
  clientId: string,
  campaignName: string,
  status: string
): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('campaigns')
    .insert({
      client_id: clientId,
      meta_campaign_id: `test-meta-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      campaign_name: campaignName,
      status
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test campaign: ${error?.message}`);
  }

  return data.campaign_id;
}

// List campaigns via API with pagination
async function listCampaigns(
  accessToken: string,
  params?: { client_id?: string; page?: number; limit?: number }
): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.client_id) queryParams.append('client_id', params.client_id);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/campaigns${
    queryParams.toString() ? '?' + queryParams.toString() : ''
  }`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to list campaigns: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 37: Pagination for Large Lists
 * 
 * For any campaign list with more than 50 records, the system should apply
 * pagination and display records in pages.
 * 
 * Validates: Requirements 16.2
 */
describe('Property 37: Pagination for Large Lists', () => {
  describe('Pagination Threshold', () => {
    it('should apply pagination when campaign count exceeds 50 records', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Pagination');

        // Create 60 campaigns (exceeds 50 threshold)
        const campaignCount = 60;
        for (let i = 0; i < campaignCount; i++) {
          const campaignId = await createTestCampaign(
            clientId,
            `Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 1: Request first page with default limit (50)
        const page1Response = await listCampaigns(testUser.accessToken, { page: 1, limit: 50 });

        // Step 2: Verify pagination is applied
        expect(page1Response.campaigns).toBeDefined();
        expect(page1Response.campaigns.length).toBe(50);
        expect(page1Response.pagination).toBeDefined();
        expect(page1Response.pagination.total).toBe(campaignCount);
        expect(page1Response.pagination.page).toBe(1);
        expect(page1Response.pagination.limit).toBe(50);
        expect(page1Response.pagination.totalPages).toBe(2);

        // Step 3: Request second page
        const page2Response = await listCampaigns(testUser.accessToken, { page: 2, limit: 50 });

        // Step 4: Verify second page contains remaining records
        expect(page2Response.campaigns.length).toBe(10);
        expect(page2Response.pagination.total).toBe(campaignCount);
        expect(page2Response.pagination.page).toBe(2);
        expect(page2Response.pagination.totalPages).toBe(2);

        // Step 5: Verify no overlap between pages
        const page1Ids = page1Response.campaigns.map((c: any) => c.campaign_id);
        const page2Ids = page2Response.campaigns.map((c: any) => c.campaign_id);
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);

        // Step 6: Verify all campaigns are accounted for
        const allIds = [...page1Ids, ...page2Ids];
        expect(allIds.length).toBe(campaignCount);
        expect(new Set(allIds).size).toBe(campaignCount); // All unique
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);
  });

  describe('Pagination Consistency', () => {
    it('should maintain consistent pagination across different page sizes', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Pagination');

        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 51, max: 100 }), // Campaign count > 50
            fc.integer({ min: 10, max: 50 }), // Page size
            async (totalCampaigns, pageSize) => {
              const createdCampaignIds: string[] = [];

              try {
                // Create campaigns
                for (let i = 0; i < totalCampaigns; i++) {
                  const campaignId = await createTestCampaign(
                    clientId!,
                    `Campaign ${i + 1}`,
                    'active'
                  );
                  createdCampaignIds.push(campaignId);
                }

                // Wait for data to be available
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Calculate expected pages
                const expectedTotalPages = Math.ceil(totalCampaigns / pageSize);

                // Fetch all pages
                const allCampaignIds: string[] = [];
                for (let page = 1; page <= expectedTotalPages; page++) {
                  const response = await listCampaigns(testUser!.accessToken, {
                    page,
                    limit: pageSize
                  });

                  // Verify pagination metadata
                  expect(response.pagination.total).toBe(totalCampaigns);
                  expect(response.pagination.page).toBe(page);
                  expect(response.pagination.limit).toBe(pageSize);
                  expect(response.pagination.totalPages).toBe(expectedTotalPages);

                  // Verify page size (except possibly last page)
                  if (page < expectedTotalPages) {
                    expect(response.campaigns.length).toBe(pageSize);
                  } else {
                    const expectedLastPageSize = totalCampaigns - (pageSize * (expectedTotalPages - 1));
                    expect(response.campaigns.length).toBe(expectedLastPageSize);
                  }

                  // Collect campaign IDs
                  const pageIds = response.campaigns.map((c: any) => c.campaign_id);
                  allCampaignIds.push(...pageIds);
                }

                // Verify all campaigns retrieved exactly once
                expect(allCampaignIds.length).toBe(totalCampaigns);
                expect(new Set(allCampaignIds).size).toBe(totalCampaigns);

                // Cleanup campaigns for next iteration
                for (const campaignId of createdCampaignIds) {
                  await supabaseAdmin.from('campaigns').delete().eq('campaign_id', campaignId);
                }

                return true;
              } catch (error) {
                // Cleanup on error
                for (const campaignId of createdCampaignIds) {
                  try {
                    await supabaseAdmin.from('campaigns').delete().eq('campaign_id', campaignId);
                  } catch (cleanupError) {
                    // Ignore cleanup errors
                  }
                }
                throw error;
              }
            }
          ),
          { numRuns: 5, timeout: 180000 }
        );
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 240000);
  });

  describe('Pagination Boundary Cases', () => {
    it('should handle exactly 50 campaigns without pagination', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Boundary');

        // Create exactly 50 campaigns (at threshold)
        const campaignCount = 50;
        for (let i = 0; i < campaignCount; i++) {
          const campaignId = await createTestCampaign(
            clientId,
            `Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Request first page
        const response = await listCampaigns(testUser.accessToken, { page: 1, limit: 50 });

        // Verify all campaigns returned in single page
        expect(response.campaigns.length).toBe(50);
        expect(response.pagination.total).toBe(50);
        expect(response.pagination.totalPages).toBe(1);
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);

    it('should handle exactly 51 campaigns with pagination', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Boundary');

        // Create 51 campaigns (just over threshold)
        const campaignCount = 51;
        for (let i = 0; i < campaignCount; i++) {
          const campaignId = await createTestCampaign(
            clientId,
            `Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Request first page
        const page1Response = await listCampaigns(testUser.accessToken, { page: 1, limit: 50 });

        // Verify pagination is applied
        expect(page1Response.campaigns.length).toBe(50);
        expect(page1Response.pagination.total).toBe(51);
        expect(page1Response.pagination.totalPages).toBe(2);

        // Request second page
        const page2Response = await listCampaigns(testUser.accessToken, { page: 2, limit: 50 });

        // Verify second page has 1 campaign
        expect(page2Response.campaigns.length).toBe(1);
        expect(page2Response.pagination.total).toBe(51);
        expect(page2Response.pagination.page).toBe(2);
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);

    it('should return empty result for page beyond total pages', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Boundary');

        // Create 60 campaigns
        const campaignCount = 60;
        for (let i = 0; i < campaignCount; i++) {
          const campaignId = await createTestCampaign(
            clientId,
            `Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Request page 10 (beyond total pages)
        const response = await listCampaigns(testUser.accessToken, { page: 10, limit: 50 });

        // Verify empty result
        expect(response.campaigns.length).toBe(0);
        expect(response.pagination.total).toBe(60);
        expect(response.pagination.page).toBe(10);
        expect(response.pagination.totalPages).toBe(2);
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);
  });

  describe('Pagination with Filtering', () => {
    it('should apply pagination correctly when filtering by client', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let client1Id: string | null = null;
      let client2Id: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and two clients
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        client1Id = await createTestClient(testUser.userId, 'Client 1');
        client2Id = await createTestClient(testUser.userId, 'Client 2');

        // Create 60 campaigns for client 1
        for (let i = 0; i < 60; i++) {
          const campaignId = await createTestCampaign(
            client1Id,
            `Client 1 Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Create 20 campaigns for client 2
        for (let i = 0; i < 20; i++) {
          const campaignId = await createTestCampaign(
            client2Id,
            `Client 2 Campaign ${i + 1}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Request first page for client 1 (should be paginated)
        const client1Page1 = await listCampaigns(testUser.accessToken, {
          client_id: client1Id,
          page: 1,
          limit: 50
        });

        expect(client1Page1.campaigns.length).toBe(50);
        expect(client1Page1.pagination.total).toBe(60);
        expect(client1Page1.pagination.totalPages).toBe(2);

        // Verify all campaigns belong to client 1
        expect(client1Page1.campaigns.every((c: any) => c.client_id === client1Id)).toBe(true);

        // Request second page for client 1
        const client1Page2 = await listCampaigns(testUser.accessToken, {
          client_id: client1Id,
          page: 2,
          limit: 50
        });

        expect(client1Page2.campaigns.length).toBe(10);
        expect(client1Page2.pagination.total).toBe(60);

        // Request first page for client 2 (should not be paginated)
        const client2Page1 = await listCampaigns(testUser.accessToken, {
          client_id: client2Id,
          page: 1,
          limit: 50
        });

        expect(client2Page1.campaigns.length).toBe(20);
        expect(client2Page1.pagination.total).toBe(20);
        expect(client2Page1.pagination.totalPages).toBe(1);

        // Verify all campaigns belong to client 2
        expect(client2Page1.campaigns.every((c: any) => c.client_id === client2Id)).toBe(true);
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);
  });

  describe('Pagination Order Consistency', () => {
    it('should maintain consistent order across paginated requests', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      let clientId: string | null = null;
      const createdCampaignIds: string[] = [];

      try {
        // Create test user and client
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        clientId = await createTestClient(testUser.userId, 'Test Client for Order');

        // Create 60 campaigns with delays to ensure different timestamps
        for (let i = 0; i < 60; i++) {
          const campaignId = await createTestCampaign(
            clientId,
            `Campaign ${String(i + 1).padStart(3, '0')}`,
            'active'
          );
          createdCampaignIds.push(campaignId);
          
          // Small delay to ensure different created_at timestamps
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        // Wait for data to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Fetch first page twice
        const firstRequest = await listCampaigns(testUser.accessToken, { page: 1, limit: 50 });
        await new Promise(resolve => setTimeout(resolve, 500));
        const secondRequest = await listCampaigns(testUser.accessToken, { page: 1, limit: 50 });

        // Verify order is consistent
        const firstIds = firstRequest.campaigns.map((c: any) => c.campaign_id);
        const secondIds = secondRequest.campaigns.map((c: any) => c.campaign_id);

        expect(firstIds).toEqual(secondIds);

        // Verify campaigns are ordered by created_at descending (newest first)
        const firstTimestamps = firstRequest.campaigns.map((c: any) => new Date(c.created_at).getTime());
        for (let i = 1; i < firstTimestamps.length; i++) {
          expect(firstTimestamps[i - 1]).toBeGreaterThanOrEqual(firstTimestamps[i]);
        }
      } finally {
        // Cleanup
        if (testUser) {
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 120000);
  });
});
