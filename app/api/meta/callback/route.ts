import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@supabase/supabase-js';

import { encrypt } from '@/lib/utils/encryption';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/clients?error=meta_auth_cancelled`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/dashboard/clients?error=missing_code_or_state', request.url)
    );
  }

  let clientId: string;
  let userId: string;

  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
    clientId = decoded.clientId;
    userId = decoded.userId;

    if (!clientId || !userId) {
      throw new Error('Missing clientId or userId in state');
    }
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/dashboard/clients?error=invalid_state_${encodeURIComponent((err as Error).message)}`, request.url)
    );
  }

  const metaAppId = process.env.META_APP_ID;
  const metaAppSecret = process.env.META_APP_SECRET;

  if (!metaAppId || !metaAppSecret) {
    return NextResponse.redirect(
      new URL('/dashboard/clients?error=meta_credentials_missing', request.url)
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUri = `${baseUrl}/api/meta/callback`;

  try {
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${metaAppId}` +
      `&client_secret=${metaAppSecret}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${code}`;

    const tokenResponse = await fetch(tokenUrl);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.redirect(
        new URL(`/dashboard/clients?error=token_exchange_failed_${encodeURIComponent(errorText.substring(0, 100))}`, request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=no_access_token_received', request.url)
      );
    }

    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );

    if (!adAccountsResponse.ok) {
      const errorText = await adAccountsResponse.text();
      return NextResponse.redirect(
        new URL(`/dashboard/clients?error=ad_accounts_fetch_failed_${encodeURIComponent(errorText.substring(0, 100))}`, request.url)
      );
    }

    const adAccountsData = await adAccountsResponse.json();
    const adAccounts = adAccountsData.data || [];

    if (adAccounts.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=no_ad_accounts_found', request.url)
      );
    }

    const firstAdAccount = adAccounts[0];
    const adAccountId = firstAdAccount.account_id;

    const encryptedToken = encrypt(accessToken);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existingToken } = await supabase
      .from('meta_tokens')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let tokenError;
    if (existingToken) {
      const { error } = await supabase
        .from('meta_tokens')
        .update({
          encrypted_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('user_id', userId);
      tokenError = error;
    } else {
      const { error } = await supabase
        .from('meta_tokens')
        .insert({
          user_id: userId,
          encrypted_token: encryptedToken,
          expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        });
      tokenError = error;
    }

    if (tokenError) {
      return NextResponse.redirect(
        new URL(`/dashboard/clients?error=token_save_failed_${encodeURIComponent(tokenError.message)}`, request.url)
      );
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
      return NextResponse.redirect(
        new URL(`/dashboard/clients/${clientId}?error=client_update_failed_${encodeURIComponent(clientError.message)}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/dashboard/clients/${clientId}?success=meta_connected`, request.url)
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    return NextResponse.redirect(
      new URL(`/dashboard/clients/${clientId}?error=callback_exception_${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
