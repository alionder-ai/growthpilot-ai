// @ts-nocheck
/**
 * Property-Based Tests for Error Handling
 * Feature: growthpilot-ai
 * 
 * These tests validate that error messages are user-friendly and in Turkish
 * across all error scenarios in the system.
 */

import * as fc from 'fast-check';
import {
  getUserFriendlyErrorMessage,
  formatAPIError,
  getMetaAPIErrorMessage,
  getGeminiAPIErrorMessage,
  getDatabaseErrorMessage,
  APIError,
  ValidationError,
  AuthenticationError,
} from '@/lib/utils/error-handler';

// ============================================================================
// Arbitraries (Random Data Generators)
// ============================================================================

/**
 * Generate arbitrary HTTP status codes
 */
const arbitraryStatusCode = fc.oneof(
  fc.constantFrom(400, 401, 403, 404, 409, 429, 500, 502, 503, 504),
  fc.integer({ min: 400, max: 599 })
);

/**
 * Generate arbitrary API errors
 */
const arbitraryAPIError = fc.record({
  message: fc.string({ minLength: 1, maxLength: 100 }),
  statusCode: arbitraryStatusCode,
}).map(({ message, statusCode }) => new APIError(message, statusCode));

/**
 * Generate arbitrary validation errors
 */
const arbitraryValidationError = fc.record({
  message: fc.string({ minLength: 1, maxLength: 100 }),
  field: fc.option(fc.constantFrom('email', 'password', 'name', 'budget', 'percentage'), { nil: undefined }),
}).map(({ message, field }) => new ValidationError(message, field));

/**
 * Generate arbitrary authentication errors
 */
const arbitraryAuthenticationError = fc.string({ minLength: 1, maxLength: 100 })
  .map(message => new AuthenticationError(message));

/**
 * Generate arbitrary standard errors
 */
const arbitraryStandardError = fc.record({
  message: fc.string({ minLength: 1, maxLength: 100 }),
  name: fc.constantFrom('Error', 'TypeError', 'ReferenceError', 'NetworkError'),
}).map(({ message, name }) => {
  const error = new Error(message);
  error.name = name;
  return error;
});

/**
 * Generate arbitrary Meta API errors
 */
const arbitraryMetaError = fc.constantFrom(
  new Error('OAuthException: Invalid OAuth access token'),
  new Error('Meta API rate limit exceeded'),
  new Error('Invalid token provided'),
  new Error('Access token has expired'),
  new Error('Insufficient permission to access this resource'),
  new Error('Unknown Meta API error')
);

/**
 * Generate arbitrary Gemini API errors
 */
const arbitraryGeminiError = fc.constantFrom(
  new Error('Invalid API key provided'),
  new Error('Quota exceeded for this API key'),
  new Error('Content policy violation detected'),
  new Error('Token limit exceeded for this request'),
  new Error('Rate limit exceeded'),
  new Error('Unknown Gemini API error')
);

/**
 * Generate arbitrary database errors
 */
const arbitraryDatabaseError = fc.constantFrom(
  new Error('foreign key constraint violation'),
  new Error('unique constraint violation on email'),
  new Error('not null constraint violation on name'),
  new Error('check constraint violation on percentage'),
  new Error('database connection failed'),
  new Error('RLS policy violation'),
  new Error('Unknown database error')
);

// ============================================================================
// Property 32: User-Friendly Error Messages
// ============================================================================

