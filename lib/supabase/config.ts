/**
 * Supabase configuration constants
 */

export const SUPABASE_CONFIG = {
  auth: {
    // OAuth providers
    providers: {
      google: {
        enabled: true,
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      },
    },
    
    // Session configuration
    session: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    
    // Password requirements
    password: {
      minLength: 6,
      requireUppercase: false,
      requireLowercase: false,
      requireNumbers: false,
      requireSpecialChars: false,
    },
  },
  
  // RLS policies
  rls: {
    enabled: true,
  },
} as const;

/**
 * OAuth redirect URLs for different providers
 */
export function getOAuthRedirectUrl(provider: 'google'): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`;
}

/**
 * Get the post-login redirect URL
 */
export function getPostLoginRedirectUrl(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
}

/**
 * Get the post-logout redirect URL
 */
export function getPostLogoutRedirectUrl(): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/login`;
}
