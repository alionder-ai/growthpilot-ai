import { NextRequest, NextResponse } from 'next/server';

import { signOut } from '@/lib/supabase/auth';
import { createServerClient } from '@/lib/supabase/server';
import { logLogout, getIpAddress, getUserAgent } from '@/lib/security/audit-logger';

export async function POST(request: NextRequest) {
  try {
    // Get current user before logout
    const supabase = createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Extract request metadata
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);

    // Perform logout
    const { error } = await signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Log logout event if we had a user
    if (user) {
      await logLogout(user.id, user.email || 'unknown', ipAddress, userAgent);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Çıkış yapılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
