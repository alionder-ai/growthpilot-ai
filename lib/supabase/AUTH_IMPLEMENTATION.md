# Authentication Implementation

## Overview

The authentication system for GrowthPilot AI is fully implemented using Supabase Auth with support for:
- Email/Password authentication
- Google OAuth authentication
- Session management
- Protected routes via middleware
- Row-Level Security (RLS) policies

## Components

### Backend Components

#### 1. Authentication Utilities (`lib/supabase/auth.ts`)
- `signUpWithEmail()` - User registration with email/password
- `signInWithEmail()` - User login with email/password
- `signInWithGoogle()` - Google OAuth authentication
- `signOut()` - User logout and session invalidation
- `getSession()` - Get current session
- `getCurrentUser()` - Get current user
- `refreshSession()` - Refresh expired session
- `onAuthStateChange()` - Listen to auth state changes
- `getAuthErrorMessage()` - Turkish error messages

#### 2. Server-Side Auth (`lib/supabase/auth-server.ts`)
- `createServerSupabaseClient()` - Server-side Supabase client
- `getAuthenticatedUser()` - Get user in server context
- `requireAuth()` - Require authentication in API routes

#### 3. API Routes
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/session` - Session validation
- `GET /api/auth/callback` - OAuth callback handler

### Frontend Components

#### 1. Auth Context (`lib/contexts/AuthContext.tsx`)
Provides authentication state and methods throughout the app:
- `user` - Current user object
- `session` - Current session
- `loading` - Loading state
- `isAuthenticated` - Authentication status
- `signIn()` - Login method
- `signUp()` - Registration method
- `signOut()` - Logout method
- `signInWithGoogle()` - Google OAuth method

#### 2. UI Components (`components/auth/`)
- `LoginForm` - Email/password login form with validation
- `SignupForm` - Registration form with password strength indicator
- `GoogleAuthButton` - Google OAuth button
- `LogoutButton` - Logout button
- `PasswordStrengthIndicator` - Visual password strength feedback

#### 3. Pages (`app/(auth)/`)
- `/login` - Login page
- `/register` - Registration page

### Middleware (`middleware.ts`)

Protected routes that require authentication:
- `/dashboard/*`
- `/clients/*`
- `/campaigns/*`
- `/action-plan/*`
- `/strategy-cards/*`
- `/reports/*`
- `/creative-generator/*`
- `/leads/*`

Automatic redirects:
- Unauthenticated users → `/login`
- Authenticated users on auth pages → `/dashboard`

## Security Features

### 1. Password Validation
- Minimum 6 characters (Supabase default)
- Password strength indicator (weak/medium/strong)
- Strength based on length and character variety

### 2. Rate Limiting
Client-side rate limiting preparation:
- 5 attempts per 15-minute window
- Automatic reset after window expires
- User-friendly error messages in Turkish

### 3. Error Handling
All error messages are translated to Turkish:
- Invalid credentials
- Email not confirmed
- User already registered
- Password too short
- Invalid email format
- Rate limit exceeded
- Session expired

### 4. Session Management
- Automatic session refresh
- Session validation on protected routes
- Secure cookie-based session storage
- Session invalidation on logout

## Usage Examples

### Using Auth Context in Components

```tsx
'use client';

import { useAuthContext } from '@/lib/contexts/AuthContext';

export function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuthContext();

  if (!isAuthenticated) {
    return <div>Lütfen giriş yapın</div>;
  }

  return (
    <div>
      <p>Hoş geldiniz, {user?.email}</p>
      <button onClick={signOut}>Çıkış Yap</button>
    </div>
  );
}
```

### Using Auth in API Routes

```tsx
import { requireAuth } from '@/lib/supabase/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // User is authenticated, proceed with logic
    return NextResponse.json({ userId: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

### Using Auth Hook (Alternative)

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export function MyComponent() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;
  if (!isAuthenticated) return <div>Giriş yapın</div>;

  return <div>Hoş geldiniz, {user?.email}</div>;
}
```

## Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Configuration

### 1. Enable Email/Password Authentication
In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)

### 2. Enable Google OAuth
In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Add authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

### 3. Configure Redirect URLs
In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add Site URL: `http://localhost:3000` (development)
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback` (production)

## Testing

### Manual Testing Checklist

- [ ] User can register with email/password
- [ ] User receives validation errors for invalid input
- [ ] Password strength indicator works
- [ ] User can login with email/password
- [ ] User can login with Google OAuth
- [ ] Invalid credentials show error message
- [ ] Rate limiting prevents brute force attempts
- [ ] User can logout successfully
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to login when not authenticated
- [ ] Authenticated users can't access login/register pages
- [ ] Session expires and redirects to login
- [ ] All error messages are in Turkish

## Next Steps

1. **Email Verification**: Configure email templates in Supabase
2. **Password Reset**: Implement forgot password flow
3. **Multi-Factor Authentication**: Add 2FA support (optional)
4. **Social Providers**: Add more OAuth providers (optional)
5. **Audit Logging**: Implement authentication audit logs (Requirement 15.6)

## Troubleshooting

### Issue: "Invalid login credentials"
- Verify email/password are correct
- Check if email is confirmed in Supabase dashboard
- Verify Supabase URL and keys in environment variables

### Issue: Google OAuth not working
- Verify Google OAuth credentials in Supabase
- Check redirect URLs are configured correctly
- Ensure NEXT_PUBLIC_APP_URL is set correctly

### Issue: Session not persisting
- Check browser cookies are enabled
- Verify middleware is configured correctly
- Check Supabase client initialization

### Issue: Rate limiting not working
- Rate limiting is client-side only (preparation)
- Production should use API gateway rate limiting
- Check localStorage is available in browser
