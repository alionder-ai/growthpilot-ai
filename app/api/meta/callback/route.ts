import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

    let clientId: string;
    let userId: string;

    try {
      const decoded = JSON.parse(Buffer.from(state, 'base64').toString());
      clientId = decoded.clientId;
      userId = decoded.userId;
    } catch (err) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=invalid_state', request.url)
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
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const adAccountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_id&access_token=${accessToken}`
    );

    if (!adAccountsResponse.ok) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=ad_accounts_fetch_failed', request.url)
      );
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

    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // Ignore
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', options);
            } catch (error) {
              // Ignore
            }
          },
        },
      }
    );

    const { error: tokenError } = await supabaseAdmin
      .from('meta_tokens')
      .upsert({
        user_id: userId,
        encrypted_token: encryptedToken,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (tokenError) {
      return NextResponse.redirect(
        new URL('/dashboard/clients?error=token_save_failed', request.url)
      );
    }

    const { error: clientError } = await supabaseAdmin
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
        new URL('/dashboard/clients?error=client_update_failed', request.url)
      );
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
