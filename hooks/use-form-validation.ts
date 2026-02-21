/**
 * Form validation hook
 * Provides real-time validation with Turkish error messages
 */

import { useState, useCallback } from 'react';
import {
  isValidEmail,
  validateCommissionPercentage,
  validatePhoneNumber,
  validateURL,
  getFieldErrorMessage,
} from '@/lib/utils/validation';

export interface ValidationRule {
  required?: boolean;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface FormValidationConfig {
  [field: string]: ValidationRule;
}

export interface FormErrors {
  [field: string]: string | undefined;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationConfig: FormValidationConfig
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: string, value: any): string | undefined => {
      const rules = validationConfig[field];
      if (!rules) return undefined;

      // Required validation
      if (rules.required && !value) {
        return getFieldErrorMessage(field);
      }

      // Skip other validations if value is empty and not required
      if (!value) return undefined;

      // Email validation
      if (rules.email && !isValidEmail(value)) {
        return 'Geçerli bir e-posta adresi giriniz';
      }

      // Phone validation
      if (rules.phone) {
        const result = validatePhoneNumber(value);
        if (!result.isValid) return result.error;
      }

      // URL validation
      if (rules.url) {
        const result = validateURL(value);
        if (!result.isValid) return result.error;
      }

      // Min/Max validation for numbers
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          return `Minimum değer ${rules.min} olmalıdır`;
        }
        if (rules.max !== undefined && value > rules.max) {
          return `Maksimum değer ${rules.max} olmalıdır`;
        }

        // Special case for commission percentage
        if (field.toLowerCase().includes('commission')) {
          const result = validateCommissionPercentage(value);
          if (!result.isValid) return result.error;
        }
      }

      // MinLength/MaxLength validation for strings
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          return `En az ${rules.minLength} karakter olmalıdır`;
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          return `En fazla ${rules.maxLength} karakter olmalıdır`;
        }
      }

      // Pattern validation
      if (rules.pattern && !rules.pattern.test(String(value))) {
        return 'Geçersiz format';
      }

      // Custom validation
      if (rules.custom) {
        return rules.custom(value);
      }

      return undefined;
    },
    [validationConfig]
  );

  /**
   * Validate all fields
   */
  const validateAll = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    Object.keys(validationConfig).forEach((field) => {
      const error = validateField(field, values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationConfig, validateField]);

  /**
   * Handle field change
   */
  const handleChange = useCallback(
    (field: string, value: any) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      // Validate on change if field was touched
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateField]
  );

  /**
   * Handle field blur
   */
  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));

      // Validate on blur
      const error = validateField(field, values[field]);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [values, validateField]
  );

  /**
   * Reset form
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Set form values
   */
  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  /**
   * Set form errors
   */
  const setFormErrors = useCallback((newErrors: FormErrors) => {
    setErrors(newErrors);
  }, []);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    setFormValues,
    setFormErrors,
    isValid: Object.keys(errors).length === 0,
  };
}
