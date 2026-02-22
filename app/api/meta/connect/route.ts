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

    if (!clientId) {
      return NextResponse.json(
        { error: 'Müşteri ID gerekli' },
        { status: 400 }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    const metaAppId = process.env.META_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meta/callback`;

    if (!metaAppId) {
      return NextResponse.json(
        { error: 'Meta App ID yapılandırılmamış' },
        { status: 500 }
      );
    }

    const state = Buffer.from(JSON.stringify({ clientId, userId: user.id })).toString('base64');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${metaAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=ads_read,ads_management`;

    return NextResponse.json({ authUrl });
  } catch (error) {
    return NextResponse.json(
      { error: 'Meta bağlantısı başlatılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
