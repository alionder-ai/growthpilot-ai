# Property-Based Tests

This directory contains property-based tests for GrowthPilot AI using the `fast-check` library.

## Database Schema Completeness Test

**Property 11: Database Schema Completeness**

This test validates that all database tables have the required fields as specified in the requirements document.

### What it tests

For each table in the database (Users, Clients, Commission_Models, Campaigns, Ad_Sets, Ads, Meta_Metrics, Leads, AI_Recommendations, Creative_Library, Reports, Notifications), the test verifies that all required fields exist.

### Prerequisites

1. **Database Setup**: Ensure your Supabase database has all migrations applied:
   ```bash
   npx supabase db push
   ```

2. **Environment Variables**: Create a `.env.local` file with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Schema Validation Function**: The test requires the `get_table_columns` function created in migration `20240101000004_schema_validation_function.sql`.

### Running the test

```bash
# Run all tests
npm run test

# Run only property tests
npm run test __tests__/property

# Run with watch mode
npm run test:watch
```

### Test Structure

The test includes:
- Individual tests for each table (12 tables total)
- A property-based test that validates all tables with 100 iterations

### Expected Output

All tests should pass if the database schema is complete. If a test fails, it will show which fields are missing from which table.

### Validates

- Requirements: 5.1-5.4, 12.1-12.11
- Property 11: Database Schema Completeness from design.md
