import { NextResponse } from 'next/server';

import { getCurrentUser, getSession } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { session, error: sessionError } = await getSession();

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    const { user, error: userError } = await getCurrentUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Kullanıcı bilgileri alınamadı' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Oturum doğrulanamadı' },
      { status: 500 }
    );
  }
}
