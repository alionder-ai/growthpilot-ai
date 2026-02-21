import { AdInsights } from './client';

export interface ParsedMetrics {
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  cpa: number | null;
  frequency: number | null;
  add_to_cart: number;
  purchases: number;
  revenue: number;
}

/**
 * Parses Meta API insights response and calculates derived metrics
 */
export function parseMetrics(insights: AdInsights): ParsedMetrics {
  const spend = parseFloat(insights.spend) || 0;
  const impressions = parseInt(insights.impressions) || 0;
  const clicks = parseInt(insights.clicks) || 0;
  const frequency = insights.frequency ? parseFloat(insights.frequency) : null;

  // Parse actions array
  let conversions = 0;
  let add_to_cart = 0;
  let purchases = 0;

  if (insights.actions) {
    for (const action of insights.actions) {
      switch (action.action_type) {
        case 'purchase':
        case 'omni_purchase':
          conversions += parseInt(action.value) || 0;
          purchases += parseInt(action.value) || 0;
          break;
        case 'add_to_cart':
        case 'omni_add_to_cart':
          add_to_cart += parseInt(action.value) || 0;
          break;
      }
    }
  }

  // Parse action values for revenue
  let revenue = 0;
  if (insights.action_values) {
    for (const actionValue of insights.action_values) {
      if (
        actionValue.action_type === 'purchase' ||
        actionValue.action_type === 'omni_purchase'
      ) {
        revenue += parseFloat(actionValue.value) || 0;
      }
    }
  }

  // Calculate derived metrics
  const roas = spend > 0 && revenue > 0 ? revenue / spend : null;
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
  const cpc = clicks > 0 ? spend / clicks : null;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : null;
  const cpa = conversions > 0 ? spend / conversions : null;

  return {
    spend,
    impressions,
    clicks,
    conversions,
    roas,
    ctr,
    cpc,
    cpm,
    cpa,
    frequency,
    add_to_cart,
    purchases,
    revenue,
  };
}

/**
 * Stores parsed metrics in the database
 */
export async function storeMetrics(
  supabase: any,
  adId: string,
  date: string,
  metrics: ParsedMetrics
) {
  const { error } = await supabase
    .from('meta_metrics')
    .upsert({
      ad_id: adId,
      date,
      spend: metrics.spend,
      impressions: metrics.impressions,
      clicks: metrics.clicks,
      conversions: metrics.conversions,
      roas: metrics.roas,
      ctr: metrics.ctr,
      cpc: metrics.cpc,
      cpm: metrics.cpm,
      cpa: metrics.cpa,
      frequency: metrics.frequency,
      add_to_cart: metrics.add_to_cart,
      purchases: metrics.purchases,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'ad_id,date',
    });

  if (error) {
    console.error('Error storing metrics:', error);
    throw error;
  }
}

/**
 * Batch stores metrics for multiple ads
 */
export async function batchStoreMetrics(
  supabase: any,
  metricsData: Array<{
    adId: string;
    date: string;
    metrics: ParsedMetrics;
  }>
) {
  const records = metricsData.map(({ adId, date, metrics }) => ({
    ad_id: adId,
    date,
    spend: metrics.spend,
    impressions: metrics.impressions,
    clicks: metrics.clicks,
    conversions: metrics.conversions,
    roas: metrics.roas,
    ctr: metrics.ctr,
    cpc: metrics.cpc,
    cpm: metrics.cpm,
    cpa: metrics.cpa,
    frequency: metrics.frequency,
    add_to_cart: metrics.add_to_cart,
    purchases: metrics.purchases,
    created_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('meta_metrics')
    .upsert(records, {
      onConflict: 'ad_id,date',
    });

  if (error) {
    console.error('Error batch storing metrics:', error);
    throw error;
  }

  return records.length;
}
