# Supabase Authentication Setup

## Overview

This project uses Supabase Auth for authentication with support for:
- Email/Password authentication
- Google OAuth authentication
- Session management with automatic token refresh
- Row-Level Security (RLS) for data isolation

## Environment Variables

Ensure the following environment variables are set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Google OAuth Configuration

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized redirect URIs:
   - Development: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Production: `https://your-production-domain.supabase.co/auth/v1/callback`
7. Copy the Client ID and Client Secret

### 2. Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" in the list and enable it
4. Enter your Google Client ID and Client Secret
5. Save the configuration

### 3. Configure Redirect URLs

In Supabase dashboard:
1. Go to "Authentication" > "URL Configuration"
2. Add your site URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Add redirect URLs:
   - `http://localhost:3000/api/auth/callback` (development)
   - `https://your-domain.com/api/auth/callback` (production)

## Email/Password Configuration

### Password Requirements

Current configuration (can be modified in Supabase dashboard):
- Minimum length: 6 characters
- No special character requirements

### Email Confirmation

By default, Supabase requires email confirmation. To configure:

1. Go to Supabase dashboard > "Authentication" > "Email Templates"
2. Customize the confirmation email template
3. For development, you can disable email confirmation:
   - Go to "Authentication" > "Settings"
   - Disable "Enable email confirmations"

## Session Management

### Session Duration

- Access tokens expire after 1 hour
- Refresh tokens are automatically used to get new access tokens
- Sessions persist across browser sessions (stored in cookies)

### Session Validation

The middleware automatically validates sessions for protected routes:
- `/dashboard/*`
- `/clients/*`
- `/campaigns/*`
- `/action-plan/*`
- `/strategy-cards/*`
- `/reports/*`
- `/creative-generator/*`
- `/leads/*`

## API Routes

### Authentication Endpoints

- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/session` - Get current session
- `GET /api/auth/callback` - OAuth callback handler

### Usage Examples

#### Sign Up
```typescript
const response = await fetch('/api/auth/signup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

#### Login
```typescript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

#### Logout
```typescript
const response = await fetch('/api/auth/logout', {
  method: 'POST',
});
```

## Client-Side Usage

### Using the Auth Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, session, loading, isAuthenticated } = useAuth();

  if (loading) return <div>Yükleniyor...</div>;
  if (!isAuthenticated) return <div>Giriş yapmanız gerekiyor</div>;

  return <div>Hoş geldiniz, {user?.email}</div>;
}
```

### Using the Auth Context

```typescript
import { useAuthContext } from '@/lib/contexts/AuthContext';

function LoginForm() {
  const { signIn, signInWithGoogle } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signIn({ email, password });
      // Redirect to dashboard
    } catch (error) {
      // Handle error
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // User will be redirected to Google OAuth
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## Server-Side Usage

### In API Routes

```typescript
import { requireAuth } from '@/lib/supabase/auth-server';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    // User is authenticated, proceed with logic
  } catch (error) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
}
```

### In Server Components

```typescript
import { getAuthenticatedUser } from '@/lib/supabase/auth-server';

export default async function DashboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login');
  }

  return <div>Dashboard for {user.email}</div>;
}
```

## Error Handling

All authentication errors are translated to Turkish. Common error messages:

- `Geçersiz e-posta veya şifre` - Invalid credentials
- `E-posta adresiniz henüz doğrulanmamış` - Email not confirmed
- `Bu e-posta adresi zaten kayıtlı` - Email already registered
- `Şifre en az 6 karakter olmalıdır` - Password too short
- `Oturumunuz sona erdi. Lütfen tekrar giriş yapın` - Session expired

## Security Considerations

1. **RLS Policies**: All database tables have Row-Level Security enabled
2. **Session Storage**: Sessions are stored in HTTP-only cookies
3. **Token Refresh**: Access tokens are automatically refreshed
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure allowed origins in Supabase dashboard

## Testing

To test authentication:

1. Start the development server: `npm run dev`
2. Navigate to `/register` to create an account
3. Check your email for confirmation (if enabled)
4. Navigate to `/login` to sign in
5. Try Google OAuth by clicking the Google sign-in button

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure all required environment variables are set in `.env.local`
- Restart the development server after adding variables

### Google OAuth not working
- Verify redirect URLs match exactly in Google Console and Supabase
- Check that Google OAuth is enabled in Supabase dashboard
- Ensure Client ID and Secret are correct

### Session not persisting
- Check that cookies are enabled in the browser
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Clear browser cookies and try again

### RLS policy errors
- Ensure RLS policies are properly configured in Supabase
- Check that the user_id column exists in tables
- Verify policies allow the authenticated user to access their data
