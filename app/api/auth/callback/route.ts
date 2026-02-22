import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      // Exchange the code for a session
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=auth_failed`
      );
    }
  }

  // Redirect to dashboard after successful authentication
  return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
}
