import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { logLogout, getIpAddress, getUserAgent } from '@/lib/security/audit-logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set(name, value, options);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    await supabase.auth.signOut();

    if (user) {
      await logLogout(user.id, user.email || 'unknown', ipAddress, userAgent);
    }

    // Create response with redirect
    const response = NextResponse.redirect(new URL('/login', request.url));
    
    // Manually delete all Supabase auth cookies
    const allCookies = cookieStore.getAll();
    allCookies.forEach((cookie) => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('auth')) {
        response.cookies.set(cookie.name, '', {
          maxAge: 0,
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
        });
      }
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
