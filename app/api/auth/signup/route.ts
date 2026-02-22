import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

import { getAuthErrorMessage } from '@/lib/supabase/auth';
import { isValidEmail, isValidPassword } from '@/lib/utils/validation';
import { 
  logSignupSuccess, 
  logSignupFailed, 
  getIpAddress, 
  getUserAgent 
} from '@/lib/security/audit-logger';

export const dynamic = 'force-dynamic';

interface SignupRequestBody {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignupRequestBody;
    const { email, password, firstName, lastName, dateOfBirth } = body;

    // Extract request metadata for audit logging
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    // Validate required fields
    if (!email || !password) {
      await logSignupFailed(email || 'unknown', 'Missing credentials', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      await logSignupFailed(email, 'Invalid email format', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Geçersiz e-posta formatı' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      await logSignupFailed(email, 'Weak password', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Create server-side Supabase client with cookie handling
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
            cookieStore.set(name, '', options);
          },
        },
      }
    );

    // Attempt to sign up using server-side client
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
        },
      },
    });

    if (error) {
      await logSignupFailed(email, error.message, ipAddress, userAgent);
      return NextResponse.json(
        { error: getAuthErrorMessage(error) },
        { status: 400 }
      );
    }

    if (!data.user) {
      await logSignupFailed(email, 'No user returned', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Kayıt başarısız oldu' },
        { status: 400 }
      );
    }

    // Log successful signup
    await logSignupSuccess(data.user.id, email, ipAddress, userAgent);

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session ? {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      } : null,
      message: 'Kayıt başarılı. E-posta adresinizi doğrulayın.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin' },
      { status: 500 }
    );
  }
}
