import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT - Shows what data exists in the database
 * GET /api/debug/metrics-data
 */
export async function GET() {
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

    // Get clients
    const { data: clients } = await supabase
      .from('clients')
      .select('client_id, name, meta_ad_account_id')
      .eq('user_id', user.id);

    const clientIds = clients?.map(c => c.client_id) || [];

    // Get campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('campaign_id, client_id, campaign_name, status, meta_campaign_id')
      .in('client_id', clientIds);

    const campaignIds = campaigns?.map(c => c.campaign_id) || [];

    // Get ad sets
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('ad_set_id, campaign_id, ad_set_name, status')
      .in('campaign_id', campaignIds);

    const adSetIds = adSets?.map(as => as.ad_set_id) || [];

    // Get ads
    const { data: ads } = await supabase
      .from('ads')
      .select('ad_id, ad_set_id, ad_name, status')
      .in('ad_set_id', adSetIds);

    const adIds = ads?.map(a => a.ad_id) || [];

    // Get metrics
    const { data: metrics } = await supabase
      .from('meta_metrics')
      .select('metric_id, ad_id, date, spend, impressions, clicks, conversions')
      .in('ad_id', adIds)
      .order('date', { ascending: false })
      .limit(100);

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const monthStartDate = startOfMonth.toISOString().split('T')[0];
    const todayDate = startOfDay.toISOString().split('T')[0];

    // Get today's metrics
    const { data: todayMetrics } = await supabase
      .from('meta_metrics')
      .select('spend')
      .in('ad_id', adIds)
      .eq('date', todayDate);

    // Get this month's metrics
    const { data: monthMetrics } = await supabase
      .from('meta_metrics')
      .select('spend')
      .in('ad_id', adIds)
      .gte('date', monthStartDate);

    const todaySpend = todayMetrics?.reduce((sum, m) => sum + (parseFloat(String(m.spend)) || 0), 0) || 0;
    const monthSpend = monthMetrics?.reduce((sum, m) => sum + (parseFloat(String(m.spend)) || 0), 0) || 0;

    return NextResponse.json({
      summary: {
        totalClients: clients?.length || 0,
        totalCampaigns: campaigns?.length || 0,
        activeCampaigns: campaigns?.filter(c => c.status === 'ACTIVE').length || 0,
        totalAdSets: adSets?.length || 0,
        totalAds: ads?.length || 0,
        totalMetricRecords: metrics?.length || 0,
        todaySpend,
        monthSpend,
        dateRanges: {
          today: todayDate,
          monthStart: monthStartDate,
        },
      },
      clients: clients?.map(c => ({
        ...c,
        campaignCount: campaigns?.filter(camp => camp.client_id === c.client_id).length || 0,
      })),
      campaigns: campaigns?.map(c => ({
        ...c,
        adSetCount: adSets?.filter(as => as.campaign_id === c.campaign_id).length || 0,
      })),
      adSets: adSets?.map(as => ({
        ...as,
        adCount: ads?.filter(a => a.ad_set_id === as.ad_set_id).length || 0,
      })),
      ads: ads?.map(a => ({
        ...a,
        metricCount: metrics?.filter(m => m.ad_id === a.ad_id).length || 0,
      })),
      recentMetrics: metrics?.slice(0, 20),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Hata oluştu', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
