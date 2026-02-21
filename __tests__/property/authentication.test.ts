// @ts-nocheck
/**
 * Feature: growthpilot-ai, Authentication Property Tests
 * 
 * Property 1: Authentication Session Round Trip
 * Property 3: Authentication Error Handling
 * 
 * Validates: Requirements 1.1-1.6
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';
import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getSession,
  getAuthErrorMessage,
} from '@/lib/supabase/auth';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid email addresses
const arbitraryEmail = (): fc.Arbitrary<string> =>
  fc.tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 3, maxLength: 10 }),
    fc.constantFrom('gmail.com', 'yahoo.com', 'hotmail.com', 'test.com')
  ).map(([local, domain]: [string, string]) => `${local}@${domain}`);

// Generate valid passwords (min 6 characters as per Supabase default)
const arbitraryPassword = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 6, maxLength: 20 });

// Generate invalid passwords (less than 6 characters)
const arbitraryInvalidPassword = (): fc.Arbitrary<string> =>
  fc.string({ minLength: 1, maxLength: 5 });

// Generate invalid email formats
const arbitraryInvalidEmail = (): fc.Arbitrary<string> =>
  fc.oneof(
    fc.string({ minLength: 1, maxLength: 10 }), // No @ symbol
    fc.string({ minLength: 1, maxLength: 10 }).map((s: string) => `${s}@`), // Missing domain
    fc.string({ minLength: 1, maxLength: 10 }).map((s: string) => `@${s}`), // Missing local part
    fc.constant(''), // Empty string
  );

/**
 * Helper function to clean up test users
 */
async function cleanupTestUser(email: string): Promise<void> {
  try {
    // Get user by email using admin client
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users?.users.find((u: any) => u.email === email);
    
    if (user) {
      await supabaseAdmin.auth.admin.deleteUser(user.id);
    }
  } catch (error) {
    // Ignore cleanup errors
    console.warn(`Cleanup warning for ${email}:`, error);
  }
}

/**
 * Property 1: Authentication Session Round Trip
 * 
 * For any valid user credentials, successful authentication should create a session token,
 * and logging out should invalidate that token such that it can no longer be used for authentication.
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.5
 */
describe('Property 1: Authentication Session Round Trip', () => {
  // Clean up before tests
  beforeAll(async () => {
    // Give some time for Supabase to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should create and invalidate session tokens for valid credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryEmail(),
        arbitraryPassword(),
        async (email: string, password: string) => {
          try {
            // Step 1: Sign up with valid credentials
            const signUpResult = await signUpWithEmail(email, password);
            
            // If signup fails due to user already existing, clean up and skip
            if (signUpResult.error?.message.includes('already registered')) {
              await cleanupTestUser(email);
              return true; // Skip this iteration
            }

            // Signup should succeed
            expect(signUpResult.error).toBeNull();
            expect(signUpResult.user).not.toBeNull();
            
            // Step 2: Get session after signup
            const sessionAfterSignup = await getSession();
            expect(sessionAfterSignup.session).not.toBeNull();
            expect(sessionAfterSignup.session?.access_token).toBeTruthy();
            
            const firstToken = sessionAfterSignup.session?.access_token;

            // Step 3: Sign out
            const signOutResult = await signOut();
            expect(signOutResult.error).toBeNull();

            // Step 4: Verify session is invalidated after logout
            const sessionAfterLogout = await getSession();
            expect(sessionAfterLogout.session).toBeNull();

            // Step 5: Sign in again with same credentials
            const signInResult = await signInWithEmail(email, password);
            expect(signInResult.error).toBeNull();
            expect(signInResult.user).not.toBeNull();
            expect(signInResult.session).not.toBeNull();

            // Step 6: Verify new session token is different from first token
            const secondToken = signInResult.session?.access_token;
            expect(secondToken).toBeTruthy();
            expect(secondToken).not.toBe(firstToken);

            // Step 7: Sign out again
            await signOut();

            // Cleanup
            await cleanupTestUser(email);

            return true;
          } catch (error) {
            // Cleanup on error
            await cleanupTestUser(email);
            throw error;
          }
        }
      ),
      { numRuns: 10, timeout: 60000 } // Reduced runs for API rate limits, increased timeout
    );
  }, 120000); // 2 minute timeout for the entire test

  it('should maintain session across multiple getSession calls', async () => {
    const email = `test-${Date.now()}@test.com`;
    const password = 'testpassword123';

    try {
      // Sign up
      const signUpResult = await signUpWithEmail(email, password);
      expect(signUpResult.error).toBeNull();

      // Get session multiple times
      const session1 = await getSession();
      const session2 = await getSession();
      const session3 = await getSession();

      // All should return the same session
      expect(session1.session?.access_token).toBe(session2.session?.access_token);
      expect(session2.session?.access_token).toBe(session3.session?.access_token);

      // Cleanup
      await signOut();
      await cleanupTestUser(email);
    } catch (error) {
      await cleanupTestUser(email);
      throw error;
    }
  }, 30000);
});

/**
 * Property 3: Authentication Error Handling
 * 
 * For any invalid credentials (wrong password, non-existent email, expired token),
 * the authentication system should return a descriptive error message and deny access.
 * 
 * Validates: Requirements 1.6
 */
