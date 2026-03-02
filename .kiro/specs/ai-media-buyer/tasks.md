# Implementation Plan: AI Media Buyer

## Overview

This implementation plan breaks down the AI Media Buyer feature into discrete coding tasks. The feature analyzes Meta Ads campaigns using 30-day historical metrics, calculates performance scores (0-100), and provides Scale/Hold/Kill recommendations with Turkish-language justifications. It integrates with the Groq API for AI-powered insights and includes profit simulation based on commission models.

## Tasks

- [x] 1. Set up core types and configuration
  - Create TypeScript types in `lib/types/media-buyer.ts` for all interfaces (MediaBuyerAnalysis, KPIMetrics, Issue, Recommendation, ProfitSimulation, BenchmarkComparison, CampaignData, AggregatedMetrics)
  - Update `lib/ai/config.ts` to add 'media_buyer' feature with Groq provider and 2000 token limit
  - Add MEDIA_BUYER_PROMPT template to `lib/ai/prompts.ts` with Turkish instructions for campaign analysis
  - Add Turkish error messages to error constants
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Implement Performance Score Calculator
  - [x] 2.1 Create PerformanceScoreCalculator class in `lib/ai/performance-score-calculator.ts`
    - Implement `calculate()` method that applies weighted scoring: engagement (40%), fatigue (20%), efficiency (30%), audience (10%)
    - Implement private methods for each score component (engagement, fatigue, efficiency, audience)
    - Ensure final score is always between 0-100
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x]* 2.2 Write property test for performance score range invariant
    - **Property 5: Performance Score Range Invariant**
    - **Validates: Requirements 2.5**
  
  - [x]* 2.3 Write property test for score calculation formula
    - **Property 4: Performance Score Calculation Formula**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
  
  - [x]* 2.4 Write unit tests for PerformanceScoreCalculator
    - Test specific metric combinations
    - Test edge cases (zero values, extreme values)
    - Test weight distribution
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 3. Implement Decision Engine
  - [x] 3.1 Create DecisionEngine class in `lib/ai/decision-engine.ts`
    - Implement `determine()` method with Scale/Hold/Kill logic
    - Implement Scale conditions: score >= 70 AND ROAS > target AND frequency < 3
    - Implement Kill conditions: score < 40 OR frequency > 4.5 OR ROAS < (target × 0.5)
    - Implement Hold as default for all other cases
    - Generate Turkish justifications for each decision
    - Generate client-friendly justifications for Kill decisions
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x]* 3.2 Write property tests for decision conditions
    - **Property 7: Scale Decision Conditions**
    - **Property 8: Hold Decision Conditions**
    - **Property 9: Kill Decision Conditions**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [x]* 3.3 Write property tests for justification presence
    - **Property 10: Turkish Justification Presence**
    - **Property 11: Client Justification for Kill Decisions**
    - **Validates: Requirements 3.4, 3.5**
  
  - [x]* 3.4 Write unit tests for DecisionEngine
    - Test boundary conditions (score = 40, 70)
    - Test frequency thresholds (3.0, 4.5)
    - Test ROAS threshold calculations
    - Test justification text generation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement Profit Simulator
  - [x] 4.1 Create ProfitSimulator class in `lib/ai/profit-simulator.ts`
    - Implement `simulate()` method that calculates current and projected profit
    - Implement projection logic: Scale (+30% spend, +25% revenue), Hold (no change), Kill (zero)
    - Calculate commission based on model type (percentage vs fixed)
    - Calculate percentage change between current and projected
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_
  
  - [x]* 4.2 Write property tests for profit calculations
    - **Property 22: Current Profit Calculation**
    - **Property 23: Profit Projection Based on Decision**
    - **Property 26: Percentage Commission Calculation**
    - **Property 27: Fixed Commission Maintenance**
    - **Validates: Requirements 6.1, 6.2, 6.5, 6.6**
  
  - [x]* 4.3 Write property test for profit simulation structure
    - **Property 24: Profit Simulation Structure**
    - **Validates: Requirements 6.3**
  
  - [x]* 4.4 Write unit tests for ProfitSimulator
    - Test percentage commission calculations
    - Test fixed commission calculations
    - Test Scale projection logic
    - Test Kill projection (zero values)
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [x] 5. Implement Data Collection and Aggregation
  - [x] 5.1 Create data collection utilities in `lib/ai/media-buyer-data.ts`
    - Implement `collectCampaignData()` function to fetch campaign, ad sets, ads, and 30-day metrics
    - Implement `aggregateMetrics()` function to calculate totals and averages
    - Implement 30-day date filtering logic
    - Handle missing or incomplete data with appropriate errors
    - _Requirements: 2.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x]* 5.2 Write property tests for data collection
    - **Property 6: 30-Day Metrics Window**
    - **Property 12: Complete Campaign Data Collection**
    - **Property 13: Metrics Aggregation Correctness**
    - **Validates: Requirements 2.6, 4.1, 4.2, 4.3, 4.4, 4.5**
  
  - [x]* 5.3 Write property test for insufficient data handling
    - **Property 14: Insufficient Data Error Handling**
    - **Validates: Requirements 4.6**

