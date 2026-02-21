# Security Property Tests

## Overview

This test suite validates the security properties of GrowthPilot AI, ensuring data isolation, password security, GDPR compliance, and audit logging.

**Feature**: growthpilot-ai  
**Test File**: `__tests__/property/security.test.ts`  
**Validates**: Requirements 1.4, 12.13, 15.1-15.6

## Properties Tested

### Property 2: Row-Level Security Isolation

**Statement**: For any two distinct users, each user should only be able to access their own data across all tables (clients, campaigns, metrics, recommendations, etc.), and any attempt to access another user's data should be rejected by RLS policies.

**Validates**: Requirements 1.4, 12.13, 15.3

**Test Coverage**:
- Client data isolation between users
- Preventing cross-user updates
- Preventing cross-user deletions
- Creative library isolation
- Notifications isolation
- Campaigns, metrics, and recommendations isolation (via foreign key chain)

**Implementation**:
- Creates two distinct users with separate data
- Verifies each user can only query their own records
- Verifies update/delete operations fail across user boundaries
- Uses property-based testing with random user data

### Property 34: Password Hashing Security

**Statement**: For any user password stored in the database, it should be hashed using bcrypt with a minimum of 10 salt rounds, and the original password should not be retrievable.

**Validates**: Requirements 15.4

**Test Coverage**:
- Passwords are hashed with bcrypt
- Bcrypt format validation (`$2a$10$...`)
- Minimum 10 salt rounds verification
- Original password is not stored in plaintext
- Password cannot be retrieved from hash (one-way function)

**Implementation**:
- Creates users with random passwords
- Queries auth.users table to verify hash format
- Validates bcrypt salt rounds
- Verifies login works with correct password but fails with wrong password

**Note**: Supabase Auth handles password hashing automatically. These tests verify the implementation meets security requirements.

### Property 35: GDPR Data Deletion

**Statement**: For any user requesting data deletion, all associated data (clients, campaigns, metrics, recommendations, etc.) should be permanently removed from the database.

**Validates**: Requirements 15.5

**Test Coverage**:
- User account deletion removes all user data
- Cascade deletion from users to clients
- Cascade deletion from clients to campaigns, recommendations, reports
- Cascade deletion from campaigns to ad_sets, ads, metrics
- Creative library deletion
- Notifications deletion
- Meta tokens deletion

**Implementation**:
- Creates user with comprehensive data across all tables
- Deletes user account
- Verifies all related data is permanently removed
- Uses admin client to bypass RLS for verification

**GDPR Compliance**: This ensures the "right to be forgotten" is properly implemented.

### Property 36: Authentication Audit Logging

**Statement**: For any authentication attempt (successful or failed), an audit log entry should be created with timestamp, user identifier, and result.

**Validates**: Requirements 15.6

**Test Coverage**:
- Successful login attempts are logged
- Failed login attempts are logged
- Successful signup attempts are logged
- Account deletion is logged
- All logs include timestamp
- All logs include user identifier (email or user_id)
- All logs include IP address and user agent
- Metadata is stored for additional context

**Implementation**:
- Uses audit logger functions from `lib/security/audit-logger.ts`
- Verifies log entries are created in audit_logs table
- Validates log structure and required fields
- Tests with property-based random data

## Running the Tests

### Prerequisites

1. **Supabase Instance**: Local or cloud Supabase instance
2. **Environment Variables**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
3. **Database Schema**: All tables and RLS policies must be created

### Run All Security Tests

```bash
npm test -- __tests__/property/security.test.ts
```

### Run Specific Property

```bash
# Property 2: RLS Isolation
npm test -- __tests__/property/security.test.ts -t "Property 2"

# Property 34: Password Hashing
npm test -- __tests__/property/security.test.ts -t "Property 34"

# Property 35: GDPR Deletion
npm test -- __tests__/property/security.test.ts -t "Property 35"

# Property 36: Audit Logging
npm test -- __tests__/property/security.test.ts -t "Property 36"
```

### Run with Verbose Output

