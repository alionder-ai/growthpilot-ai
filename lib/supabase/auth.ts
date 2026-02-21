import type { AuthError, Session, User } from '@supabase/supabase-js';

import { supabase } from './client';

/**
 * Authentication response type
 */
export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });

    return { data, error };
  } catch (error) {
    return {
      data: null,
      error: error as AuthError,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error: error as AuthError };
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.getSession();
    return {
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser(): Promise<{
  user: User | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.getUser();
    return {
      user: data.user,
      error,
    };
  } catch (error) {
    return {
      user: null,
      error: error as AuthError,
    };
  }
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<{
  session: Session | null;
  error: AuthError | null;
}> {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    return {
      session: data.session,
      error,
    };
  } catch (error) {
    return {
      session: null,
      error: error as AuthError,
    };
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(
  callback: (event: string, session: Session | null) => void
) {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  
  return data;
}

/**
 * Get user-friendly error message in Turkish
 */
export function getAuthErrorMessage(error: AuthError | null): string {
  if (!error) return '';

  switch (error.message) {
    case 'Invalid login credentials':
      return 'Geçersiz e-posta veya şifre';
    case 'Email not confirmed':
      return 'E-posta adresiniz henüz doğrulanmamış';
    case 'User already registered':
      return 'Bu e-posta adresi zaten kayıtlı';
    case 'Password should be at least 6 characters':
      return 'Şifre en az 6 karakter olmalıdır';
    case 'Unable to validate email address: invalid format':
      return 'Geçersiz e-posta formatı';
    case 'Email rate limit exceeded':
      return 'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin';
    case 'Invalid email or password':
      return 'Geçersiz e-posta veya şifre';
    case 'Email link is invalid or has expired':
      return 'E-posta bağlantısı geçersiz veya süresi dolmuş';
    case 'Token has expired or is invalid':
      return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın';
    case 'User not found':
      return 'Kullanıcı bulunamadı';
    default:
      return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
}