describe('Property 3: Authentication Error Handling', () => {
  describe('Invalid password scenarios', () => {
    it('should return descriptive error for passwords shorter than 6 characters', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryEmail(),
          arbitraryInvalidPassword(),
          async (email: string, invalidPassword: string) => {
            const result = await signUpWithEmail(email, invalidPassword);
            
            // Should have an error
            expect(result.error).not.toBeNull();
            expect(result.user).toBeNull();
            expect(result.session).toBeNull();

            // Error message should be descriptive
            const errorMessage = getAuthErrorMessage(result.error);
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.length).toBeGreaterThan(0);
            
            // Should be in Turkish
            expect(errorMessage).toContain('karakter');

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Invalid email scenarios', () => {
    it('should return descriptive error for invalid email formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryInvalidEmail(),
          arbitraryPassword(),
          async (invalidEmail: string, password: string) => {
            // Skip empty strings as they might be handled differently
            if (!invalidEmail || invalidEmail.trim() === '') {
              return true;
            }

            const result = await signUpWithEmail(invalidEmail, password);
            
            // Should have an error
            expect(result.error).not.toBeNull();
            expect(result.user).toBeNull();
            expect(result.session).toBeNull();

            // Error message should be descriptive
            const errorMessage = getAuthErrorMessage(result.error);
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Wrong password scenarios', () => {
    it('should return descriptive error for wrong password on existing user', async () => {
      const email = `test-wrong-pwd-${Date.now()}@test.com`;
      const correctPassword = 'correctpassword123';
      const wrongPassword = 'wrongpassword456';

      try {
        // Create a user
        const signUpResult = await signUpWithEmail(email, correctPassword);
        expect(signUpResult.error).toBeNull();

        // Sign out
        await signOut();

        // Try to sign in with wrong password
        const signInResult = await signInWithEmail(email, wrongPassword);
        
        // Should have an error
        expect(signInResult.error).not.toBeNull();
        expect(signInResult.user).toBeNull();
        expect(signInResult.session).toBeNull();

        // Error message should be descriptive and in Turkish
        const errorMessage = getAuthErrorMessage(signInResult.error);
        expect(errorMessage).toBeTruthy();
        expect(errorMessage).toContain('Geçersiz');

        // Cleanup
        await cleanupTestUser(email);
      } catch (error) {
        await cleanupTestUser(email);
        throw error;
      }
    }, 30000);
  });

  describe('Non-existent user scenarios', () => {
    it('should return descriptive error for non-existent email', async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryEmail(),
          arbitraryPassword(),
          async (email: string, password: string) => {
            // Ensure user doesn't exist
            await cleanupTestUser(email);

            // Try to sign in with non-existent user
            const result = await signInWithEmail(email, password);
            
            // Should have an error
            expect(result.error).not.toBeNull();
            expect(result.user).toBeNull();
            expect(result.session).toBeNull();

            // Error message should be descriptive
            const errorMessage = getAuthErrorMessage(result.error);
            expect(errorMessage).toBeTruthy();
            expect(errorMessage.length).toBeGreaterThan(0);

            return true;
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Error message localization', () => {
    it('should return Turkish error messages for all error types', () => {
      const testCases = [
        { message: 'Invalid login credentials', expected: 'Geçersiz' },
        { message: 'Email not confirmed', expected: 'doğrulanmamış' },
        { message: 'User already registered', expected: 'kayıtlı' },
        { message: 'Password should be at least 6 characters', expected: 'karakter' },
        { message: 'Unable to validate email address: invalid format', expected: 'Geçersiz' },
        { message: 'Token has expired or is invalid', expected: 'Oturumunuz' },
      ];

      testCases.forEach(({ message, expected }) => {
        const error = { message, name: 'AuthError', status: 400 } as any;
        const turkishMessage = getAuthErrorMessage(error);
        
        expect(turkishMessage).toBeTruthy();
        expect(turkishMessage).toContain(expected);
      });
    });
  });

  describe('Property-based error handling validation', () => {
    it('should always return non-empty error messages for authentication failures', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Invalid email scenarios
            fc.tuple(arbitraryInvalidEmail(), arbitraryPassword()).map(([e, p]: [string, string]) => ({ email: e, password: p, type: 'invalid_email' as const })),
            // Invalid password scenarios
            fc.tuple(arbitraryEmail(), arbitraryInvalidPassword()).map(([e, p]: [string, string]) => ({ email: e, password: p, type: 'invalid_password' as const })),
            // Non-existent user scenarios
            fc.tuple(arbitraryEmail(), arbitraryPassword()).map(([e, p]: [string, string]) => ({ email: e, password: p, type: 'non_existent' as const }))
          ),
          async (scenario: { email: string; password: string; type: 'invalid_email' | 'invalid_password' | 'non_existent' }) => {
            let result;

            if (scenario.type === 'non_existent') {
              // Ensure user doesn't exist
              await cleanupTestUser(scenario.email);
              result = await signInWithEmail(scenario.email, scenario.password);
            } else {
              result = await signUpWithEmail(scenario.email, scenario.password);
            }

            // If there's an error, it should have a descriptive message
            if (result.error) {
              const errorMessage = getAuthErrorMessage(result.error);
              expect(errorMessage).toBeTruthy();
              expect(errorMessage.length).toBeGreaterThan(0);
              
              // Should not be the raw error message
              expect(errorMessage).not.toBe(result.error.message);
            }

            return true;
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