- [x] 6. Implement Benchmark Comparison
  - [x] 6.1 Create benchmark comparison utilities in `lib/ai/benchmark-comparator.ts`
    - Implement `compareToBenchmark()` function that retrieves industry benchmarks
    - Compare campaign CTR, CVR, and ROAS against industry averages
    - Determine status ('above', 'below', 'at') for each metric
    - Return null when benchmark data unavailable
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_
  
  - [x]* 6.2 Write property tests for benchmark comparison
    - **Property 28: Benchmark Comparison Completeness**
    - **Property 29: Missing Benchmark Handling**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5, 7.6**

- [x] 7. Implement AI Analysis Integration
  - [x] 7.1 Create Groq API integration in `lib/ai/media-buyer-ai.ts`
    - Implement `generateAIAnalysis()` function that calls Groq API with campaign data
    - Use llama-3.3-70b-versatile model
    - Send Turkish-language prompt requesting summary, KPI overview, issues, recommendations, and next tests
    - Parse JSON response into structured format
    - Implement retry logic with exponential backoff (3 attempts)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  
  - [x]* 7.2 Write property tests for AI analysis
    - **Property 15: Groq API Model Specification**
    - **Property 16: Turkish Language Prompt**
    - **Property 17: Analysis Structure Completeness**
    - **Property 18: Issue Severity Validation**
    - **Property 19: Recommendation Impact Validation**
    - **Property 20: Groq API Retry Logic**
    - **Property 21: Turkish Error Messages After Retry Exhaustion**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 5.8**

- [x] 8. Implement Main Analyzer Orchestrator
  - [x] 8.1 Create MediaBuyerAnalyzer class in `lib/ai/media-buyer-analyzer.ts`
    - Implement `analyzeCampaign()` method that orchestrates all components
    - Call data collection, score calculation, decision engine, AI analysis, profit simulation, and benchmark comparison
    - Combine all results into MediaBuyerAnalysis object
    - Handle errors from each component with Turkish messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 11.1, 11.2, 11.5_
  
  - [x]* 8.2 Write unit tests for MediaBuyerAnalyzer
    - Test component orchestration
    - Test error handling flows
    - Test data transformation
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Checkpoint - Ensure core business logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement Caching Layer
  - [x] 10.1 Create cache utilities in `lib/ai/media-buyer-cache.ts`
    - Implement in-memory cache with 5-minute TTL
    - Implement `getCachedAnalysis()` function with campaign ID key
    - Implement `setCachedAnalysis()` function with timestamp
    - Implement `invalidateCache()` function for metric updates
    - _Requirements: 12.1, 12.2, 12.3_
  
  - [x]* 10.2 Write property tests for caching behavior
    - **Property 44: Cache Storage with TTL**
    - **Property 45: Cache Hit Behavior**
    - **Property 46: Cache Invalidation on Metric Update**
    - **Validates: Requirements 12.1, 12.2, 12.3**

