# Requirements Document

## Introduction

This document specifies the requirements for migrating the GrowthPilot AI platform from Google Gemini API to Groq API for all AI-powered features. The migration aims to replace the AI provider while maintaining backward compatibility, preserving all existing functionality, and ensuring Turkish language content generation continues to work seamlessly.

## Glossary

- **AI_Service**: The external API service that provides large language model capabilities (currently Gemini, migrating to Groq)
- **Client_Module**: The TypeScript module that interfaces with the AI_Service
- **Action_Plan**: AI-generated daily task recommendations for campaign optimization
- **Strategy_Card**: AI-generated strategic insights for campaign performance
- **Creative_Content**: AI-generated advertising copy and content suggestions
- **Target_Audience**: AI-generated audience segmentation and targeting recommendations
- **Token_Limit**: Maximum number of tokens allowed in AI_Service responses
- **Retry_Logic**: Error handling mechanism that attempts failed API calls multiple times with exponential backoff
- **Temperature**: AI model parameter controlling response randomness (0.0 = deterministic, 1.0 = creative)
- **API_Interface**: The public methods exposed by Client_Module for generating AI content

## Requirements

### Requirement 1: Replace Gemini SDK with Groq SDK

**User Story:** As a developer, I want to replace the Gemini API dependency with Groq API, so that the platform uses the new AI provider.

#### Acceptance Criteria

1. THE System SHALL remove the @google/generative-ai package from package.json
2. THE System SHALL add the groq-sdk package to package.json
3. WHEN the migration is complete, THE System SHALL have no remaining imports of @google/generative-ai in the codebase
4. THE System SHALL use groq-sdk version 0.3.0 or higher

### Requirement 2: Implement Groq Client Module

**User Story:** As a developer, I want a new Groq-based client implementation, so that AI features can communicate with the Groq API.

#### Acceptance Criteria

1. THE Client_Module SHALL be located at lib/gemini/client.ts
2. THE Client_Module SHALL use the llama-3.3-70b-versatile model
3. THE Client_Module SHALL set temperature to 0.7 for all requests
4. THE Client_Module SHALL implement a generateContent method that accepts a prompt string and returns generated text
5. THE Client_Module SHALL implement a generateJSON method that accepts a prompt string and returns parsed JSON
6. WHEN an API request fails, THE Client_Module SHALL apply Retry_Logic with exponential backoff
7. THE Client_Module SHALL read the GROQ_API_KEY from environment variables
8. IF GROQ_API_KEY is not set, THEN THE Client_Module SHALL throw a configuration error

### Requirement 3: Enforce Token Limits

**User Story:** As a system administrator, I want token limits enforced for different content types, so that API costs remain controlled.

#### Acceptance Criteria

1. WHEN generating Action_Plan content, THE Client_Module SHALL set Token_Limit to 500
2. WHEN generating Strategy_Card content, THE Client_Module SHALL set Token_Limit to 300
3. WHEN generating Creative_Content, THE Client_Module SHALL set Token_Limit to 1000
4. WHEN generating Target_Audience content, THE Client_Module SHALL set Token_Limit to 2000
5. THE Client_Module SHALL pass the max_tokens parameter to the Groq API for each request type

### Requirement 4: Maintain API Interface Compatibility

**User Story:** As a developer, I want the existing API interface preserved, so that no changes are required in dependent code.

#### Acceptance Criteria

1. THE Client_Module SHALL expose the same public methods as the previous Gemini implementation
2. THE Client_Module SHALL accept the same input parameters as the previous implementation
3. THE Client_Module SHALL return the same output structure as the previous implementation
4. WHEN existing code calls Client_Module methods, THE System SHALL execute without modification to the calling code
5. FOR ALL existing AI features, THE API_Interface SHALL remain unchanged

### Requirement 5: Update Environment Configuration

**User Story:** As a system administrator, I want to configure the Groq API key, so that the system can authenticate with the new provider.

#### Acceptance Criteria

1. THE System SHALL add GROQ_API_KEY to the required environment variables list
2. THE System SHALL remove GEMINI_API_KEY from the required environment variables list
3. THE System SHALL document GROQ_API_KEY in environment configuration files
4. WHEN the application starts, THE System SHALL validate that GROQ_API_KEY is present
5. IF GROQ_API_KEY is missing, THEN THE System SHALL log a clear error message in Turkish

### Requirement 6: Preserve Turkish Language Content Generation

