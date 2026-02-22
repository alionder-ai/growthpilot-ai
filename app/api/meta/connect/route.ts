import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientId } = body;

    console.log('[META_CONNECT] Gelen clientId:', clientId, 'User ID:', user.id);

    if (!clientId) {
      return NextResponse.json(
        { error: 'Müşteri ID gerekli' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    console.log('[META_CONNECT] Supabase sorgu:', { client, error: clientError?.message });

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const metaAppId = process.env.META_APP_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!metaAppId || !appUrl) {
      return NextResponse.json(
        { error: 'Meta yapılandırması eksik' },
        { status: 500 }
      );
    }

    const redirectUri = `${appUrl}/api/meta/callback`;
    const state = Buffer.from(JSON.stringify({ clientId, userId: user.id })).toString('base64');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${metaAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=ads_read,ads_management`;

    console.log('[META_CONNECT] Auth URL başarıyla oluşturuldu');

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error('[META_CONNECT] Hata:', error);
    return NextResponse.json(
      { error: 'Meta bağlantısı başlatılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