- [x] 11. Implement API Endpoint
  - [x] 11.1 Create POST endpoint at `app/api/ai/media-buyer/route.ts`
    - Validate campaign ID from request body
    - Verify authenticated user owns the campaign (RLS check)
    - Check cache for fresh results
    - Call MediaBuyerAnalyzer if cache miss
    - Store results in cache
    - Return JSON response with analysis or error
    - Log all requests for audit
    - Return appropriate HTTP status codes (200, 400, 403, 404, 500)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_
  
  - [x]* 11.2 Write property tests for API endpoint
    - **Property 36: Campaign ID Validation**
    - **Property 37: Campaign Ownership Authorization**
    - **Property 38: JSON Response Format**
    - **Property 39: HTTP Status Code Correctness**
    - **Property 40: Analysis Request Audit Logging**
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7**
  
  - [x]* 11.3 Write unit tests for API endpoint
    - Test request validation
    - Test authorization checks
    - Test response formatting
    - Test error responses
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 12. Implement Frontend Components - Campaign Selection
  - [x] 12.1 Create CampaignSelector component in `components/ai/CampaignSelector.tsx`
    - Display dropdown with all active campaigns
    - Show campaign name, status, and budget
    - Handle single campaign selection
    - Emit selection event to parent
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x]* 12.2 Write property tests for campaign selection
    - **Property 1: Campaign Selection State Management**
    - **Property 3: Campaign Information Display**
    - **Validates: Requirements 1.3, 1.5**

- [x] 13. Implement Frontend Components - Analysis Results Display
  - [x] 13.1 Create PerformanceScoreCard component in `components/ai/PerformanceScoreCard.tsx`
    - Display performance score with circular progress indicator
    - Apply color coding: green (70+), yellow (40-69), red (<40)
    - Display decision badge and justification
    - _Requirements: 8.1, 8.2_
  
  - [x] 13.2 Create DecisionBadge component in `components/ai/DecisionBadge.tsx`
    - Display Turkish labels: "Ölçeklendir" (green), "Beklet" (yellow), "Durdur" (red)
    - Support different sizes
    - _Requirements: 8.2_
  
  - [x] 13.3 Create IssuesList component in `components/ai/IssuesList.tsx`
    - Display issues sorted by severity (critical first)
    - Show color-coded severity indicators
    - _Requirements: 8.4_
  
  - [x] 13.4 Create RecommendationsList component in `components/ai/RecommendationsList.tsx`
    - Display recommendations sorted by impact (high first)
    - Show impact level badges
    - _Requirements: 8.5_
  
  - [x] 13.5 Create ProfitSimulationCard component in `components/ai/ProfitSimulationCard.tsx`
    - Display current and projected profit with Turkish Lira formatting (₺1.234,56)
    - Show percentage change with +/- indicator
    - Display revenue and commission breakdown
    - Include visual comparison chart
    - _Requirements: 6.3, 6.4, 8.7_
  
  - [x] 13.6 Create BenchmarkComparison component in `components/ai/BenchmarkComparison.tsx`
    - Display CTR, CVR, and ROAS comparisons
    - Show visual indicators for above/below/at benchmark
    - Use Turkish labels for metrics
    - Handle missing benchmark data
    - _Requirements: 7.5, 7.6, 8.8_
  
  - [x] 13.7 Create AnalysisResults component in `components/ai/AnalysisResults.tsx`
    - Compose all result components (score, decision, issues, recommendations, profit, benchmark)
    - Display campaign summary and KPI overview
    - Display next test suggestions
    - Show client justification in copyable format for Kill decisions
    - Display all text in Turkish
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_
  
  - [x]* 13.8 Write property tests for UI components
    - **Property 30: Performance Score Color Coding**
    - **Property 31: Decision and Justification Display**
    - **Property 32: Issues Sorted by Severity**
    - **Property 33: Recommendations Sorted by Impact**
    - **Property 34: Client Justification Display for Kill**
    - **Property 35: Turkish UI Labels**
    - **Property 25: Turkish Lira Formatting**
    - **Validates: Requirements 6.4, 8.1, 8.2, 8.4, 8.5, 8.9, 8.10**
  
  - [x]* 13.9 Write unit tests for UI components
    - Test component rendering with various props
    - Test user interactions
    - Test conditional rendering
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

