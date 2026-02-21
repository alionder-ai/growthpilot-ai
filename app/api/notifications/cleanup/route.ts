import { NextResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * Notification Cleanup Cron Job
 * Runs daily at 02:00 UTC via Vercel Cron
 * Deletes read notifications older than 30 days
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createClient();

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete read notifications older than 30 days
    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('read_status', true)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('notification_id');

    if (error) {
      console.error('Notification cleanup error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    const deletedCount = data?.length || 0;

    console.log(`Notification cleanup completed: ${deletedCount} notifications deleted`);

    return NextResponse.json({
      success: true,
      deletedCount,
      timestamp: new Date().toISOString(),
      message: `Başarıyla ${deletedCount} bildirim temizlendi`
    });

  } catch (error) {
    console.error('Notification cleanup exception:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing
export async function GET() {
  return NextResponse.json({
    message: 'Notification cleanup cron job',
    schedule: 'Daily at 02:00 UTC',
    description: 'Deletes read notifications older than 30 days'
  });
}
