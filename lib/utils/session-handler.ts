/**
 * Session expiration handler
 * Validates: Requirement 1.5
 */

'use client';

/**
 * Check if error is a session expiration error
 */
export function isSessionExpiredError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('session') ||
      message.includes('unauthorized') ||
      message.includes('401') ||
      message.includes('token expired') ||
      message.includes('invalid token')
    );
  }

  if (typeof error === 'object' && error !== null) {
    const statusCode = (error as any).statusCode || (error as any).status;
    return statusCode === 401;
  }

  return false;
}

/**
 * Handle session expiration by redirecting to login
 */
export function handleSessionExpiration(returnUrl?: string): void {
  // Get current URL if not provided
  const currentUrl = returnUrl || window.location.pathname + window.location.search;

  // Build login URL with return URL
  const loginUrl = `/login?returnUrl=${encodeURIComponent(currentUrl)}`;

  // Redirect to login
  window.location.href = loginUrl;
}

/**
 * Get return URL from query params
 */
export function getReturnUrl(): string {
  if (typeof window === 'undefined') return '/dashboard';

  const params = new URLSearchParams(window.location.search);
  const returnUrl = params.get('returnUrl');

  // Validate return URL to prevent open redirect
  if (returnUrl && returnUrl.startsWith('/')) {
    return returnUrl;
  }

  return '/dashboard';
}

/**
 * Wrapper for API calls that handles session expiration
 */
export async function withSessionCheck<T>(
  fn: () => Promise<T>,
  onSessionExpired?: () => void
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (isSessionExpiredError(error)) {
      // Call custom handler if provided
      if (onSessionExpired) {
        onSessionExpired();
      } else {
        // Default: redirect to login
        handleSessionExpiration();
      }
    }
    throw error;
  }
}

/**
 * Create a fetch wrapper that handles session expiration
 */
export function createSessionAwareFetch() {
  return async function sessionAwareFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const response = await fetch(input, init);

    // Check for 401 Unauthorized
    if (response.status === 401) {
      handleSessionExpiration();
      throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
    }

    return response;
  };
}

/**
 * Session timeout warning (optional feature)
 */
export class SessionTimeoutWarning {
  private warningTimeout: NodeJS.Timeout | null = null;
  private expirationTimeout: NodeJS.Timeout | null = null;
  private onWarning?: () => void;
  private onExpiration?: () => void;

  constructor(
    sessionDuration: number, // in milliseconds
    warningBefore: number = 5 * 60 * 1000, // 5 minutes before expiration
    onWarning?: () => void,
    onExpiration?: () => void
  ) {
    this.onWarning = onWarning;
    this.onExpiration = onExpiration;

    // Set warning timeout
    const warningTime = sessionDuration - warningBefore;
    if (warningTime > 0) {
      this.warningTimeout = setTimeout(() => {
        this.onWarning?.();
      }, warningTime);
    }

    // Set expiration timeout
    this.expirationTimeout = setTimeout(() => {
      this.onExpiration?.();
      handleSessionExpiration();
    }, sessionDuration);
  }

  /**
   * Reset the timeout (call this on user activity)
   */
  reset(sessionDuration: number, warningBefore: number = 5 * 60 * 1000): void {
    this.clear();

    const warningTime = sessionDuration - warningBefore;
    if (warningTime > 0) {
      this.warningTimeout = setTimeout(() => {
        this.onWarning?.();
      }, warningTime);
    }

    this.expirationTimeout = setTimeout(() => {
      this.onExpiration?.();
      handleSessionExpiration();
    }, sessionDuration);
  }

  /**
   * Clear all timeouts
   */
  clear(): void {
    if (this.warningTimeout) {
      clearTimeout(this.warningTimeout);
      this.warningTimeout = null;
    }
    if (this.expirationTimeout) {
      clearTimeout(this.expirationTimeout);
      this.expirationTimeout = null;
    }
  }
}
