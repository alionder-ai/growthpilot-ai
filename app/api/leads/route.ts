import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/leads - List leads for authenticated user
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

    // Get search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('ad_id');
    const campaignId = searchParams.get('campaign_id');
    const convertedStatus = searchParams.get('converted_status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query with joins to get campaign and ad info
    let query = supabase
      .from('leads')
      .select(`
        *,
        ads!inner (
          ad_id,
          ad_name,
          meta_ad_id,
          ad_sets!inner (
            ad_set_id,
            ad_set_name,
            campaigns!inner (
              campaign_id,
              campaign_name,
              clients!inner (
                client_id,
                name,
                user_id
              )
            )
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (adId) {
      query = query.eq('ad_id', adId);
    }

    if (campaignId) {
      query = query.eq('ads.ad_sets.campaigns.campaign_id', campaignId);
    }

    if (convertedStatus !== null && convertedStatus !== undefined) {
      query = query.eq('converted_status', convertedStatus === 'true');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: leads, error, count } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Potansiyel müşteriler yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      leads: leads || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/leads:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
