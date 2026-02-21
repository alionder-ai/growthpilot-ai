/**
 * Toast hook for managing toast notifications
 * Provides a simple API for showing success, error, and warning messages
 */

import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

let toastCount = 0;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastCount}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      return addToast(props);
    },
    [addToast]
  );

  // Convenience methods
  toast.success = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'success' });
    },
    [addToast]
  );

  toast.error = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'error' });
    },
    [addToast]
  );

  toast.warning = useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'warning' });
    },
    [addToast]
  );

  return {
    toasts,
    toast,
    removeToast,
  };
}
