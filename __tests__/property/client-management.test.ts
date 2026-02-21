// @ts-nocheck
/**
 * Feature: growthpilot-ai, Client Management Property Tests
 * 
 * Property 4: Client CRUD Operations Persistence
 * Property 5: Client List Completeness
 * 
 * Validates: Requirements 2.1-2.6
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
  fc.oneof(
    fc.constantFrom(
      'logistics',
      'e-commerce',
      'beauty',
      'real estate',
      'healthcare',
      'education',
      'technology',
      'retail',
      'finance'
    ),
    fc.constant(null) // Industry is optional
  );

// Generate valid email addresses
const arbitraryEmail = () =>
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'hotmail.com', 'company.com')
  ).map(([local, domain]: [string, string]) => `${local}@${domain}`);

// Generate valid phone numbers
const arbitraryPhone = () =>
  fc.oneof(
    fc.tuple(
      fc.constantFrom('+90', '+1', '+44'),
      fc.stringOf(fc.constantFrom(...'0123456789'.split('')), { minLength: 10, maxLength: 10 })
    ).map(([code, number]: [string, string]) => `${code}${number}`),
    fc.constant(null) // Phone is optional
  );

// Generate complete client data
const arbitraryClientData = () =>
  fc.record({
    name: arbitraryClientName(),
    industry: arbitraryIndustry(),
    contact_email: fc.option(arbitraryEmail(), { nil: null }),
    contact_phone: arbitraryPhone()
  });

// Generate valid password for test users
const arbitraryPassword = () =>
  fc.string({ minLength: 8, maxLength: 20 });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-client-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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

// Create client via API
async function createClient(
  accessToken: string,
  clientData: { name: string; industry?: string | null; contact_email?: string | null; contact_phone?: string | null }
): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(clientData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create client: ${error.error}`);
  }

  return response.json();
}

// Get client by ID via API
async function getClient(accessToken: string, clientId: string): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/${clientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get client: ${error.error}`);
  }

  return response.json();
}

// Update client via API
async function updateClient(
  accessToken: string,
  clientId: string,
  clientData: { name: string; industry?: string | null; contact_email?: string | null; contact_phone?: string | null }
): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/${clientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify(clientData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update client: ${error.error}`);
  }

  return response.json();
}

// Delete client via API
async function deleteClient(accessToken: string, clientId: string): Promise<any> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to delete client: ${error.error}`);
  }

  return response.json();
}

// List all clients via API
async function listClients(accessToken: string, params?: { search?: string; industry?: string; page?: number; limit?: number }): Promise<any> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.industry) queryParams.append('industry', params.industry);
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/clients${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to list clients: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 4: Client CRUD Operations Persistence
 * 
 * For any valid client data, creating a client should result in a retrievable record,
 * updating should persist changes, and deleting should remove the client and cascade
 * to associated campaigns.
 * 
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.6
 */
