/**
 * Session-aware API hook
 * Automatically handles session expiration and redirects to login
 * Validates: Requirement 1.5
 */

'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { isSessionExpiredError, handleSessionExpiration } from '@/lib/utils/session-handler';
import { useToast } from '@/lib/contexts/ToastContext';

export function useSessionAwareAPI() {
  const router = useRouter();
  const { toast } = useToast();

  /**
   * Execute API call with session expiration handling
   */
  const executeAPI = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      options?: {
        showErrorToast?: boolean;
        onSessionExpired?: () => void;
      }
    ): Promise<T> => {
      try {
        return await apiCall();
      } catch (error) {
        // Check if it's a session expiration error
        if (isSessionExpiredError(error)) {
          // Show toast notification
          toast.error(
            'Oturum Süresi Doldu',
            'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'
          );

          // Call custom handler if provided
          if (options?.onSessionExpired) {
            options.onSessionExpired();
          } else {
            // Wait a moment for toast to be visible
            setTimeout(() => {
              handleSessionExpiration();
            }, 1000);
          }
        } else if (options?.showErrorToast !== false) {
          // Show generic error toast for other errors
          const message = error instanceof Error ? error.message : 'Bir hata oluştu';
          toast.error('Hata', message);
        }

        throw error;
      }
    },
    [router, toast]
  );

  /**
   * Fetch wrapper with session handling
   */
  const fetchWithSession = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, init);

      // Check for 401 Unauthorized
      if (response.status === 401) {
        toast.error(
          'Oturum Süresi Doldu',
          'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.'
        );

        setTimeout(() => {
          handleSessionExpiration();
        }, 1000);

        throw new Error('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
      }

      return response;
    },
    [toast]
  );

  return {
    executeAPI,
    fetchWithSession,
  };
}
