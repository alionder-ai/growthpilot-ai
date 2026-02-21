# Authentication Property Tests

## Overview

This file contains property-based tests for the GrowthPilot AI authentication system using the `fast-check` library.

## Properties Tested

### Property 1: Authentication Session Round Trip
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

For any valid user credentials, successful authentication should create a session token, and logging out should invalidate that token such that it can no longer be used for authentication.

**Test Coverage:**
- Sign up with valid credentials creates a session
- Session token is available after signup
- Sign out invalidates the session
- Session is null after logout
- Sign in again creates a new session with different token
- Session persistence across multiple getSession calls

### Property 3: Authentication Error Handling
**Validates: Requirements 1.6**

For any invalid credentials (wrong password, non-existent email, expired token), the authentication system should return a descriptive error message and deny access.

**Test Coverage:**
- Invalid password scenarios (< 6 characters)
- Invalid email format scenarios
- Wrong password on existing user
- Non-existent user scenarios
- Error message localization (Turkish)
- Property-based validation of error messages

## Test Structure

### Arbitrary Generators

The tests use `fast-check` arbitrary generators to create random test data:

- `arbitraryEmail()`: Generates valid email addresses
- `arbitraryPassword()`: Generates valid passwords (6-20 characters)
- `arbitraryInvalidPassword()`: Generates invalid passwords (1-5 characters)
- `arbitraryInvalidEmail()`: Generates invalid email formats

### Helper Functions

- `cleanupTestUser(email)`: Removes test users from the database after tests

## Running the Tests

### Prerequisites

1. **Environment Variables**: Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

2. **Supabase Setup**: Ensure your Supabase project is running and accessible

3. **Database Schema**: Run migrations to create the required tables

### Run Tests

```bash
# Run all property tests
npm run test -- __tests__/property/authentication.test.ts

# Run with coverage
npm run test -- __tests__/property/authentication.test.ts --coverage

# Run in watch mode
npm run test:watch -- __tests__/property/authentication.test.ts
```

## Test Configuration

- **Test Environment**: Node.js (configured in jest.config.js)
- **Timeout**: 30 seconds per test (configurable)
- **Property Test Runs**: 
  - Session round trip: 10 runs (reduced for API rate limits)
  - Error handling: 20-30 runs per scenario
- **Total Timeout**: 2 minutes for session round trip test

## Important Notes

### Rate Limiting

The tests interact with Supabase Auth API, which has rate limits. The number of property test runs has been reduced to avoid hitting these limits:
- Session round trip: 10 iterations (instead of 100)
- Error scenarios: 20-30 iterations

### Cleanup

Tests automatically clean up created users after each test run. If tests fail unexpectedly, you may need to manually clean up test users from your Supabase dashboard.

### Turkish Error Messages

All error messages are validated to be in Turkish, as per the product requirements. The `getAuthErrorMessage()` function in `lib/supabase/auth.ts` handles the translation.

## Troubleshooting

### "User already registered" errors

If you see this error during tests, it means a previous test run didn't clean up properly. Clean up test users manually or wait for the cleanup to complete.

### Connection timeouts

If tests timeout, check:
1. Supabase project is running
2. Environment variables are correct
3. Network connection is stable
4. Increase timeout in test configuration if needed

### Type errors in IDE

The TypeScript errors shown in the IDE (missing Jest types, etc.) are expected and will be resolved at runtime by the Jest configuration. The tests will run correctly despite these warnings.

## Next Steps

After running these tests successfully:
1. Verify all tests pass
2. Check test coverage meets requirements (>80%)
3. Review any failing scenarios
4. Update implementation if needed
5. Mark task 3.5 as complete in tasks.md