describe('Property 4: Client CRUD Operations Persistence', () => {
  let testUser: { userId: string; email: string; accessToken: string };

  beforeAll(async () => {
    // Create a test user for all tests in this suite
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up test user
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  describe('Create and Retrieve', () => {
    it('should persist created clients and make them retrievable', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryClientData(),
          async (clientData) => {
            let createdClientId: string | null = null;

            try {
              // Step 1: Create client
              const createResponse = await createClient(testUser.accessToken, clientData);
              expect(createResponse.client).toBeDefined();
              expect(createResponse.client.client_id).toBeTruthy();
              expect(createResponse.client.name).toBe(clientData.name.trim());
              expect(createResponse.client.user_id).toBe(testUser.userId);

              createdClientId = createResponse.client.client_id;

              // Step 2: Retrieve client by ID
              const getResponse = await getClient(testUser.accessToken, createdClientId);
              expect(getResponse.client).toBeDefined();
              expect(getResponse.client.client_id).toBe(createdClientId);
              expect(getResponse.client.name).toBe(clientData.name.trim());
              expect(getResponse.client.industry).toBe(clientData.industry);
              expect(getResponse.client.contact_email).toBe(clientData.contact_email);
              expect(getResponse.client.contact_phone).toBe(clientData.contact_phone);

              // Step 3: Verify client appears in list
              const listResponse = await listClients(testUser.accessToken);
              const foundClient = listResponse.clients.find((c: any) => c.client_id === createdClientId);
              expect(foundClient).toBeDefined();
              expect(foundClient.name).toBe(clientData.name.trim());

              // Cleanup
              await deleteClient(testUser.accessToken, createdClientId);

              return true;
            } catch (error) {
              // Cleanup on error
              if (createdClientId) {
                try {
                  await deleteClient(testUser.accessToken, createdClientId);
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

  describe('Update Operations', () => {
    it('should persist updates to client data', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryClientData(),
          arbitraryClientData(),
          async (initialData, updatedData) => {
            let createdClientId: string | null = null;

            try {
              // Step 1: Create client with initial data
              const createResponse = await createClient(testUser.accessToken, initialData);
              createdClientId = createResponse.client.client_id;

              // Step 2: Update client with new data
              const updateResponse = await updateClient(testUser.accessToken, createdClientId, updatedData);
              expect(updateResponse.client).toBeDefined();
              expect(updateResponse.client.client_id).toBe(createdClientId);
              expect(updateResponse.client.name).toBe(updatedData.name.trim());
              expect(updateResponse.client.industry).toBe(updatedData.industry);
              expect(updateResponse.client.contact_email).toBe(updatedData.contact_email);
              expect(updateResponse.client.contact_phone).toBe(updatedData.contact_phone);

              // Step 3: Retrieve client to verify persistence
              const getResponse = await getClient(testUser.accessToken, createdClientId);
              expect(getResponse.client.name).toBe(updatedData.name.trim());
              expect(getResponse.client.industry).toBe(updatedData.industry);
              expect(getResponse.client.contact_email).toBe(updatedData.contact_email);
              expect(getResponse.client.contact_phone).toBe(updatedData.contact_phone);

              // Verify updated_at timestamp changed
              expect(getResponse.client.updated_at).toBeTruthy();
              expect(new Date(getResponse.client.updated_at).getTime()).toBeGreaterThan(
                new Date(createResponse.client.created_at).getTime()
              );

              // Cleanup
              await deleteClient(testUser.accessToken, createdClientId);

              return true;
            } catch (error) {
              // Cleanup on error
              if (createdClientId) {
                try {
                  await deleteClient(testUser.accessToken, createdClientId);
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
  });

  describe('Delete Operations', () => {
    it('should remove client and make it unretrievable', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryClientData(),
          async (clientData) => {
            // Step 1: Create client
            const createResponse = await createClient(testUser.accessToken, clientData);
            const createdClientId = createResponse.client.client_id;

            // Step 2: Verify client exists
            const getResponse = await getClient(testUser.accessToken, createdClientId);
            expect(getResponse.client).toBeDefined();

            // Step 3: Delete client
            const deleteResponse = await deleteClient(testUser.accessToken, createdClientId);
            expect(deleteResponse.success).toBe(true);

            // Step 4: Verify client is no longer retrievable
            try {
              await getClient(testUser.accessToken, createdClientId);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error: any) {
              // Should throw error indicating client not found
              expect(error.message).toContain('bulunamadı');
            }

            // Step 5: Verify client doesn't appear in list
            const listResponse = await listClients(testUser.accessToken);
            const foundClient = listResponse.clients.find((c: any) => c.client_id === createdClientId);
            expect(foundClient).toBeUndefined();

            return true;
          }
        ),
        { numRuns: 15, timeout: 60000 }
      );
    }, 120000);
  });

  describe('Cascade Delete', () => {
    it('should cascade delete to associated campaigns when client is deleted', async () => {
      const clientData = {
        name: 'Test Client for Cascade',
        industry: 'e-commerce',
        contact_email: 'cascade@test.com',
        contact_phone: null
      };

      let createdClientId: string | null = null;
      let campaignId: string | null = null;

      try {
        // Step 1: Create client
        const createResponse = await createClient(testUser.accessToken, clientData);
        createdClientId = createResponse.client.client_id;

        // Step 2: Create a campaign for this client (directly in database)
        const { data: campaign, error: campaignError } = await supabaseAdmin
          .from('campaigns')
          .insert({
            client_id: createdClientId,
            meta_campaign_id: `test-campaign-${Date.now()}`,
            campaign_name: 'Test Campaign',
            status: 'active'
          })
          .select()
          .single();

        if (campaignError) {
          throw new Error(`Failed to create test campaign: ${campaignError.message}`);
        }

        campaignId = campaign.campaign_id;

        // Step 3: Verify campaign exists
        const { data: verifyCampaign } = await supabaseAdmin
          .from('campaigns')
          .select('*')
          .eq('campaign_id', campaignId)
          .single();

        expect(verifyCampaign).toBeDefined();

        // Step 4: Delete client
        await deleteClient(testUser.accessToken, createdClientId);

        // Step 5: Verify campaign was cascade deleted
        const { data: deletedCampaign } = await supabaseAdmin
          .from('campaigns')
          .select('*')
          .eq('campaign_id', campaignId)
          .single();

        expect(deletedCampaign).toBeNull();

        return true;
      } catch (error) {
        // Cleanup on error
        if (campaignId) {
          try {
            await supabaseAdmin.from('campaigns').delete().eq('campaign_id', campaignId);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
        if (createdClientId) {
          try {
            await deleteClient(testUser.accessToken, createdClientId);
          } catch (cleanupError) {
            // Ignore cleanup errors
          }
        }
        throw error;
      }
    }, 30000);
  });
});

/**
 * Property 5: Client List Completeness
 * 
 * For any authenticated user with N clients, the dashboard client list should
 * display exactly N clients, all belonging to that user.
 * 
 * Validates: Requirements 2.5
 */
describe('Property 5: Client List Completeness', () => {
  describe('List Completeness', () => {
    it('should return exactly N clients for a user with N clients', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdClientIds: string[] = [];

      try {
        // Create a fresh test user
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await fc.assert(
          fc.asyncProperty(
            fc.integer({ min: 0, max: 10 }),
            fc.array(arbitraryClientData(), { minLength: 0, maxLength: 10 }),
            async (targetCount, clientDataArray) => {
              // Use only the first targetCount items
              const clientsToCreate = clientDataArray.slice(0, targetCount);

              // Step 1: Create N clients
              for (const clientData of clientsToCreate) {
                const createResponse = await createClient(testUser!.accessToken, clientData);
                createdClientIds.push(createResponse.client.client_id);
              }

              // Step 2: List all clients
              const listResponse = await listClients(testUser!.accessToken);

              // Step 3: Verify exactly N clients are returned
              expect(listResponse.clients).toBeDefined();
              expect(listResponse.clients.length).toBe(targetCount);
              expect(listResponse.pagination.total).toBe(targetCount);

              // Step 4: Verify all clients belong to the user
              for (const client of listResponse.clients) {
                expect(client.user_id).toBe(testUser!.userId);
              }

              // Step 5: Verify all created clients are in the list
              for (const clientId of createdClientIds) {
                const foundClient = listResponse.clients.find((c: any) => c.client_id === clientId);
                expect(foundClient).toBeDefined();
              }

              // Cleanup created clients
              for (const clientId of createdClientIds) {
                await deleteClient(testUser!.accessToken, clientId);
              }
              createdClientIds.length = 0;

              return true;
            }
          ),
          { numRuns: 10, timeout: 120000 }
        );
      } finally {
        // Cleanup any remaining clients
        if (testUser) {
          for (const clientId of createdClientIds) {
            try {
              await deleteClient(testUser.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 180000);
  });

  describe('User Isolation', () => {
    it('should only return clients belonging to the authenticated user', async () => {
      let user1: { userId: string; email: string; accessToken: string } | null = null;
      let user2: { userId: string; email: string; accessToken: string } | null = null;
      const user1ClientIds: string[] = [];
      const user2ClientIds: string[] = [];

      try {
        // Create two test users
        user1 = await createTestUser();
        user2 = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        await fc.assert(
          fc.asyncProperty(
            fc.tuple(
              fc.array(arbitraryClientData(), { minLength: 1, maxLength: 5 }),
              fc.array(arbitraryClientData(), { minLength: 1, maxLength: 5 })
            ),
            async ([user1Clients, user2Clients]) => {
              // Step 1: Create clients for user1
              for (const clientData of user1Clients) {
                const createResponse = await createClient(user1!.accessToken, clientData);
                user1ClientIds.push(createResponse.client.client_id);
              }

              // Step 2: Create clients for user2
              for (const clientData of user2Clients) {
                const createResponse = await createClient(user2!.accessToken, clientData);
                user2ClientIds.push(createResponse.client.client_id);
              }

              // Step 3: List clients for user1
              const user1ListResponse = await listClients(user1!.accessToken);
              expect(user1ListResponse.clients.length).toBe(user1Clients.length);

              // Step 4: Verify user1 only sees their own clients
              for (const client of user1ListResponse.clients) {
                expect(client.user_id).toBe(user1!.userId);
                expect(user1ClientIds).toContain(client.client_id);
                expect(user2ClientIds).not.toContain(client.client_id);
              }

              // Step 5: List clients for user2
              const user2ListResponse = await listClients(user2!.accessToken);
              expect(user2ListResponse.clients.length).toBe(user2Clients.length);

              // Step 6: Verify user2 only sees their own clients
              for (const client of user2ListResponse.clients) {
                expect(client.user_id).toBe(user2!.userId);
                expect(user2ClientIds).toContain(client.client_id);
                expect(user1ClientIds).not.toContain(client.client_id);
              }

              // Cleanup
              for (const clientId of user1ClientIds) {
                await deleteClient(user1!.accessToken, clientId);
              }
              user1ClientIds.length = 0;

              for (const clientId of user2ClientIds) {
                await deleteClient(user2!.accessToken, clientId);
              }
              user2ClientIds.length = 0;

              return true;
            }
          ),
          { numRuns: 5, timeout: 120000 }
        );
      } finally {
        // Cleanup
        if (user1) {
          for (const clientId of user1ClientIds) {
            try {
              await deleteClient(user1.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(user1.userId);
        }
        if (user2) {
          for (const clientId of user2ClientIds) {
            try {
              await deleteClient(user2.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(user2.userId);
        }
      }
    }, 180000);
  });

  describe('Filtering and Search', () => {
    it('should correctly filter clients by search term', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdClientIds: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create clients with specific names
        const clientNames = ['Acme Corp', 'Tech Solutions', 'Acme Industries', 'Beauty Salon'];
        for (const name of clientNames) {
          const createResponse = await createClient(testUser.accessToken, {
            name,
            industry: 'technology',
            contact_email: null,
            contact_phone: null
          });
          createdClientIds.push(createResponse.client.client_id);
        }

        // Search for "Acme"
        const searchResponse = await listClients(testUser.accessToken, { search: 'Acme' });
        expect(searchResponse.clients.length).toBe(2);
        expect(searchResponse.clients.every((c: any) => c.name.includes('Acme'))).toBe(true);

        // Cleanup
        for (const clientId of createdClientIds) {
          await deleteClient(testUser.accessToken, clientId);
        }
      } finally {
        if (testUser) {
          for (const clientId of createdClientIds) {
            try {
              await deleteClient(testUser.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 60000);

    it('should correctly filter clients by industry', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdClientIds: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create clients with different industries
        const clients = [
          { name: 'Tech Co', industry: 'technology' },
          { name: 'Beauty Co', industry: 'beauty' },
          { name: 'Tech Solutions', industry: 'technology' },
          { name: 'Healthcare Co', industry: 'healthcare' }
        ];

        for (const client of clients) {
          const createResponse = await createClient(testUser.accessToken, {
            ...client,
            contact_email: null,
            contact_phone: null
          });
          createdClientIds.push(createResponse.client.client_id);
        }

        // Filter by technology industry
        const filterResponse = await listClients(testUser.accessToken, { industry: 'technology' });
        expect(filterResponse.clients.length).toBe(2);
        expect(filterResponse.clients.every((c: any) => c.industry === 'technology')).toBe(true);

        // Cleanup
        for (const clientId of createdClientIds) {
          await deleteClient(testUser.accessToken, clientId);
        }
      } finally {
        if (testUser) {
          for (const clientId of createdClientIds) {
            try {
              await deleteClient(testUser.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 60000);
  });

  describe('Pagination', () => {
    it('should correctly paginate client lists', async () => {
      let testUser: { userId: string; email: string; accessToken: string } | null = null;
      const createdClientIds: string[] = [];

      try {
        testUser = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create 15 clients
        for (let i = 0; i < 15; i++) {
          const createResponse = await createClient(testUser.accessToken, {
            name: `Client ${i + 1}`,
            industry: 'technology',
            contact_email: null,
            contact_phone: null
          });
          createdClientIds.push(createResponse.client.client_id);
        }

        // Get first page (limit 10)
        const page1Response = await listClients(testUser.accessToken, { page: 1, limit: 10 });
        expect(page1Response.clients.length).toBe(10);
        expect(page1Response.pagination.total).toBe(15);
        expect(page1Response.pagination.totalPages).toBe(2);

        // Get second page
        const page2Response = await listClients(testUser.accessToken, { page: 2, limit: 10 });
        expect(page2Response.clients.length).toBe(5);
        expect(page2Response.pagination.total).toBe(15);

        // Verify no overlap between pages
        const page1Ids = page1Response.clients.map((c: any) => c.client_id);
        const page2Ids = page2Response.clients.map((c: any) => c.client_id);
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);

        // Cleanup
        for (const clientId of createdClientIds) {
          await deleteClient(testUser.accessToken, clientId);
        }
      } finally {
        if (testUser) {
          for (const clientId of createdClientIds) {
            try {
              await deleteClient(testUser.accessToken, clientId);
            } catch (error) {
              // Ignore cleanup errors
            }
          }
          await cleanupTestUser(testUser.userId);
        }
      }
    }, 90000);
  });
});
