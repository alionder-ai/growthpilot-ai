import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { syncMetaData } from '@/lib/meta/sync';

/**
 * POST /api/campaigns/sync
 * Triggers manual Meta API sync for the authenticated user
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Get user's Meta token
    const { data: token, error: tokenError } = await supabase
      .from('meta_tokens')
      .select('encrypted_access_token, ad_account_id, expires_at')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Meta hesabı bağlı değil. Lütfen önce Meta hesabınızı bağlayın.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Meta erişim tokenı süresi dolmuş. Lütfen yeniden bağlanın.' },
        { status: 400 }
      );
    }

    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0],
    };

    // Trigger sync
    const result = await syncMetaData(
      supabase,
      user.id,
      token.encrypted_access_token,
      token.ad_account_id,
      dateRange
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Senkronizasyon sırasında hatalar oluştu',
          details: result.errors,
          stats: {
            campaignsProcessed: result.campaignsProcessed,
            adsProcessed: result.adsProcessed,
            metricsStored: result.metricsStored,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Senkronizasyon başarıyla tamamlandı',
      stats: {
        campaignsProcessed: result.campaignsProcessed,
        adsProcessed: result.adsProcessed,
        metricsStored: result.metricsStored,
      },
    });

  } catch (error) {
    console.error('Manual sync API error:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
