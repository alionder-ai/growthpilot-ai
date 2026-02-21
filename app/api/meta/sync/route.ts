import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { syncAllUsers } from '@/lib/meta/sync';

/**
 * POST /api/meta/sync
 * Triggers Meta API sync for all users (called by cron job)
 * This endpoint should be protected by Vercel Cron secret in production
 */
export async function POST() {
  try {
    const supabase = await createServerClient();
    
    // In production, verify cron secret here
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Sync all users
    await syncAllUsers(supabase);

    return NextResponse.json({
      success: true,
      message: 'Tüm kullanıcılar için senkronizasyon tamamlandı',
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
