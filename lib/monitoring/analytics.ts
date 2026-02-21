/**
 * Analytics and Performance Monitoring
 * 
 * This module provides analytics tracking and performance monitoring
 * for GrowthPilot AI platform.
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count';
  timestamp: string;
}

/**
 * Track user event
 */
export function trackEvent(name: string, properties?: Record<string, any>) {
  const event: AnalyticsEvent = {
    name,
    properties,
    timestamp: new Date().toISOString()
  };

  // In production, this would send to Vercel Analytics or custom analytics service
  if (process.env.NODE_ENV === 'production') {
    console.log('[Analytics] Event:', event);
  }
}

/**
 * Track page view
 */
export function trackPageView(path: string, properties?: Record<string, any>) {
  trackEvent('page_view', {
    path,
    ...properties
  });
}

/**
 * Track API call performance
 */
export function trackAPICall(
  endpoint: string,
  method: string,
  duration: number,
  status: number
) {
  const metric: PerformanceMetric = {
    name: 'api_call',
    value: duration,
    unit: 'ms',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'production') {
    console.log('[Analytics] API Call:', {
      endpoint,
      method,
      duration,
      status,
      ...metric
    });
  }

  // Alert if response time is too slow
  if (duration > 2000) {
    console.warn(`[Performance] Slow API call: ${endpoint} took ${duration}ms`);
  }
}

/**
 * Track database query performance
 */
export function trackDatabaseQuery(
  query: string,
  duration: number,
  rowCount?: number
) {
  const metric: PerformanceMetric = {
    name: 'database_query',
    value: duration,
    unit: 'ms',
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'production') {
    console.log('[Analytics] Database Query:', {
      query: query.substring(0, 100), // Truncate for logging
      duration,
      rowCount,
      ...metric
    });
  }

  // Alert if query is too slow
  if (duration > 1000) {
    console.warn(`[Performance] Slow database query: ${duration}ms`);
  }
}

/**
 * Track external API call (Meta, Gemini)
 */
export function trackExternalAPI(
  service: 'meta' | 'gemini',
  operation: string,
  duration: number,
  success: boolean,
  error?: string
) {
  trackEvent('external_api_call', {
    service,
    operation,
    duration,
    success,
    error
  });

  if (!success) {
    console.error(`[Analytics] External API failure: ${service} - ${operation}`, error);
  }
}

/**
 * Track user action
 */
export function trackUserAction(
  action: string,
  category: string,
  properties?: Record<string, any>
) {
  trackEvent('user_action', {
    action,
    category,
    ...properties
  });
}

/**
 * Track error
 */
export function trackError(
  error: Error,
  context?: Record<string, any>
) {
  trackEvent('error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
}

/**
 * Track business metric
 */
export function trackBusinessMetric(
  metric: string,
  value: number,
  properties?: Record<string, any>
) {
  trackEvent('business_metric', {
    metric,
    value,
    ...properties
  });
}

/**
 * Get Web Vitals (Core Web Vitals)
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
}) {
  if (process.env.NODE_ENV === 'production') {
    console.log('[Analytics] Web Vital:', metric);
  }

  // Alert if metrics are poor
  const thresholds: Record<string, number> = {
    FCP: 1800,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    FID: 100,   // First Input Delay
    CLS: 0.1,   // Cumulative Layout Shift
    TTFB: 600   // Time to First Byte
  };

  if (metric.name in thresholds && metric.value > thresholds[metric.name]) {
    console.warn(`[Performance] Poor ${metric.name}: ${metric.value}`);
  }
}

/**
 * Track cache hit/miss
 */
export function trackCachePerformance(
  key: string,
  hit: boolean,
  duration?: number
) {
  trackEvent('cache_access', {
    key,
    hit,
    duration
  });
}

/**
 * Track AI recommendation generation
 */
export function trackAIRecommendation(
  type: 'action_plan' | 'strategy_card' | 'creative',
  duration: number,
  success: boolean,
  tokenCount?: number
) {
  trackEvent('ai_recommendation', {
    type,
    duration,
    success,
    tokenCount
  });
}

/**
 * Track report generation
 */
export function trackReportGeneration(
  format: 'whatsapp' | 'pdf',
  duration: number,
  success: boolean,
  size?: number
) {
  trackEvent('report_generation', {
    format,
    duration,
    success,
    size
  });
}
