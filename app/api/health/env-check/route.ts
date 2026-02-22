import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    META_APP_ID: !!process.env.META_APP_ID,
    META_APP_SECRET: !!process.env.META_APP_SECRET,
    NEXT_PUBLIC_APP_URL: !!process.env.NEXT_PUBLIC_APP_URL,
    GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
    ENCRYPTION_KEY: !!process.env.ENCRYPTION_KEY,
  };

  const allPresent = Object.values(envCheck).every(v => v === true);

  return NextResponse.json({
    status: allPresent ? 'ok' : 'missing_vars',
    env: envCheck,
    timestamp: new Date().toISOString(),
  });
}
