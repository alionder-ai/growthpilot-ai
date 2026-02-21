/**
 * Toast Context Provider
 * Provides toast functionality throughout the application
 */

'use client';

import React from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  toast: {
    (props: Omit<Toast, 'id'>): string;
    success: (title: string, description?: string) => string;
    error: (title: string, description?: string) => string;
    warning: (title: string, description?: string) => string;
  };
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

let toastCount = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
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
  }, [removeToast]);

  const toast = React.useCallback(
    (props: Omit<Toast, 'id'>) => {
      return addToast(props);
    },
    [addToast]
  ) as ToastContextType['toast'];

  // Convenience methods
  toast.success = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'success' });
    },
    [addToast]
  );

  toast.error = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'error' });
    },
    [addToast]
  );

  toast.warning = React.useCallback(
    (title: string, description?: string) => {
      return addToast({ title, description, variant: 'warning' });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
