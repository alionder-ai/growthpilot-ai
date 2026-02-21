/**
 * Validation utilities for user input
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * Minimum 6 characters as per Supabase default
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Get password strength level
 * Returns: weak, medium, strong
 */
export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 6) return 'weak';
  
  let strength = 0;
  
  // Length check
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return 'weak';
  if (strength <= 4) return 'medium';
  return 'strong';
}

/**
 * Get password strength message in Turkish
 */
export function getPasswordStrengthMessage(password: string): string {
  const strength = getPasswordStrength(password);
  
  switch (strength) {
    case 'weak':
      return 'Zayıf şifre';
    case 'medium':
      return 'Orta güçlükte şifre';
    case 'strong':
      return 'Güçlü şifre';
  }
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  fields: Record<string, unknown>
): { isValid: boolean; missingFields: string[] } {
  const missingFields = Object.entries(fields)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Validate commission percentage (0-100)
 * Validates: Requirement 3.4
 */
export function validateCommissionPercentage(percentage: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return {
      isValid: false,
      error: 'Komisyon yüzdesi sayı olmalıdır',
    };
  }

  if (percentage < 0 || percentage > 100) {
    return {
      isValid: false,
      error: 'Komisyon yüzdesi 0 ile 100 arasında olmalıdır',
    };
  }

  return { isValid: true };
}

/**
 * Validate phone number (Turkish format)
 */
export function validatePhoneNumber(phone: string): {
  isValid: boolean;
  error?: string;
} {
  // Turkish phone format: +90 5XX XXX XX XX or 05XX XXX XX XX
  const phoneRegex = /^(\+90|0)?5\d{9}$/;
  const cleanPhone = phone.replace(/\s/g, '');

  if (!phoneRegex.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Geçerli bir telefon numarası giriniz (örn: 05XX XXX XX XX)',
    };
  }

  return { isValid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): {
  isValid: boolean;
  error?: string;
} {
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Geçerli bir URL giriniz',
    };
  }
}

/**
 * Get field validation error message in Turkish
 */
export function getFieldErrorMessage(field: string): string {
  const fieldNames: Record<string, string> = {
    email: 'E-posta',
    password: 'Şifre',
    name: 'İsim',
    phone: 'Telefon',
    industry: 'Sektör',
    commission: 'Komisyon',
    budget: 'Bütçe',
    campaign: 'Kampanya',
  };

  const fieldName = fieldNames[field] || field;
  return `${fieldName} alanı zorunludur`;
}
