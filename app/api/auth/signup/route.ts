import { NextRequest, NextResponse } from 'next/server';

import { getAuthErrorMessage, signUpWithEmail } from '@/lib/supabase/auth';
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as SignupRequestBody;
    const { email, password } = body;

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

    // Attempt to sign up
    const { user, session, error } = await signUpWithEmail(email, password);

    if (error) {
      await logSignupFailed(email, error.message, ipAddress, userAgent);
      return NextResponse.json(
        { error: getAuthErrorMessage(error) },
        { status: 400 }
      );
    }

    if (!user) {
      await logSignupFailed(email, 'No user returned', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Kayıt başarısız oldu' },
        { status: 400 }
      );
    }

    // Log successful signup
    await logSignupSuccess(user.id, email, ipAddress, userAgent);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      session: session ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
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
