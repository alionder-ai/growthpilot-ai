# Design Document: Gemini to Groq Migration

## Overview

This design document specifies the technical approach for migrating GrowthPilot AI from Google Gemini API to Groq API. The migration replaces the underlying AI provider while maintaining complete backward compatibility with existing features, API interfaces, and Turkish language content generation.

### Goals

- Replace Google Gemini SDK with Groq SDK across the entire codebase
- Maintain identical API interfaces for all AI-powered features
- Preserve Turkish language content generation quality
- Ensure zero breaking changes for dependent code
- Implement robust error handling and retry logic for Groq API
- Support future multi-provider architecture

### Non-Goals

- Changing the functionality of existing AI features
- Modifying API route signatures or response formats
- Implementing new AI features during migration
- Performance optimization beyond provider switch
- Multi-provider support in this phase (infrastructure only)

### Success Criteria

- All AI features (action plans, strategy cards, creative content, target audience) generate Turkish content via Groq
- All existing tests pass with Groq API mocks
- No changes required in API route consumers
- Error messages remain in Turkish with generic AI service terminology
- Token limits enforced correctly for each content type

## Architecture

### Current Architecture (Gemini)

```
API Routes (app/api/ai/*)
    ↓
GeminiClient (lib/gemini/client.ts)
    ↓
@google/generative-ai SDK
    ↓
Google Gemini API (gemini-flash-latest)
```

### Target Architecture (Groq)

```
API Routes (app/api/ai/*)
    ↓
GroqClient (lib/gemini/client.ts) [same interface]
    ↓
groq-sdk
    ↓
Groq API (llama-3.3-70b-versatile)
```

### Future Architecture (Multi-Provider)

```
API Routes (app/api/ai/*)
    ↓
generateAI() (lib/ai/index.ts)
    ↓
AI Provider Router (lib/ai/config.ts)
    ↓
├── GroqClient (lib/ai/providers/groq.ts)
├── ClaudeClient (lib/ai/providers/claude.ts) [future]
└── OpenAIClient (lib/ai/providers/openai.ts) [future]
```

### Design Principles

1. **Interface Preservation**: Maintain exact same public API to avoid breaking changes
2. **Drop-in Replacement**: Groq client implements identical interface as Gemini client
3. **Provider Abstraction**: Prepare infrastructure for future multi-provider support
4. **Fail-Safe**: Robust error handling with Turkish user-facing messages
5. **Configuration-Driven**: Environment variables control provider selection

## Components and Interfaces

### 1. Groq Client Module (lib/gemini/client.ts)

**Purpose**: Wrapper around groq-sdk providing content generation capabilities

**Public Interface**:

```typescript
// Token limits for different content types
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,
} as const;

// Main client class
export class GroqClient {
  constructor(apiKey?: string);
  
  // Generate text content
  generateContent(
    prompt: string,
    maxTokens: number,
    useJsonMode: boolean
  ): Promise<string>;
  
  // Generate and parse JSON content
  generateJSON<T>(
    prompt: string,
    maxTokens: number
  ): Promise<T>;
}

// Singleton access
export function getGeminiClient(): GroqClient;

// Convenience functions
export function generateContent(
  prompt: string,
  maxTokens: number
): Promise<string>;

export function generateJSON<T>(
  prompt: string,
  maxTokens: number
): Promise<T>;
```

**Implementation Details**:

- Uses `groq-sdk` package (v0.3.0+)
- Model: `llama-3.3-70b-versatile`
- Temperature: 0.7 (balanced creativity)
- Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s)
- Error handling: Throws descriptive errors for upstream handling
- Singleton pattern: Single instance reused across requests

**Configuration**:

- Environment variable: `GROQ_API_KEY`
- Throws configuration error if key missing
- Validates API key format on initialization

### 2. Prompt Templates (lib/gemini/prompts.ts)

**Purpose**: Build structured prompts for different AI features

**No Changes Required**: All prompt templates remain identical. They are provider-agnostic and work with any LLM that supports Turkish language generation.

**Existing Functions**:
- `buildActionPlanPrompt(context: ActionPlanContext): string`
- `buildStrategyCardPrompt(context: StrategyCardContext): string`
- `buildCreativePrompt(context: CreativeContext): string`
- `buildTargetAudiencePrompt(industry: string): string`

### 3. Multi-Provider Infrastructure (Future)

**lib/ai/config.ts**:

