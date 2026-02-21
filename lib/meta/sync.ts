import { createMetaAPIClient, DateRange } from './client';
import type { createClient } from '@/lib/supabase/server';
import { checkROASAndNotify, checkBudgetAndNotify, notifySyncError } from '@/lib/utils/notifications';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface SyncResult {
  success: boolean;
  campaignsProcessed: number;
  adsProcessed: number;
  metricsStored: number;
  errors: string[];
}

/**
 * Calculate metrics from Meta API insights
 */
function calculateMetrics(insights: any) {
  const spend = parseFloat(insights.spend || '0');
  const impressions = parseInt(insights.impressions || '0', 10);
  const clicks = parseInt(insights.clicks || '0', 10);
  
  // Extract actions
  const actions = insights.actions || [];
  const actionValues = insights.action_values || [];
  
  const purchases = actions.find((a: any) => a.action_type === 'purchase')?.value || '0';
  const addToCart = actions.find((a: any) => a.action_type === 'add_to_cart')?.value || '0';
  const purchaseValue = actionValues.find((a: any) => a.action_type === 'purchase')?.value || '0';
  
  const conversions = parseInt(purchases, 10);
  const frequency = parseFloat(insights.frequency || '0');
  
  // Calculate derived metrics
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cpc = clicks > 0 ? spend / clicks : 0;
  const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? parseFloat(purchaseValue) / spend : 0;
  
  return {
    spend,
    impressions,
    clicks,
    conversions,
    roas: parseFloat(roas.toFixed(2)),
    ctr: parseFloat(ctr.toFixed(2)),
    cpc: parseFloat(cpc.toFixed(2)),
    cpm: parseFloat(cpm.toFixed(2)),
    cpa: parseFloat(cpa.toFixed(2)),
    frequency: parseFloat(frequency.toFixed(2)),
    add_to_cart: parseInt(addToCart, 10),
    purchases: conversions,
  };
}

/**
 * Sync Meta Ads data for a user
 */
