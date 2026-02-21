import { cookies } from 'next/headers';
import { createServerClient as createSupabaseServerClient } from '@supabase/auth-helpers-nextjs';

// Re-export createServerClient for external use
export { createServerClient } from '@supabase/auth-helpers-nextjs';

/**
 * Create a Supabase client for server-side operations (API routes, Server Components)
 * This client respects RLS policies and uses the authenticated user's session
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}
