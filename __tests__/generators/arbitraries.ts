/**
 * Property-Based Test Data Generators
 * 
 * Uses fast-check library to generate arbitrary test data for property-based testing.
 */

import * as fc from 'fast-check';

/**
 * Generate arbitrary user data
 */
export const arbitraryUser = () =>
  fc.record({
    user_id: fc.uuid(),
    email: fc.emailAddress(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary client data
 */
export const arbitraryClient = () =>
  fc.record({
    client_id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 3, maxLength: 100 }),
    industry: fc.constantFrom(
      'logistics',
      'e-commerce',
      'beauty',
      'real estate',
      'healthcare',
      'education'
    ),
    contact_email: fc.emailAddress(),
    contact_phone: fc.string({ minLength: 10, maxLength: 15 }).map(s => s.replace(/[^0-9]/g, '')),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary commission model data
 */
export const arbitraryCommissionModel = () =>
  fc.record({
    model_id: fc.uuid(),
    client_id: fc.uuid(),
    commission_percentage: fc.float({ min: 0, max: 100, noNaN: true }),
    calculation_basis: fc.constantFrom('sales_revenue', 'total_revenue'),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary campaign data
 */
export const arbitraryCampaign = () =>
  fc.record({
    campaign_id: fc.uuid(),
    client_id: fc.uuid(),
    meta_campaign_id: fc.string({ minLength: 10, maxLength: 20 }),
    campaign_name: fc.string({ minLength: 5, maxLength: 100 }),
    status: fc.constantFrom('ACTIVE', 'PAUSED', 'ARCHIVED'),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary ad set data
 */
export const arbitraryAdSet = () =>
  fc.record({
    ad_set_id: fc.uuid(),
    campaign_id: fc.uuid(),
    meta_ad_set_id: fc.string({ minLength: 10, maxLength: 20 }),
    ad_set_name: fc.string({ minLength: 5, maxLength: 100 }),
    budget: fc.float({ min: 100, max: 100000, noNaN: true }),
    status: fc.constantFrom('ACTIVE', 'PAUSED', 'ARCHIVED'),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary ad data
 */
export const arbitraryAd = () =>
  fc.record({
    ad_id: fc.uuid(),
    ad_set_id: fc.uuid(),
    meta_ad_id: fc.string({ minLength: 10, maxLength: 20 }),
    ad_name: fc.string({ minLength: 5, maxLength: 100 }),
    creative_url: fc.webUrl(),
    status: fc.constantFrom('ACTIVE', 'PAUSED', 'ARCHIVED'),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary metrics data
 */
export const arbitraryMetrics = () =>
  fc.record({
    metric_id: fc.uuid(),
    ad_id: fc.uuid(),
    date: fc.date({ min: new Date('2023-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    spend: fc.float({ min: 0, max: 50000, noNaN: true }),
    impressions: fc.integer({ min: 0, max: 1000000 }),
    clicks: fc.integer({ min: 0, max: 50000 }),
    conversions: fc.integer({ min: 0, max: 1000 }),
    roas: fc.float({ min: 0, max: 10, noNaN: true }),
    ctr: fc.float({ min: 0, max: 20, noNaN: true }),
    cpc: fc.float({ min: 0, max: 100, noNaN: true }),
    cpm: fc.float({ min: 0, max: 1000, noNaN: true }),
    cpa: fc.float({ min: 0, max: 500, noNaN: true }),
    frequency: fc.float({ min: 1, max: 10, noNaN: true }),
    add_to_cart: fc.integer({ min: 0, max: 500 }),
    purchases: fc.integer({ min: 0, max: 200 }),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary lead data
 */
export const arbitraryLead = () =>
  fc.record({
    lead_id: fc.uuid(),
    ad_id: fc.uuid(),
    lead_source: fc.constantFrom('facebook', 'instagram', 'messenger'),
    contact_info: fc.record({
      name: fc.string({ minLength: 3, maxLength: 50 }),
      email: fc.emailAddress(),
      phone: fc.string({ minLength: 10, maxLength: 15 }),
    }),
    converted_status: fc.boolean(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
    updated_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary AI recommendation data
 */
export const arbitraryAIRecommendation = () =>
  fc.record({
    recommendation_id: fc.uuid(),
    client_id: fc.uuid(),
    recommendation_type: fc.constantFrom('action_plan', 'strategy_card'),
    content: fc.oneof(
      // Action plan content
      fc.array(
        fc.record({
          action: fc.string({ minLength: 10, maxLength: 200 }),
          priority: fc.constantFrom('high', 'medium', 'low'),
          expected_impact: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        { minLength: 1, maxLength: 5 }
      ),
      // Strategy card content
      fc.record({
        do_actions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        dont_actions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 2, maxLength: 5 }),
        reasoning: fc.string({ minLength: 20, maxLength: 200 }),
      })
    ),
    priority: fc.constantFrom('high', 'medium', 'low'),
    status: fc.constantFrom('active', 'completed', 'dismissed'),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary creative library data
 */
export const arbitraryCreativeLibrary = () =>
  fc.record({
    creative_id: fc.uuid(),
    user_id: fc.uuid(),
    industry: fc.constantFrom(
      'logistics',
      'e-commerce',
      'beauty',
      'real estate',
      'healthcare',
      'education'
    ),
    content_type: fc.constantFrom('ad_copy', 'video_script', 'voiceover'),
    content_text: fc.string({ minLength: 50, maxLength: 1000 }),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary report data
 */
export const arbitraryReport = () =>
  fc.record({
    report_id: fc.uuid(),
    client_id: fc.uuid(),
    report_type: fc.constantFrom('weekly', 'monthly'),
    period_start: fc.date({ min: new Date('2023-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    period_end: fc.date({ min: new Date('2023-01-01'), max: new Date() }).map(d => d.toISOString().split('T')[0]),
    file_url: fc.webUrl(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary notification data
 */
export const arbitraryNotification = () =>
  fc.record({
    notification_id: fc.uuid(),
    user_id: fc.uuid(),
    message: fc.string({ minLength: 10, maxLength: 500 }),
    type: fc.constantFrom('roas_alert', 'budget_alert', 'sync_error', 'general'),
    read_status: fc.boolean(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });

/**
 * Generate arbitrary date range
 */
export const arbitraryDateRange = () =>
  fc.record({
    start: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
    end: fc.date({ min: new Date('2023-01-01'), max: new Date() }),
  }).map(({ start, end }) => ({
    start: start.toISOString().split('T')[0],
    end: end > start ? end.toISOString().split('T')[0] : start.toISOString().split('T')[0],
  }));

/**
 * Generate arbitrary valid email
 */
export const arbitraryEmail = () => fc.emailAddress();

/**
 * Generate arbitrary valid password (min 8 chars, with uppercase, lowercase, number)
 */
export const arbitraryPassword = () =>
  fc.string({ minLength: 8, maxLength: 20 }).filter(s => {
    return /[A-Z]/.test(s) && /[a-z]/.test(s) && /[0-9]/.test(s);
  });

/**
 * Generate arbitrary percentage (0-100)
 */
export const arbitraryPercentage = () => fc.float({ min: 0, max: 100, noNaN: true });

/**
 * Generate arbitrary positive number
 */
export const arbitraryPositiveNumber = () => fc.float({ min: 0.01, max: 1000000, noNaN: true });

/**
 * Generate arbitrary Turkish Lira amount
 */
export const arbitraryTRYAmount = () => fc.float({ min: 0, max: 1000000, noNaN: true });

/**
 * Generate arbitrary ROAS value (typically 0-10)
 */
export const arbitraryROAS = () => fc.float({ min: 0, max: 10, noNaN: true });

/**
 * Generate arbitrary frequency value (typically 1-10)
 */
export const arbitraryFrequency = () => fc.float({ min: 1, max: 10, noNaN: true });

/**
 * Generate arbitrary CTR value (0-20%)
 */
export const arbitraryCTR = () => fc.float({ min: 0, max: 20, noNaN: true });

/**
 * Generate arbitrary industry
 */
export const arbitraryIndustry = () =>
  fc.constantFrom('logistics', 'e-commerce', 'beauty', 'real estate', 'healthcare', 'education');

/**
 * Generate arbitrary content type
 */
export const arbitraryContentType = () => fc.constantFrom('ad_copy', 'video_script', 'voiceover');

/**
 * Generate arbitrary campaign status
 */
export const arbitraryCampaignStatus = () => fc.constantFrom('ACTIVE', 'PAUSED', 'ARCHIVED');

/**
 * Generate arbitrary priority level
 */
export const arbitraryPriority = () => fc.constantFrom('high', 'medium', 'low');

/**
 * Generate arbitrary scored item (for target audience analysis)
 */
export const arbitraryScoredItem = () =>
  fc.record({
    text: fc.string({ minLength: 5, maxLength: 200 }),
    score: fc.integer({ min: 1, max: 10 }),
  });

/**
 * Generate arbitrary customer segment (for target audience analysis)
 */
export const arbitraryCustomerSegment = () =>
  fc.record({
    profil: fc.string({ minLength: 20, maxLength: 500 }),
    icselArzular: fc.array(arbitraryScoredItem(), { minLength: 3, maxLength: 10 }),
    dissalArzular: fc.array(arbitraryScoredItem(), { minLength: 3, maxLength: 10 }),
    icselEngeller: fc.array(arbitraryScoredItem(), { minLength: 3, maxLength: 10 }),
    dissalEngeller: fc.array(arbitraryScoredItem(), { minLength: 3, maxLength: 10 }),
    ihtiyaclar: fc.array(arbitraryScoredItem(), { minLength: 3, maxLength: 10 }),
  });

/**
 * Generate arbitrary unnecessary customer (for target audience analysis)
 */
export const arbitraryUnnecessaryCustomer = () =>
  fc.record({
    profil: fc.string({ minLength: 20, maxLength: 500 }),
  });

/**
 * Generate arbitrary irresistible offers (for target audience analysis)
 */
export const arbitraryIrresistibleOffers = () =>
  fc.record({
    mukemmelMusteriTeklif: fc.string({ minLength: 20, maxLength: 500 }),
    mecburiMusteriTeklif: fc.string({ minLength: 20, maxLength: 500 }),
    gereksizMusteriTeklif: fc.string({ minLength: 20, maxLength: 500 }),
  });

/**
 * Generate arbitrary strategic analysis (for target audience analysis)
 */
export const arbitraryStrategicAnalysis = () =>
  fc.record({
    mukemmelMusteri: arbitraryCustomerSegment(),
    mecburiMusteri: arbitraryCustomerSegment(),
    gereksizMusteri: arbitraryUnnecessaryCustomer(),
    reddedilemezTeklifler: arbitraryIrresistibleOffers(),
  });

/**
 * Generate arbitrary target audience analysis record
 */
export const arbitraryTargetAudienceAnalysis = () =>
  fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    industry: fc.string({ minLength: 3, maxLength: 100 }),
    analysis_data: arbitraryStrategicAnalysis(),
    created_at: fc.date({ min: new Date('2020-01-01'), max: new Date() }).map(d => d.toISOString()),
  });
