import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

import { syncMetaData } from '@/lib/meta/sync';

export async function POST(request: NextRequest) {
  let userId: string | undefined;
  let currentStep = 'INITIALIZATION';

  try {
    console.log('[SYNC API] ========== SYNC BAŞLADI ==========');
    console.log('[SYNC API] ADIM 0: İstek başlatılıyor...');
    
    // Get clientId from request body
    const body = await request.json().catch(() => ({}));
    const requestedClientId = body.clientId;
    console.log('[SYNC API] İstenen Client ID:', requestedClientId || 'Tüm müşteriler');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('[SYNC API] Supabase Bağlantı Kontrolü:', {
      url: !!supabaseUrl,
      key: !!supabaseKey,
      keyType: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON',
    });

    if (!supabaseUrl || !supabaseKey) {
      console.error('[SYNC API] HATA: Supabase credentials eksik');
      return NextResponse.json(
        { error: 'Supabase bağlantı bilgileri eksik', step: 'ENV_CHECK' },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set(name, value, options);
          } catch (error) {
            console.error('[SYNC API] Cookie set error:', error);
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, '', options);
          } catch (error) {
            console.error('[SYNC API] Cookie remove error:', error);
          }
        },
      },
    });

    console.log('[SYNC API] ✓ Supabase client oluşturuldu');
    
    currentStep = 'AUTH';
    console.log('[SYNC API] ADIM 1: Kullanıcı kimlik doğrulaması yapılıyor...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('[SYNC API] HATA (AUTH):', authError);
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası', details: authError.message, step: 'AUTH' },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[SYNC API] HATA (AUTH): Kullanıcı bulunamadı');
      return NextResponse.json(
        { error: 'Oturum bulunamadı', step: 'AUTH' },
        { status: 401 }
      );
    }

    userId = user.id;
    console.log('[SYNC API] ✓ Kullanıcı doğrulandı:', userId);

    currentStep = 'TOKEN_FETCH';
    console.log('[SYNC API] ADIM 2: Supabase\'den Meta token çekiliyor...');
    const { data: token, error: tokenError } = await supabase
      .from('meta_tokens')
      .select('encrypted_token, expires_at')
      .eq('user_id', userId)
      .single();

    if (tokenError) {
      console.error('[SYNC API] HATA (TOKEN_FETCH):', tokenError);
      return NextResponse.json(
        { error: 'Meta token alınamadı', details: tokenError.message, step: 'TOKEN_FETCH' },
        { status: 400 }
      );
    }

    if (!token || !token.encrypted_token) {
      console.error('[SYNC API] HATA (TOKEN_FETCH): Token bulunamadı veya boş');
      return NextResponse.json(
        { error: 'Meta token bulunamadı', step: 'TOKEN_FETCH' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] ✓ Token bulundu');

    const expiresAt = new Date(token.expires_at);
    if (expiresAt < new Date()) {
      console.error('[SYNC API] HATA (TOKEN_FETCH): Token süresi dolmuş');
      return NextResponse.json(
        { error: 'Token süresi dolmuş', step: 'TOKEN_FETCH' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] ✓ Token geçerli');

    currentStep = 'AD_ACCOUNT_FETCH';
    console.log('[SYNC API] ADIM 3: Ad Account ID çekiliyor...');
    
    // Build query
    let query = supabase
      .from('clients')
      .select('client_id, meta_ad_account_id')
      .eq('user_id', userId)
      .eq('meta_connected', true)
      .not('meta_ad_account_id', 'is', null);
    
    // If clientId is provided, filter for that specific client
    if (requestedClientId) {
      query = query.eq('client_id', requestedClientId);
      console.log('[SYNC API] Sadece belirli müşteri için senkronizasyon:', requestedClientId);
    }
    
    const { data: clients, error: clientsError } = await query;

    if (clientsError) {
      console.error('[SYNC API] HATA (AD_ACCOUNT_FETCH):', clientsError);
      return NextResponse.json(
        { error: 'Müşteri bilgileri alınamadı', details: clientsError.message, step: 'AD_ACCOUNT_FETCH' },
        { status: 500 }
      );
    }

    if (!clients || clients.length === 0) {
      console.error('[SYNC API] HATA (AD_ACCOUNT_FETCH): Bağlı müşteri yok');
      return NextResponse.json(
        { error: 'Meta hesabı bağlı müşteri bulunamadı', step: 'AD_ACCOUNT_FETCH' },
        { status: 400 }
      );
    }

    console.log('[SYNC API] ✓ Bağlı müşteriler bulundu:', clients.length);
    console.log('[SYNC API] Müşteri hesapları:', clients.map(c => ({
      clientId: c.client_id,
      adAccountId: c.meta_ad_account_id,
    })));

    // Sync all connected clients' ad accounts
    const allResults = {
      success: true,
      totalCampaigns: 0,
      totalAds: 0,
      totalMetrics: 0,
      errors: [] as string[],
    };

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const dateRange = {
      since: startDate.toISOString().split('T')[0],
      until: endDate.toISOString().split('T')[0],
    };

    console.log('[SYNC API] ✓ Tarih aralığı:', dateRange);

    for (const client of clients) {
      const adAccountId = client.meta_ad_account_id;
      if (!adAccountId) {
        console.log(`[SYNC API] ⚠ Client ${client.client_id} için ad account ID yok, atlanıyor`);
        continue;
      }

      console.log(`[SYNC API] ADIM 4: Client ${client.client_id} için Meta Graph API'den veri çekiliyor...`);
      console.log('[SYNC API] syncMetaData parametreleri:', {
        userId,
        clientId: client.client_id,
        adAccountId,
        dateRange,
        hasToken: !!token.encrypted_token,
      });

      currentStep = 'META_SYNC';
      const result = await syncMetaData(
        supabase,
        userId,
        token.encrypted_token,
        adAccountId,
        dateRange
      );

      console.log(`[SYNC API] ✓ Client ${client.client_id} syncMetaData tamamlandı`);
      console.log('[SYNC API] Sonuç:', {
        success: result.success,
        campaignsProcessed: result.campaignsProcessed,
        adsProcessed: result.adsProcessed,
        metricsStored: result.metricsStored,
        errorCount: result.errors.length,
      });

      allResults.totalCampaigns += result.campaignsProcessed;
      allResults.totalAds += result.adsProcessed;
      allResults.totalMetrics += result.metricsStored;
      allResults.errors.push(...result.errors);

      if (!result.success) {
        allResults.success = false;
      }
    }

    if (!allResults.success || allResults.errors.length > 0) {
      console.error('[SYNC API] ========== SYNC BAŞARISIZ ==========');
      console.error('[SYNC API] Hata sayısı:', allResults.errors.length);
      console.error('[SYNC API] Hatalar:', JSON.stringify(allResults.errors, null, 2));
      console.error('[SYNC API] ====================================');
      
      return NextResponse.json(
        {
          error: 'Senkronizasyon sırasında hatalar oluştu',
          errorDetails: allResults.errors.join(' | '),
          allErrors: allResults.errors,
          step: 'META_SYNC',
          stats: {
            campaignsProcessed: allResults.totalCampaigns,
            adsProcessed: allResults.totalAds,
            metricsStored: allResults.totalMetrics,
          },
          debugInfo: {
            message: 'Meta API\'den veri çekilirken hatalar oluştu',
            checks: clients.map(c => `Hesap ID: ${c.meta_ad_account_id}`),
          },
        },
        { status: 500 }
      );
    }

    console.log('[SYNC API] ========== SYNC BAŞARILI ==========');
    return NextResponse.json({
      success: true,
      message: 'Senkronizasyon başarıyla tamamlandı',
      stats: {
        campaignsProcessed: allResults.totalCampaigns,
        adsProcessed: allResults.totalAds,
        metricsStored: allResults.totalMetrics,
      },
      debugInfo: {
        clientCount: clients.length,
        adAccountIds: clients.map(c => c.meta_ad_account_id),
        dateRange,
        totalErrors: allResults.errors.length,
        errors: allResults.errors,
      },
    });

  } catch (error) {
    console.error('[SYNC API] ========== KRİTİK HATA ==========');
    console.error('[SYNC API] Hata adımı:', currentStep);
    console.error('[SYNC API] Hata tipi:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[SYNC API] Hata mesajı:', error instanceof Error ? error.message : String(error));
    console.error('[SYNC API] Stack trace:', error instanceof Error ? error.stack : 'Yok');
    console.error('[SYNC API] User ID:', userId);
    console.error('[SYNC API] ====================================');

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        step: currentStep,
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 }
    );
  }
}
