import { NextRequest, NextResponse } from 'next/server';

const META_APP_ID = process.env.META_APP_ID;
const META_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/meta/callback`;

/**
 * POST /api/meta/connect
 * Initiates Meta OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    if (!META_APP_ID) {
      return NextResponse.json(
        { error: 'Meta API yapılandırması eksik' },
        { status: 500 }
      );
    }

    // Build OAuth URL
    const oauthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    oauthUrl.searchParams.append('client_id', META_APP_ID);
    oauthUrl.searchParams.append('redirect_uri', META_REDIRECT_URI);
    oauthUrl.searchParams.append('scope', 'ads_read,ads_management');
    oauthUrl.searchParams.append('response_type', 'code');
    
    // Generate state for CSRF protection
    const state = crypto.randomUUID();
    oauthUrl.searchParams.append('state', state);

    return NextResponse.json({
      authUrl: oauthUrl.toString(),
      state,
    });
  } catch (error) {
    console.error('Meta OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Meta bağlantısı başlatılamadı' },
      { status: 500 }
    );
  }
}
