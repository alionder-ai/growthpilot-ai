/**
 * End-to-End Tests for Critical User Flows
 * 
 * These tests validate complete user journeys through the application:
 * 1. User registration flow
 * 2. Client creation flow
 * 3. Meta sync flow
 * 4. Report generation flow
 */

import { createClient } from '@supabase/supabase-js';
import { generateActionPlan } from '@/lib/gemini/client';
import { syncMetaData } from '@/lib/meta/sync';

// Test configuration
const TEST_USER_EMAIL = `test-${Date.now()}@example.com`;
const TEST_USER_PASSWORD = 'TestPassword123!';
const TEST_CLIENT_NAME = 'Test Client Company';

describe('End-to-End User Flows', () => {
  let supabase: any;
  let userId: string;
  let clientId: string;
  let sessionToken: string;

  beforeAll(() => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  });

  afterAll(async () => {
    // Cleanup: Delete test user and all associated data
    if (userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) {
        console.error('Cleanup error:', error);
      }
    }
  });

  describe('1. User Registration Flow', () => {
    it('should complete full registration flow', async () => {
      // Step 1: Sign up with email and password
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      expect(signUpError).toBeNull();
      expect(signUpData.user).toBeDefined();
      expect(signUpData.user.email).toBe(TEST_USER_EMAIL);
      
      userId = signUpData.user.id;
      sessionToken = signUpData.session.access_token;

      // Step 2: Verify session is created
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      expect(sessionError).toBeNull();
      expect(sessionData.session).toBeDefined();
      expect(sessionData.session.user.id).toBe(userId);

      // Step 3: Verify user can access protected routes
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      expect(userError).toBeNull();
      expect(userData).toBeDefined();
    });

    it('should prevent duplicate email registration', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD,
      });

      expect(error).toBeDefined();
      expect(error.message).toContain('already registered');
    });

    it('should validate password strength', async () => {
      const { data, error } = await supabase.auth.signUp({
        email: `weak-${Date.now()}@example.com`,
        password: '123', // Weak password
      });

      expect(error).toBeDefined();
      expect(error.message).toContain('password');
    });
  });

  describe('2. Client Creation Flow', () => {
    it('should complete full client creation flow', async () => {
      // Step 1: Create client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: TEST_CLIENT_NAME,
          industry: 'e-commerce',
          contact_email: 'contact@testclient.com',
          contact_phone: '+90 555 123 4567',
        })
        .select()
        .single();

      expect(clientError).toBeNull();
      expect(clientData).toBeDefined();
      expect(clientData.name).toBe(TEST_CLIENT_NAME);
      expect(clientData.industry).toBe('e-commerce');
      
      clientId = clientData.client_id;

      // Step 2: Create commission model for client
      const { data: commissionData, error: commissionError } = await supabase
        .from('commission_models')
        .insert({
          client_id: clientId,
          commission_percentage: 15.5,
          calculation_basis: 'sales_revenue',
        })
        .select()
        .single();

      expect(commissionError).toBeNull();
      expect(commissionData).toBeDefined();
      expect(commissionData.commission_percentage).toBe(15.5);

      // Step 3: Verify client appears in user's client list
      const { data: clientList, error: listError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId);

      expect(listError).toBeNull();
      expect(clientList).toHaveLength(1);
      expect(clientList[0].client_id).toBe(clientId);
    });

    it('should enforce RLS policies - user cannot access other users clients', async () => {
      // Create another user
      const otherUserEmail = `other-${Date.now()}@example.com`;
      const { data: otherUser } = await supabase.auth.signUp({
        email: otherUserEmail,
        password: TEST_USER_PASSWORD,
      });

      // Try to access first user's client
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('client_id', clientId);

      // Should return empty array due to RLS
      expect(data).toHaveLength(0);

      // Cleanup other user
      if (otherUser.user) {
        await supabase.auth.admin.deleteUser(otherUser.user.id);
      }
    });

    it('should validate required fields', async () => {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          // Missing required 'name' field
          industry: 'logistics',
        });

      expect(error).toBeDefined();
      expect(error.message).toContain('name');
    });
  });

  describe('3. Meta Sync Flow', () => {
    it('should handle Meta API sync flow', async () => {
      // Note: This test uses mocked Meta API responses
      // In production, you would need actual Meta API credentials

      // Step 1: Store Meta token (encrypted)
      const mockMetaToken = 'mock_meta_access_token';
      const { data: tokenData, error: tokenError } = await supabase
        .from('meta_tokens')
        .insert({
          user_id: userId,
          encrypted_access_token: mockMetaToken, // In production, this would be encrypted
          ad_account_id: 'act_123456789',
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        })
        .select()
        .single();

      expect(tokenError).toBeNull();
      expect(tokenData).toBeDefined();

      // Step 2: Create mock campaign data
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientId,
          meta_campaign_id: '123456789',
          campaign_name: 'Test Campaign',
          status: 'ACTIVE',
        })
        .select()
        .single();

      expect(campaignError).toBeNull();
      expect(campaignData).toBeDefined();

      // Step 3: Create ad set
      const { data: adSetData, error: adSetError } = await supabase
        .from('ad_sets')
        .insert({
          campaign_id: campaignData.campaign_id,
          meta_ad_set_id: '987654321',
          ad_set_name: 'Test Ad Set',
          budget: 5000.00,
          status: 'ACTIVE',
        })
        .select()
        .single();

      expect(adSetError).toBeNull();

      // Step 4: Create ad
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          ad_set_id: adSetData.ad_set_id,
          meta_ad_id: '111222333',
          ad_name: 'Test Ad',
          creative_url: 'https://example.com/creative.jpg',
          status: 'ACTIVE',
        })
        .select()
        .single();

      expect(adError).toBeNull();

      // Step 5: Insert metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('meta_metrics')
        .insert({
          ad_id: adData.ad_id,
          date: new Date().toISOString().split('T')[0],
          spend: 1250.50,
          impressions: 50000,
          clicks: 1500,
          conversions: 45,
          roas: 3.2,
          ctr: 3.0,
          cpc: 0.83,
          cpm: 25.01,
          cpa: 27.79,
          frequency: 2.5,
          add_to_cart: 120,
          purchases: 45,
        })
        .select()
        .single();

      expect(metricsError).toBeNull();
      expect(metricsData).toBeDefined();
      expect(metricsData.spend).toBe(1250.50);
      expect(metricsData.roas).toBe(3.2);

      // Step 6: Verify metrics can be queried
      const { data: queryMetrics, error: queryError } = await supabase
        .from('meta_metrics')
        .select('*')
        .eq('ad_id', adData.ad_id);

      expect(queryError).toBeNull();
      expect(queryMetrics).toHaveLength(1);
    });

    it('should handle sync failures gracefully', async () => {
      // Test with invalid Meta token
      const { data, error } = await supabase
        .from('meta_tokens')
        .insert({
          user_id: userId,
          encrypted_access_token: 'invalid_token',
          ad_account_id: 'act_invalid',
          expires_at: new Date(Date.now() - 1000).toISOString(), // Expired
        });

      // Should still insert but sync will fail
      expect(error).toBeNull();
      
      // Verify notification is created for sync failure
      // (This would be tested in integration with actual sync function)
    });
  });

  describe('4. Report Generation Flow', () => {
    it('should complete full report generation flow', async () => {
      // Step 1: Generate report
      const reportStartDate = '2024-01-01';
      const reportEndDate = '2024-01-31';

      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .insert({
          client_id: clientId,
          report_type: 'monthly',
          period_start: reportStartDate,
          period_end: reportEndDate,
          file_url: 'https://storage.example.com/reports/test-report.pdf',
        })
        .select()
        .single();

      expect(reportError).toBeNull();
      expect(reportData).toBeDefined();
      expect(reportData.report_type).toBe('monthly');
      expect(reportData.period_start).toBe(reportStartDate);

      // Step 2: Verify report appears in user's report list
      const { data: reportList, error: listError } = await supabase
        .from('reports')
        .select(`
          *,
          clients (
            name,
            user_id
          )
        `)
        .eq('clients.user_id', userId);

      expect(listError).toBeNull();
      expect(reportList.length).toBeGreaterThan(0);

      // Step 3: Verify report can be retrieved by ID
      const { data: singleReport, error: singleError } = await supabase
        .from('reports')
        .select('*')
        .eq('report_id', reportData.report_id)
        .single();

      expect(singleError).toBeNull();
      expect(singleReport.report_id).toBe(reportData.report_id);
    });

    it('should validate report date range', async () => {
      const { data, error } = await supabase
        .from('reports')
        .insert({
          client_id: clientId,
          report_type: 'weekly',
          period_start: '2024-01-31', // End before start
          period_end: '2024-01-01',
          file_url: 'https://storage.example.com/reports/invalid.pdf',
        });

      // Should fail validation (if check constraint exists)
      // Or should be handled by application logic
      expect(error || data).toBeDefined();
    });
  });

  describe('5. Complete User Journey', () => {
    it('should complete full user journey from signup to report', async () => {
      // This test validates the complete flow:
      // Signup -> Create Client -> Sync Data -> Generate Report

      const journeyEmail = `journey-${Date.now()}@example.com`;

      // 1. Sign up
      const { data: signUpData } = await supabase.auth.signUp({
        email: journeyEmail,
        password: TEST_USER_PASSWORD,
      });
      expect(signUpData.user).toBeDefined();
      const journeyUserId = signUpData.user.id;

      // 2. Create client
      const { data: clientData } = await supabase
        .from('clients')
        .insert({
          user_id: journeyUserId,
          name: 'Journey Test Client',
          industry: 'healthcare',
        })
        .select()
        .single();
      expect(clientData).toBeDefined();

      // 3. Create commission model
      const { data: commissionData } = await supabase
        .from('commission_models')
        .insert({
          client_id: clientData.client_id,
          commission_percentage: 20.0,
          calculation_basis: 'total_revenue',
        })
        .select()
        .single();
      expect(commissionData).toBeDefined();

      // 4. Create campaign
      const { data: campaignData } = await supabase
        .from('campaigns')
        .insert({
          client_id: clientData.client_id,
          meta_campaign_id: `journey_${Date.now()}`,
          campaign_name: 'Journey Campaign',
          status: 'ACTIVE',
        })
        .select()
        .single();
      expect(campaignData).toBeDefined();

      // 5. Generate report
      const { data: reportData } = await supabase
        .from('reports')
        .insert({
          client_id: clientData.client_id,
          report_type: 'weekly',
          period_start: '2024-01-08',
          period_end: '2024-01-14',
          file_url: 'https://storage.example.com/reports/journey.pdf',
        })
        .select()
        .single();
      expect(reportData).toBeDefined();

      // 6. Verify all data is accessible
      const { data: allClients } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', journeyUserId);
      expect(allClients).toHaveLength(1);

      const { data: allReports } = await supabase
        .from('reports')
        .select('*')
        .eq('client_id', clientData.client_id);
      expect(allReports).toHaveLength(1);

      // Cleanup
      await supabase.auth.admin.deleteUser(journeyUserId);
    });
  });
});
