'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  onAuthStateChange,
  getSession,
  getCurrentUser,
} from '@/lib/supabase/auth';
import type { AuthContextType, LoginCredentials, SignupCredentials } from '@/lib/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initAuth = async () => {
      try {
        const { session: currentSession } = await getSession();
        const { user: currentUser } = await getCurrentUser();
        
        setSession(currentSession);
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const authListener = onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener?.data?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (credentials: LoginCredentials) => {
    const { user, session, error } = await signInWithEmail(
      credentials.email,
      credentials.password
    );

    if (error) {
      throw error;
    }

    setUser(user);
    setSession(session);
  };

  const signUp = async (credentials: SignupCredentials) => {
    const { user, session, error } = await signUpWithEmail(
      credentials.email,
      credentials.password
    );

    if (error) {
      throw error;
    }

    setUser(user);
    setSession(session);
  };

  const signOut = async () => {
    const { error } = await authSignOut();

    if (error) {
      throw error;
    }

    setUser(null);
    setSession(null);
  };

  const handleSignInWithGoogle = async () => {
    const { error } = await signInWithGoogle();

    if (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    signInWithGoogle: handleSignInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
}
