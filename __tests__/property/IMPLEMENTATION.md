# Database Schema Property Test Implementation

## Overview

This document explains the implementation of Property 11: Database Schema Completeness test for GrowthPilot AI.

## Property Definition

**Property 11: Database Schema Completeness**

*For any* table in the database schema (Users, Clients, Commission_Models, Campaigns, Ad_Sets, Ads, Meta_Metrics, Leads, AI_Recommendations, Creative_Library, Reports, Notifications), all required fields as specified in the requirements should be present.

**Validates**: Requirements 5.1-5.4, 12.1-12.11

## Implementation Approach

### 1. Schema Definition

The test defines the required schema for each table based on the requirements document:

```typescript
const REQUIRED_SCHEMA = {
  users: ['user_id', 'email', 'created_at', 'updated_at'],
  clients: ['client_id', 'user_id', 'name', 'industry', ...],
  // ... other tables
};
```

### 2. Database Query Function

A PostgreSQL function `get_table_columns` was created to query the information_schema:

```sql
CREATE OR REPLACE FUNCTION get_table_columns(p_table_name TEXT)
RETURNS TABLE(column_name TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
END;
$$;
```

This function:
- Queries the PostgreSQL system catalog
- Returns column names for a given table
- Is callable via Supabase RPC
- Has SECURITY DEFINER to allow service role access

### 3. Test Structure

The test has two levels:

#### Individual Table Tests
Each table has its own test case for clear error reporting:

```typescript
describe('Users table schema', () => {
  it('should have all required fields', async () => {
    const actualColumns = await getTableSchema('users');
    const { isValid, missingFields } = validateTableSchema(
      'users',
      actualColumns,
      REQUIRED_SCHEMA.users
    );
    expect(isValid).toBe(true);
    expect(missingFields).toEqual([]);
  });
});
```

#### Property-Based Test
A single property-based test validates all tables with 100 iterations:

```typescript
it('should validate that all tables have their required fields', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...Object.keys(REQUIRED_SCHEMA)),
      async (tableName) => {
        const actualColumns = await getTableSchema(tableName);
        const requiredColumns = REQUIRED_SCHEMA[tableName];
        const { isValid } = validateTableSchema(
          tableName,
          actualColumns,
          requiredColumns
        );
        return isValid;
      }
    ),
    { numRuns: 100 }
  );
});
```

### 4. Validation Logic

The `validateTableSchema` function checks if all required fields exist:

```typescript
function validateTableSchema(
  tableName: string, 
  actualColumns: string[], 
  requiredColumns: string[]
): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields = requiredColumns.filter(
    (requiredCol) => !actualColumns.includes(requiredCol)
  );
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}
```

## Files Created

1. **`__tests__/property/database-schema.test.ts`**
   - Main test file with all test cases
   - Uses fast-check for property-based testing
   - Connects to Supabase using service role key

2. **`supabase/migrations/20240101000004_schema_validation_function.sql`**
   - Creates the `get_table_columns` PostgreSQL function
   - Grants execute permissions to authenticated and service_role

3. **`jest.config.js`**
   - Jest configuration for Next.js
   - Supports TypeScript and async tests
   - 30-second timeout for database operations

4. **`jest.setup.js`**
   - Loads environment variables
   - Sets up testing-library/jest-dom

5. **`__tests__/property/README.md`**
   - User-facing documentation
   - Instructions for running tests

6. **`__tests__/property/run-schema-test.sh`**
   - Helper script to run tests with prerequisite checks

## Running the Test

### Prerequisites

1. Apply all database migrations:
   ```bash
   npx supabase db push
   ```

2. Create `.env.local` with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### Run Commands

```bash
# Run all tests
npm run test

# Run only this test
npm run test __tests__/property/database-schema.test.ts

# Run with helper script
./__tests__/property/run-schema-test.sh
```

## Expected Results

### Success Case
All 13 test cases pass (12 individual table tests + 1 property-based test):

```
PASS  __tests__/property/database-schema.test.ts
  Property 11: Database Schema Completeness
    Users table schema
      ✓ should have all required fields
    Clients table schema
      ✓ should have all required fields
    ...
    Property-based schema validation
      ✓ should validate that all tables have their required fields

Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total
```

### Failure Case
If a field is missing, the test will show:

```
FAIL  __tests__/property/database-schema.test.ts
  Property 11: Database Schema Completeness
    Users table schema
      ✕ should have all required fields
      
    Missing fields in users table: email
    
    expect(received).toEqual(expected)
    
    Expected: []
    Received: ["email"]
```

## Design Decisions

### Why PostgreSQL Function?

Using a PostgreSQL function instead of direct queries:
- ✅ Works with Supabase RPC
- ✅ Consistent across environments
- ✅ Can be version controlled in migrations
- ✅ Respects database permissions

### Why Individual + Property-Based Tests?

- **Individual tests**: Clear error messages per table
- **Property-based test**: Validates the universal property with randomization

### Why 100 Iterations?

The design document specifies minimum 100 iterations for property-based tests. Since we're testing a finite set of tables (12), the property-based test will cycle through all tables multiple times.

## Maintenance

### Adding New Tables

When adding a new table to the schema:

1. Add the table to `REQUIRED_SCHEMA` in the test file
2. Add an individual test case for the table
3. The property-based test will automatically include it

### Modifying Table Schema

When adding required fields to existing tables:

1. Update the field list in `REQUIRED_SCHEMA`
2. Run the test to verify the migration added the field

## Troubleshooting

### "Error fetching schema for [table]"

- Check that migrations have been applied
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Ensure the `get_table_columns` function exists

### "Missing fields in [table]"

- Check that the migration for that table has been applied
- Verify the field name matches exactly (case-sensitive)
- Review the migration SQL file

### Test Timeout

- Default timeout is 30 seconds
- Increase in jest.config.js if needed
- Check database connection speed

## References

- Design Document: `.kiro/specs/growthpilot-ai/design.md`
- Requirements: `.kiro/specs/growthpilot-ai/requirements.md`
- Tasks: `.kiro/specs/growthpilot-ai/tasks.md` (Task 2.5)
- fast-check Documentation: https://fast-check.dev/
