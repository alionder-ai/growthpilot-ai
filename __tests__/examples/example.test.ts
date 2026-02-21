/**
 * Example Test File
 * 
 * Demonstrates how to use the testing infrastructure with mocks and arbitraries.
 * This file serves as a reference for writing new tests.
 */

import * as fc from 'fast-check';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { createMockMetaClient } from '../mocks/meta-api.mock';
import { createMockGeminiClient } from '../mocks/gemini-api.mock';
import {
  arbitraryUser,
  arbitraryClient,
  arbitraryMetrics,
  arbitraryDateRange,
} from '../generators/arbitraries';

describe('Example: Testing Infrastructure Usage', () => {
  describe('Property-Based Testing with Arbitraries', () => {
    it('should generate valid user data', () => {
      fc.assert(
        fc.property(arbitraryUser(), (user) => {
          // Verify user has required fields
          expect(user.user_id).toBeDefined();
          expect(user.email).toContain('@');
          expect(user.created_at).toBeDefined();
          expect(user.updated_at).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid client data', () => {
      fc.assert(
        fc.property(arbitraryClient(), (client) => {
          // Verify client has required fields
          expect(client.client_id).toBeDefined();
          expect(client.user_id).toBeDefined();
          expect(client.name.length).toBeGreaterThanOrEqual(3);
          expect(['logistics', 'e-commerce', 'beauty', 'real estate', 'healthcare', 'education'])
            .toContain(client.industry);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid metrics with correct ranges', () => {
      fc.assert(
        fc.property(arbitraryMetrics(), (metrics) => {
          // Verify metrics are within valid ranges
          expect(metrics.spend).toBeGreaterThanOrEqual(0);
          expect(metrics.impressions).toBeGreaterThanOrEqual(0);
          expect(metrics.clicks).toBeGreaterThanOrEqual(0);
          expect(metrics.roas).toBeGreaterThanOrEqual(0);
          expect(metrics.roas).toBeLessThanOrEqual(10);
          expect(metrics.frequency).toBeGreaterThanOrEqual(1);
          expect(metrics.frequency).toBeLessThanOrEqual(10);
        }),
        { numRuns: 100 }
      );
    });

    it('should generate valid date ranges', () => {
      fc.assert(
        fc.property(arbitraryDateRange(), (dateRange) => {
          const start = new Date(dateRange.start);
          const end = new Date(dateRange.end);
          
          // End date should be >= start date
          expect(end.getTime()).toBeGreaterThanOrEqual(start.getTime());
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Supabase Mock Usage', () => {
    let supabase: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
      supabase = createMockSupabaseClient();
    });

    it('should mock database queries', async () => {
      // Set mock data
      const mockClients = [
        { client_id: '123', name: 'Test Client 1' },
        { client_id: '456', name: 'Test Client 2' },
      ];
      supabase.setMockData('clients', mockClients);

      // Query mock data
      const { data, error } = await supabase.from('clients').select('*');

      expect(error).toBeNull();
      expect(data).toEqual(mockClients);
    });

    it('should simulate database errors', async () => {
      // Enable failure mode
      supabase.setFailure(true, 'Connection timeout');

      // Attempt query
      const { data, error } = await supabase.from('clients').select('*');

      expect(error).toBeDefined();
      expect(error.message).toBe('Connection timeout');
    });

    it('should mock authentication', async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(error).toBeNull();
      expect(data.user).toBeDefined();
      expect(data.session).toBeDefined();
      expect(data.session.access_token).toBe('test-token');
    });
  });

  describe('Meta API Mock Usage', () => {
    let metaClient: ReturnType<typeof createMockMetaClient>;

    beforeEach(() => {
      metaClient = createMockMetaClient();
    });

    afterEach(() => {
      metaClient.resetCallCount();
    });

    it('should mock campaign data retrieval', async () => {
      const campaigns = await metaClient.getCampaigns('act_123456');

      expect(campaigns.data).toBeDefined();
      expect(campaigns.data.length).toBeGreaterThan(0);
      expect(campaigns.data[0].name).toBe('Test Campaign');
    });

    it('should simulate API failures', async () => {
      metaClient.setFailure(true);

      await expect(metaClient.getCampaigns('act_123456')).rejects.toThrow();
    });

    it('should simulate rate limiting', async () => {
      metaClient.setRateLimit(true);

      await expect(metaClient.getCampaigns('act_123456')).rejects.toThrow();
    });

    it('should track API call count', async () => {
      await metaClient.getCampaigns('act_123456');
      await metaClient.getAdSets('123456789');
      await metaClient.getAds('987654321');

      expect(metaClient.getCallCount()).toBe(3);
    });
  });

  describe('Gemini API Mock Usage', () => {
    let geminiClient: ReturnType<typeof createMockGeminiClient>;

    beforeEach(() => {
      geminiClient = createMockGeminiClient();
    });

    afterEach(() => {
      geminiClient.resetCallCount();
    });

    it('should mock action plan generation', async () => {
      const response = await geminiClient.generateActionPlan({
        client_name: 'Test Client',
        metrics: {},
      });

      expect(response.candidates).toBeDefined();
      expect(response.candidates[0].content.parts[0].text).toBeDefined();
    });

    it('should mock strategy card generation', async () => {
      const response = await geminiClient.generateStrategyCard({
        situation: 'High frequency',
      });

      expect(response.candidates).toBeDefined();
      const content = JSON.parse(response.candidates[0].content.parts[0].text);
      expect(content.do_actions).toBeDefined();
      expect(content.dont_actions).toBeDefined();
    });

    it('should simulate API failures', async () => {
      geminiClient.setFailure(true);

      await expect(geminiClient.generateContent('test prompt')).rejects.toThrow();
    });

    it('should add response delay', async () => {
      geminiClient.setResponseDelay(100);

      const startTime = Date.now();
      await geminiClient.generateContent('test prompt');
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });

    it('should track API call count', async () => {
      await geminiClient.generateActionPlan({});
      await geminiClient.generateStrategyCard({});
      await geminiClient.generateCreativeContent({});

      expect(geminiClient.getCallCount()).toBe(3);
    });
  });

  describe('Combined Usage: Property-Based Test with Mocks', () => {
    it('should test client creation with arbitrary data', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryClient(), async (client) => {
          const supabase = createMockSupabaseClient();
          
          // Mock successful insert
          supabase.setMockData('clients', [client]);

          const { data, error } = await supabase
            .from('clients')
            .insert(client)
            .select()
            .single();

          expect(error).toBeNull();
          expect(data).toBeDefined();
        }),
        { numRuns: 50 }
      );
    });

    it('should test metrics import with arbitrary data', async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryMetrics(), async (metrics) => {
          const supabase = createMockSupabaseClient();
          
          // Verify metrics are valid before insert
          expect(metrics.spend).toBeGreaterThanOrEqual(0);
          expect(metrics.impressions).toBeGreaterThanOrEqual(0);
          
          // Mock successful insert
          supabase.setMockData('meta_metrics', [metrics]);

          const { data, error } = await supabase
            .from('meta_metrics')
            .insert(metrics)
            .select()
            .single();

          expect(error).toBeNull();
          expect(data).toBeDefined();
        }),
        { numRuns: 50 }
      );
    });
  });
});
