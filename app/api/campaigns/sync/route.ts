import { NextResponse } from 'next/server';

import { createServerClient } from '@/lib/supabase/server';
import { syncMetaData } from '@/lib/meta/sync';

export async function POST() {
  let supabase;
  let userId: string | undefined;

  try {
    console.log('[SYNC API] Starting sync request...');
    
    supabase = await createServerClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[SYNC API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[SYNC API] No user found');
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    userId = user.id;
    console.log('[SYNC API] User authenticated:', userId);

    const { data: token, error: tokenError } = await supabase
      .from('meta_tokens')
      .select('encrypted_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError) {
      console.error('[SYNC API] Token fetch error:', tokenError);
      return NextResponse.json(
        { 
          error: 'Meta token alınamadı', 
          details: tokenError.message 
        },
        { status: 400 }
      );
    }

    if (!token) {
      console.error('[SYNC API] No token found for user:', userId);
      return NextResponse.json(
        { error: 'Meta hesabı bağlı değil. Lütfen önce Meta hesabınızı bağlayın.' },
        { status: 400 }
      );
    }

    if (!token.encrypted_token) {
      console.error('[SYNC API] Token is null or undefined');
      return NextResponse.json(
        { error: 'Meta access token bulunamadı. Lütfen yeniden bağlanın.' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] Token found, checking expiry...');

    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      console.error('[SYNC API] Token expired:', expiresAt);
      return NextResponse.json(
        { error: 'Meta erişim tokenı süresi dolmuş. Lütfen yeniden bağlanın.' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] Token valid, fetching client ad_account_id...');

    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('meta_ad_account_id')
      .eq('user_id', userId)
      .eq('meta_connected', true)
      .not('meta_ad_account_id', 'is', null)
      .limit(1);

    if (clientsError) {
      console.error('[SYNC API] Clients fetch error:', clientsError);
      return NextResponse.json(
        { 
          error: 'Müşteri bilgileri alınamadı', 
          details: clientsError.message 
        },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      console.error('[SYNC API] No connected clients found');
      return NextResponse.json(
        { error: 'Meta hesabı bağlı müşteri bulunamadı. Lütfen önce bir müşteriye Meta hesabı bağlayın.' },
        { status: 400 }
      );
    }

    const adAccountId = clients[0].meta_ad_account_id;
    
    if (!adAccountId) {
      console.error('[SYNC API] Ad account ID is null');
      return NextResponse.json(
        { error: 'Reklam hesabı ID bulunamadı. Lütfen Meta hesabını yeniden bağlayın.' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] Ad account ID found:', adAccountId);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0],
    };

    console.log('[SYNC API] Date range:', dateRange);
    console.log('[SYNC API] Starting Meta data sync...');

    const result = await syncMetaData(
      supabase,
      userId,
      token.encrypted_token,
      adAccountId,
      dateRange
    );

    console.log('[SYNC API] Sync completed:', {
      success: result.success,
      campaignsProcessed: result.campaignsProcessed,
      adsProcessed: result.adsProcessed,
      metricsStored: result.metricsStored,
      errorCount: result.errors.length,
    });

    if (!result.success) {
      console.error('[SYNC API] Sync failed with errors:', result.errors);
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
    console.error('[SYNC API] CRITICAL ERROR:', error);
    console.error('[SYNC API] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId,
    });

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
