import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCommission } from '@/lib/utils/commission';

export const dynamic = 'force-dynamic';

interface TrendDataPoint {
  date: string;
  spend: number;
  revenue: number;
}

/**
 * GET /api/metrics/trends
 * 
 * Returns daily spending and revenue trends for the last 30 days
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

    // Calculate date range (last 30 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

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

    const clientIds = clients?.map((c) => c.client_id) || [];

    // If no clients, return empty array
    if (clientIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get all campaigns for these clients
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('campaign_id, client_id')
      .in('client_id', clientIds);

    const campaignIds = campaigns?.map((c) => c.campaign_id) || [];

    if (campaignIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get ad IDs for these campaigns
    const { data: adSets } = await supabase
      .from('ad_sets')
      .select('ad_set_id, campaign_id')
      .in('campaign_id', campaignIds);

    const adSetIds = adSets?.map((as) => as.ad_set_id) || [];

    if (adSetIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: ads } = await supabase
      .from('ads')
      .select('ad_id, ad_set_id')
      .in('ad_set_id', adSetIds);

    const adIds = ads?.map((a) => a.ad_id) || [];

    if (adIds.length === 0) {
      return NextResponse.json([]);
    }

    // Get metrics for the last 30 days
    const { data: metrics, error: metricsError } = await supabase
      .from('meta_metrics')
      .select('ad_id, date, spend, conversions, purchases')
      .in('ad_id', adIds)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Metrikler alınırken hata oluştu' },
        { status: 500 }
      );
    }

    // Create a map to link ads to campaigns to clients
    const adToCampaign = new Map<string, string>();
    ads?.forEach((ad) => {
      const adSet = adSets?.find((as) => as.ad_set_id === ad.ad_set_id);
      if (adSet) {
        adToCampaign.set(ad.ad_id, adSet.campaign_id);
      }
    });

    const campaignToClient = new Map<string, string>();
    campaigns?.forEach((campaign) => {
      campaignToClient.set(campaign.campaign_id, campaign.client_id);
    });

    // Get commission models for all clients
    const { data: commissionModels } = await supabase
      .from('commission_models')
      .select('client_id, commission_percentage, calculation_basis')
      .in('client_id', clientIds);

    const clientCommissions = new Map<string, { percentage: number; basis: string }>();
    commissionModels?.forEach((model) => {
      clientCommissions.set(model.client_id, {
        percentage: model.commission_percentage,
        basis: model.calculation_basis,
      });
    });

    // Group metrics by date
    const dailyData = new Map<string, { spend: number; revenue: number }>();

    // Initialize all dates in range with zero values
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dailyData.set(dateStr, { spend: 0, revenue: 0 });
    }

    // Aggregate spend and calculate revenue by date
    metrics?.forEach((metric) => {
      const existing = dailyData.get(metric.date) || { spend: 0, revenue: 0 };
      existing.spend += metric.spend || 0;

      // Calculate revenue for this metric
      const campaignId = adToCampaign.get(metric.ad_id);
      if (campaignId) {
        const clientId = campaignToClient.get(campaignId);
        if (clientId) {
          const commission = clientCommissions.get(clientId);
          if (commission) {
            let revenue = 0;
            if (commission.basis === 'sales_revenue') {
              // Use purchases as proxy for revenue
              revenue = (metric.purchases || 0) * 100; // Placeholder calculation
            } else {
              // Use spend as proxy for total revenue
              revenue = metric.spend || 0;
            }
            const commissionAmount = calculateCommission(revenue, commission.percentage);
            existing.revenue += commissionAmount;
          }
        }
      }

      dailyData.set(metric.date, existing);
    });

    // Convert to array format for charts
    const trendData: TrendDataPoint[] = Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        spend: Math.round(data.spend * 100) / 100,
        revenue: Math.round(data.revenue * 100) / 100,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(trendData);
  } catch (error) {
    console.error('Error fetching trend metrics:', error);
    return NextResponse.json(
      { error: 'Trend verileri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}
