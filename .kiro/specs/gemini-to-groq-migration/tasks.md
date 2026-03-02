# Implementation Plan: Gemini to Groq Migration

## Overview

This plan migrates GrowthPilot AI from Google Gemini API to Groq API by replacing the AI provider SDK while maintaining complete backward compatibility. All AI features will continue to generate Turkish content with identical API interfaces.

## Tasks

- [x] 1. Update package dependencies
  - Remove @google/generative-ai from package.json
  - Add groq-sdk (v0.3.0+) to package.json
  - Run npm install to update dependencies
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Implement Groq client module
  - [x] 2.1 Rewrite lib/gemini/client.ts with Groq SDK
    - Replace GoogleGenerativeAI with Groq client
    - Use llama-3.3-70b-versatile model
    - Set temperature to 0.7
    - Implement generateContent method with retry logic (3 attempts, exponential backoff)
    - Implement generateJSON method with retry logic
    - Read GROQ_API_KEY from environment variables
    - Throw configuration error if GROQ_API_KEY is missing
    - Maintain TOKEN_LIMITS constant (ACTION_PLAN: 500, STRATEGY_CARD: 300, CREATIVE_CONTENT: 1000, TARGET_AUDIENCE: 2000)
    - Preserve singleton pattern (getGeminiClient function)
    - Preserve convenience functions (generateContent, generateJSON)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 12.1, 12.2_

  - [ ]* 2.2 Write property test for temperature consistency
    - **Property 1: Temperature Consistency**
    - **Validates: Requirements 2.3**

  - [ ]* 2.3 Write property test for token limit enforcement
    - **Property 4: Token Limit Enforcement by Content Type**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

  - [ ]* 2.4 Write property test for retry logic
    - **Property 3: Exponential Backoff Retry Pattern**
    - **Validates: Requirements 2.6, 12.1, 12.2, 12.5**

- [x] 3. Update error handling
  - [x] 3.1 Update error messages in lib/gemini/client.ts
    - Replace "Gemini" references with "Yapay zeka servisi" in user-facing errors
    - Implement Turkish error messages for configuration, API, rate limit, validation, and content errors
    - Log technical error details in English for debugging
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 12.3, 12.4_

  - [ ]* 3.2 Write property test for Turkish error messages
    - **Property 10: Provider-Agnostic Error Messages**
    - **Validates: Requirements 7.1, 7.3**

  - [ ]* 3.3 Write property test for technical error logging
    - **Property 11: Technical Error Logging in English**
    - **Validates: Requirements 7.5**

- [x] 4. Update environment configuration
  - [x] 4.1 Update .env.example and documentation
    - Add GROQ_API_KEY to required environment variables
    - Remove GEMINI_API_KEY from documentation
    - Update tech.md to reference Groq API instead of Gemini API
    - Document llama-3.3-70b-versatile model
    - Document token limits for each content type
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4_

- [x] 5. Update AI API routes
  - [x] 5.1 Update app/api/ai/action-plan/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.1_

  - [x] 5.2 Update app/api/ai/strategy-cards/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.2_

  - [x] 5.3 Update app/api/ai/recommendations/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.3_

  - [x] 5.4 Update app/api/ai/recommendations/[id]/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.4_

  - [x] 5.5 Update app/api/ai/target-audience/[id]/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.5_

  - [x] 5.6 Update app/api/ai/cron/generate-action-plans/route.ts
    - Verify imports still work with new Groq client (no code changes needed due to interface compatibility)
    - _Requirements: 8.6_

  - [ ]* 5.7 Write property test for successful content generation
    - **Property 12: Successful Content Generation via Groq**
    - **Validates: Requirements 8.7**

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Update test infrastructure
  - [x] 7.1 Update __tests__/mocks/gemini-api.mock.ts to mock Groq SDK
    - Replace Gemini API mocks with Groq API mocks
    - Mock chat.completions.create method
    - Return llama-3.3-70b-versatile model in responses
    - _Requirements: 9.1, 9.4_

  - [x] 7.2 Update __tests__/property/gemini-api.test.ts
    - Update test file to test Groq client behavior
    - Verify temperature, token limits, retry logic
    - _Requirements: 9.2, 9.5_

  - [ ]* 7.3 Write property tests for Turkish language output
    - **Property 7: Turkish Language Prompt Inclusion**
    - **Property 8: Turkish Language Output Generation**
    - **Property 9: Turkish Locale Formatting Preservation**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5, 11.1, 11.2, 11.3, 11.4**

  - [ ]* 7.4 Write property tests for API compatibility
    - **Property 5: Input Parameter Compatibility**
    - **Property 6: Output Structure Compatibility**
    - **Validates: Requirements 4.2, 4.3**

  - [ ]* 7.5 Write property test for JSON parsing
    - **Property 2: JSON Parsing Round Trip**
    - **Validates: Requirements 2.5**

  - [ ]* 7.6 Write property test for retry exhaustion
    - **Property 13: Retry Exhaustion Error Handling**
    - **Validates: Requirements 12.3**

  - [ ]* 7.7 Write property test for error logging
    - **Property 14: API Error Logging with Details**
    - **Validates: Requirements 12.4**

- [x] 8. Update documentation
  - [x] 8.1 Update lib/gemini/README.md
    - Document Groq API integration
    - Document llama-3.3-70b-versatile model
    - Document token limits
    - Add migration notes from Gemini to Groq
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

- [x] 9. Create multi-provider infrastructure (future-proofing)
  - [x] 9.1 Create lib/ai/config.ts
    - Define AIProvider type ('groq' | 'claude' | 'openai')
    - Define AIFeature type
    - Create FEATURE_PROVIDER_MAP (all features map to 'groq')
    - Create PROVIDER_CONFIGS with Groq configuration
    - _Requirements: 4.5 (future architecture)_

  - [x] 9.2 Create lib/ai/index.ts
    - Implement generateAI function that routes to appropriate provider
    - Currently only supports Groq, throws errors for other providers
    - _Requirements: 4.5 (future architecture)_

- [x] 10. Final validation and deployment
  - [x] 10.1 Run npm install
    - Install groq-sdk package
    - Remove @google/generative-ai package
    - _Requirements: 1.1, 1.2_

  - [x] 10.2 Verify no Gemini imports remain
    - Search codebase for @google/generative-ai imports
    - Ensure all imports removed
    - _Requirements: 1.3_

  - [x] 10.3 Run all tests
    - Execute npm test to run all unit and property tests
    - Verify all tests pass
    - _Requirements: 9.5, 11.1, 11.2, 11.3, 11.4, 11.5_

  - [x] 10.4 Deploy to production
    - Set GROQ_API_KEY environment variable in production
    - Deploy updated code
    - Monitor for errors
    - _Requirements: 5.4_

## Notes

- Tasks marked with `*` are optional property-based tests and can be skipped for faster MVP
- The Groq client maintains identical interface to Gemini client, so no changes needed in API routes
- All prompt templates (lib/gemini/prompts.ts) remain unchanged as they are provider-agnostic
- Multi-provider infrastructure (tasks 9.1-9.2) prepares for future Claude/OpenAI support but is not required for migration
- Turkish language generation is preserved through prompt instructions, not provider-specific configuration
