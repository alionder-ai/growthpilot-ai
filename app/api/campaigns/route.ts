import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/campaigns - List campaigns with hierarchical data (campaigns > ad_sets > ads > metrics)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Get search params for filtering and pagination
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('client_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build campaigns query
    let campaignsQuery = supabase
      .from('campaigns')
      .select(`
        *,
        clients!inner(client_id, name, user_id)
      `, { count: 'exact' })
      .eq('clients.user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply client filter if provided
    if (clientId) {
      campaignsQuery = campaignsQuery.eq('client_id', clientId);
    }

    // Apply pagination
    campaignsQuery = campaignsQuery.range(offset, offset + limit - 1);

    const { data: campaigns, error: campaignsError, count } = await campaignsQuery;

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        { error: 'Kampanyalar yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // If no campaigns, return empty result
    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        campaigns: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get campaign IDs for fetching related data
    const campaignIds = campaigns.map(c => c.campaign_id);

    // Fetch ad sets for these campaigns
    const { data: adSets, error: adSetsError } = await supabase
      .from('ad_sets')
      .select('*')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (adSetsError) {
      console.error('Error fetching ad sets:', adSetsError);
      return NextResponse.json(
        { error: 'Reklam setleri yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Get ad set IDs for fetching ads
    const adSetIds = adSets?.map(as => as.ad_set_id) || [];

    // Fetch ads for these ad sets
    const { data: ads, error: adsError } = await supabase
      .from('ads')
      .select('*')
      .in('ad_set_id', adSetIds)
      .order('created_at', { ascending: false });

    if (adsError) {
      console.error('Error fetching ads:', adsError);
      return NextResponse.json(
        { error: 'Reklamlar yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Get ad IDs for fetching metrics
    const adIds = ads?.map(a => a.ad_id) || [];

    // Fetch latest metrics for these ads (most recent date per ad)
    const { data: metrics, error: metricsError } = await supabase
      .from('meta_metrics')
      .select('*')
      .in('ad_id', adIds)
      .order('date', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Metrikler yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Group metrics by ad_id (get most recent for each ad)
    const metricsByAdId = new Map();
    metrics?.forEach(metric => {
      if (!metricsByAdId.has(metric.ad_id)) {
        metricsByAdId.set(metric.ad_id, metric);
      }
    });

    // Build hierarchical structure
    const campaignsWithData = campaigns.map(campaign => {
      const campaignAdSets = adSets?.filter(as => as.campaign_id === campaign.campaign_id) || [];
      
      const adSetsWithData = campaignAdSets.map(adSet => {
        const adSetAds = ads?.filter(a => a.ad_set_id === adSet.ad_set_id) || [];
        
        const adsWithMetrics = adSetAds.map(ad => ({
          ...ad,
          metrics: metricsByAdId.get(ad.ad_id) || null
        }));

        return {
          ...adSet,
          ads: adsWithMetrics
        };
      });

      return {
        ...campaign,
        ad_sets: adSetsWithData
      };
    });

    return NextResponse.json({
      campaigns: campaignsWithData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/campaigns:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
