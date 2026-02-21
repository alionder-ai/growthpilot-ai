'use client';

/**
 * Language Context for i18n support
 * Implements Requirement 19.5: Language switching between Turkish and English
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type Language = 'tr' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'growthpilot_language';

/**
 * Language Provider Component
 * Manages language state and provides translation function
 */
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('tr');

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
      if (stored && (stored === 'tr' || stored === 'en')) {
        setLanguageState(stored);
      }
    }
  }, []);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    }
  }, []);

  // Translation function (placeholder - would use actual translation library in production)
  const t = useCallback((key: string): string => {
    // This is a simplified implementation
    // In production, this would use a proper i18n library like react-i18next
    return key;
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to use language context
 * @throws Error if used outside LanguageProvider
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Get translations for a specific language
 * This is a helper for testing and server-side rendering
 */
export function getTranslations(lang: Language) {
  // This would load actual translation files in production
  // For now, returns a simple object structure
  return {
    tr: {
      dashboard: 'Gösterge Paneli',
      clients: 'Müşteriler',
      campaigns: 'Kampanyalar',
      save: 'Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
    },
    en: {
      dashboard: 'Dashboard',
      clients: 'Clients',
      campaigns: 'Campaigns',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
    },
  }[lang];
}
