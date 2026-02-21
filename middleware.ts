import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(request: NextRequest) {
  // HTTPS Enforcement (Validates Requirements: 15.2)
  // In production, redirect HTTP to HTTPS
  // Vercel automatically handles HTTPS, but we add this as a safeguard
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    const httpsUrl = new URL(request.url);
    httpsUrl.protocol = 'https:';
    return NextResponse.redirect(httpsUrl, 301);
  }

  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req: request, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes that require authentication
  const protectedPaths = [
    '/dashboard',
    '/clients',
    '/campaigns',
    '/action-plan',
    '/strategy-cards',
    '/reports',
    '/creative-generator',
    '/leads',
  ];

  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Redirect to login if accessing protected route without session
  // Validates: Requirement 1.5 (session expiration handling)
  if (isProtectedPath && !session) {
    const redirectUrl = new URL('/login', request.url);
    // Store the full path including query params for return after login
    const returnUrl = request.nextUrl.pathname + request.nextUrl.search;
    redirectUrl.searchParams.set('returnUrl', returnUrl);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages with active session
  const authPaths = ['/login', '/register'];
  const isAuthPath = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isAuthPath && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/campaigns/:path*',
    '/action-plan/:path*',
    '/strategy-cards/:path*',
    '/reports/:path*',
    '/creative-generator/:path*',
    '/leads/:path*',
    '/login',
    '/register',
  ],
};