export async function syncMetaData(
  supabase: SupabaseClient,
  userId: string,
  encryptedAccessToken: string,
  adAccountId: string,
  dateRange: DateRange
): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    campaignsProcessed: 0,
    adsProcessed: 0,
    metricsStored: 0,
    errors: [],
  };

  try {
    // Create Meta API client
    const metaClient = createMetaAPIClient(encryptedAccessToken);

    // Get all clients for this user
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('user_id', userId);

    if (clientsError) {
      result.errors.push(`Müşteriler alınamadı: ${clientsError.message}`);
      result.success = false;
      return result;
    }

    if (!clients || clients.length === 0) {
      return result; // No clients to sync
    }

    // Fetch campaigns from Meta API
    const metaCampaigns = await metaClient.getCampaigns(adAccountId);

    for (const metaCampaign of metaCampaigns) {
      try {
        // Check if campaign exists in database
        const { data: existingCampaign } = await supabase
          .from('campaigns')
          .select('campaign_id, client_id')
          .eq('meta_campaign_id', metaCampaign.id)
          .single();

        let campaignId: string;
        let clientId: string;

        if (existingCampaign) {
          // Update existing campaign
          campaignId = existingCampaign.campaign_id;
          clientId = existingCampaign.client_id;

          await supabase
            .from('campaigns')
            .update({
              campaign_name: metaCampaign.name,
              status: metaCampaign.status,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('campaign_id', campaignId);
        } else {
          // Create new campaign (assign to first client for now)
          clientId = clients[0].client_id;

          const { data: newCampaign, error: createError } = await supabase
            .from('campaigns')
            .insert({
              client_id: clientId,
              meta_campaign_id: metaCampaign.id,
              campaign_name: metaCampaign.name,
              status: metaCampaign.status,
              last_synced_at: new Date().toISOString(),
            })
            .select('campaign_id')
            .single();

          if (createError || !newCampaign) {
            result.errors.push(`Kampanya oluşturulamadı: ${metaCampaign.name}`);
            continue;
          }

          campaignId = newCampaign.campaign_id;
        }

        result.campaignsProcessed++;

        // Fetch ad sets for this campaign
        const adSets = await metaClient.getAdSets(metaCampaign.id);

        for (const adSet of adSets) {
          try {
            // Upsert ad set
            const { data: existingAdSet } = await supabase
              .from('ad_sets')
              .select('ad_set_id')
              .eq('meta_ad_set_id', adSet.id)
              .single();

            let adSetId: string;

            if (existingAdSet) {
              adSetId = existingAdSet.ad_set_id;
              await supabase
                .from('ad_sets')
                .update({
                  ad_set_name: adSet.name,
                  budget: adSet.daily_budget || adSet.lifetime_budget || null,
                  status: adSet.status,
                })
                .eq('ad_set_id', adSetId);
            } else {
              const { data: newAdSet, error: adSetError } = await supabase
                .from('ad_sets')
                .insert({
                  campaign_id: campaignId,
                  meta_ad_set_id: adSet.id,
                  ad_set_name: adSet.name,
                  budget: adSet.daily_budget || adSet.lifetime_budget || null,
                  status: adSet.status,
                })
                .select('ad_set_id')
                .single();

              if (adSetError || !newAdSet) {
                result.errors.push(`Reklam seti oluşturulamadı: ${adSet.name}`);
                continue;
              }

              adSetId = newAdSet.ad_set_id;
            }

            // Fetch ads for this ad set
            const ads = await metaClient.getAds(adSet.id);

            for (const ad of ads) {
              try {
                // Upsert ad
                const { data: existingAd } = await supabase
                  .from('ads')
                  .select('ad_id')
                  .eq('meta_ad_id', ad.id)
                  .single();

                let adId: string;

                if (existingAd) {
                  adId = existingAd.ad_id;
                  await supabase
                    .from('ads')
                    .update({
                      ad_name: ad.name,
                      creative_url: ad.creative?.thumbnail_url || null,
                      status: ad.status,
                    })
                    .eq('ad_id', adId);
                } else {
                  const { data: newAd, error: adError } = await supabase
                    .from('ads')
                    .insert({
                      ad_set_id: adSetId,
                      meta_ad_id: ad.id,
                      ad_name: ad.name,
                      creative_url: ad.creative?.thumbnail_url || null,
                      status: ad.status,
                    })
                    .select('ad_id')
                    .single();

                  if (adError || !newAd) {
                    result.errors.push(`Reklam oluşturulamadı: ${ad.name}`);
                    continue;
                  }

                  adId = newAd.ad_id;
                }

                result.adsProcessed++;

                // Fetch insights for this ad
                const insights = await metaClient.getAdInsights(ad.id, dateRange);

                if (insights) {
                  const metrics = calculateMetrics(insights);

                  // Upsert metrics
                  const { error: metricsError } = await supabase
                    .from('meta_metrics')
                    .upsert({
                      ad_id: adId,
                      date: insights.date_start,
                      ...metrics,
                    }, {
                      onConflict: 'ad_id,date',
                    });

                  if (metricsError) {
                    result.errors.push(`Metrikler kaydedilemedi: ${ad.name}`);
                  } else {
                    result.metricsStored++;
                    
                    // Check ROAS and create notification if needed
                    if (metrics.roas > 0) {
                      await checkROASAndNotify(
                        userId,
                        metaCampaign.name,
                        metrics.roas
                      );
                    }
                    
                    // Check budget and create notification if needed
                    if (adSet.daily_budget && metrics.spend > 0) {
                      const dailyBudget = parseFloat(adSet.daily_budget);
                      await checkBudgetAndNotify(
                        userId,
                        metaCampaign.name,
                        metrics.spend,
                        dailyBudget
                      );
                    }
                  }
                }
              } catch (adError) {
                result.errors.push(`Reklam işlenirken hata: ${ad.name}`);
              }
            }
          } catch (adSetError) {
            result.errors.push(`Reklam seti işlenirken hata: ${adSet.name}`);
          }
        }
      } catch (campaignError) {
        result.errors.push(`Kampanya işlenirken hata: ${metaCampaign.name}`);
      }
    }

    // If there were errors, mark as partial success
    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Senkronizasyon hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    return result;
  }
}

/**
 * Sync all users' Meta data (called by cron job)
 */
export async function syncAllUsers(supabase: SupabaseClient): Promise<void> {
  try {
    // Get all users with active Meta tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('meta_tokens')
      .select('user_id, encrypted_access_token, ad_account_id, expires_at');

    if (tokensError || !tokens) {
      console.error('Meta tokenları alınamadı:', tokensError);
      return;
    }

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0],
    };

    for (const token of tokens) {
      // Check if token is expired
      const expiresAt = new Date(token.expires_at);
      if (expiresAt < new Date()) {
        // Create notification for expired token
        await notifySyncError(
          token.user_id,
          'Meta erişim tokenınızın süresi doldu. Lütfen yeniden bağlanın.'
        );
        continue;
      }

      // Sync data for this user
      const result = await syncMetaData(
        supabase,
        token.user_id,
        token.encrypted_access_token,
        token.ad_account_id,
        dateRange
      );

      // Create notification if sync failed
      if (!result.success) {
        await notifySyncError(
          token.user_id,
          `Meta senkronizasyonu başarısız oldu. ${result.errors.length} hata oluştu.`
        );
      }
    }
  } catch (error) {
    console.error('Toplu senkronizasyon hatası:', error);
  }
}
