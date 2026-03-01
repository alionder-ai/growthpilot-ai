# Implementation Plan: Target Audience & Offer Generator

## Overview

This implementation plan creates an AI-powered strategic analysis feature that generates customer segmentation and irresistible offer recommendations based on Alex Hormozi's "Grand Slam Offer" methodology. The feature integrates with the existing GrowthPilot AI dashboard, using TypeScript, Next.js 14, Supabase, and Google Gemini API.

## Tasks

- [x] 1. Database schema and migration
  - [x] 1.1 Create database migration file for target_audience_analyses table
    - Create migration file: `supabase/migrations/20260225000001_create_target_audience_analyses.sql`
    - Define table with columns: id (UUID), user_id (UUID FK), industry (TEXT), analysis_data (JSONB), created_at (TIMESTAMP)
    - Add indexes on user_id and created_at columns
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.8, 15.9_
  
  - [x] 1.2 Add Row-Level Security policies
    - Create RLS policy restricting users to their own records
    - Enable RLS on target_audience_analyses table
    - _Requirements: 15.7, 9.6, 9.7_

- [x] 2. TypeScript interfaces and types
  - [x] 2.1 Create type definitions for strategic analysis data structures
    - Create file: `lib/types/target-audience.ts`
    - Define interfaces: StrategicAnalysis, CustomerSegment, UnnecessaryCustomer, ScoredItem, IrresistibleOffers, TargetAudienceAnalysis
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_

- [x] 3. Gemini API integration
  - [x] 3.1 Add target audience prompt template to Gemini prompts
    - Update file: `lib/gemini/prompts.ts`
    - Create function: `buildTargetAudiencePrompt(industry: string): string`
    - Include Alex Hormozi framework reference, Turkish language specification, JSON structure request
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7_
  
  - [x] 3.2 Add token limit configuration for target audience
    - Update TOKEN_LIMITS constant in `lib/gemini/prompts.ts`
    - Add TARGET_AUDIENCE: 2000 to token limits
    - _Requirements: 14.1_
  
  - [x] 3.3 Implement response parsing and validation logic
    - Create file: `lib/utils/target-audience-parser.ts`
    - Implement JSON extraction from markdown code blocks
    - Implement structure validation for all required fields
    - Implement score clamping (1-10 range) and default handling (non-numeric → 5)
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 14.7_

- [x] 4. API endpoint implementation
  - [x] 4.1 Create POST endpoint for analysis generation
    - Create file: `app/api/ai/target-audience/route.ts`
    - Implement authentication validation (return 401 if not authenticated)
    - Implement input validation (return 400 if industry missing/empty)
    - Implement Gemini API call with retry logic (3 retries, exponential backoff)
    - Implement database storage of analysis
    - Return 200 with analysis on success, 500 on error
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 14.3, 14.4, 14.5, 14.6_
  
  - [x] 4.2 Write unit tests for API endpoint
    - Create file: `__tests__/unit/ai/target-audience-api.test.ts`
    - Test authentication validation (401 for unauthenticated)
    - Test input validation (400 for empty industry)
    - Test successful analysis generation (200 with valid structure)
    - Test Gemini API failure handling (500 with Turkish error message)
    - Test database storage failure handling
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 5. Checkpoint - Ensure API endpoint tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Core UI components
  - [x] 6.1 Create ImportanceScoreBar component
    - Create file: `components/ai/ImportanceScoreBar.tsx`
    - Implement horizontal progress bar with color gradient (red → yellow → green)
    - Display numeric score (e.g., "8/10")
    - Props: score (number), label (string)
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_
  
  - [x] 6.2 Create CustomerSegmentCard component
    - Create file: `components/ai/CustomerSegmentCard.tsx`
    - Implement color-coded card by segment type (green/yellow/red)
    - Display profile section
    - Display collapsible sections for desires, barriers, needs
    - Use ImportanceScoreBar for each scored item
    - Props: segment (CustomerSegment), type ('perfect' | 'necessary' | 'unnecessary'), title (string)
    - _Requirements: 7.2, 7.3, 7.4, 7.6_
  
  - [x] 6.3 Create AnalysisDisplay component
    - Create file: `components/ai/AnalysisDisplay.tsx`
    - Render three CustomerSegmentCard components (Mükemmel, Mecburi, Gereksiz)
    - Render offers section with three offer cards
    - Implement responsive layout
    - Props: analysis (StrategicAnalysis)
    - _Requirements: 7.1, 7.6_
  
  - [x] 6.4 Create TargetAudienceForm component
    - Create file: `components/ai/TargetAudienceForm.tsx`
    - Implement industry input field with label "Sektör/Endüstri"
    - Implement "Analiz Et" button
    - Implement empty input validation with message "Bu alan zorunludur"
    - Implement loading state (button disabled, spinner, text "Analiz Ediliyor...")
    - Implement error message display
    - Props: onSubmit (async function), isLoading (boolean)
    - _Requirements: 1.1, 1.2, 1.3, 8.1, 8.2, 8.5_
  
  - [x] 6.5 Write unit tests for UI components
    - Create file: `__tests__/unit/ai/target-audience-components.test.ts`
    - Test ImportanceScoreBar rendering with different scores
    - Test CustomerSegmentCard rendering and collapsible sections
    - Test AnalysisDisplay rendering with complete analysis
    - Test TargetAudienceForm validation and loading states

