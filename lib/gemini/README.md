# Groq API Integration

This module provides integration with the Groq API for AI-powered features in GrowthPilot AI.

## Overview

The Groq client provides Turkish language content generation for:
- Action plans (daily optimization recommendations)
- Strategy cards (metric-based strategic insights)
- Creative content (ad copy and creative suggestions)
- Target audience analysis (audience segmentation recommendations)

## Migration from Gemini to Groq

This module was migrated from Google Gemini API to Groq API while maintaining complete backward compatibility. All public interfaces remain unchanged.

### Key Changes

- **Provider**: Google Gemini → Groq
- **Model**: gemini-flash-latest → llama-3.3-70b-versatile
- **SDK**: @google/generative-ai → groq-sdk
- **Environment Variable**: GEMINI_API_KEY → GROQ_API_KEY

### What Stayed the Same

- All function signatures and return types
- Token limits for each content type
- Retry logic with exponential backoff
- Turkish language output
- Error handling patterns

## Configuration

### Environment Variables

```bash
GROQ_API_KEY=your-groq-api-key-here
```

Get your API key from: https://console.groq.com

### Model Configuration

- **Model**: llama-3.3-70b-versatile
- **Temperature**: 0.7 (balanced creativity)
- **Retry Logic**: 3 attempts with exponential backoff (1s, 2s, 4s)

### Token Limits

Different content types have different token limits to optimize cost and response quality:

```typescript
TOKEN_LIMITS = {
  ACTION_PLAN: 500,        // Daily action recommendations
  STRATEGY_CARD: 300,      // Strategic insights
  CREATIVE_CONTENT: 1000,  // Ad copy and creative
  TARGET_AUDIENCE: 2000,   // Audience analysis
}
```

## Usage

### Basic Usage

```typescript
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';

const client = getGeminiClient();

// Generate text content
const response = await client.generateContent(
  'Your prompt here',
  TOKEN_LIMITS.ACTION_PLAN
);

// Generate JSON content
const jsonResponse = await client.generateJSON<YourType>(
  'Your prompt here',
  TOKEN_LIMITS.STRATEGY_CARD
);
```

### Convenience Functions

```typescript
import { generateContent, generateJSON } from '@/lib/gemini/client';

// Direct function calls (uses singleton client)
const text = await generateContent('prompt', TOKEN_LIMITS.ACTION_PLAN);
const json = await generateJSON<Type>('prompt', TOKEN_LIMITS.STRATEGY_CARD);
```

### With Prompt Templates

```typescript
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
import { buildActionPlanPrompt } from '@/lib/gemini/prompts';

const client = getGeminiClient();

const context = {
  clientName: 'Example Client',
  industry: 'e-commerce',
  totalSpend: 50000,
  roas: 2.5,
  conversions: 150,
  // ... other metrics
};

const prompt = buildActionPlanPrompt(context);
const actionPlan = await client.generateJSON(prompt, TOKEN_LIMITS.ACTION_PLAN);
```

## Error Handling

The client implements robust error handling with Turkish user-facing messages:

### Error Types

1. **Configuration Errors**
   - Missing GROQ_API_KEY
   - Message: "Yapay zeka servisi yapılandırması eksik"

2. **API Errors**
   - Network failures, timeouts, service unavailable
   - Message: "Yapay zeka servisi geçici olarak kullanılamıyor"
   - Retry: Yes (3 attempts with exponential backoff)

3. **Rate Limit Errors**
   - Too many requests, quota exceeded
   - Message: "Yapay zeka servisi istek limitine ulaşıldı. Lütfen birkaç dakika sonra tekrar deneyin"
   - Retry: No (immediate failure)

4. **Validation Errors**
   - Invalid JSON response, missing required fields
   - Message: "Yapay zeka servisi geçersiz yanıt döndü"
   - Retry: No

5. **Content Errors**
   - Empty response, content filter triggered
   - Message: "İçerik oluşturulamadı. Lütfen farklı parametrelerle tekrar deneyin"
   - Retry: No

### Error Logging

- **User-facing errors**: Turkish, generic, actionable
- **Technical errors**: English, detailed, with stack traces

```typescript
try {
  const result = await client.generateContent(prompt, maxTokens);
} catch (error) {
  // User sees: "Yapay zeka servisi geçici olarak kullanılamıyor"
  // Logs contain: Full error details in English
  console.error('[GROQ CLIENT] Error:', error);
}
```

## Retry Logic

The client automatically retries failed requests with exponential backoff:

- **Attempt 1**: Immediate
- **Attempt 2**: After 1 second
- **Attempt 3**: After 2 seconds (total 3s)
- **Attempt 4**: After 4 seconds (total 7s)

Rate limit errors are not retried.

## Turkish Language Support

All AI-generated content is in Turkish:

- Prompts include explicit Turkish language instructions
- Formal business Turkish ("siz" form)
- Turkish locale formatting for dates, currency, numbers
- Industry-specific terminology in Turkish

## Testing

### Unit Tests

```bash
npm test -- __tests__/unit/groq-client
```

### Property Tests

```bash
npm test -- __tests__/property/groq-api.test.ts
```

Property tests validate:
- Temperature consistency (always 0.7)
- Token limit enforcement
- Retry logic with exponential backoff
- Turkish language output
- Error message localization

### Mocks

Use the Groq API mock for testing:

```typescript
import { createMockGroqClient } from '@/__tests__/mocks/groq-api.mock';

const mockClient = createMockGroqClient();
mockClient.setFailure(true); // Simulate failures
mockClient.setResponseDelay(1000); // Simulate latency
```

## Architecture

### Singleton Pattern

The client uses a singleton pattern to reuse the same instance across requests:

```typescript
let groqClient: GroqClient | null = null;

export function getGeminiClient(): GroqClient {
  if (!groqClient) {
    groqClient = new GroqClient();
  }
  return groqClient;
}
```

### Future Multi-Provider Support

The architecture is designed to support multiple AI providers in the future:

```
API Routes
    ↓
generateAI() (lib/ai/index.ts)
    ↓
AI Provider Router (lib/ai/config.ts)
    ↓
├── GroqClient (lib/gemini/client.ts) [current]
├── ClaudeClient (lib/ai/providers/claude.ts) [future]
└── OpenAIClient (lib/ai/providers/openai.ts) [future]
```

## Performance Considerations

- **Singleton client**: Reuses connection across requests
- **Token limits**: Optimized for cost and response quality
- **Retry logic**: Handles transient failures gracefully
- **Concurrent requests**: Each request has independent retry logic

## Security

- API key stored in environment variables (never in code)
- API key validated on client initialization
- Error messages don't expose sensitive information
- Technical details logged separately from user messages

## Troubleshooting

### "Yapay zeka servisi yapılandırması eksik"

- Check that GROQ_API_KEY is set in environment variables
- Verify the API key is valid (get from https://console.groq.com)

### "Yapay zeka servisi geçici olarak kullanılamıyor"

- Check network connectivity
- Verify Groq API status (https://status.groq.com)
- Check logs for detailed error information

### "Yapay zeka servisi istek limitine ulaşıldı"

- Wait a few minutes before retrying
- Check your Groq API quota and usage
- Consider upgrading your Groq plan if needed

### Empty or Invalid Responses

- Check prompt formatting
- Verify token limits are appropriate for content type
- Review logs for JSON parsing errors

## References

- Groq API Documentation: https://console.groq.com/docs
- Groq SDK: https://www.npmjs.com/package/groq-sdk
- Model: llama-3.3-70b-versatile
- Migration Spec: .kiro/specs/gemini-to-groq-migration/
