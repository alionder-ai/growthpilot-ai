import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  calculateAdConversionRate,
  calculateCampaignConversionRate,
  calculateMultipleCampaignConversionRates
} from '@/lib/utils/lead-conversion';

// GET /api/leads/conversion-rates - Get conversion rates
// Query params: ad_id, campaign_id, or campaign_ids (comma-separated)
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

    const searchParams = request.nextUrl.searchParams;
    const adId = searchParams.get('ad_id');
    const campaignId = searchParams.get('campaign_id');
    const campaignIds = searchParams.get('campaign_ids');

    // Calculate conversion rate for a specific ad
    if (adId) {
      const conversionRate = await calculateAdConversionRate(adId);
      
      if (!conversionRate) {
        return NextResponse.json(
          { error: 'Reklam bulunamadı veya dönüşüm oranı hesaplanamadı' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversionRate });
    }

    // Calculate conversion rate for a specific campaign
    if (campaignId) {
      const conversionRate = await calculateCampaignConversionRate(campaignId);
      
      if (!conversionRate) {
        return NextResponse.json(
          { error: 'Kampanya bulunamadı veya dönüşüm oranı hesaplanamadı' },
          { status: 404 }
        );
      }

      return NextResponse.json({ conversionRate });
    }

    // Calculate conversion rates for multiple campaigns
    if (campaignIds) {
      const ids = campaignIds.split(',').map(id => id.trim());
      const conversionRates = await calculateMultipleCampaignConversionRates(ids);

      return NextResponse.json({ conversionRates });
    }

    // If no specific filter, get all campaigns for the user
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        campaign_id,
        clients!inner (
          user_id
        )
      `)
      .eq('clients.user_id', user.id);

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        { error: 'Kampanyalar yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    const ids = campaigns?.map(c => c.campaign_id) || [];
    const conversionRates = await calculateMultipleCampaignConversionRates(ids);

    return NextResponse.json({ conversionRates });
  } catch (error) {
    console.error('Unexpected error in GET /api/leads/conversion-rates:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
