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
    console.log('[SYNC META] ========== syncMetaData BAŞLADI ==========');
    console.log('[SYNC META] Parametreler:', {
      userId,
      adAccountId,
      dateRange,
      hasToken: !!encryptedAccessToken,
    });

    // Create Meta API client
    console.log('[SYNC META] ADIM 1: Meta API client oluşturuluyor...');
    const metaClient = createMetaAPIClient(encryptedAccessToken);
    console.log('[SYNC META] ✓ Meta API client oluşturuldu');

    // Get all clients for this user
    console.log('[SYNC META] ADIM 2: Kullanıcının müşterileri çekiliyor...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('user_id', userId);

    if (clientsError) {
      console.error('[SYNC META] HATA (CLIENTS_FETCH):', clientsError);
      result.errors.push(`Müşteriler alınamadı: ${clientsError.message}`);
      result.success = false;
      return result;
    }

    if (!clients || clients.length === 0) {
      console.log('[SYNC META] ⚠ Müşteri bulunamadı, sync atlanıyor');
      return result;
    }

    console.log('[SYNC META] ✓ Müşteriler bulundu:', clients.length);

    // Fetch campaigns from Meta API
    console.log('[SYNC META] ADIM 3: Meta Graph API\'den kampanyalar çekiliyor...');
    console.log('[SYNC META] Ad Account ID:', adAccountId);
    
    let metaCampaigns: any[];
    try {
      metaCampaigns = await metaClient.getCampaigns(adAccountId);
      console.log('[SYNC META] ✓ Meta API\'den kampanyalar alındı:', metaCampaigns.length);
    } catch (metaError: any) {
      console.error('[SYNC META] ========== META API HATASI ==========');
      console.error('[SYNC META] Hata tipi:', metaError?.constructor?.name || typeof metaError);
      console.error('[SYNC META] Hata mesajı:', metaError?.message || String(metaError));
      console.error('[SYNC META] Response data:', JSON.stringify(metaError?.response?.data || 'Yok'));
      console.error('[SYNC META] Response status:', metaError?.response?.status || 'Yok');
      console.error('[SYNC META] Stack:', metaError?.stack || 'Yok');
      console.error('[SYNC META] ====================================');
      
      result.errors.push(`Meta API hatası: ${metaError?.message || 'Bilinmeyen hata'}`);
      result.success = false;
      return result;
    }

    console.log('[SYNC META] ADIM 4: Kampanyalar işleniyor...');
    for (let i = 0; i < metaCampaigns.length; i++) {
      const metaCampaign = metaCampaigns[i];
      console.log(`[SYNC META] Kampanya ${i + 1}/${metaCampaigns.length}: ${metaCampaign.name} (ID: ${metaCampaign.id})`);
      
      try {
        // Check if campaign exists in database
        console.log('[SYNC META]   → Veritabanında kontrol ediliyor...');
        const { data: existingCampaign, error: checkError } = await supabase
          .from('campaigns')
          .select('campaign_id, client_id')
          .eq('meta_campaign_id', metaCampaign.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error('[SYNC META]   ✗ Kampanya kontrol hatası:', checkError);
          result.errors.push(`Kampanya kontrol hatası: ${metaCampaign.name}`);
          continue;
        }

        let campaignId: string;
        let clientId: string;

        if (existingCampaign) {
          // Update existing campaign
          console.log('[SYNC META]   → Mevcut kampanya güncelleniyor...');
          campaignId = existingCampaign.campaign_id;
          clientId = existingCampaign.client_id;

          const { error: updateError } = await supabase
            .from('campaigns')
            .update({
              campaign_name: metaCampaign.name,
              status: metaCampaign.status,
              last_synced_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('campaign_id', campaignId);

          if (updateError) {
            console.error('[SYNC META]   ✗ Kampanya güncelleme hatası:', updateError);
            result.errors.push(`Kampanya güncellenemedi: ${metaCampaign.name}`);
            continue;
          }
          console.log('[SYNC META]   ✓ Kampanya güncellendi');
        } else {
          // Create new campaign
          console.log('[SYNC META]   → Yeni kampanya oluşturuluyor...');
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

          if (createError) {
            console.error('[SYNC META]   ========== SUPABASE INSERT HATASI ==========');
            console.error('[SYNC META]   Tablo: campaigns');
            console.error('[SYNC META]   Hata kodu:', createError.code);
            console.error('[SYNC META]   Hata mesajı:', createError.message);
            console.error('[SYNC META]   Hata detayları:', createError.details);
            console.error('[SYNC META]   Hint:', createError.hint);
            console.error('[SYNC META]   ====================================');
            result.errors.push(`Kampanya oluşturulamadı: ${metaCampaign.name} - ${createError.message}`);
            continue;
          }

          if (!newCampaign) {
            console.error('[SYNC META]   ✗ Kampanya oluşturuldu ama veri dönmedi');
            result.errors.push(`Kampanya oluşturulamadı: ${metaCampaign.name}`);
            continue;
          }

          campaignId = newCampaign.campaign_id;
          console.log('[SYNC META]   ✓ Yeni kampanya oluşturuldu');
        }

        result.campaignsProcessed++;
        console.log('[SYNC META]   ✓ Kampanya işlendi');

        // Fetch ad sets for this campaign
        console.log('[SYNC META]   → Reklam setleri çekiliyor...');
        const adSets = await metaClient.getAdSets(metaCampaign.id);
        console.log(`[SYNC META]   ✓ ${adSets.length} reklam seti bulundu`);

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

              if (adSetError) {
                console.error('[SYNC META]     ========== AD SET INSERT HATASI ==========');
                console.error('[SYNC META]     Tablo: ad_sets');
                console.error('[SYNC META]     Hata kodu:', adSetError.code);
                console.error('[SYNC META]     Hata mesajı:', adSetError.message);
                console.error('[SYNC META]     Hata detayları:', adSetError.details);
                console.error('[SYNC META]     Hint:', adSetError.hint);
                console.error('[SYNC META]     ====================================');
                result.errors.push(`Reklam seti oluşturulamadı: ${adSet.name} - ${adSetError.message}`);
                continue;
              }

              if (!newAdSet) {
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

                  if (adError) {
                    console.error('[SYNC META]       ✗ Reklam oluşturma hatası:', adError);
                    result.errors.push(`Reklam oluşturulamadı: ${ad.name}`);
                    continue;
                  }

                  if (!newAd) {
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
                    console.error('[SYNC META]       ✗ Metrik kaydetme hatası:', metricsError);
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
                console.error('[SYNC META]       ✗ Reklam işleme hatası:', adError);
                result.errors.push(`Reklam işlenirken hata: ${ad.name}`);
              }
            }
          } catch (adSetError) {
            console.error('[SYNC META]     ✗ Reklam seti işleme hatası:', adSetError);
            result.errors.push(`Reklam seti işlenirken hata: ${adSet.name}`);
          }
        }
      } catch (campaignError) {
        console.error('[SYNC META]   ✗ Kampanya işleme hatası:', campaignError);
        result.errors.push(`Kampanya işlenirken hata: ${metaCampaign.name}`);
      }
    }

    console.log('[SYNC META] ========== syncMetaData TAMAMLANDI ==========');
    console.log('[SYNC META] Sonuç:', {
      success: result.success,
      campaignsProcessed: result.campaignsProcessed,
      adsProcessed: result.adsProcessed,
      metricsStored: result.metricsStored,
      errorCount: result.errors.length,
    });

    // If there were errors, mark as partial success
    if (result.errors.length > 0) {
      result.success = false;
    }

    return result;
  } catch (error) {
    console.error('[SYNC META] ========== KRİTİK HATA ==========');
    console.error('[SYNC META] Hata:', error);
    console.error('[SYNC META] ====================================');
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