```typescript
export type AIProvider = 'groq' | 'claude' | 'openai';

export type AIFeature = 
  | 'action_plan'
  | 'strategy_card'
  | 'creative'
  | 'recommendations'
  | 'target_audience';

export interface AIProviderConfig {
  provider: AIProvider;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Feature-to-provider mapping
export const FEATURE_PROVIDER_MAP: Record<AIFeature, AIProvider> = {
  action_plan: 'groq',
  strategy_card: 'groq',
  creative: 'groq',
  recommendations: 'groq',
  target_audience: 'groq',
};

// Provider configurations
export const PROVIDER_CONFIGS: Record<AIProvider, AIProviderConfig> = {
  groq: {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    maxTokens: 2000,
  },
  claude: {
    provider: 'claude',
    model: 'claude-3-sonnet-20240229',
    temperature: 0.7,
    maxTokens: 2000,
  },
  openai: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 2000,
  },
};
```

**lib/ai/index.ts**:

```typescript
export interface GenerateAIOptions {
  feature: AIFeature;
  prompt: string;
  maxTokens?: number;
  jsonMode?: boolean;
}

export async function generateAI<T = string>(
  options: GenerateAIOptions
): Promise<T> {
  const provider = FEATURE_PROVIDER_MAP[options.feature];
  const config = PROVIDER_CONFIGS[provider];
  
  // Route to appropriate provider
  switch (provider) {
    case 'groq':
      return generateWithGroq<T>(options, config);
    case 'claude':
      throw new Error('Claude provider not yet implemented');
    case 'openai':
      throw new Error('OpenAI provider not yet implemented');
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
```

### 4. API Routes

**No Interface Changes**: All API routes maintain their existing signatures and response formats. Only internal implementation changes from direct GeminiClient usage to GroqClient.

**Affected Routes**:
- `app/api/ai/action-plan/route.ts`
- `app/api/ai/strategy-cards/route.ts`
- `app/api/ai/recommendations/route.ts`
- `app/api/ai/recommendations/[id]/route.ts`
- `app/api/ai/target-audience/[id]/route.ts`
- `app/api/ai/cron/generate-action-plans/route.ts`

**Migration Pattern**:

```typescript
// Before (Gemini)
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
const geminiClient = getGeminiClient();
const result = await geminiClient.generateJSON(prompt, TOKEN_LIMITS.ACTION_PLAN);

// After (Groq) - IDENTICAL INTERFACE
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
const groqClient = getGeminiClient(); // Returns GroqClient instance
const result = await groqClient.generateJSON(prompt, TOKEN_LIMITS.ACTION_PLAN);
```

### 5. Error Handler

**Purpose**: Provide Turkish user-facing error messages

**Location**: Error handling embedded in GroqClient class

**Error Types**:
- Configuration errors: "Yapay zeka servisi yapılandırması eksik"
- API errors: "Yapay zeka servisi geçici olarak kullanılamıyor"
- Validation errors: "Yapay zeka servisi geçersiz yanıt döndü"
- Rate limit errors: "Yapay zeka servisi istek limitine ulaşıldı"

**Error Logging**: Technical details logged in English for debugging

## Data Models

### Environment Configuration

```typescript
interface EnvironmentConfig {
  // New required variable
  GROQ_API_KEY: string;
  
  // Removed variable (no longer needed)
  // GEMINI_API_KEY: string;
  
  // Existing variables (unchanged)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  META_APP_ID: string;
  META_APP_SECRET: string;
  ENCRYPTION_KEY: string;
}
```

### Groq API Request

```typescript
interface GroqChatRequest {
  model: string; // "llama-3.3-70b-versatile"
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature: number; // 0.7
  max_tokens: number; // Varies by content type
  response_format?: {
    type: 'json_object';
  };
}
```

### Groq API Response

```typescript
interface GroqChatResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: 'stop' | 'length' | 'content_filter';
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Token Limits Configuration

```typescript
const TOKEN_LIMITS = {
  ACTION_PLAN: 500,      // Daily action recommendations
  STRATEGY_CARD: 300,    // Strategic insights
  CREATIVE_CONTENT: 1000, // Ad copy and creative
  TARGET_AUDIENCE: 2000,  // Audience analysis
} as const;
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: 3;
  baseDelay: 1000; // 1 second
  maxDelay: 4000;  // 4 seconds
  backoffMultiplier: 2; // Exponential
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

- **Token Limit Properties (3.1-3.4)**: These can be combined into a single property that validates token limits are correctly set based on content type
- **Turkish Output Properties (6.2, 6.4, 11.1-11.4)**: These all validate Turkish language output and can be consolidated into one comprehensive property
- **Error Message Properties (7.1, 7.3)**: Both validate Turkish error messages and can be combined
- **Retry Logic Properties (12.1, 12.2, 12.5)**: These all validate retry behavior and can be consolidated

The following properties provide unique validation value after eliminating redundancy:

