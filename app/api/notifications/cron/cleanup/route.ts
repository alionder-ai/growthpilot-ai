import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications/cron/cleanup
 * 
 * Cron job that deletes read notifications older than 30 days
 * Runs daily at 02:00 UTC
 * 
 * This endpoint uses service role key to bypass RLS and process all users
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (Vercel adds this header)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In development, allow requests without cron secret
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Yetkisiz erişim' },
          { status: 401 }
        );
      }
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Calculate date threshold (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateThreshold = thirtyDaysAgo.toISOString();

    // Delete read notifications older than 30 days
    const { data: deletedNotifications, error } = await supabase
      .from('notifications')
      .delete()
      .eq('read_status', true)
      .lt('created_at', dateThreshold)
      .select('notification_id');

    if (error) {
      console.error('Error deleting old notifications:', error);
      return NextResponse.json(
        { 
          error: 'Bildirimler silinirken hata oluştu',
          details: error.message 
        },
        { status: 500 }
      );
    }

    const deletedCount = deletedNotifications?.length || 0;

    console.log(`Deleted ${deletedCount} old read notifications`);

    return NextResponse.json({
      success: true,
      message: `${deletedCount} eski bildirim silindi`,
      deletedCount,
      dateThreshold,
    });
  } catch (error) {
    console.error('Error in notification cleanup cron job:', error);
    return NextResponse.json(
      { 
        error: 'Beklenmeyen bir hata oluştu',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
