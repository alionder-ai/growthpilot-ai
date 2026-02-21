/**
 * Test Environment Setup
 * 
 * Configures test database connection and environment variables for testing.
 * This file should be imported in test files that need database access.
 */

import { createClient } from '@supabase/supabase-js';

// Test environment variables
export const TEST_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key',
  META_APP_ID: process.env.META_APP_ID || 'test-meta-app-id',
  META_APP_SECRET: process.env.META_APP_SECRET || 'test-meta-app-secret',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'test-gemini-api-key',
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'test-encryption-key-32-characters',
};

/**
 * Create a test Supabase client with service role key
 * Use this for tests that need to bypass RLS policies
 */
export function createTestSupabaseClient() {
  return createClient(TEST_ENV.SUPABASE_URL, TEST_ENV.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create a test Supabase client with anon key
 * Use this for tests that need to test RLS policies
 */
export function createTestSupabaseAnonClient() {
  return createClient(TEST_ENV.SUPABASE_URL, TEST_ENV.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Clean up test data from database
 * Call this in afterEach or afterAll hooks
 */
export async function cleanupTestData(supabase: ReturnType<typeof createTestSupabaseClient>) {
  // Delete in reverse order of dependencies
  await supabase.from('meta_metrics').delete().neq('metric_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('leads').delete().neq('lead_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ads').delete().neq('ad_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ad_sets').delete().neq('ad_set_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('campaigns').delete().neq('campaign_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ai_recommendations').delete().neq('recommendation_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('creative_library').delete().neq('creative_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reports').delete().neq('report_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('notifications').delete().neq('notification_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('meta_tokens').delete().neq('token_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('commission_models').delete().neq('model_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('clients').delete().neq('client_id', '00000000-0000-0000-0000-000000000000');
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
