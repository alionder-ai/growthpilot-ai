/**
 * Media Buyer Data Collection
 * 
 * Collects and aggregates campaign data for AI analysis.
 * Fetches campaign, ad sets, ads, and 30-day metrics from database.
 */

import { createClient } from '@/lib/supabase/server';
import { CampaignData, AggregatedMetrics } from '@/lib/types/media-buyer';
import { MEDIA_BUYER_ERRORS } from '@/lib/ai/prompts';

/**
 * Collect complete campaign data for analysis
 * 
 * @param campaignId - Campaign UUID
 * @param userId - User UUID for authorization
 * @returns Complete campaign data with metrics
 * @throws Error if data is insufficient or missing
 */
export async function collectCampaignData(
  campaignId: string,
  userId: string
): Promise<CampaignData> {
  const supabase = await createClient();

  // DEBUG - environment variables kontrol
  console.log('SUPABASE_URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Get campaign (campaign_name is correct per schema)
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('campaign_id, campaign_name, status, meta_campaign_id, client_id')
    .eq('campaign_id', campaignId)
    .single();

  if (campaignError || !campaign) {
    throw new Error(`CAMPAIGN_DEBUG: id=${campaignId}, error=${campaignError?.message}, code=${campaignError?.code}`);
  }

  // Get client separately (no join)
  const { data: clientData, error: clientError } = await supabase
    .from('clients')
    .select('client_id, name, industry, user_id')
    .eq('client_id', campaign.client_id)
    .single();

  if (clientError || !clientData) {
    throw new Error(MEDIA_BUYER_ERRORS.CAMPAIGN_NOT_FOUND);
  }

  // Verify ownership
  if (clientData.user_id !== userId) {
    throw new Error(MEDIA_BUYER_ERRORS.CAMPAIGN_NOT_FOUND);
  }

  // Get commission model separately
  const { data: commissionModelData } = await supabase
    .from('commission_models')
    .select('commission_percentage, calculation_basis')
    .eq('client_id', campaign.client_id)
    .single();

  const commissionModel = {
    model_type: 'percentage',
    rate: commissionModelData?.commission_percentage ? commissionModelData.commission_percentage / 100 : 0.15,
    target_roas: 2.0
  };

  // Fetch ad sets
  const { data: adSets, error: adSetsError } = await supabase
    .from('ad_sets')
    .select('ad_set_id, ad_set_name, budget, status')
    .eq('campaign_id', campaignId);

  if (adSetsError) {
    throw new Error(MEDIA_BUYER_ERRORS.DATABASE_ERROR);
  }

  // Get ad set IDs
  const adSetIds = (adSets || []).map((as: any) => as.ad_set_id);

  // Fetch ads via ad_set_id
  const { data: ads, error: adsError } = await supabase
    .from('ads')
    .select('ad_id, ad_name, status')
    .in('ad_set_id', adSetIds);

  if (adsError) {
    throw new Error(MEDIA_BUYER_ERRORS.DATABASE_ERROR);
  }

  // Get ad IDs
  const adIds = (ads || []).map((a: any) => a.ad_id);

  // Fetch 30-day metrics via ad_id (meta_metrics only has ad_id, not campaign_id)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: metrics, error: metricsError } = await supabase
    .from('meta_metrics')
    .select('date, spend, impressions, clicks, conversions, roas, ctr, cpc, cpm, cpa, frequency, purchases, conversations, messaging_conversations_started, link_clicks, landing_page_views, post_engagement, post_reactions, leads, cost_per_lead, cost_per_conversation, objective')
    .in('ad_id', adIds)
    .gte('date', thirtyDaysAgoStr)
    .order('date', { ascending: true });

  if (metricsError) {
    throw new Error(MEDIA_BUYER_ERRORS.DATABASE_ERROR);
  }

  // Validate sufficient data (at least 1 day for testing)
  if (!metrics || metrics.length < 1) {
    throw new Error(MEDIA_BUYER_ERRORS.INSUFFICIENT_DATA);
  }

  // Extract commission model
  if (!commissionModel) {
    throw new Error('Komisyon modeli bulunamadı');
  }

  return {
    campaign: {
      campaign_id: campaign.campaign_id,
      campaign_name: campaign.campaign_name,
      status: campaign.status,
      meta_campaign_id: campaign.meta_campaign_id,
    },
    adSets: adSets || [],
    ads: ads || [],
    metrics: metrics.map(m => ({
      date: m.date,
      spend: m.spend || 0,
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
      conversions: m.conversions || 0,
      roas: m.roas || 0,
      ctr: m.ctr || 0,
      cpc: m.cpc || 0,
      cpm: m.cpm || 0,
      cpa: m.cpa || 0,
      frequency: m.frequency || 0,
    })),
    client: {
      client_id: clientData.client_id,
      client_name: clientData.name,
      industry: clientData.industry || 'Genel',
    },
    commissionModel: {
      model_type: commissionModel.model_type,
      rate: commissionModel.rate,
      target_roas: commissionModel.target_roas || 2.0,
    },
  };
}

/**
 * Aggregate metrics from daily data
 * 
 * @param metrics - Array of daily metrics
 * @returns Aggregated metrics with totals and averages
 */
export function aggregateMetrics(
  metrics: CampaignData['metrics']
): AggregatedMetrics {
  if (metrics.length === 0) {
    throw new Error(MEDIA_BUYER_ERRORS.MISSING_METRICS);
  }

  // Calculate totals
  const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

  // Calculate averages (weighted by spend for some metrics)
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCVR = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  // For ROAS, CPM, and frequency, use weighted average by spend
  let weightedROAS = 0;
  let weightedCPM = 0;
  let weightedFrequency = 0;

  metrics.forEach(m => {
    if (m.spend > 0) {
      const weight = m.spend / totalSpend;
      weightedROAS += m.roas * weight;
      weightedCPM += m.cpm * weight;
      weightedFrequency += m.frequency * weight;
    }
  });

  const avgROAS = weightedROAS;
  const avgCPM = weightedCPM;
  const avgFrequency = weightedFrequency;

  // Date range
  const dates = metrics.map(m => m.date).sort();
  const dateRange = {
    start: dates[0],
    end: dates[dates.length - 1],
  };

  return {
    totalSpend,
    totalImpressions,
    totalClicks,
    totalConversions,
    avgCTR,
    avgCVR,
    avgROAS,
    avgCPA,
    avgCPM,
    avgFrequency,
    dateRange,
  };
}