- [x] 7. Main page implementation
  - [x] 7.1 Create target audience page
    - Create file: `app/dashboard/target-audience/page.tsx`
    - Implement page component with authentication middleware
    - Manage state: loading, analysis data, error
    - Implement form submission handler (call API endpoint)
    - Render TargetAudienceForm and AnalysisDisplay components
    - Implement error handling with Turkish error messages
    - Implement success toast notification
    - _Requirements: 18.3, 18.4, 8.3, 8.4, 10.1, 10.2, 10.3, 10.4_
  
  - [x] 7.2 Add navigation link to dashboard menu
    - Update file: `components/dashboard/DashboardLayout.tsx`
    - Add menu item: "Hedef Kitle Analizi" with target icon
    - Position after "Strateji Kartları"
    - Link to /dashboard/target-audience
    - _Requirements: 18.1, 18.2, 18.5_

- [x] 8. Analysis history feature
  - [x] 8.1 Create API endpoint for history retrieval
    - Create file: `app/api/ai/target-audience/history/route.ts`
    - Implement GET endpoint with authentication
    - Fetch user's analyses sorted by created_at DESC
    - Implement pagination (50 records per page)
    - Return list with id, industry, created_at fields
    - _Requirements: 13.1, 13.2, 13.3, 13.5_
  
  - [x] 8.2 Create API endpoint for single analysis retrieval
    - Create file: `app/api/ai/target-audience/[id]/route.ts`
    - Implement GET endpoint with authentication and RLS enforcement
    - Return full analysis data
    - Return 404 if not found
    - _Requirements: 13.4_
  
  - [x] 8.3 Create AnalysisHistory component
    - Create file: `components/ai/AnalysisHistory.tsx`
    - Display list of past analyses with industry and date
    - Implement pagination controls
    - Implement click handler to view full analysis
    - Props: analyses (TargetAudienceAnalysis[]), onSelect (function)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
  
  - [x] 8.4 Integrate history view into main page
    - Update `app/dashboard/target-audience/page.tsx`
    - Add "Geçmiş Analizler" button
    - Implement history modal or separate view
    - Load and display analysis when selected from history

- [x] 9. Checkpoint - Ensure all core features work
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Turkish localization verification
  - [x] 10.1 Verify all UI text is in Turkish
    - Check all labels, buttons, error messages, validation messages
    - Ensure formal business Turkish ("siz" form) is used
    - Verify consistent terminology with existing GrowthPilot AI
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [x] 11. Styling and responsive design
  - [x] 11.1 Implement responsive layouts
    - Desktop: Two-column layout for customer segments
    - Tablet: Single-column stacked layout
    - Mobile: Condensed spacing, collapsible sections default closed
    - _Requirements: 7.5_
  
  - [x] 11.2 Apply consistent styling with existing dashboard
    - Use existing Tailwind classes and color palette
    - Match existing card shadows, borders, spacing
    - Use Shadcn/UI components (Button, Input, Card, Progress)
    - _Requirements: 18.5_

