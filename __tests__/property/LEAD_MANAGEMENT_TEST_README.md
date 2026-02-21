# Lead Management Property-Based Tests

## Overview

This test suite validates the lead management functionality of GrowthPilot AI using property-based testing with the `fast-check` library. It ensures that lead status updates, foreign key relationships, conversion rate calculations, and AI context integration work correctly across all possible inputs.

## Test Coverage

### Property 27: Lead Status Update and Persistence
**Validates: Requirements 11.1, 11.2**

Tests that toggling lead conversion status correctly updates and persists the `converted_status` field in the database.

**Test Strategy:**
- Generates random initial conversion status (true/false)
- Creates lead with initial status
- Toggles status via API
- Verifies persistence in database
- Toggles back to original status
- Confirms final state matches initial state

**Iterations:** 20 runs with random data

### Property 28: Lead Foreign Key Relationship
**Validates: Requirements 11.3**

Ensures all leads have valid `ad_id` foreign keys linking them to specific ads, and that invalid foreign keys are rejected.

**Test Strategy:**
- Creates leads with valid ad_id references
- Verifies foreign key relationship through JOIN queries
- Tests rejection of invalid ad_id values
- Confirms database constraint enforcement

**Iterations:** 15 runs with random data + edge case tests

### Property 29: Lead Conversion Rate Calculation
**Validates: Requirements 11.4, 11.6**

Validates that conversion rates are calculated correctly as M/N (converted leads / total leads) for both ad-level and campaign-level aggregations.

**Test Strategy:**
- Generates N total leads with M converted (where M ≤ N)
- Calculates expected conversion rate: (M/N) × 100
- Fetches conversion rate via API
- Verifies ad-level calculation accuracy
- Verifies campaign-level aggregation accuracy
- Tests edge cases: zero leads, 100% conversion

**Iterations:** 15 runs with random data + edge case tests

**Edge Cases Tested:**
- Zero leads (0/0 = 0% conversion rate)
- 100% conversion (5/5 = 100% conversion rate)
- Various ratios (e.g., 3/10 = 30%, 7/20 = 35%)

### Property 30: Lead Quality in AI Context
**Validates: Requirements 11.5**

Confirms that lead quality data is included in AI prompts when generating action plans and strategy cards.

**Test Strategy:**
- Creates leads with specific conversion rates
- Builds AI prompts using prompt template functions
- Verifies lead quality text appears in prompts
- Checks for Turkish terminology ("Lead Kalitesi", "potansiyel müşteri", "dönüşüm")
- Tests prompts without lead data (should not include lead quality text)
- Validates low conversion rate triggers specific recommendations

**Iterations:** 10 runs with random data + edge case tests

## Test Data Generators

### Arbitrary Generators
- `arbitraryEmail()`: Valid email addresses
- `arbitraryConversionStatus()`: Boolean true/false
- `arbitraryLeadSource()`: facebook, instagram, website, landing_page, form
- `arbitraryContactInfo()`: JSONB with email, phone, name fields

### Helper Functions
- `createTestUser()`: Creates authenticated test user
- `createTestClient()`: Creates client for test user
- `createTestCampaignStructure()`: Creates campaign → ad_set → ad hierarchy
- `updateLeadStatus()`: Updates lead via API
- `getLeadById()`: Fetches lead from database
- `getConversionRates()`: Fetches conversion rates via API
- `cleanupTestUser()`: Removes test user and cascades to all data

## Running the Tests

```bash
# Run all lead management property tests
npm test -- __tests__/property/lead-management.test.ts

# Run with watch mode
npm run test:watch -- __tests__/property/lead-management.test.ts

# Run specific test suite
npm test -- __tests__/property/lead-management.test.ts -t "Property 27"
```

## Test Environment Requirements

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `NEXT_PUBLIC_APP_URL`: Application URL (defaults to http://localhost:3000)

### Database Setup
- Supabase database with all tables created
- RLS policies enabled
- Foreign key constraints configured
- Test user creation permissions

### API Routes
- `/api/leads/:id/status` - Update lead status
- `/api/leads/conversion-rates` - Get conversion rates

## Expected Results

All tests should pass with:
- ✓ Property 27: Lead Status Update and Persistence (20 runs)
- ✓ Property 28: Lead Foreign Key Relationship (15 runs + edge cases)
- ✓ Property 29: Lead Conversion Rate Calculation (15 runs + edge cases)
- ✓ Property 30: Lead Quality in AI Context (10 runs + edge cases)

## Troubleshooting

### Common Issues

**Test Timeout:**
- Increase timeout in test configuration
- Check database connection speed
- Verify API routes are responding

**Foreign Key Violations:**
- Ensure campaign structure is created before leads
- Verify cascade delete is working properly
- Check RLS policies aren't blocking operations

**Conversion Rate Mismatch:**
- Verify lead creation succeeded
- Check for floating-point precision issues (use `toBeCloseTo`)
- Ensure cleanup from previous tests completed

**AI Prompt Missing Lead Data:**
- Verify lead quality object structure matches interface
- Check Turkish text encoding
- Ensure prompt builder imports correctly

## Integration with CI/CD

These tests are designed to run in CI/CD pipelines:
- Isolated test users prevent conflicts
- Automatic cleanup prevents data accumulation
- Deterministic results with seeded random data
- Parallel execution safe (separate test users)

## Maintenance Notes

- Update arbitrary generators if lead schema changes
- Adjust iteration counts based on CI/CD time constraints
- Keep Turkish terminology consistent with product requirements
- Monitor test execution time and optimize if needed
