import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCommission } from '@/lib/utils/commission';
import cache, { CACHE_TTL, generateCacheKey } from '@/lib/utils/cache';

export const dynamic = 'force-dynamic';

interface OverviewMetrics {
  totalClients: number;
  totalSpendThisMonth: number;
  totalSpendToday: number;
  totalRevenueThisMonth: number;
  activeCampaigns: number;
}

/**
 * GET /api/metrics/overview
 * 
 * Returns overview metrics for the dashboard:
 * - Total clients count
 * - Total spend this month
 * - Total spend today
 * - Total revenue this month (calculated using commission models)
 * - Active campaigns count
 * 
 * Query parameters:
 * - clientId (optional): Filter metrics by specific client
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Get optional client filter from query params
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');

    // Generate cache key
    const cacheKey = generateCacheKey('dashboard-metrics', {
      userId: user.id,
      clientId: clientId || 'all'
    });

    // Check cache
    const cachedData = cache.get<OverviewMetrics>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Build base query for clients
    let clientsQuery = supabase
      .from('clients')
      .select('client_id')
      .eq('user_id', user.id);

    if (clientId) {
      clientsQuery = clientsQuery.eq('client_id', clientId);
    }

    const { data: clients, error: clientsError } = await clientsQuery;

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return NextResponse.json(
        { error: 'Müşteriler alınırken hata oluştu' },
        { status: 500 }
      );
    }

    const totalClients = clients?.length || 0;
    const clientIds = clients?.map((c) => c.client_id) || [];

    // If no clients, return zeros
    if (clientIds.length === 0) {
      const metrics: OverviewMetrics = {
        totalClients: 0,
        totalSpendThisMonth: 0,
        totalSpendToday: 0,
        totalRevenueThisMonth: 0,
        activeCampaigns: 0,
      };
      return NextResponse.json(metrics);
    }

    // Get ALL campaigns (not just active) for spend calculation
    const { data: allCampaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('campaign_id, status')
      .in('client_id', clientIds);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
    }

    // Count only ACTIVE campaigns for the metric
    const activeCampaigns = allCampaigns?.filter(c => c.status === 'ACTIVE').length || 0;

    // Get ALL campaign IDs for spend calculation (including paused/inactive)
    const campaignIds = allCampaigns?.map((c) => c.campaign_id) || [];

    let totalSpendThisMonth = 0;
    let totalSpendToday = 0;

    console.log('[OVERVIEW METRICS] ========== HESAPLAMA BAŞLADI ==========');
    console.log('[OVERVIEW METRICS] Toplam kampanya sayısı:', campaignIds.length);
    console.log('[OVERVIEW METRICS] Aktif kampanya sayısı:', activeCampaigns);

    if (campaignIds.length > 0) {
      // Get ad IDs for these campaigns through ad_sets
      const { data: adSets, error: adSetsError } = await supabase
        .from('ad_sets')
        .select('ad_set_id, campaign_id')
        .in('campaign_id', campaignIds);

      if (adSetsError) {
        console.error('[OVERVIEW METRICS] Ad sets fetch error:', adSetsError);
      }

      console.log('[OVERVIEW METRICS] Bulunan ad set sayısı:', adSets?.length || 0);

      const adSetIds = adSets?.map((as) => as.ad_set_id) || [];

      if (adSetIds.length > 0) {
        const { data: ads, error: adsError } = await supabase
          .from('ads')
          .select('ad_id, ad_set_id')
          .in('ad_set_id', adSetIds);

        if (adsError) {
          console.error('[OVERVIEW METRICS] Ads fetch error:', adsError);
        }

        console.log('[OVERVIEW METRICS] Bulunan reklam sayısı:', ads?.length || 0);

        const adIds = ads?.map((a) => a.ad_id) || [];

        if (adIds.length > 0) {
          // Get spend for this month
          const monthStartDate = startOfMonth.toISOString().split('T')[0];
          const todayDate = startOfDay.toISOString().split('T')[0];
          
          console.log('[OVERVIEW METRICS] Tarih aralıkları:');
          console.log('[OVERVIEW METRICS]   - Ay başlangıcı:', monthStartDate);
          console.log('[OVERVIEW METRICS]   - Bugün:', todayDate);

          const { data: monthMetrics, error: monthError } = await supabase
            .from('meta_metrics')
            .select('spend, date, ad_id')
            .in('ad_id', adIds)
            .gte('date', monthStartDate);

          if (monthError) {
            console.error('[OVERVIEW METRICS] Bu ay metrikleri fetch hatası:', monthError);
          } else {
            console.log('[OVERVIEW METRICS] Bu ay için bulunan metrik kayıtları:', monthMetrics?.length || 0);
            
            if (monthMetrics && monthMetrics.length > 0) {
              // Group by date to see distribution
              const byDate = monthMetrics.reduce((acc, m) => {
                acc[m.date] = (acc[m.date] || 0) + (parseFloat(String(m.spend)) || 0);
                return acc;
              }, {} as Record<string, number>);
              
              console.log('[OVERVIEW METRICS] Tarihlere göre harcama dağılımı:', byDate);
            }
            
            totalSpendThisMonth = monthMetrics?.reduce(
              (sum, m) => sum + (parseFloat(String(m.spend)) || 0),
              0
            ) || 0;
            console.log('[OVERVIEW METRICS] Bu ay toplam harcama:', totalSpendThisMonth);
          }

          // Get spend for today
          const { data: todayMetrics, error: todayError } = await supabase
            .from('meta_metrics')
            .select('spend, date, ad_id')
            .in('ad_id', adIds)
            .eq('date', todayDate);

          if (todayError) {
            console.error('[OVERVIEW METRICS] Bugün metrikleri fetch hatası:', todayError);
          } else {
            console.log('[OVERVIEW METRICS] Bugün için bulunan metrik kayıtları:', todayMetrics?.length || 0);
            totalSpendToday = todayMetrics?.reduce(
              (sum, m) => sum + (parseFloat(String(m.spend)) || 0),
              0
            ) || 0;
            console.log('[OVERVIEW METRICS] Bugün toplam harcama:', totalSpendToday);
          }
        } else {
          console.log('[OVERVIEW METRICS] ⚠ Hiç reklam bulunamadı');
        }
      } else {
        console.log('[OVERVIEW METRICS] ⚠ Hiç ad set bulunamadı');
      }
    } else {
      console.log('[OVERVIEW METRICS] ⚠ Hiç kampanya bulunamadı');
    }

    console.log('[OVERVIEW METRICS] ========== HESAPLAMA BİTTİ ==========');

    // Calculate revenue using commission models
    let totalRevenueThisMonth = 0;

    for (const client of clients || []) {
      // Get commission model for this client
      const { data: commissionModel } = await supabase
        .from('commission_models')
        .select('commission_percentage, calculation_basis')
        .eq('client_id', client.client_id)
        .single();

      if (commissionModel) {
        // Get campaigns for this client
        const { data: clientCampaigns } = await supabase
          .from('campaigns')
          .select('campaign_id')
          .eq('client_id', client.client_id);

        const clientCampaignIds = clientCampaigns?.map((c) => c.campaign_id) || [];

        if (clientCampaignIds.length > 0) {
          // Get ad IDs for these campaigns
          const { data: clientAdSets } = await supabase
            .from('ad_sets')
            .select('ad_set_id')
            .in('campaign_id', clientCampaignIds);

          const clientAdSetIds = clientAdSets?.map((as) => as.ad_set_id) || [];

          if (clientAdSetIds.length > 0) {
            const { data: clientAds } = await supabase
              .from('ads')
              .select('ad_id')
              .in('ad_set_id', clientAdSetIds);

            const clientAdIds = clientAds?.map((a) => a.ad_id) || [];

            if (clientAdIds.length > 0) {
              // Get metrics for this month
              const { data: clientMetrics } = await supabase
                .from('meta_metrics')
                .select('spend, conversions, purchases')
                .in('ad_id', clientAdIds)
                .gte('date', startOfMonth.toISOString().split('T')[0]);

              // Calculate revenue based on calculation basis
              let revenue = 0;
              if (commissionModel.calculation_basis === 'sales_revenue') {
                // For sales_revenue, we use purchases as proxy for revenue
                // In real scenario, this would come from actual revenue data
                const totalPurchases = clientMetrics?.reduce(
                  (sum, m) => sum + (m.purchases || 0),
                  0
                ) || 0;
                // Assuming average order value - this should be configurable per client
                revenue = totalPurchases * 100; // Placeholder calculation
              } else {
                // For total_revenue, use spend as proxy
                revenue = clientMetrics?.reduce(
                  (sum, m) => sum + (m.spend || 0),
                  0
                ) || 0;
              }

              // Calculate commission
              const commission = calculateCommission(
                revenue,
                commissionModel.commission_percentage
              );
              totalRevenueThisMonth += commission;
            }
          }
        }
      }
    }

    const metrics: OverviewMetrics = {
      totalClients,
      totalSpendThisMonth,
      totalSpendToday,
      totalRevenueThisMonth,
      activeCampaigns,
    };

    // Cache the result
    cache.set(cacheKey, metrics, CACHE_TTL.DASHBOARD_METRICS);

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching overview metrics:', error);
    return NextResponse.json(
      { error: 'Metrikler alınırken hata oluştu' },
      { status: 500 }
    );
  }
}
