/**
 * Rate limiting utilities
 * Note: This is a basic client-side implementation for preparation.
 * Production rate limiting should be implemented at the API gateway level.
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
};

/**
 * Check if rate limit is exceeded for a given key
 * Uses localStorage for client-side tracking
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remainingAttempts: number; resetTime: number } {
  if (typeof window === 'undefined') {
    return { allowed: true, remainingAttempts: config.maxAttempts, resetTime: 0 };
  }

  const storageKey = `rate_limit_${key}`;
  const now = Date.now();

  try {
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : null;

    // Reset if window has passed
    if (!data || now > data.resetTime) {
      const newData = {
        attempts: 0,
        resetTime: now + config.windowMs,
      };
      localStorage.setItem(storageKey, JSON.stringify(newData));
      return {
        allowed: true,
        remainingAttempts: config.maxAttempts,
        resetTime: newData.resetTime,
      };
    }

    // Check if limit exceeded
    if (data.attempts >= config.maxAttempts) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetTime: data.resetTime,
      };
    }

    return {
      allowed: true,
      remainingAttempts: config.maxAttempts - data.attempts,
      resetTime: data.resetTime,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    return { allowed: true, remainingAttempts: config.maxAttempts, resetTime: 0 };
  }
}

/**
 * Record an attempt for rate limiting
 */
export function recordAttempt(key: string): void {
  if (typeof window === 'undefined') return;

  const storageKey = `rate_limit_${key}`;

  try {
    const stored = localStorage.getItem(storageKey);
    const data = stored ? JSON.parse(stored) : { attempts: 0, resetTime: Date.now() + DEFAULT_CONFIG.windowMs };

    data.attempts += 1;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('Record attempt error:', error);
  }
}

/**
 * Get time remaining until rate limit reset
 */
export function getTimeUntilReset(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;

  if (diff <= 0) return '0 dakika';

  const minutes = Math.ceil(diff / 60000);
  return `${minutes} dakika`;
}
