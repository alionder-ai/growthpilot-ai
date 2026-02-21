/**
 * Centralized error handling utilities
 * Provides user-friendly Turkish error messages for all API errors
 * Validates: Requirements 14.4
 */

export class APIError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Get user-friendly error message in Turkish
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  // Handle known error types
  if (error instanceof ValidationError) {
    return error.message;
  }

  if (error instanceof AuthenticationError) {
    return error.message;
  }

  if (error instanceof APIError) {
    // Map status codes to Turkish messages
    switch (error.statusCode) {
      case 400:
        return 'Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin.';
      case 401:
        return 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.';
      case 403:
        return 'Bu işlem için yetkiniz bulunmuyor.';
      case 404:
        return 'İstenen kaynak bulunamadı.';
      case 409:
        return 'Bu kayıt zaten mevcut.';
      case 429:
        return 'Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
      default:
        return error.message || 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return 'Bağlantı hatası. Lütfen internet bağlantınızı kontrol edin.';
    }

    if (error.message.includes('timeout')) {
      return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
    }

    if (error.message.includes('CORS')) {
      return 'Güvenlik hatası. Lütfen sistem yöneticisiyle iletişime geçin.';
    }

    // Return the error message if it's already in Turkish
    return error.message;
  }

  // Fallback for unknown errors
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}

/**
 * Format API error response for user display
 */
export function formatAPIError(error: unknown): {
  message: string;
  statusCode?: number;
  field?: string;
} {
  const message = getUserFriendlyErrorMessage(error);
  
  if (error instanceof APIError) {
    return {
      message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof ValidationError) {
    return {
      message,
      field: error.field,
    };
  }

  return { message };
}

/**
 * Meta API specific error messages
 */
export function getMetaAPIErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific Meta API error patterns
    if (error.message.includes('OAuthException')) {
      return 'Meta hesap bağlantınız geçersiz. Lütfen hesabınızı yeniden bağlayın.';
    }

    if (error.message.includes('rate limit')) {
      return 'Meta API kullanım limitine ulaşıldı. Lütfen bir süre bekleyip tekrar deneyin.';
    }

    if (error.message.includes('invalid token')) {
      return 'Meta erişim anahtarınız geçersiz. Lütfen hesabınızı yeniden bağlayın.';
    }

    if (error.message.includes('expired')) {
      return 'Meta erişim anahtarınızın süresi dolmuş. Lütfen hesabınızı yeniden bağlayın.';
    }

    if (error.message.includes('permission')) {
      return 'Meta hesabınızda gerekli izinler bulunmuyor. Lütfen izinleri kontrol edin.';
    }
  }

  return getUserFriendlyErrorMessage(error);
}

/**
 * Gemini API specific error messages
 */
export function getGeminiAPIErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific Gemini API error patterns
    if (error.message.includes('API key')) {
      return 'Yapay zeka servisi yapılandırması hatalı. Lütfen sistem yöneticisiyle iletişime geçin.';
    }

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      return 'Yapay zeka servisi kullanım limitine ulaşıldı. Lütfen daha sonra tekrar deneyin.';
    }

    if (error.message.includes('content policy') || error.message.includes('safety')) {
      return 'İçerik güvenlik politikası ihlali. Lütfen farklı bir içerik deneyin.';
    }

    if (error.message.includes('token limit')) {
      return 'İçerik çok uzun. Lütfen daha kısa bir içerik deneyin.';
    }
  }

  return getUserFriendlyErrorMessage(error);
}

/**
 * Database error messages
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific database error patterns
    if (error.message.includes('foreign key')) {
      return 'Bu kayıt başka kayıtlar tarafından kullanılıyor ve silinemez.';
    }

    if (error.message.includes('unique constraint')) {
      return 'Bu kayıt zaten mevcut.';
    }

    if (error.message.includes('not null')) {
      return 'Zorunlu alanlar eksik. Lütfen tüm alanları doldurun.';
    }

    if (error.message.includes('check constraint')) {
      return 'Girilen değer geçerli aralıkta değil.';
    }

    if (error.message.includes('connection')) {
      return 'Veritabanı bağlantısı kurulamadı. Lütfen daha sonra tekrar deneyin.';
    }

    if (error.message.includes('RLS') || error.message.includes('policy')) {
      return 'Bu işlem için yetkiniz bulunmuyor.';
    }
  }

  return getUserFriendlyErrorMessage(error);
}

/**
 * Log error for monitoring
 */
export function logError(
  context: string,
  error: unknown,
  additionalInfo?: Record<string, unknown>
): void {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    additionalInfo,
  };

  // Log to console in development
  console.error(`[${context}]`, errorLog);

  // TODO: In production, send to error tracking service (Sentry, etc.)
  // Sentry.captureException(error, { extra: errorLog });
}