### Property 1: Temperature Consistency

*For any* API request made by the Client_Module, the temperature parameter SHALL be set to 0.7.

**Validates: Requirements 2.3**

### Property 2: JSON Parsing Round Trip

*For any* valid JSON response from generateJSON method, parsing the response SHALL produce a valid JavaScript object without errors.

**Validates: Requirements 2.5**

### Property 3: Exponential Backoff Retry Pattern

*For any* failed API request, the Client_Module SHALL retry up to 3 times with exponential backoff delays (1s, 2s, 4s), and the retry logic SHALL apply to both generateContent and generateJSON methods.

**Validates: Requirements 2.6, 12.1, 12.2, 12.5**

### Property 4: Token Limit Enforcement by Content Type

*For any* AI generation request, the Client_Module SHALL set the max_tokens parameter according to content type: 500 for Action_Plan, 300 for Strategy_Card, 1000 for Creative_Content, and 2000 for Target_Audience.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

### Property 5: Input Parameter Compatibility

*For any* valid input parameters accepted by the previous Gemini implementation, the new Groq implementation SHALL accept the same parameters without modification.

**Validates: Requirements 4.2**

### Property 6: Output Structure Compatibility

*For any* AI generation request, the output structure returned by the Groq implementation SHALL match the structure returned by the previous Gemini implementation.

**Validates: Requirements 4.3**

### Property 7: Turkish Language Prompt Inclusion

*For any* prompt generated by the system, it SHALL include explicit Turkish language instructions.

**Validates: Requirements 6.1**

### Property 8: Turkish Language Output Generation

*For any* AI feature (Action_Plan, Strategy_Card, Creative_Content, Target_Audience), the generated output SHALL be in Turkish language.

**Validates: Requirements 6.2, 6.4, 11.1, 11.2, 11.3, 11.4**

### Property 9: Turkish Locale Formatting Preservation

*For any* AI-generated content containing dates, currency, or numbers, the formatting SHALL use Turkish locale conventions (DD.MM.YYYY for dates, ₺X.XXX,XX for currency, X.XXX,XX for numbers).

**Validates: Requirements 6.5**

### Property 10: Provider-Agnostic Error Messages

*For any* user-facing error message, it SHALL NOT contain provider-specific terminology (e.g., "Gemini") and SHALL use generic terms (e.g., "Yapay zeka servisi") in Turkish.

**Validates: Requirements 7.1, 7.3**

### Property 11: Technical Error Logging in English

*For any* error that occurs, the system SHALL log technical details in English for debugging purposes while displaying Turkish messages to users.

**Validates: Requirements 7.5**

### Property 12: Successful Content Generation via Groq

*For any* AI endpoint call (action-plan, strategy-cards, recommendations, target-audience), the system SHALL successfully generate content using the Groq API.

**Validates: Requirements 8.7**

### Property 13: Retry Exhaustion Error Handling

*For any* API request that fails after all retry attempts are exhausted, the system SHALL return a user-friendly error message in Turkish.

**Validates: Requirements 12.3**

### Property 14: API Error Logging with Details

*For any* API error that occurs, the system SHALL log the error with request details (prompt length, content type, timestamp) for debugging.

**Validates: Requirements 12.4**

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing GROQ_API_KEY
   - Invalid API key format
   - Message: "Yapay zeka servisi yapılandırması eksik"
   - HTTP Status: 500

2. **API Errors**
   - Network failures
   - Timeout errors
   - Service unavailable
   - Message: "Yapay zeka servisi geçici olarak kullanılamıyor"
   - HTTP Status: 503
   - Retry: Yes (3 attempts with exponential backoff)

3. **Rate Limit Errors**
   - Too many requests
   - Quota exceeded
   - Message: "Yapay zeka servisi istek limitine ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin"
   - HTTP Status: 429
   - Retry: No (immediate failure)

4. **Validation Errors**
   - Invalid JSON response
   - Missing required fields
   - Malformed data
   - Message: "Yapay zeka servisi geçersiz yanıt döndü"
   - HTTP Status: 500
   - Retry: No

5. **Content Errors**
   - Empty response
   - Content filter triggered
   - Message: "İçerik oluşturulamadı. Lütfen farklı parametrelerle tekrar deneyin"
   - HTTP Status: 400
   - Retry: No

### Error Handling Flow

```
API Request
    ↓
Try Attempt 1
    ↓
[Success?] → Yes → Return Result
    ↓ No
Wait 1 second
    ↓
Try Attempt 2
    ↓
[Success?] → Yes → Return Result
    ↓ No
Wait 2 seconds
    ↓
Try Attempt 3
    ↓
[Success?] → Yes → Return Result
    ↓ No
Wait 4 seconds
    ↓
[Rate Limit?] → Yes → Throw Rate Limit Error (No Retry)
    ↓ No
[Validation Error?] → Yes → Throw Validation Error (No Retry)
    ↓ No
Throw API Error with Turkish Message
```

