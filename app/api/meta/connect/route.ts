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

    if (!clientId) {
      const redirectUrl = new URL('/dashboard/clients', request.url);
      redirectUrl.searchParams.set('error', 'client_id_required');
      return NextResponse.redirect(redirectUrl);
    }

    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single();

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

    return NextResponse.redirect(authUrl);
  } catch (error) {
    const redirectUrl = new URL('/dashboard/clients', request.url);
    redirectUrl.searchParams.set('error', 'meta_connect_failed');
    return NextResponse.redirect(redirectUrl);
  }
}
