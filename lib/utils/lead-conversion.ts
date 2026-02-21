/**
 * Lead conversion rate calculation utilities
 * Calculates conversion rates per ad and per campaign
 */

import { createClient } from '@/lib/supabase/server';

export interface LeadConversionRate {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number; // Percentage (0-100)
}

export interface AdConversionRate extends LeadConversionRate {
  adId: string;
  adName: string;
}

export interface CampaignConversionRate extends LeadConversionRate {
  campaignId: string;
  campaignName: string;
  adConversionRates: AdConversionRate[];
}

/**
 * Calculate conversion rate for a specific ad
 * @param adId - The ad UUID
 * @returns Conversion rate data for the ad
 */
export async function calculateAdConversionRate(
  adId: string
): Promise<AdConversionRate | null> {
  try {
    const supabase = await createClient();

    // Get ad info
    const { data: ad, error: adError } = await supabase
      .from('ads')
      .select('ad_id, ad_name')
      .eq('ad_id', adId)
      .single();

    if (adError || !ad) {
      console.error('Error fetching ad:', adError);
      return null;
    }

    // Get all leads for this ad
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('lead_id, converted_status')
      .eq('ad_id', adId);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return null;
    }

    const totalLeads = leads?.length || 0;
    const convertedLeads = leads?.filter(lead => lead.converted_status).length || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    return {
      adId: ad.ad_id,
      adName: ad.ad_name,
      totalLeads,
      convertedLeads,
      conversionRate
    };
  } catch (error) {
    console.error('Unexpected error calculating ad conversion rate:', error);
    return null;
  }
}

/**
 * Calculate conversion rate for a specific campaign
 * Aggregates conversion rates across all ads in the campaign
 * @param campaignId - The campaign UUID
 * @returns Conversion rate data for the campaign and its ads
 */
export async function calculateCampaignConversionRate(
  campaignId: string
): Promise<CampaignConversionRate | null> {
  try {
    const supabase = await createClient();

    // Get campaign info
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('campaign_id, campaign_name')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('Error fetching campaign:', campaignError);
      return null;
    }

    // Get all ads in this campaign with their leads
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select(`
        ad_id,
        ad_name,
        ad_sets!inner (
          campaign_id
        )
      `)
      .eq('ad_sets.campaign_id', campaignId);

    if (adsError) {
      console.error('Error fetching ads:', adsError);
      return null;
    }

    if (!ads || ads.length === 0) {
      return {
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        totalLeads: 0,
        convertedLeads: 0,
        conversionRate: 0,
        adConversionRates: []
      };
    }

    // Calculate conversion rate for each ad
    const adConversionRates: AdConversionRate[] = [];
    let totalLeadsAcrossAds = 0;
    let totalConvertedAcrossAds = 0;

    for (const ad of ads) {
      const adRate = await calculateAdConversionRate(ad.ad_id);
      if (adRate) {
        adConversionRates.push(adRate);
        totalLeadsAcrossAds += adRate.totalLeads;
        totalConvertedAcrossAds += adRate.convertedLeads;
      }
    }

    const campaignConversionRate = totalLeadsAcrossAds > 0 
      ? (totalConvertedAcrossAds / totalLeadsAcrossAds) * 100 
      : 0;

    return {
      campaignId: campaign.campaign_id,
      campaignName: campaign.campaign_name,
      totalLeads: totalLeadsAcrossAds,
      convertedLeads: totalConvertedAcrossAds,
      conversionRate: campaignConversionRate,
      adConversionRates
    };
  } catch (error) {
    console.error('Unexpected error calculating campaign conversion rate:', error);
    return null;
  }
}

/**
 * Calculate conversion rates for multiple campaigns
 * @param campaignIds - Array of campaign UUIDs
 * @returns Array of conversion rate data for each campaign
 */
export async function calculateMultipleCampaignConversionRates(
  campaignIds: string[]
): Promise<CampaignConversionRate[]> {
  const results: CampaignConversionRate[] = [];

  for (const campaignId of campaignIds) {
    const rate = await calculateCampaignConversionRate(campaignId);
    if (rate) {
      results.push(rate);
    }
  }

  return results;
}

/**
 * Get lead quality summary for AI context
 * Returns aggregated lead quality data for use in AI prompts
 * @param campaignId - The campaign UUID
 * @returns Summary text for AI context
 */
export async function getLeadQualitySummary(
  campaignId: string
): Promise<string> {
  const conversionData = await calculateCampaignConversionRate(campaignId);

  if (!conversionData || conversionData.totalLeads === 0) {
    return 'Lead verisi mevcut değil.';
  }

  const { totalLeads, convertedLeads, conversionRate } = conversionData;

  return `Lead Kalitesi: ${totalLeads} potansiyel müşteriden ${convertedLeads} tanesi dönüşüm sağladı (Dönüşüm Oranı: %${conversionRate.toFixed(1)}).`;
}
