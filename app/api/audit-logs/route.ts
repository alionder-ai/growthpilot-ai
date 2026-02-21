/**
 * Audit Logs API
 * 
 * Allows users to view their authentication audit logs.
 * Validates Requirements: 15.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserAuditLogs } from '@/lib/security/audit-logger';

/**
 * GET /api/audit-logs
 * Get audit logs for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama başarısız' },
        { status: 401 }
      );
    }
    
    // Get limit from query params (default: 50, max: 100)
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    
    // Get audit logs for the user
    const logs = await getUserAuditLogs(user.id, limit);
    
    return NextResponse.json({
      logs,
      count: logs.length,
    });
  } catch (error) {
    console.error('Error in GET /api/audit-logs:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