**User Story:** As a user, I want AI-generated content to remain in Turkish, so that the platform continues to serve Turkish-speaking users.

#### Acceptance Criteria

1. THE Client_Module SHALL include Turkish language instructions in all prompts
2. WHEN generating any AI content, THE System SHALL produce output in Turkish
3. THE System SHALL maintain the formal business Turkish style ("siz" form)
4. FOR ALL AI features (Action_Plan, Strategy_Card, Creative_Content, Target_Audience), THE output language SHALL be Turkish
5. THE System SHALL preserve Turkish locale formatting for dates, currency, and numbers in AI-generated content

### Requirement 7: Update Error Messages

**User Story:** As a user, I want error messages to reference the generic AI service, so that provider-specific terminology is removed.

#### Acceptance Criteria

1. THE System SHALL replace all "Gemini" references in user-facing error messages with "Yapay zeka servisi"
2. THE Error_Handler SHALL be located at lib/gemini/error-handler.ts
3. WHEN an AI_Service error occurs, THE System SHALL display Turkish error messages
4. THE System SHALL maintain the same error handling behavior as the previous implementation
5. THE System SHALL log technical error details in English for debugging purposes

### Requirement 8: Update All AI Feature Endpoints

**User Story:** As a developer, I want all AI API routes updated to use the new client, so that all features work with Groq.

#### Acceptance Criteria

1. THE System SHALL update app/api/ai/action-plan/route.ts to use the new Client_Module
2. THE System SHALL update app/api/ai/strategy-cards/route.ts to use the new Client_Module
3. THE System SHALL update app/api/ai/recommendations/route.ts to use the new Client_Module
4. THE System SHALL update app/api/ai/recommendations/[id]/route.ts to use the new Client_Module
5. THE System SHALL update app/api/ai/target-audience/[id]/route.ts to use the new Client_Module
6. THE System SHALL update app/api/ai/cron/generate-action-plans/route.ts to use the new Client_Module
7. WHEN any AI endpoint is called, THE System SHALL successfully generate content using Groq API

### Requirement 9: Update Test Infrastructure

**User Story:** As a developer, I want test files updated to mock Groq API, so that tests continue to pass with the new provider.

#### Acceptance Criteria

1. THE System SHALL update __tests__/mocks/gemini-api.mock.ts to mock Groq SDK instead of Gemini SDK
2. THE System SHALL update __tests__/property/gemini-api.test.ts to test Groq client behavior
3. THE System SHALL rename test files to reflect Groq instead of Gemini where appropriate
4. WHEN tests run, THE System SHALL use Groq API mocks instead of Gemini mocks
5. FOR ALL property-based tests involving AI features, THE tests SHALL pass with the new Client_Module

### Requirement 10: Update Documentation

**User Story:** As a developer, I want documentation updated to reflect Groq usage, so that the codebase remains maintainable.

#### Acceptance Criteria

1. THE System SHALL update lib/gemini/README.md to document Groq API integration
2. THE System SHALL update tech.md to list Groq API instead of Gemini API
3. THE System SHALL document the llama-3.3-70b-versatile model in technical documentation
4. THE System SHALL document all Token_Limit values for different content types
5. THE System SHALL provide migration notes explaining the change from Gemini to Groq

### Requirement 11: Validate All AI Features Post-Migration

**User Story:** As a quality assurance engineer, I want all AI features tested after migration, so that functionality is verified.

#### Acceptance Criteria

1. WHEN Action_Plan generation is requested, THE System SHALL successfully generate Turkish action plans using Groq
2. WHEN Strategy_Card generation is requested, THE System SHALL successfully generate Turkish strategy cards using Groq
3. WHEN Creative_Content generation is requested, THE System SHALL successfully generate Turkish creative content using Groq
4. WHEN Target_Audience generation is requested, THE System SHALL successfully generate Turkish audience insights using Groq
5. FOR ALL AI features, THE output quality SHALL be comparable to the previous Gemini implementation

### Requirement 12: Maintain Retry and Error Handling Logic

**User Story:** As a system administrator, I want robust error handling preserved, so that transient API failures are handled gracefully.

#### Acceptance Criteria

1. THE Client_Module SHALL implement exponential backoff for failed requests
2. THE Client_Module SHALL retry failed requests up to 3 times
3. WHEN a request fails after all retries, THE System SHALL return a user-friendly error message in Turkish
4. THE System SHALL log all API errors with request details for debugging
5. THE Retry_Logic SHALL apply to both generateContent and generateJSON methods

