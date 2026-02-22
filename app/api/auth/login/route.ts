import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { getAuthErrorMessage } from '@/lib/supabase/auth';
import { 
  logLoginSuccess, 
  logLoginFailed, 
  getIpAddress, 
  getUserAgent 
} from '@/lib/security/audit-logger';

export const dynamic = 'force-dynamic';

interface LoginRequestBody {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequestBody;
    const { email, password, rememberMe = false } = body;

    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    if (!email || !password) {
      await logLoginFailed(email || 'unknown', 'Missing credentials', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 7 : undefined;
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            const updatedOptions = {
              ...options,
              maxAge: cookieMaxAge,
            };
            cookieStore.set(name, value, updatedOptions);
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logLoginFailed(email, error.message, ipAddress, userAgent);
      return NextResponse.json(
        { error: getAuthErrorMessage(error) },
        { status: 401 }
      );
    }

    if (!data.user || !data.session) {
      await logLoginFailed(email, 'No user or session returned', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Giriş başarısız oldu' },
        { status: 401 }
      );
    }

    await logLoginSuccess(data.user.id, email, ipAddress, userAgent);

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin' },
      { status: 500 }
    );
  }
}
