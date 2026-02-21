/**
 * Network error handler with toast notifications and retry options
 * Validates: Requirements 14.1, 14.2, 14.3
 */

import { withRetry, isRetryableError } from './retry';
import { getUserFriendlyErrorMessage, getMetaAPIErrorMessage, getGeminiAPIErrorMessage, logError } from './error-handler';

export interface NetworkErrorHandlerOptions {
  showToast?: boolean;
  allowRetry?: boolean;
  context: string;
  onError?: (error: Error) => void;
  onRetry?: (attempt: number) => void;
}

/**
 * Handle network errors with user-friendly messages and retry options
 */
export async function handleNetworkError<T>(
  fn: () => Promise<T>,
  options: NetworkErrorHandlerOptions
): Promise<T> {
  const { context, showToast = true, allowRetry = true, onError, onRetry } = options;

  try {
    if (allowRetry && isRetryableError) {
      return await withRetry(fn, context, {
        maxAttempts: 3,
        initialDelay: 1000,
        onRetry: (attempt, error) => {
          console.log(`Retrying ${context} (attempt ${attempt}/3)...`);
          onRetry?.(attempt);
        },
      });
    } else {
      return await fn();
    }
  } catch (error) {
    // Log the error
    logError(context, error);

    // Call error callback
    onError?.(error as Error);

    // Get user-friendly message
    const message = getUserFriendlyErrorMessage(error);

    // Re-throw with user-friendly message
    throw new Error(message);
  }
}

/**
 * Handle Meta API errors specifically
 */
export async function handleMetaAPIError<T>(
  fn: () => Promise<T>,
  options: Omit<NetworkErrorHandlerOptions, 'context'>
): Promise<T> {
  try {
    return await handleNetworkError(fn, {
      ...options,
      context: 'Meta API',
    });
  } catch (error) {
    const message = getMetaAPIErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Handle Gemini API errors specifically
 */
export async function handleGeminiAPIError<T>(
  fn: () => Promise<T>,
  options: Omit<NetworkErrorHandlerOptions, 'context'>
): Promise<T> {
  try {
    return await handleNetworkError(fn, {
      ...options,
      context: 'Gemini API',
    });
  } catch (error) {
    const message = getGeminiAPIErrorMessage(error);
    throw new Error(message);
  }
}

/**
 * Create a retry handler for client-side API calls
 */
export function createRetryHandler(toast: any) {
  return {
    /**
     * Execute API call with automatic retry and toast notifications
     */
    async execute<T>(
      fn: () => Promise<T>,
      options: {
        successMessage?: string;
        errorMessage?: string;
        context: string;
      }
    ): Promise<T> {
      try {
        const result = await handleNetworkError(fn, {
          context: options.context,
          showToast: true,
          allowRetry: true,
          onRetry: (attempt) => {
            toast.warning(
              'Yeniden deneniyor...',
              `Bağlantı hatası. Deneme ${attempt}/3`
            );
          },
        });

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        return result;
      } catch (error) {
        const message = options.errorMessage || getUserFriendlyErrorMessage(error);
        toast.error('Hata', message);
        throw error;
      }
    },

    /**
     * Execute with manual retry option
     */
    async executeWithManualRetry<T>(
      fn: () => Promise<T>,
      options: {
        context: string;
        onRetryClick: () => void;
      }
    ): Promise<T> {
      try {
        return await fn();
      } catch (error) {
        const message = getUserFriendlyErrorMessage(error);
        
        // Show error with retry button
        toast.error('Hata', message);
        
        // Store retry function for manual retry
        options.onRetryClick();
        
        throw error;
      }
    },
  };
}