```bash
npm test -- __tests__/property/security.test.ts --verbose
```

## Test Configuration

### Property-Based Testing

- **Library**: fast-check
- **Iterations**: 5-10 per property (reduced for API rate limits)
- **Timeout**: 60-120 seconds per test
- **Generators**:
  - `arbitraryEmail()`: Random valid email addresses
  - `arbitraryPassword()`: Random passwords (8-20 characters)
  - `arbitraryClientData()`: Random client records

### Test Data Cleanup

All tests include cleanup logic to remove test users and data:
- `cleanupTestUser(email)`: Deletes user and all associated data
- Cleanup runs in `finally` blocks to ensure execution even on test failure
- Admin client used for cleanup to bypass RLS policies

## Expected Results

### Passing Tests

All tests should pass when:
- RLS policies are correctly configured on all tables
- Foreign key constraints have ON DELETE CASCADE
- Supabase Auth is configured with bcrypt (default)
- Audit logging functions are properly implemented
- Database schema matches requirements

### Common Failures

**RLS Policy Failures**:
- **Symptom**: User A can see User B's data
- **Cause**: Missing or incorrect RLS policy
- **Fix**: Review and update RLS policies in database migrations

**Cascade Delete Failures**:
- **Symptom**: Child records remain after parent deletion
- **Cause**: Missing ON DELETE CASCADE on foreign keys
- **Fix**: Update foreign key constraints in database schema

**Password Hashing Failures**:
- **Symptom**: Cannot query encrypted_password or format is wrong
- **Cause**: Supabase Auth configuration issue
- **Fix**: Verify Supabase Auth is properly configured (usually automatic)

**Audit Logging Failures**:
- **Symptom**: Audit logs not created
- **Cause**: audit_logs table missing or audit logger not called
- **Fix**: Create audit_logs table and integrate audit logger in auth flows

## Security Considerations

### Test Environment

- **Use Test Database**: Never run these tests on production database
- **Isolated Environment**: Use separate Supabase project for testing
- **Service Role Key**: Required for admin operations, keep secure
- **Rate Limits**: Tests may hit Supabase rate limits, adjust numRuns if needed

### Data Privacy

- **Test Data**: All test data uses fake emails and random data
- **Cleanup**: Tests clean up all created data
- **No PII**: No real user data should be used in tests

### Access Control

- **Admin Client**: Used only for verification and cleanup
- **RLS Bypass**: Admin client bypasses RLS for testing purposes only
- **Production**: Never expose service role key in production client code

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Security Tests

on: [push, pull_request]

jobs:
  security-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run security property tests
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_SERVICE_ROLE_KEY }}
        run: npm test -- __tests__/property/security.test.ts
```

## Troubleshooting

### Issue: "Cannot find module '@/lib/supabase/auth'"

**Solution**: Ensure TypeScript path aliases are configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Issue: "Timeout exceeded"

**Solution**: Increase timeout in test configuration:
```typescript
{ numRuns: 5, timeout: 120000 } // 2 minutes
```

### Issue: "User already registered"

**Solution**: Tests include cleanup logic, but if tests are interrupted:
```bash
# Manually clean up test users in Supabase Dashboard
# Or run cleanup script
```

### Issue: "RLS policy violation"

**Solution**: Verify RLS policies are enabled and correctly configured:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

## Related Documentation

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [GDPR Compliance Guide](https://gdpr.eu/)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)

## Maintenance

### Adding New Security Tests

1. Add new property to design document
2. Create test case in `security.test.ts`
3. Update this README with property description
4. Run tests to verify implementation

### Updating Existing Tests

1. Review property statement in design document
2. Update test implementation
3. Verify all test cases still pass
4. Update README if test behavior changes

## Conclusion

These security property tests provide comprehensive validation of:
- ✅ Data isolation between users (RLS)
- ✅ Password security (bcrypt hashing)
- ✅ GDPR compliance (data deletion)
- ✅ Security auditing (authentication logging)

All tests use property-based testing to verify properties hold for all valid inputs, not just specific examples.