- [x] 14. Implement Main Page Component
  - [x] 14.1 Create MediaBuyerPage at `app/dashboard/ai-media-buyer/page.tsx`
    - Fetch all active campaigns for authenticated user
    - Render CampaignSelector component
    - Render "Analiz Et" button (enabled only when campaign selected)
    - Handle analyze button click to call API endpoint
    - Display loading state during analysis
    - Display AnalysisResults component when analysis completes
    - Display Turkish error messages on failure
    - Display success confirmation on completion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 11.3, 11.4_
  
  - [x]* 14.2 Write property tests for page behavior
    - **Property 2: Analysis Button Enablement**
    - **Property 41: Turkish Error Messages for Data Issues**
    - **Property 42: Loading State Display**
    - **Property 43: Success Confirmation Display**
    - **Validates: Requirements 1.4, 11.1, 11.2, 11.3, 11.4, 11.5**

- [x] 15. Add Navigation Menu Item
  - [x] 15.1 Update DashboardLayout in `components/dashboard/DashboardLayout.tsx`
    - Add "AI Media Buyer" menu item with bot icon
    - Link to `/dashboard/ai-media-buyer`
    - Use Turkish label: "AI Media Buyer"
    - _Requirements: 1.1_

- [x] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Create Property Test Generators
  - [x] 17.1 Create custom arbitraries in `__tests__/generators/media-buyer-arbitraries.ts`
    - Create `campaignMetricsArbitrary` for generating random metrics
    - Create `commissionModelArbitrary` for generating commission models
    - Create `campaignDataArbitrary` for generating complete campaign data
    - _Requirements: All testing requirements_

- [x] 18. Implement All Property-Based Tests
  - [x] 18.1 Create property test file at `__tests__/property/media-buyer.test.ts`
    - Implement all 46 correctness properties from design document
    - Use 100 iterations minimum per property
    - Tag each test with property number and description
    - Group tests by component (score calculator, decision engine, profit simulator, etc.)
    - _Requirements: All requirements_

- [x] 19. Final Integration and Polish
  - [x] 19.1 Add Turkish locale formatting utilities if not already present
    - Ensure currency formatting matches ₺1.234,56 pattern
    - Ensure date formatting uses DD.MM.YYYY
    - _Requirements: 6.4_
  
  - [x] 19.2 Add audit logging for analysis requests
    - Log user ID, campaign ID, timestamp, and result status
    - _Requirements: 9.7_
  
  - [x] 19.3 Verify all error messages are in Turkish
    - Review all error messages in API, business logic, and UI
    - Ensure consistency with Turkish localization rules
    - _Requirements: 3.4, 5.8, 8.10, 11.1, 11.2, 11.5_

- [x] 20. Final Checkpoint - Complete testing and verification
  - Run all unit tests and property tests
  - Verify test coverage meets goals (>80% line, >75% branch, >85% function)
  - Test end-to-end flow manually
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (46 total)
- Unit tests validate specific examples and edge cases
- All user-facing content must be in Turkish
- The feature integrates with existing Groq API infrastructure
- Caching improves performance with 5-minute TTL
- Decision logic is objective and based on weighted performance scoring
