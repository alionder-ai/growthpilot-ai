import { NextRequest, NextResponse } from 'next/server';

import { getAuthErrorMessage, signInWithEmail } from '@/lib/supabase/auth';
import { 
  logLoginSuccess, 
  logLoginFailed, 
  getIpAddress, 
  getUserAgent 
} from '@/lib/security/audit-logger';

interface LoginRequestBody {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginRequestBody;
    const { email, password } = body;

    // Extract request metadata for audit logging
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    // Validate required fields
    if (!email || !password) {
      await logLoginFailed(email || 'unknown', 'Missing credentials', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Attempt to sign in
    const { user, session, error } = await signInWithEmail(email, password);

    if (error) {
      // Log failed login attempt
      await logLoginFailed(email, error.message, ipAddress, userAgent);
      
      return NextResponse.json(
        { error: getAuthErrorMessage(error) },
        { status: 401 }
      );
    }

    if (!user || !session) {
      await logLoginFailed(email, 'No user or session returned', ipAddress, userAgent);
      return NextResponse.json(
        { error: 'Giriş başarısız oldu' },
        { status: 401 }
      );
    }

    // Log successful login
    await logLoginSuccess(user.id, email, ipAddress, userAgent);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu. Lütfen tekrar deneyin' },
      { status: 500 }
    );
  }
}
