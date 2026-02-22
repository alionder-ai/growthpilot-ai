import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/clients?error=${encodeURIComponent('Meta bağlantısı iptal edildi')}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=invalid_request', request.url)
      );
    }

    const { clientId, userId } = JSON.parse(Buffer.from(state, 'base64').toString());

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=unauthorized', request.url)
      );
    }

    const metaAppId = process.env.META_APP_ID;
    const metaAppSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meta/callback`;

    if (!metaAppId || !metaAppSecret) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=config_error', request.url)
      );
    }

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}` +
      `&client_secret=${metaAppSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`
    );

    if (!tokenResponse.ok) {
      throw new Error('Token exchange failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
    );

    if (!meResponse.ok) {
      throw new Error('Failed to fetch user info');
    }

    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );

    if (!adAccountsResponse.ok) {
      throw new Error('Failed to fetch ad accounts');
    }

    const adAccountsData = await adAccountsResponse.json();
    const adAccounts = adAccountsData.data || [];

    if (adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=no_ad_accounts', request.url)
      );
    }

    const firstAdAccount = adAccounts[0];
    const adAccountId = firstAdAccount.account_id;

    const encryptedToken = encrypt(accessToken);

    const { error: tokenError } = await supabase
      .from('meta_tokens')
      .upsert({
        user_id: userId,
        encrypted_token: encryptedToken,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (tokenError) {
      throw tokenError;
    }

    const { error: clientError } = await supabase
      .from('clients')
      .update({
        meta_ad_account_id: adAccountId,
        meta_connected: true,
        meta_connected_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .eq('user_id', userId);

    if (clientError) {
      throw clientError;
    }

    return NextResponse.redirect(
      new URL(`/dashboard/clients/${clientId}?success=meta_connected`, request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL('/dashboard/clients?error=connection_failed', request.url)
    );
  }
}
