/**
 * Property-Based Test Data Generators for AI Media Buyer
 * 
 * Uses fast-check library to generate arbitrary test data for media buyer property-based testing.
 */

import * as fc from 'fast-check';
import type {
  AggregatedMetrics,
  CampaignData,
  MediaBuyerAnalysis,
  KPIMetrics,
  Issue,
  Recommendation,
  ProfitSimulation,
  BenchmarkComparison,
  MetricComparison,
} from '@/lib/types/media-buyer';

/**
 * Generate arbitrary aggregated metrics
 */
export const arbitraryAggregatedMetrics = (): fc.Arbitrary<AggregatedMetrics> =>
  fc.record({
    totalSpend: fc.float({ min: 100, max: 100000, noNaN: true }),
    totalImpressions: fc.integer({ min: 1000, max: 1000000 }),
    totalClicks: fc.integer({ min: 10, max: 50000 }),
    totalConversions: fc.integer({ min: 0, max: 5000 }),
    avgCTR: fc.float({ min: 0, max: 10, noNaN: true }),
    avgCVR: fc.float({ min: 0, max: 20, noNaN: true }),
    avgROAS: fc.float({ min: 0, max: 15, noNaN: true }),
    avgCPA: fc.float({ min: 1, max: 500, noNaN: true }),
    avgCPM: fc.float({ min: 1, max: 100, noNaN: true }),
    avgFrequency: fc.float({ min: 1, max: 8, noNaN: true }),
    dateRange: fc.record({
      start: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
      end: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    }),
  });

/**
 * Generate arbitrary commission model (percentage or fixed)
 */
export const arbitraryCommissionModel = () =>
  fc.oneof(
    fc.record({
      model_type: fc.constant('percentage' as const),
      rate: fc.float({ min: 0.05, max: 0.30, noNaN: true }),
      target_roas: fc.float({ min: 1.5, max: 4, noNaN: true }),
    }),
    fc.record({
      model_type: fc.constant('fixed' as const),
      rate: fc.float({ min: 500, max: 5000, noNaN: true }),
      target_roas: fc.float({ min: 1.5, max: 4, noNaN: true }),
    })
  );

/**
 * Generate arbitrary campaign data for analysis
 */
export const arbitraryCampaignData = (): fc.Arbitrary<CampaignData> =>
  fc.record({
    campaign: fc.record({
      campaign_id: fc.uuid(),
      campaign_name: fc.string({ minLength: 5, maxLength: 100 }),
      status: fc.constantFrom('ACTIVE', 'PAUSED'),
      meta_campaign_id: fc.string({ minLength: 10, maxLength: 20 }),
    }),
    adSets: fc.array(
      fc.record({
        ad_set_id: fc.uuid(),
        ad_set_name: fc.string({ minLength: 5, maxLength: 100 }),
        budget: fc.float({ min: 100, max: 10000, noNaN: true }),
        status: fc.constantFrom('ACTIVE', 'PAUSED'),
      }),
      { minLength: 1, maxLength: 5 }
    ),
    ads: fc.array(
      fc.record({
        ad_id: fc.uuid(),
        ad_name: fc.string({ minLength: 5, maxLength: 100 }),
        status: fc.constantFrom('ACTIVE', 'PAUSED'),
      }),
      { minLength: 1, maxLength: 10 }
    ),
    metrics: fc.array(
      fc.record({
        date: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
        spend: fc.float({ min: 10, max: 5000, noNaN: true }),
        impressions: fc.integer({ min: 100, max: 100000 }),
        clicks: fc.integer({ min: 1, max: 5000 }),
        conversions: fc.integer({ min: 0, max: 500 }),
        roas: fc.float({ min: 0, max: 10, noNaN: true }),
        ctr: fc.float({ min: 0, max: 10, noNaN: true }),
        cpc: fc.float({ min: 0.1, max: 50, noNaN: true }),
        cpm: fc.float({ min: 1, max: 100, noNaN: true }),
        cpa: fc.float({ min: 1, max: 200, noNaN: true }),
        frequency: fc.float({ min: 1, max: 8, noNaN: true }),
      }),
      { minLength: 7, maxLength: 30 }
    ),
    client: fc.record({
      client_id: fc.uuid(),
      client_name: fc.string({ minLength: 3, maxLength: 100 }),
      industry: fc.constantFrom(
        'e-ticaret',
        'lojistik',
        'güzellik',
        'emlak',
        'sağlık',
        'eğitim',
        'finans',
        'turizm',
        'teknoloji',
        'gıda'
      ),
    }),
    commissionModel: arbitraryCommissionModel(),
  });

