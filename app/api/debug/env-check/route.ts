import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * DEBUG ENDPOINT - Checks environment variables
 * GET /api/debug/env-check
 */
export async function GET() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    META_APP_ID: !!process.env.META_APP_ID,
    META_APP_SECRET: !!process.env.META_APP_SECRET,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const missingVars = Object.entries(envVars)
    .filter(([_, exists]) => !exists)
    .map(([key]) => key);

  return NextResponse.json({
    allConfigured: missingVars.length === 0,
    configured: envVars,
    missing: missingVars,
    message: missingVars.length === 0 
      ? 'Tüm environment variable\'lar yapılandırılmış' 
      : `${missingVars.length} environment variable eksik`,
  });
}
