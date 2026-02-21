/**
 * Sentry Error Tracking Configuration
 * 
 * This module provides error tracking and performance monitoring
 * using Sentry for production environments.
 */

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  enabled: boolean;
}

/**
 * Get Sentry configuration from environment variables
 */
export function getSentryConfig(): SentryConfig {
  return {
    dsn: process.env.SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    enabled: !!process.env.SENTRY_DSN && process.env.NODE_ENV === 'production'
  };
}

/**
 * Capture exception with context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    console.error('Error:', error, 'Context:', context);
    return;
  }

  // In production, this would use @sentry/nextjs
  // For now, we log to console
  console.error('[Sentry] Exception:', {
    error: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Capture message with severity level
 */
export function captureMessage(
  message: string, 
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, any>
) {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    console.log(`[${level.toUpperCase()}] ${message}`, context);
    return;
  }

  console.log(`[Sentry] ${level}:`, {
    message,
    context,
    timestamp: new Date().toISOString()
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string }) {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    return;
  }

  console.log('[Sentry] User context set:', user);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>
) {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    return;
  }

  console.log('[Sentry] Breadcrumb:', {
    message,
    category,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Track API performance
 */
export function trackAPIPerformance(
  endpoint: string,
  duration: number,
  status: number
) {
  const config = getSentryConfig();
  
  if (!config.enabled) {
    return;
  }

  console.log('[Sentry] API Performance:', {
    endpoint,
    duration,
    status,
    timestamp: new Date().toISOString()
  });
}
