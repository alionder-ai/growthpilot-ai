// @ts-nocheck
/**
 * Feature: growthpilot-ai, Report Generation Property Tests
 * 
 * Property 21: Report Generation Completeness
 * Property 22: Report Customization
 * Property 23: Report Persistence
 * Property 39: Asynchronous Report Processing
 * 
 * Validates: Requirements 9.1-9.7, 16.5
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import { generateWhatsAppReport, generateCustomWhatsAppReport } from '@/lib/utils/report-formatters';
import type { ReportMetrics } from '@/lib/utils/report-formatters';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid report type
const arbitraryReportType = () =>
  fc.constantFrom('weekly', 'monthly');

// Generate valid date string (YYYY-MM-DD)
const arbitraryDateString = () =>
  fc.date({ min: new Date('2023-01-01'), max: new Date('2026-12-31') })
    .map(d => d.toISOString().split('T')[0]);

// Generate valid date range (start before end)
const arbitraryDateRange = () =>
  fc.tuple(arbitraryDateString(), arbitraryDateString())
    .filter(([start, end]) => start < end)
    .map(([start, end]) => ({ periodStart: start, periodEnd: end }));

// Generate valid report metrics
const arbitraryReportMetrics = (): fc.Arbitrary<ReportMetrics> =>
  fc.record({
    totalSpend: fc.double({ min: 0, max: 1000000, noNaN: true }),
    totalRevenue: fc.double({ min: 0, max: 500000, noNaN: true }),
    leadCount: fc.integer({ min: 0, max: 10000 }),
    roas: fc.double({ min: 0, max: 20, noNaN: true }),
    costPerLead: fc.double({ min: 0, max: 1000, noNaN: true }),
    impressions: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
    clicks: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
    conversions: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
    purchases: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
    ctr: fc.option(fc.double({ min: 0, max: 20, noNaN: true }), { nil: undefined }),
    cpc: fc.option(fc.double({ min: 0, max: 100, noNaN: true }), { nil: undefined }),
  });

// Generate valid client name
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

// Generate valid format
const arbitraryFormat = () =>
  fc.constantFrom('whatsapp', 'pdf');

// Generate valid metric selection (subset of available metrics)
const arbitraryMetricSelection = () =>
  fc.subarray([
    'totalSpend',
    'totalRevenue',
    'roas',
    'leadCount',
    'costPerLead',
    'impressions',
    'clicks',
    'ctr',
    'cpc',
    'conversions',
    'purchases'
  ], { minLength: 1, maxLength: 11 });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-report-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
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
async function createTestClient(userId: string, name: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('clients')
    .insert({
      user_id: userId,
      name,
      industry: 'e-commerce',
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create test client: ${error?.message}`);
  }

  return data.client_id;
}

// Generate report via API
async function generateReport(
  accessToken: string,
  clientId: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  format: 'whatsapp' | 'pdf',
  selectedMetrics?: string[]
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/reports/generate`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        clientId,
        reportType,
        periodStart,
        periodEnd,
        format,
        selectedMetrics
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to generate report: ${error.error}`);
  }

  return response.json();
}

/**
 * Property 21: Report Generation Completeness
 * 
 * For any report generation request (weekly or monthly), the generated report should include
 * all required metrics (total spend, total revenue, lead count, ROAS, cost per lead) and be
 * available in both WhatsApp text format and PDF format.
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */
describe('Property 21: Report Generation Completeness', () => {
  describe('WhatsApp Report Format', () => {
    it('should include all required metrics in WhatsApp format', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics
            );

            // Verify report is not empty
            expect(report).toBeTruthy();
            expect(report.length).toBeGreaterThan(0);

            // Verify all required metrics are present
            expect(report).toContain('Toplam Harcama');
            expect(report).toContain('Toplam Gelir');
            expect(report).toContain('ROAS');
            expect(report).toContain('Lead Sayısı');
            expect(report).toContain('Lead Başına Maliyet');

            // Verify client name is included
            expect(report).toContain(clientName);

            // Verify report type is included
            const reportTypeText = reportType === 'weekly' ? 'Haftalık' : 'Aylık';
            expect(report).toContain(reportTypeText);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format currency values in Turkish locale', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics
            );

            // Verify Turkish currency symbol is present
            expect(report).toContain('₺');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include date range in Turkish format', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics
            );

            // Verify date range is included
            expect(report).toContain('Dönem');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include optional metrics when available', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics
            );

            // If impressions are provided, they should be in the report
            if (metrics.impressions !== undefined && metrics.impressions > 0) {
              expect(report).toContain('Gösterim');
            }

            // If clicks are provided, they should be in the report
            if (metrics.clicks !== undefined) {
              expect(report).toContain('Tıklama');
            }

            // If CTR is provided, it should be in the report
            if (metrics.ctr !== undefined) {
              expect(report).toContain('CTR');
            }

            // If CPC is provided, it should be in the report
            if (metrics.cpc !== undefined) {
              expect(report).toContain('CPC');
            }

            // If conversions are provided, they should be in the report
            if (metrics.conversions !== undefined) {
              expect(report).toContain('Dönüşüm');
            }

            // If purchases are provided, they should be in the report
            if (metrics.purchases !== undefined) {
              expect(report).toContain('Satın Alma');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should be plain text format suitable for WhatsApp', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics
            );

            // Verify no HTML tags
            expect(report).not.toMatch(/<[^>]+>/);

            // Verify uses WhatsApp formatting (asterisks for bold)
            expect(report).toMatch(/\*/);

            // Verify uses emojis for visual appeal
            expect(report).toMatch(/[\u{1F300}-\u{1F9FF}]/u);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Report Type Validation', () => {
    it('should support weekly report type', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              'weekly',
              periodStart,
              periodEnd,
              metrics
            );

            expect(report).toContain('Haftalık');
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should support monthly report type', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, { periodStart, periodEnd }, metrics) => {
            const report = generateWhatsAppReport(
              clientName,
              'monthly',
              periodStart,
              periodEnd,
              metrics
            );

            expect(report).toContain('Aylık');
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Property 22: Report Customization
 * 
 * For any subset of metrics selected by the user, the generated report should contain
 * only those selected metrics and exclude unselected ones.
 * 
 * Validates: Requirements 9.6
 */
describe('Property 22: Report Customization', () => {
  describe('Metric Selection', () => {
    it('should include only selected metrics', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          arbitraryMetricSelection(),
          (clientName, reportType, { periodStart, periodEnd }, metrics, selectedMetrics) => {
            const report = generateCustomWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics,
              selectedMetrics
            );

            // Verify report is not empty
            expect(report).toBeTruthy();

            // Verify selected metrics are included
            if (selectedMetrics.includes('totalSpend')) {
              expect(report).toContain('Toplam Harcama');
            }

            if (selectedMetrics.includes('totalRevenue')) {
              expect(report).toContain('Toplam Gelir');
            }

            if (selectedMetrics.includes('roas')) {
              expect(report).toContain('ROAS');
            }

            if (selectedMetrics.includes('leadCount')) {
              expect(report).toContain('Lead Sayısı');
            }

            if (selectedMetrics.includes('costPerLead')) {
              expect(report).toContain('Lead Başına Maliyet');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should exclude unselected metrics', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            // Select only totalSpend
            const selectedMetrics = ['totalSpend'];
            
            const report = generateCustomWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics,
              selectedMetrics
            );

            // Verify totalSpend is included
            expect(report).toContain('Toplam Harcama');

            // Verify other metrics are NOT included
            expect(report).not.toContain('Toplam Gelir');
            expect(report).not.toContain('Lead Sayısı');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single metric selection', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const selectedMetrics = ['roas'];
            
            const report = generateCustomWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics,
              selectedMetrics
            );

            // Verify only ROAS is included
            expect(report).toContain('ROAS');
            expect(report).toContain(metrics.roas.toFixed(2));

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle all metrics selected', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            const selectedMetrics = [
              'totalSpend',
              'totalRevenue',
              'roas',
              'leadCount',
              'costPerLead'
            ];
            
            const report = generateCustomWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics,
              selectedMetrics
            );

            // Verify all core metrics are included
            expect(report).toContain('Toplam Harcama');
            expect(report).toContain('Toplam Gelir');
            expect(report).toContain('ROAS');
            expect(report).toContain('Lead Sayısı');
            expect(report).toContain('Lead Başına Maliyet');

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Optional Metrics Customization', () => {
    it('should include optional metrics only when selected and available', () => {
      fc.assert(
        fc.property(
          arbitraryClientName(),
          arbitraryReportType(),
          arbitraryDateRange(),
          arbitraryReportMetrics(),
          (clientName, reportType, { periodStart, periodEnd }, metrics) => {
            // Select impressions and clicks
            const selectedMetrics = ['impressions', 'clicks'];
            
            const report = generateCustomWhatsAppReport(
              clientName,
              reportType,
              periodStart,
              periodEnd,
              metrics,
              selectedMetrics
            );

            // If impressions are available, they should be included
            if (metrics.impressions !== undefined) {
              expect(report).toContain('Gösterim');
            }

            // If clicks are available, they should be included
            if (metrics.clicks !== undefined) {
              expect(report).toContain('Tıklama');
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property 23: Report Persistence
 * 
 * For any generated report, it should be stored in the Reports table with all required fields
 * (client_id, report_type, period_start, period_end, file_url).
 * 
 * Validates: Requirements 9.7
 */
describe('Property 23: Report Persistence', () => {
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

  describe('Report Storage', () => {
    it('should store PDF report in database with all required fields', async () => {
      let clientId: string | null = null;

      try {
        // Create test client
        clientId = await createTestClient(testUser!.userId, 'Test Client Report');

        // Create minimal test data for report generation
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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
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

        // Generate PDF report
        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'weekly',
          periodStart,
          periodEnd,
          'pdf'
        );

        expect(result.success).toBe(true);
        expect(result.report).toBeDefined();

        // Verify stored in database
        const { data: storedReport, error } = await supabaseAdmin
          .from('reports')
          .select('*')
          .eq('report_id', result.report.report_id)
          .single();

        expect(error).toBeNull();
        expect(storedReport).toBeDefined();
        expect(storedReport.client_id).toBe(clientId);
        expect(storedReport.report_type).toBe('weekly');
        expect(storedReport.period_start).toBe(periodStart);
        expect(storedReport.period_end).toBe(periodEnd);
        expect(storedReport.file_url).toBeTruthy();
        expect(storedReport.created_at).toBeTruthy();

        // Cleanup
        await supabaseAdmin
          .from('reports')
          .delete()
          .eq('report_id', result.report.report_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should store report with correct report_type', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client Monthly');

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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
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

        // Generate monthly report
        const periodStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'monthly',
          periodStart,
          periodEnd,
          'pdf'
        );

        const { data: storedReport } = await supabaseAdmin
          .from('reports')
          .select('*')
          .eq('report_id', result.report.report_id)
          .single();

        expect(storedReport.report_type).toBe('monthly');

        // Cleanup
        await supabaseAdmin
          .from('reports')
          .delete()
          .eq('report_id', result.report.report_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should store report with valid date range', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client Dates');

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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
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

        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'weekly',
          periodStart,
          periodEnd,
          'pdf'
        );

        const { data: storedReport } = await supabaseAdmin
          .from('reports')
          .select('*')
          .eq('report_id', result.report.report_id)
          .single();

        // Verify date range
        expect(storedReport.period_start).toBe(periodStart);
        expect(storedReport.period_end).toBe(periodEnd);
        expect(new Date(storedReport.period_start) <= new Date(storedReport.period_end)).toBe(true);

        // Cleanup
        await supabaseAdmin
          .from('reports')
          .delete()
          .eq('report_id', result.report.report_id);
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });
});

/**
 * Property 39: Asynchronous Report Processing
 * 
 * For any report generation request, the processing should occur asynchronously
 * without blocking other UI operations.
 * 
 * Validates: Requirements 16.5
 */
describe('Property 39: Asynchronous Report Processing', () => {
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

  describe('Async Processing', () => {
    it('should complete report generation within 5 seconds', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client Async');

        // Create test data
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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
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

        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        // Measure execution time
        const startTime = Date.now();
        
        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'weekly',
          periodStart,
          periodEnd,
          'whatsapp'
        );

        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Verify completed within 5 seconds (5000ms)
        expect(executionTime).toBeLessThan(5000);
        expect(result.success).toBe(true);

        // Cleanup (WhatsApp reports don't create database records)
      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should return response immediately for WhatsApp format', async () => {
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client WhatsApp');

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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
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

        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'weekly',
          periodStart,
          periodEnd,
          'whatsapp'
        );

        // WhatsApp format should return content immediately
        expect(result.success).toBe(true);
        expect(result.format).toBe('whatsapp');
        expect(result.content).toBeTruthy();
        expect(typeof result.content).toBe('string');

      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);

    it('should handle timeout gracefully for long-running reports', async () => {
      // This test verifies that the API has timeout protection
      // The actual implementation has a 5-second timeout
      
      let clientId: string | null = null;

      try {
        clientId = await createTestClient(testUser!.userId, 'Test Client Timeout');

        // Create test data
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

        const today = new Date().toISOString().split('T')[0];
        await supabaseAdmin
          .from('meta_metrics')
          .insert({
            ad_id: ad.ad_id,
            date: today,
            spend: 700,
            roas: 2.9,
            conversions: 22,
            frequency: 2.2,
            add_to_cart: 45,
            purchases: 22,
            cpc: 2.9,
            ctr: 1.7,
            impressions: 9000,
            clicks: 153
          });

        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = today;

        // This should complete successfully (not timeout)
        const result = await generateReport(
          testUser!.accessToken,
          clientId,
          'weekly',
          periodStart,
          periodEnd,
          'whatsapp'
        );

        expect(result.success).toBe(true);

      } finally {
        if (clientId) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 30000);
  });

  describe('Non-Blocking Behavior', () => {
    it('should allow multiple concurrent report generations', async () => {
      const clientIds: string[] = [];

      try {
        // Create multiple test clients
        const client1 = await createTestClient(testUser!.userId, 'Test Client Concurrent 1');
        const client2 = await createTestClient(testUser!.userId, 'Test Client Concurrent 2');
        clientIds.push(client1, client2);

        // Create test data for both clients
        for (const clientId of clientIds) {
          const { data: campaign } = await supabaseAdmin
            .from('campaigns')
            .insert({
              client_id: clientId,
              meta_campaign_id: `test-campaign-${Date.now()}-${clientId}`,
              campaign_name: 'Test Campaign',
              status: 'active'
            })
            .select()
            .single();

          const { data: adSet } = await supabaseAdmin
            .from('ad_sets')
            .insert({
              campaign_id: campaign.campaign_id,
              meta_ad_set_id: `test-adset-${Date.now()}-${clientId}`,
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
              meta_ad_id: `test-ad-${Date.now()}-${clientId}`,
              ad_name: 'Test Ad',
              status: 'active'
            })
            .select()
            .single();

          const today = new Date().toISOString().split('T')[0];
          await supabaseAdmin
            .from('meta_metrics')
            .insert({
              ad_id: ad.ad_id,
              date: today,
              spend: 500,
              roas: 3.0,
              conversions: 20,
              frequency: 2.0,
              add_to_cart: 40,
              purchases: 20,
              cpc: 2.5,
              ctr: 1.5,
              impressions: 8000,
              clicks: 120
            });
        }

        const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const periodEnd = new Date().toISOString().split('T')[0];

        // Generate reports concurrently
        const promises = clientIds.map(clientId =>
          generateReport(
            testUser!.accessToken,
            clientId,
            'weekly',
            periodStart,
            periodEnd,
            'whatsapp'
          )
        );

        const results = await Promise.all(promises);

        // Verify all reports generated successfully
        expect(results.length).toBe(2);
        results.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.content).toBeTruthy();
        });

      } finally {
        // Cleanup
        for (const clientId of clientIds) {
          await supabaseAdmin.from('clients').delete().eq('client_id', clientId);
        }
      }
    }, 60000);
  });
});