/**
 * Generate arbitrary issue
 */
export const arbitraryIssue = (): fc.Arbitrary<Issue> =>
  fc.record({
    severity: fc.constantFrom('critical', 'high', 'medium', 'low'),
    description: fc.string({ minLength: 20, maxLength: 200 }),
  });

/**
 * Generate arbitrary recommendation
 */
export const arbitraryRecommendation = (): fc.Arbitrary<Recommendation> =>
  fc.record({
    impact: fc.constantFrom('high', 'medium', 'low'),
    action: fc.string({ minLength: 20, maxLength: 200 }),
  });

/**
 * Generate arbitrary KPI metrics
 */
export const arbitraryKPIMetrics = (): fc.Arbitrary<KPIMetrics> =>
  fc.record({
    ctr: fc.string({ minLength: 5, maxLength: 100 }),
    cvr: fc.string({ minLength: 5, maxLength: 100 }),
    roas: fc.string({ minLength: 5, maxLength: 100 }),
    cpa: fc.string({ minLength: 5, maxLength: 100 }),
    cpm: fc.string({ minLength: 5, maxLength: 100 }),
    frequency: fc.string({ minLength: 5, maxLength: 100 }),
  });

/**
 * Generate arbitrary profit simulation
 */
export const arbitraryProfitSimulation = (): fc.Arbitrary<ProfitSimulation> =>
  fc.record({
    currentProfit: fc.float({ min: -10000, max: 100000, noNaN: true }),
    projectedProfit: fc.float({ min: -10000, max: 150000, noNaN: true }),
    percentageChange: fc.float({ min: -100, max: 200, noNaN: true }),
    currentRevenue: fc.float({ min: 0, max: 200000, noNaN: true }),
    projectedRevenue: fc.float({ min: 0, max: 300000, noNaN: true }),
    commission: fc.float({ min: 0, max: 50000, noNaN: true }),
  });

/**
 * Generate arbitrary metric comparison
 */
export const arbitraryMetricComparison = (): fc.Arbitrary<MetricComparison> =>
  fc.record({
    campaign: fc.float({ min: 0, max: 20, noNaN: true }),
    benchmark: fc.float({ min: 0, max: 20, noNaN: true }),
    status: fc.constantFrom('above', 'below', 'at'),
  });

/**
 * Generate arbitrary benchmark comparison
 */
export const arbitraryBenchmarkComparison = (): fc.Arbitrary<BenchmarkComparison> =>
  fc.record({
    industry: fc.constantFrom(
      'e-ticaret',
      'lojistik',
      'güzellik',
      'emlak',
      'sağlık',
      'eğitim',
      'finans',
      'turizm',
      'teknoloji',
      'gıda'
    ),
    metrics: fc.record({
      ctr: arbitraryMetricComparison(),
      cvr: arbitraryMetricComparison(),
      roas: arbitraryMetricComparison(),
    }),
  });

/**
 * Generate arbitrary media buyer analysis
 */
