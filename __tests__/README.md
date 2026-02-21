# Testing Infrastructure

This directory contains the complete testing infrastructure for GrowthPilot AI, including property-based tests, unit tests, mocks, and test data generators.

## Directory Structure

```
__tests__/
├── setup/              # Test environment configuration
│   └── test-env.ts     # Database setup and cleanup utilities
├── mocks/              # Mock implementations for external services
│   ├── meta-api.mock.ts    # Meta Graph API mocks
│   ├── gemini-api.mock.ts  # Google Gemini API mocks
│   └── supabase.mock.ts    # Supabase client mocks
├── generators/         # Property-based test data generators
│   └── arbitraries.ts  # fast-check arbitraries for all entities
├── property/           # Property-based tests (48 properties)
│   ├── authentication.test.ts
│   ├── client-management.test.ts
│   ├── commission.test.ts
│   ├── meta-api.test.ts
│   ├── sync.test.ts
│   ├── dashboard-metrics.test.ts
│   ├── pagination.test.ts
│   ├── gemini-api.test.ts
│   ├── action-plan.test.ts
│   ├── strategy-cards.test.ts
│   ├── report-generation.test.ts
│   ├── creative-generator.test.ts
│   ├── lead-management.test.ts
│   ├── notifications.test.ts
│   ├── security.test.ts
│   ├── cache.test.ts
│   ├── error-handling.test.ts
│   └── locale.test.ts
└── unit/               # Unit tests
    ├── auth/
    ├── security/
    └── utils/
```

## Test Environment Setup

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
GEMINI_API_KEY=your_gemini_api_key
ENCRYPTION_KEY=your_32_character_encryption_key
```

3. Set up test database (optional for integration tests):
```bash
npx supabase start
npx supabase db reset
```

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm run test __tests__/property/authentication.test.ts
```

### Run with coverage
```bash
npm run test -- --coverage
```

## Test Environment Configuration

### Test Database Setup

The `test-env.ts` file provides utilities for test database management:

```typescript
import { createTestSupabaseClient, cleanupTestData } from '../setup/test-env';

describe('My Test Suite', () => {
  let supabase: ReturnType<typeof createTestSupabaseClient>;

  beforeAll(() => {
    supabase = createTestSupabaseClient();
  });

  afterEach(async () => {
    await cleanupTestData(supabase);
  });
});
```

### Using Mocks

#### Meta API Mock

```typescript
import { createMockMetaClient, mockMetaInsights } from '../mocks/meta-api.mock';

const metaClient = createMockMetaClient();

// Simulate API failure
metaClient.setFailure(true);

// Simulate rate limiting
metaClient.setRateLimit(true);

// Get call count
const calls = metaClient.getCallCount();
```

#### Gemini API Mock

```typescript
import { createMockGeminiClient } from '../mocks/gemini-api.mock';

const geminiClient = createMockGeminiClient();

// Simulate API failure
geminiClient.setFailure(true);

// Add response delay
geminiClient.setResponseDelay(1000);

// Generate content
const response = await geminiClient.generateActionPlan(context);
```

#### Supabase Mock

```typescript
import { createMockSupabaseClient } from '../mocks/supabase.mock';

const supabase = createMockSupabaseClient();

// Set mock data
supabase.setMockData('clients', [
  { client_id: '123', name: 'Test Client' }
]);

// Simulate database error
supabase.setFailure(true, 'Connection failed');

// Query mock data
const { data, error } = await supabase.from('clients').select('*');
```

## Property-Based Testing

### Using Arbitraries

The `arbitraries.ts` file provides generators for all entities:

```typescript
import * as fc from 'fast-check';
import { arbitraryUser, arbitraryClient, arbitraryMetrics } from '../generators/arbitraries';

fc.assert(
  fc.property(arbitraryUser(), arbitraryClient(), (user, client) => {
    // Test property here
    expect(client.user_id).toBeDefined();
  }),
  { numRuns: 100 } // Run 100 iterations
);
```

### Available Arbitraries

- `arbitraryUser()` - User data
- `arbitraryClient()` - Client data
- `arbitraryCommissionModel()` - Commission model data
- `arbitraryCampaign()` - Campaign data
- `arbitraryAdSet()` - Ad set data
- `arbitraryAd()` - Ad data
- `arbitraryMetrics()` - Metrics data
- `arbitraryLead()` - Lead data
- `arbitraryAIRecommendation()` - AI recommendation data
- `arbitraryCreativeLibrary()` - Creative library data
- `arbitraryReport()` - Report data
- `arbitraryNotification()` - Notification data
- `arbitraryDateRange()` - Date range
- `arbitraryEmail()` - Valid email
- `arbitraryPassword()` - Valid password
- `arbitraryPercentage()` - Percentage (0-100)
- `arbitraryTRYAmount()` - Turkish Lira amount
- `arbitraryROAS()` - ROAS value
- `arbitraryFrequency()` - Frequency value
- `arbitraryCTR()` - CTR value
- `arbitraryIndustry()` - Industry type
- `arbitraryContentType()` - Content type
- `arbitraryCampaignStatus()` - Campaign status
- `arbitraryPriority()` - Priority level

## Writing New Tests

### Property-Based Test Template

```typescript
import * as fc from 'fast-check';
import { arbitraryClient } from '../generators/arbitraries';

describe('Property: Client Management', () => {
  it('should persist client data correctly', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryClient(), async (client) => {
        // Arrange
        const supabase = createTestSupabaseClient();

        // Act
        const { data, error } = await supabase
          .from('clients')
          .insert(client)
          .select()
          .single();

        // Assert
        expect(error).toBeNull();
        expect(data.name).toBe(client.name);

        // Cleanup
        await cleanupTestData(supabase);
      }),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Template

```typescript
import { calculateCommission } from '@/lib/utils/commission';

describe('Commission Calculation', () => {
  it('should calculate commission correctly', () => {
    const revenue = 10000;
    const percentage = 15;
    
    const result = calculateCommission(revenue, percentage);
    
    expect(result).toBe(1500);
  });
});
```

## Test Coverage Goals

- Property-based tests: All 48 correctness properties from design document
- Unit tests: Critical utility functions and calculations
- Integration tests: API routes and database operations
- Minimum coverage: 80% for core business logic

## Troubleshooting

### Tests timing out

Increase timeout in jest.config.js:
```javascript
testTimeout: 60000 // 60 seconds
```

### Database connection issues

Ensure Supabase is running:
```bash
npx supabase status
```

### Mock not working

Reset mock state between tests:
```typescript
afterEach(() => {
  mockClient.resetCallCount();
  jest.clearAllMocks();
});
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after each test
3. **Mocking**: Use mocks for external services to avoid rate limits and costs
4. **Property-based**: Run minimum 100 iterations for property-based tests
5. **Assertions**: Use descriptive assertion messages
6. **Async**: Always await async operations and handle errors
7. **Turkish locale**: Test Turkish formatting for currency, dates, and numbers

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [fast-check Documentation](https://github.com/dubzzz/fast-check)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supabase Testing Guide](https://supabase.com/docs/guides/getting-started/testing)
