import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('error', 'auth_required');
      return NextResponse.redirect(redirectUrl);
    }

    const clientId = request.nextUrl.searchParams.get('clientId');

    console.log('[META_CONNECT] Gelen clientId:', clientId, 'User ID:', user.id);

    if (!clientId) {
      const redirectUrl = new URL('/dashboard/clients', request.url);
      redirectUrl.searchParams.set('error', 'client_id_required');
      return NextResponse.redirect(redirectUrl);
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    console.log('[META_CONNECT] Supabase sorgu:', { client, error: clientError?.message });

    if (clientError || !client) {
      const redirectUrl = new URL('/dashboard/clients', request.url);
      redirectUrl.searchParams.set('error', 'client_not_found');
      return NextResponse.redirect(redirectUrl);
    }

    const metaAppId = process.env.META_APP_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!metaAppId || !appUrl) {
      const redirectUrl = new URL('/dashboard/clients', request.url);
      redirectUrl.searchParams.set('error', 'meta_config_missing');
      return NextResponse.redirect(redirectUrl);
    }

    const redirectUri = `${appUrl}/api/meta/callback`;
    const state = Buffer.from(JSON.stringify({ clientId, userId: user.id })).toString('base64');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${metaAppId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=ads_read,ads_management`;

    console.log('[META_CONNECT] Redirecting to Meta OAuth');

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('[META_CONNECT] Hata:', error);
    const redirectUrl = new URL('/dashboard/clients', request.url);
    redirectUrl.searchParams.set('error', 'meta_connect_failed');
    return NextResponse.redirect(redirectUrl);
  }
}