export const arbitraryMediaBuyerAnalysis = (): fc.Arbitrary<MediaBuyerAnalysis> =>
  fc.record({
    performanceScore: fc.integer({ min: 0, max: 100 }),
    decision: fc.constantFrom('scale', 'hold', 'kill'),
    justification: fc.string({ minLength: 20, maxLength: 300 }),
    clientJustification: fc.option(fc.string({ minLength: 20, maxLength: 300 }), { nil: undefined }),
    summary: fc.string({ minLength: 50, maxLength: 500 }),
    kpiOverview: arbitraryKPIMetrics(),
    issues: fc.array(arbitraryIssue(), { minLength: 0, maxLength: 10 }),
    recommendations: fc.array(arbitraryRecommendation(), { minLength: 1, maxLength: 10 }),
    nextTests: fc.array(fc.string({ minLength: 20, maxLength: 200 }), { minLength: 0, maxLength: 5 }),
    profitSimulation: arbitraryProfitSimulation(),
    industryBenchmark: fc.option(arbitraryBenchmarkComparison(), { nil: undefined }),
    analyzedAt: fc.date({ min: new Date('2024-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary metrics for Scale decision (score >= 70, ROAS > target, frequency < 3)
 */
export const arbitraryScaleMetrics = () =>
  fc.record({
    score: fc.integer({ min: 70, max: 100 }),
    roas: fc.float({ min: 3, max: 10, noNaN: true }),
    frequency: fc.float({ min: 1, max: 2.99, noNaN: true }),
    targetROAS: fc.float({ min: 1, max: 2.5, noNaN: true }),
  });

/**
 * Generate arbitrary metrics for Hold decision (score 40-69)
 */
export const arbitraryHoldMetrics = () =>
  fc.record({
    score: fc.integer({ min: 40, max: 69 }),
    roas: fc.float({ min: 1, max: 5, noNaN: true }),
    frequency: fc.float({ min: 1, max: 4, noNaN: true }),
    targetROAS: fc.float({ min: 1.5, max: 3, noNaN: true }),
  });

/**
 * Generate arbitrary metrics for Kill decision (score < 40 OR frequency > 4.5 OR ROAS very low)
 */
export const arbitraryKillMetrics = () =>
  fc.oneof(
    // Low score
    fc.record({
      score: fc.integer({ min: 0, max: 39 }),
      roas: fc.float({ min: 0, max: 5, noNaN: true }),
      frequency: fc.float({ min: 1, max: 4, noNaN: true }),
      targetROAS: fc.float({ min: 1.5, max: 3, noNaN: true }),
    }),
    // High frequency
    fc.record({
      score: fc.integer({ min: 40, max: 100 }),
      roas: fc.float({ min: 1, max: 5, noNaN: true }),
      frequency: fc.float({ min: 4.51, max: 8, noNaN: true }),
      targetROAS: fc.float({ min: 1.5, max: 3, noNaN: true }),
    }),
    // Very low ROAS
    fc.record({
      score: fc.integer({ min: 40, max: 100 }),
      roas: fc.float({ min: 0, max: 0.5, noNaN: true }),
      frequency: fc.float({ min: 1, max: 4, noNaN: true }),
      targetROAS: fc.float({ min: 2, max: 4, noNaN: true }),
    })
  );

/**
 * Generate arbitrary 30-day date range
 */
export const arbitrary30DayDateRange = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  
  return fc.constant({
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  });
};

/**
 * Generate arbitrary metrics within 30-day window
 */
export const arbitraryMetricsIn30Days = () => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 30);
  
  return fc.array(
    fc.record({
      date: fc.date({ min: startDate, max: endDate }).map(d => d.toISOString().split('T')[0]),
      spend: fc.float({ min: 10, max: 5000, noNaN: true }),
      impressions: fc.integer({ min: 100, max: 100000 }),
      clicks: fc.integer({ min: 1, max: 5000 }),
      conversions: fc.integer({ min: 0, max: 500 }),
      roas: fc.float({ min: 0, max: 10, noNaN: true }),
      ctr: fc.float({ min: 0, max: 10, noNaN: true }),
      cpc: fc.float({ min: 0.1, max: 50, noNaN: true }),
      cpm: fc.float({ min: 1, max: 100, noNaN: true }),
      cpa: fc.float({ min: 1, max: 200, noNaN: true }),
      frequency: fc.float({ min: 1, max: 8, noNaN: true }),
    }),
    { minLength: 7, maxLength: 30 }
  );
};

/**
 * Generate arbitrary Turkish Lira formatted string
 */
export const arbitraryTurkishLiraString = () =>
  fc.float({ min: 0, max: 1000000, noNaN: true }).map(amount => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  });

/**
 * Generate arbitrary performance score (0-100)
 */
export const arbitraryPerformanceScore = () =>
  fc.integer({ min: 0, max: 100 });

/**
 * Generate arbitrary decision type
 */
export const arbitraryDecision = () =>
  fc.constantFrom('scale', 'hold', 'kill');

/**
 * Generate arbitrary severity level
 */
export const arbitrarySeverity = () =>
  fc.constantFrom('critical', 'high', 'medium', 'low');

/**
 * Generate arbitrary impact level
 */
export const arbitraryImpact = () =>
  fc.constantFrom('high', 'medium', 'low');

/**
 * Generate arbitrary industry for benchmarking
 */
export const arbitraryIndustry = () =>
  fc.constantFrom(
    'e-ticaret',
    'lojistik',
    'güzellik',
    'emlak',
    'sağlık',
    'eğitim',
    'finans',
    'turizm',
    'teknoloji',
    'gıda'
  );
