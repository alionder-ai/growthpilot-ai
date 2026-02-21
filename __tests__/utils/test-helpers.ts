/**
 * Test Helper Utilities
 * 
 * Common helper functions used across test files.
 */

import { createTestSupabaseClient } from '../setup/test-env';

/**
 * Create a test user and return user ID
 */
export async function createTestUser(email: string = 'test@example.com') {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password: 'TestPassword123!',
  });

  if (error) throw error;
  return data.user?.id;
}

/**
 * Create a test client and return client ID
 */
export async function createTestClient(userId: string, clientData?: Partial<any>) {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      name: clientData?.name || 'Test Client',
      industry: clientData?.industry || 'e-commerce',
      contact_email: clientData?.contact_email || 'client@example.com',
      contact_phone: clientData?.contact_phone || '5551234567',
    })
    .select()
    .single();

  if (error) throw error;
  return data.client_id;
}

/**
 * Create a test campaign and return campaign ID
 */
export async function createTestCampaign(clientId: string, campaignData?: Partial<any>) {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      client_id: clientId,
      meta_campaign_id: campaignData?.meta_campaign_id || `test_${Date.now()}`,
      campaign_name: campaignData?.campaign_name || 'Test Campaign',
      status: campaignData?.status || 'ACTIVE',
    })
    .select()
    .single();

  if (error) throw error;
  return data.campaign_id;
}

/**
 * Create a test ad set and return ad set ID
 */
export async function createTestAdSet(campaignId: string, adSetData?: Partial<any>) {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase
    .from('ad_sets')
    .insert({
      campaign_id: campaignId,
      meta_ad_set_id: adSetData?.meta_ad_set_id || `test_${Date.now()}`,
      ad_set_name: adSetData?.ad_set_name || 'Test Ad Set',
      budget: adSetData?.budget || 10000,
      status: adSetData?.status || 'ACTIVE',
    })
    .select()
    .single();

  if (error) throw error;
  return data.ad_set_id;
}

/**
 * Create a test ad and return ad ID
 */
export async function createTestAd(adSetId: string, adData?: Partial<any>) {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase
    .from('ads')
    .insert({
      ad_set_id: adSetId,
      meta_ad_id: adData?.meta_ad_id || `test_${Date.now()}`,
      ad_name: adData?.ad_name || 'Test Ad',
      creative_url: adData?.creative_url || 'https://example.com/image.jpg',
      status: adData?.status || 'ACTIVE',
    })
    .select()
    .single();

  if (error) throw error;
  return data.ad_id;
}

/**
 * Create test metrics for an ad
 */
export async function createTestMetrics(adId: string, metricsData?: Partial<any>) {
  const supabase = createTestSupabaseClient();
  
  const { data, error } = await supabase
    .from('meta_metrics')
    .insert({
      ad_id: adId,
      date: metricsData?.date || new Date().toISOString().split('T')[0],
      spend: metricsData?.spend || 5000,
      impressions: metricsData?.impressions || 10000,
      clicks: metricsData?.clicks || 500,
      conversions: metricsData?.conversions || 10,
      roas: metricsData?.roas || 3.0,
      ctr: metricsData?.ctr || 5.0,
      cpc: metricsData?.cpc || 10.0,
      cpm: metricsData?.cpm || 500.0,
      cpa: metricsData?.cpa || 500.0,
      frequency: metricsData?.frequency || 2.5,
      add_to_cart: metricsData?.add_to_cart || 50,
      purchases: metricsData?.purchases || 10,
    })
    .select()
    .single();

  if (error) throw error;
  return data.metric_id;
}

/**
 * Create a complete test hierarchy: user -> client -> campaign -> ad set -> ad -> metrics
 */
export async function createTestHierarchy() {
  const userId = await createTestUser();
  const clientId = await createTestClient(userId!);
  const campaignId = await createTestCampaign(clientId);
  const adSetId = await createTestAdSet(campaignId);
  const adId = await createTestAd(adSetId);
  const metricId = await createTestMetrics(adId);

  return {
    userId,
    clientId,
    campaignId,
    adSetId,
    adId,
    metricId,
  };
}

/**
 * Wait for a condition to be true (polling)
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Generate a random email for testing
 */
export function generateTestEmail(): string {
  return `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`;
}

/**
 * Generate a random Turkish phone number
 */
export function generateTestPhone(): string {
  return `5${Math.floor(Math.random() * 900000000 + 100000000)}`;
}

/**
 * Format date to DD.MM.YYYY (Turkish format)
 */
export function formatDateTurkish(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Format currency to Turkish Lira format
 */
export function formatCurrencyTurkish(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
}

/**
 * Calculate ROAS (Return on Ad Spend)
 */
export function calculateROAS(revenue: number, spend: number): number {
  if (spend === 0) return 0;
  return revenue / spend;
}

/**
 * Calculate CTR (Click-Through Rate)
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

/**
 * Calculate CPC (Cost Per Click)
 */
export function calculateCPC(spend: number, clicks: number): number {
  if (clicks === 0) return 0;
  return spend / clicks;
}

/**
 * Calculate CPM (Cost Per Mille/Thousand Impressions)
 */
export function calculateCPM(spend: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (spend / impressions) * 1000;
}

/**
 * Calculate CPA (Cost Per Acquisition)
 */
export function calculateCPA(spend: number, conversions: number): number {
  if (conversions === 0) return 0;
  return spend / conversions;
}

/**
 * Calculate commission
 */
export function calculateCommission(revenue: number, percentage: number): number {
  return (revenue * percentage) / 100;
}

/**
 * Verify Turkish locale formatting
 */
export function verifyTurkishLocale(text: string): boolean {
  // Check for Turkish Lira symbol
  const hasTRY = text.includes('₺') || text.includes('TRY');
  
  // Check for Turkish date format (DD.MM.YYYY)
  const hasDateFormat = /\d{2}\.\d{2}\.\d{4}/.test(text);
  
  // Check for Turkish number format (1.234,56)
  const hasNumberFormat = /\d{1,3}(\.\d{3})*,\d{2}/.test(text);
  
  return hasTRY || hasDateFormat || hasNumberFormat;
}

/**
 * Mock fetch for API testing
 */
export function mockFetch(response: any, status: number = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  ) as jest.Mock;
}

/**
 * Reset all mocks
 */
export function resetAllMocks() {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.restoreAllMocks();
}