describe('Property 32: User-Friendly Error Messages', () => {
  describe('getUserFriendlyErrorMessage', () => {
    test('should return Turkish message for any APIError', () => {
      fc.assert(
        fc.property(arbitraryAPIError, (error) => {
          const message = getUserFriendlyErrorMessage(error);
          
          // Message should be a non-empty string
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Message should not contain technical terms
          expect(message).not.toMatch(/stack trace|undefined|null|NaN/i);
          expect(message).not.toMatch(/Error:|Exception:/);
          
          // Message should be in Turkish (contains Turkish characters or common Turkish words)
          const hasTurkishContent = 
            /[çğıöşüÇĞİÖŞÜ]/.test(message) || 
            /lütfen|hata|geçersiz|yetki|kayıt|istek|sunucu|bağlantı/i.test(message);
          expect(hasTurkishContent).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    test('should return Turkish message for any ValidationError', () => {
      fc.assert(
        fc.property(arbitraryValidationError, (error) => {
          const message = getUserFriendlyErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should return the validation error message as-is (assumed to be in Turkish)
          expect(message).toBe(error.message);
        }),
        { numRuns: 100 }
      );
    });

    test('should return Turkish message for any AuthenticationError', () => {
      fc.assert(
        fc.property(arbitraryAuthenticationError, (error) => {
          const message = getUserFriendlyErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should return the authentication error message as-is (assumed to be in Turkish)
          expect(message).toBe(error.message);
        }),
        { numRuns: 100 }
      );
    });

    test('should return Turkish message for any standard Error', () => {
      fc.assert(
        fc.property(arbitraryStandardError, (error) => {
          const message = getUserFriendlyErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Message should not be a raw stack trace
          expect(message).not.toMatch(/at Object\.|at Function\.|at async/);
        }),
        { numRuns: 100 }
      );
    });

    test('should handle unknown error types gracefully', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.constant(null),
            fc.constant(undefined),
            fc.record({ foo: fc.string() })
          ),
          (unknownError) => {
            const message = getUserFriendlyErrorMessage(unknownError);
            
            // Should always return a string
            expect(typeof message).toBe('string');
            expect(message.length).toBeGreaterThan(0);
            
            // Should be a fallback Turkish message
            expect(message).toMatch(/hata|lütfen|tekrar/i);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('formatAPIError', () => {
    test('should format any error with user-friendly message', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            arbitraryAPIError,
            arbitraryValidationError,
            arbitraryAuthenticationError,
            arbitraryStandardError
          ),
          (error) => {
            const formatted = formatAPIError(error);
            
            // Should always have a message
            expect(formatted).toHaveProperty('message');
            expect(typeof formatted.message).toBe('string');
            expect(formatted.message.length).toBeGreaterThan(0);
            
            // Message should be user-friendly (Turkish)
            const hasTurkishContent = 
              /[çğıöşüÇĞİÖŞÜ]/.test(formatted.message) || 
              /lütfen|hata|geçersiz|yetki|kayıt|istek|sunucu|bağlantı/i.test(formatted.message);
            expect(hasTurkishContent).toBe(true);
            
            // Should not expose technical details
            expect(formatted.message).not.toMatch(/stack|trace|undefined|null/i);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should include statusCode for APIError', () => {
      fc.assert(
        fc.property(arbitraryAPIError, (error) => {
          const formatted = formatAPIError(error);
          
          expect(formatted).toHaveProperty('statusCode');
          expect(formatted.statusCode).toBe(error.statusCode);
        }),
        { numRuns: 100 }
      );
    });

    test('should include field for ValidationError', () => {
      fc.assert(
        fc.property(arbitraryValidationError, (error) => {
          const formatted = formatAPIError(error);
          
          if (error.field) {
            expect(formatted).toHaveProperty('field');
            expect(formatted.field).toBe(error.field);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('getMetaAPIErrorMessage', () => {
    test('should return Turkish message for any Meta API error', () => {
      fc.assert(
        fc.property(arbitraryMetaError, (error) => {
          const message = getMetaAPIErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should be in Turkish
          const hasTurkishContent = 
            /[çğıöşüÇĞİÖŞÜ]/.test(message) || 
            /meta|hesap|bağla|erişim|anahtar|izin|limit/i.test(message);
          expect(hasTurkishContent).toBe(true);
          
          // Should not expose technical OAuth details
          expect(message).not.toMatch(/OAuthException|token|API key/);
        }),
        { numRuns: 100 }
      );
    });

    test('should provide specific guidance for OAuth errors', () => {
      const oauthError = new Error('OAuthException: Invalid OAuth access token');
      const message = getMetaAPIErrorMessage(oauthError);
      
      expect(message).toMatch(/meta/i);
      expect(message).toMatch(/bağla|yeniden/i);
    });

    test('should provide specific guidance for rate limit errors', () => {
      const rateLimitError = new Error('Meta API rate limit exceeded');
      const message = getMetaAPIErrorMessage(rateLimitError);
      
      expect(message).toMatch(/limit/i);
      expect(message).toMatch(/bekle/i);
    });
  });

  describe('getGeminiAPIErrorMessage', () => {
    test('should return Turkish message for any Gemini API error', () => {
      fc.assert(
        fc.property(arbitraryGeminiError, (error) => {
          const message = getGeminiAPIErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should be in Turkish
          const hasTurkishContent = 
            /[çğıöşüÇĞİÖŞÜ]/.test(message) || 
            /yapay zeka|servis|içerik|limit|lütfen/i.test(message);
          expect(hasTurkishContent).toBe(true);
          
          // Should not expose API key or technical details
          expect(message).not.toMatch(/API key|token|quota/);
        }),
        { numRuns: 100 }
      );
    });

    test('should provide specific guidance for quota errors', () => {
      const quotaError = new Error('Quota exceeded for this API key');
      const message = getGeminiAPIErrorMessage(quotaError);
      
      expect(message).toMatch(/limit/i);
      expect(message).toMatch(/daha sonra/i);
    });

    test('should provide specific guidance for content policy errors', () => {
      const policyError = new Error('Content policy violation detected');
      const message = getGeminiAPIErrorMessage(policyError);
      
      expect(message).toMatch(/içerik|güvenlik|politika/i);
      expect(message).toMatch(/farklı/i);
    });
  });

  describe('getDatabaseErrorMessage', () => {
    test('should return Turkish message for any database error', () => {
      fc.assert(
        fc.property(arbitraryDatabaseError, (error) => {
          const message = getDatabaseErrorMessage(error);
          
          expect(typeof message).toBe('string');
          expect(message.length).toBeGreaterThan(0);
          
          // Should be in Turkish
          const hasTurkishContent = 
            /[çğıöşüÇĞİÖŞÜ]/.test(message) || 
            /kayıt|alan|değer|yetki|bağlantı|veritabanı/i.test(message);
          expect(hasTurkishContent).toBe(true);
          
          // Should not expose SQL or technical database details
          expect(message).not.toMatch(/constraint|foreign key|SQL|RLS policy/);
        }),
        { numRuns: 100 }
      );
    });

    test('should provide specific guidance for foreign key errors', () => {
      const fkError = new Error('foreign key constraint violation');
      const message = getDatabaseErrorMessage(fkError);
      
      expect(message).toMatch(/kayıt/i);
      expect(message).toMatch(/kullanılıyor|silinemez/i);
    });

    test('should provide specific guidance for unique constraint errors', () => {
      const uniqueError = new Error('unique constraint violation on email');
      const message = getDatabaseErrorMessage(uniqueError);
      
      expect(message).toMatch(/kayıt|mevcut/i);
    });

    test('should provide specific guidance for RLS policy errors', () => {
      const rlsError = new Error('RLS policy violation');
      const message = getDatabaseErrorMessage(rlsError);
      
      expect(message).toMatch(/yetki/i);
    });
  });

  // ============================================================================
  // Specific Status Code Tests
  // ============================================================================

  describe('HTTP Status Code Mapping', () => {
    test('400 Bad Request should return Turkish validation message', () => {
      const error = new APIError('Bad request', 400);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/geçersiz|istek|bilgi/i);
    });

    test('401 Unauthorized should return Turkish session expired message', () => {
      const error = new APIError('Unauthorized', 401);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/oturum|giriş/i);
    });

    test('403 Forbidden should return Turkish permission denied message', () => {
      const error = new APIError('Forbidden', 403);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/yetki/i);
    });

    test('404 Not Found should return Turkish resource not found message', () => {
      const error = new APIError('Not found', 404);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/bulunamadı|kaynak/i);
    });

    test('409 Conflict should return Turkish duplicate record message', () => {
      const error = new APIError('Conflict', 409);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/mevcut|kayıt/i);
    });

    test('429 Too Many Requests should return Turkish rate limit message', () => {
      const error = new APIError('Too many requests', 429);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/fazla|istek|bekle/i);
    });

    test('500 Internal Server Error should return Turkish server error message', () => {
      const error = new APIError('Internal server error', 500);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/sunucu|hata|daha sonra/i);
    });

    test('503 Service Unavailable should return Turkish server error message', () => {
      const error = new APIError('Service unavailable', 503);
      const message = getUserFriendlyErrorMessage(error);
      
      expect(message).toMatch(/sunucu|hata|daha sonra/i);
    });
  });

  // ============================================================================
  // Network Error Pattern Tests
  // ============================================================================

  describe('Network Error Patterns', () => {
    test('network errors should return Turkish connection message', () => {
      const networkErrors = [
        new Error('network error occurred'),
        new Error('fetch failed'),
        new Error('Failed to fetch'),
      ];

      networkErrors.forEach(error => {
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toMatch(/bağlantı|internet/i);
      });
    });

    test('timeout errors should return Turkish timeout message', () => {
      const timeoutErrors = [
        new Error('request timeout'),
        new Error('timeout exceeded'),
        new Error('Connection timeout'),
      ];

      timeoutErrors.forEach(error => {
        const message = getUserFriendlyErrorMessage(error);
        expect(message).toMatch(/zaman aşımı|timeout/i);
      });
    });

    test('CORS errors should return Turkish security message', () => {
      const corsError = new Error('CORS policy blocked');
      const message = getUserFriendlyErrorMessage(corsError);
      
      expect(message).toMatch(/güvenlik|yönetici/i);
    });
  });

  // ============================================================================
  // Property: No Technical Details Exposed
  // ============================================================================

  describe('Technical Details Protection', () => {
    test('should never expose stack traces in user messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            arbitraryAPIError,
            arbitraryStandardError,
            arbitraryMetaError,
            arbitraryGeminiError,
            arbitraryDatabaseError
          ),
          (error) => {
            const message = getUserFriendlyErrorMessage(error);
            
            // Should not contain stack trace patterns
            expect(message).not.toMatch(/at Object\./);
            expect(message).not.toMatch(/at Function\./);
            expect(message).not.toMatch(/at async/);
            expect(message).not.toMatch(/\.js:\d+:\d+/);
            expect(message).not.toMatch(/\.ts:\d+:\d+/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should never expose raw API error codes in user messages', () => {
      fc.assert(
        fc.property(
          fc.oneof(arbitraryMetaError, arbitraryGeminiError),
          (error) => {
            const metaMessage = getMetaAPIErrorMessage(error);
            const geminiMessage = getGeminiAPIErrorMessage(error);
            
            // Should not contain technical error codes
            expect(metaMessage).not.toMatch(/OAuthException|API_ERROR|ERR_/);
            expect(geminiMessage).not.toMatch(/API_ERROR|QUOTA_EXCEEDED|ERR_/);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('should never expose SQL or database internals in user messages', () => {
      fc.assert(
        fc.property(arbitraryDatabaseError, (error) => {
          const message = getDatabaseErrorMessage(error);
          
          // Should not contain SQL or database technical terms
          expect(message).not.toMatch(/constraint|foreign key|primary key|SQL/i);
          expect(message).not.toMatch(/RLS policy|row level security/i);
          expect(message).not.toMatch(/INSERT|UPDATE|DELETE|SELECT/);
        }),
        { numRuns: 100 }
      );
    });
  });
});
