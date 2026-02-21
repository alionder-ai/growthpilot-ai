/**
 * Error handling utilities for Gemini API
 * Provides fallback to cached recommendations and user-friendly error messages
 */

import { getCachedRecommendation, cacheRecommendation } from './cache';

export class GeminiAPIError extends Error {
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly attemptCount?: number
  ) {
    super(message);
    this.name = 'GeminiAPIError';
  }
}

/**
 * Execute Gemini API call with cache fallback
 */
export async function executeWithFallback<T>(
  type: 'action_plan' | 'strategy_card' | 'creative',
  context: any,
  apiCall: () => Promise<T>
): Promise<{ data: T; fromCache: boolean }> {
  try {
    // Try API call
    const data = await apiCall();
    
    // Cache successful response
    cacheRecommendation(type, context, data);
    
    return { data, fromCache: false };
  } catch (error) {
    console.error(`Gemini API error for ${type}:`, error);
    
    // Try to get cached recommendation
    const cached = getCachedRecommendation(type, context);
    
    if (cached) {
      console.log(`Using cached ${type} recommendation`);
      return { data: cached, fromCache: true };
    }
    
    // No cache available, throw error
    throw new GeminiAPIError(
      `Gemini API başarısız oldu ve önbellek bulunamadı`,
      error as Error
    );
  }
}

/**
 * Get user-friendly error message in Turkish
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof GeminiAPIError) {
    return 'Yapay zeka servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin.';
  }
  
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes('API key')) {
      return 'Yapay zeka servisi yapılandırması hatalı. Lütfen sistem yöneticisiyle iletişime geçin.';
    }
    
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return 'Yapay zeka servisi kullanım limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Yapay zeka servisi yanıt vermedi. Lütfen tekrar deneyin.';
    }
  }
  
  return 'Bir hata oluştu. Lütfen tekrar deneyin.';
}

/**
 * Log error for monitoring (in production, send to error tracking service)
 */
export function logGeminiError(
  type: string,
  context: any,
  error: Error
): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type,
    context: JSON.stringify(context),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  };
  
  // In production, send to Sentry or similar service
  console.error('Gemini API Error:', errorLog);
  
  // TODO: Integrate with error tracking service
  // Sentry.captureException(error, { extra: errorLog });
}