### Error Logging Strategy

**User-Facing Errors** (Turkish):
- Displayed in API responses
- Shown in UI notifications
- Generic, non-technical language
- Actionable guidance when possible

**Technical Errors** (English):
- Logged to console/monitoring system
- Include full stack traces
- Include request/response details
- Include timing information
- Include retry attempt numbers

**Example**:
```typescript
// User sees (Turkish):
"Yapay zeka servisi geçici olarak kullanılamıyor"

// Logs contain (English):
"[GROQ CLIENT] API Error: Request failed with status 503
  Model: llama-3.3-70b-versatile
  Prompt length: 1247 characters
  Max tokens: 500
  Attempt: 3/3
  Error: Service Unavailable
  Response: { error: { message: 'Service temporarily unavailable' } }
  Timestamp: 2024-02-20T14:30:45.123Z"
```

### Graceful Degradation

When AI service is unavailable:
- API routes return 503 status with Turkish error message
- Frontend displays error notification
- User can retry manually
- No data loss (request can be retried)
- System remains functional for non-AI features

## Testing Strategy

### Dual Testing Approach

This migration requires both unit tests and property-based tests to ensure correctness:

**Unit Tests**: Verify specific examples, edge cases, and error conditions
- Configuration error when GROQ_API_KEY is missing
- Correct model name is used (llama-3.3-70b-versatile)
- generateContent returns string for valid prompt
- generateJSON returns parsed object for valid JSON response
- Startup validation checks for GROQ_API_KEY

**Property Tests**: Verify universal properties across all inputs
- Temperature is always 0.7 for any request
- Token limits are correctly set for any content type
- Retry logic applies to any failed request
- Turkish output for any AI feature
- Error messages are in Turkish for any error
- Input/output compatibility for any valid parameters

### Property-Based Testing Configuration

**Library**: fast-check (existing in project)

**Minimum Iterations**: 100 per property test

**Test Organization**: `__tests__/property/groq-migration.test.ts`

**Tag Format**: Each test must reference its design property:
```typescript
// Feature: gemini-to-groq-migration, Property 1: Temperature Consistency
test('temperature is always 0.7 for any request', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 10, maxLength: 1000 }), // Random prompts
      async (prompt) => {
        const client = new GroqClient();
        const spy = jest.spyOn(client, 'generateContent');
        
        await client.generateContent(prompt, 500, false);
        
        expect(spy).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({ temperature: 0.7 })
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Coverage Requirements

**Unit Tests**:
- ✓ Configuration validation (GROQ_API_KEY presence)
- ✓ Model name verification
- ✓ Method signature compatibility
- ✓ Error message localization
- ✓ Edge cases (empty responses, malformed JSON)

**Property Tests** (14 properties from design):
1. Temperature consistency across all requests
2. JSON parsing round trip for any valid response
3. Exponential backoff retry pattern for any failure
4. Token limit enforcement for any content type
5. Input parameter compatibility for any valid input
6. Output structure compatibility for any request
7. Turkish language prompt inclusion for any prompt
8. Turkish language output for any AI feature
9. Turkish locale formatting for any generated content
10. Provider-agnostic error messages for any error
11. Technical error logging in English for any error
12. Successful content generation for any endpoint
13. Retry exhaustion error handling for any failed request
14. API error logging with details for any error

**Integration Tests**:
- ✓ End-to-end action plan generation
- ✓ End-to-end strategy card generation
- ✓ End-to-end creative content generation
- ✓ End-to-end target audience generation
- ✓ API route compatibility (no changes to consumers)

### Mock Strategy

**Groq API Mock** (`__tests__/mocks/groq-api.mock.ts`):
```typescript
export const mockGroqClient = {
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: Date.now(),
        model: 'llama-3.3-70b-versatile',
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: 'Mocked Turkish response'
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      })
    }
  }
};
```

### Test Execution

```bash
# Run all tests
npm test

# Run unit tests only
npm test -- __tests__/unit/groq-migration

# Run property tests only
npm test -- __tests__/property/groq-migration

# Run with coverage
npm test -- --coverage

# Run specific property test
npm test -- -t "temperature is always 0.7"
```

### Success Criteria

- All 14 property tests pass with 100+ iterations each
- All unit tests pass
- All integration tests pass
- Code coverage > 80% for new Groq client module
- No breaking changes detected in API route tests
- Turkish language validation passes for all AI features

