import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/utils/encryption';

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const META_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;

interface MetaTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface MetaAdAccountsResponse {
  data: Array<{
    id: string;
    account_id: string;
    name: string;
  }>;
}

/**
 * GET /api/meta/callback
 * Handles Meta OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Meta OAuth error:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=meta_auth_failed`
      );
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=missing_code`
      );
    }

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error('Meta API credentials not configured');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=config_error`
      );
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.append('client_id', META_APP_ID);
    tokenUrl.searchParams.append('client_secret', META_APP_SECRET);
    tokenUrl.searchParams.append('redirect_uri', META_REDIRECT_URI);
    tokenUrl.searchParams.append('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=token_exchange_failed`
      );
    }

    const tokenData: MetaTokenResponse = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get ad accounts for this token
    const adAccountsUrl = new URL('https://graph.facebook.com/v18.0/me/adaccounts');
    adAccountsUrl.searchParams.append('access_token', accessToken);
    adAccountsUrl.searchParams.append('fields', 'id,account_id,name');

    const adAccountsResponse = await fetch(adAccountsUrl.toString());
    
    if (!adAccountsResponse.ok) {
      console.error('Failed to fetch ad accounts');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=ad_accounts_failed`
      );
    }

    const adAccountsData: MetaAdAccountsResponse = await adAccountsResponse.json();

    if (!adAccountsData.data || adAccountsData.data.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=no_ad_accounts`
      );
    }

    // Use the first ad account (in production, let user select)
    const adAccount = adAccountsData.data[0];
    const adAccountId = adAccount.account_id;

    // Get authenticated user
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/login?error=auth_required`
      );
    }

    // Encrypt access token
    const encryptedToken = encrypt(accessToken);

    // Calculate expiration (default 60 days for Meta tokens)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Store encrypted token in database
    const { error: dbError } = await supabase
      .from('meta_tokens')
      .upsert({
        user_id: user.id,
        encrypted_access_token: encryptedToken,
        ad_account_id: adAccountId,
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=db_error`
      );
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?success=meta_connected`
    );
  } catch (error) {
    console.error('Meta OAuth callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/clients?error=unexpected_error`
    );
  }
}