- [x] 12. Accessibility implementation
  - [x] 12.1 Add WCAG 2.1 AA compliance features
    - Add semantic HTML elements
    - Add ARIA labels for interactive elements
    - Implement keyboard navigation support
    - Ensure focus indicators are visible
    - Verify color contrast ratios ≥4.5:1
    - Add screen reader announcements for loading states

- [x] 13. Property-based testing
  - [x] 13.1 Write property test for input whitespace normalization
    - Create file: `__tests__/property/target-audience.test.ts`
    - **Property 1: Input whitespace normalization**
    - **Validates: Requirements 1.5**
  
  - [x] 13.2 Write property test for Unicode input acceptance
    - **Property 2: Unicode input acceptance**
    - **Validates: Requirements 1.4**
  
  - [x] 13.3 Write property test for authentication enforcement
    - **Property 3: Authentication enforcement**
    - **Validates: Requirements 11.2, 11.3**
  
  - [x] 13.4 Write property test for empty input validation
    - **Property 4: Empty input validation**
    - **Validates: Requirements 11.5**
  
  - [x] 13.5 Write property test for perfect customer segment structure
    - **Property 5: Perfect customer segment structure completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**
  
  - [x] 13.6 Write property test for necessary customer segment structure
    - **Property 6: Necessary customer segment structure completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
  
  - [x] 13.7 Write property test for importance score range validity
    - **Property 7: Importance score range validity**
    - **Validates: Requirements 3.7, 4.7**
  
  - [x] 13.8 Write property test for unnecessary customer profile existence
    - **Property 8: Unnecessary customer profile existence**
    - **Validates: Requirements 5.1, 5.2, 5.3**
  
  - [x] 13.9 Write property test for irresistible offers completeness
    - **Property 9: Irresistible offers completeness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
  
  - [x] 13.10 Write property test for analysis persistence
    - **Property 10: Analysis persistence**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
  
  - [x] 13.11 Write property test for Row-Level Security isolation
    - **Property 11: Row-Level Security isolation**
    - **Validates: Requirements 9.6, 9.7**
  
  - [x] 13.12 Write property test for JSON response structure validity
    - **Property 12: JSON response structure validity**
    - **Validates: Requirements 12.1-12.9**
  
  - [x] 13.13 Write property test for analysis history sorting
    - **Property 13: Analysis history sorting**
    - **Validates: Requirements 13.2**
  
  - [x] 13.14 Write property test for Gemini API retry behavior
    - **Property 14: Gemini API retry behavior**
    - **Validates: Requirements 14.3, 14.4, 14.5**
  
  - [x] 13.15 Write property test for prompt content completeness
    - **Property 15: Prompt content completeness**
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 19.1, 19.2, 19.5, 19.6**
  
  - [x] 13.16 Write property test for JSON parsing resilience
    - **Property 16: JSON parsing resilience**
    - **Validates: Requirements 20.2**
  
  - [x] 13.17 Write property test for score value clamping
    - **Property 17: Score value clamping**
    - **Validates: Requirements 20.5**
  
  - [x] 13.18 Write property test for invalid score default handling
    - **Property 18: Invalid score default handling**
    - **Validates: Requirements 20.6**
  
  - [x] 13.19 Write property test for Turkish localization in UI
    - **Property 19: Turkish localization in UI**
    - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**
  
  - [x] 13.20 Write property test for button state synchronization
    - **Property 20: Button state synchronization**
    - **Validates: Requirements 8.5**

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Implementation uses TypeScript with Next.js 14 App Router
- All user-facing text must be in Turkish (formal business form)
- Feature integrates with existing GrowthPilot AI dashboard and styling
