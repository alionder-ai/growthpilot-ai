# Error Handling Property-Based Tests

## Overview

This test suite validates **Property 32: User-Friendly Error Messages** from the GrowthPilot AI design document.

## Property Definition

**Property 32**: *For any* API error, the error message displayed to the user should be in user-friendly language (not technical stack traces or raw API errors).

**Validates**: Requirements 14.4

## What This Test Validates

The test ensures that all error messages in the system are:

1. **User-Friendly**: No technical jargon, stack traces, or raw error codes
2. **In Turkish**: All user-facing error messages are in Turkish language
3. **Actionable**: Messages provide guidance on what the user should do
4. **Consistent**: Similar errors produce similar message patterns
5. **Secure**: No exposure of internal system details or security information

## Test Coverage

### Error Types Tested

1. **API Errors** (`APIError`)
   - HTTP status codes (400, 401, 403, 404, 409, 429, 500, 502, 503, 504)
   - Custom error messages
   - Status code to Turkish message mapping

2. **Validation Errors** (`ValidationError`)
   - Field-specific validation errors
   - Form validation messages
   - Input constraint violations

3. **Authentication Errors** (`AuthenticationError`)
   - Invalid credentials
   - Session expiration
   - OAuth failures

4. **Standard Errors** (`Error`)
   - Network errors (fetch failures, connection issues)
   - Timeout errors
   - CORS errors
   - Generic JavaScript errors

5. **Meta API Errors**
   - OAuth exceptions
   - Rate limiting
   - Invalid/expired tokens
   - Permission errors

6. **Gemini API Errors**
   - API key issues
   - Quota exceeded
   - Content policy violations
   - Token limit exceeded

7. **Database Errors**
   - Foreign key constraint violations
   - Unique constraint violations
   - Not null constraint violations
   - Check constraint violations
   - Connection failures
   - RLS policy violations

### Functions Tested

- `getUserFriendlyErrorMessage(error)` - Main error message formatter
- `formatAPIError(error)` - API error response formatter
- `getMetaAPIErrorMessage(error)` - Meta API specific error handler
- `getGeminiAPIErrorMessage(error)` - Gemini API specific error handler
- `getDatabaseErrorMessage(error)` - Database error handler

## Test Structure

### Arbitraries (Random Data Generators)

The test uses `fast-check` to generate random error scenarios:

- `arbitraryStatusCode` - Random HTTP status codes
- `arbitraryAPIError` - Random API errors with status codes
- `arbitraryValidationError` - Random validation errors with optional field names
- `arbitraryAuthenticationError` - Random authentication errors
- `arbitraryStandardError` - Random JavaScript errors
- `arbitraryMetaError` - Specific Meta API error patterns
- `arbitraryGeminiError` - Specific Gemini API error patterns
- `arbitraryDatabaseError` - Specific database error patterns

### Property Tests

Each test runs 100 iterations with randomly generated error data to ensure the property holds across all scenarios.

## Running the Tests

```bash
# Run all property tests
npm run test __tests__/property

# Run only error handling tests
npm run test __tests__/property/error-handling.test.ts

# Run with coverage
npm run test -- --coverage __tests__/property/error-handling.test.ts

# Run in watch mode
npm run test:watch __tests__/property/error-handling.test.ts
```

## Expected Behavior

### ✅ All Tests Should Pass If:

1. Every error returns a non-empty Turkish message
2. No technical details (stack traces, SQL, error codes) are exposed
3. HTTP status codes map to appropriate Turkish messages
4. Network errors provide connection guidance
5. Meta API errors guide users to reconnect their account
6. Gemini API errors provide actionable feedback
7. Database errors explain the issue without exposing schema details

### ❌ Tests Will Fail If:

1. Error messages contain English technical terms
2. Stack traces or error codes are exposed to users
3. Messages are empty or undefined
4. SQL queries or database internals are visible
5. API keys or tokens are included in messages
6. Messages don't provide actionable guidance

## Turkish Message Validation

The tests verify Turkish content by checking for:

- Turkish characters: `çğıöşüÇĞİÖŞÜ`
- Common Turkish words: `lütfen`, `hata`, `geçersiz`, `yetki`, `kayıt`, `istek`, `sunucu`, `bağlantı`

## Example Test Cases

### API Error with Status Code
```typescript
const error = new APIError('Bad request', 400);
const message = getUserFriendlyErrorMessage(error);
// Expected: "Geçersiz istek. Lütfen girdiğiniz bilgileri kontrol edin."
```

### Meta API OAuth Error
```typescript
const error = new Error('OAuthException: Invalid OAuth access token');
const message = getMetaAPIErrorMessage(error);
// Expected: "Meta hesap bağlantınız geçersiz. Lütfen hesabınızı yeniden bağlayın."
```

### Database Foreign Key Error
```typescript
const error = new Error('foreign key constraint violation');
const message = getDatabaseErrorMessage(error);
// Expected: "Bu kayıt başka kayıtlar tarafından kullanılıyor ve silinemez."
```

## Integration with Error Handler

This test validates the implementation in `lib/utils/error-handler.ts`, which is used throughout the application:

- API routes return formatted errors
- Frontend components display user-friendly messages
- Toast notifications show Turkish error messages
- Form validation displays inline Turkish messages

## Security Considerations

The tests ensure that error messages:

- Don't expose database schema or table names
- Don't reveal API keys or tokens
- Don't show internal file paths or stack traces
- Don't leak information about system architecture
- Provide generic messages for security-related errors (RLS violations)

## Maintenance

When adding new error types:

1. Add a new arbitrary generator for the error type
2. Add property tests for the new error type
3. Verify Turkish message content
4. Ensure no technical details are exposed
5. Update this README with the new error type

## Related Files

- Implementation: `lib/utils/error-handler.ts`
- Network error handler: `lib/utils/network-error-handler.ts`
- Toast context: `lib/contexts/ToastContext.tsx`
- Error boundary: `components/ui/error-boundary.tsx`
- Form validation: `hooks/use-form-validation.ts`

## Requirements Traceability

- **Requirement 14.4**: THE System SHALL display API error messages in a user-friendly format
- **Property 32**: User-Friendly Error Messages
- **Task 24.5**: Error handling için property test
