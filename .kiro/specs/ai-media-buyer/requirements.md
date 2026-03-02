# Requirements Document

## Introduction

AI Media Buyer is an intelligent campaign analysis and decision-making feature that consolidates campaign management and strategy card functionality into a unified AI-powered interface. The system analyzes Meta Ads campaigns using 30-day historical metrics, calculates performance scores, and provides actionable recommendations with Scale/Hold/Kill decisions.

## Glossary

- **AI_Media_Buyer**: The system component that analyzes campaigns and generates recommendations
- **Performance_Score**: A numerical value (0-100) representing overall campaign health
- **Scale_Decision**: A recommendation to increase campaign budget (score 70+, ROAS above target, frequency < 3)
- **Hold_Decision**: A recommendation to maintain current campaign settings (score 40-69, mixed signals)
- **Kill_Decision**: A recommendation to stop campaign (score < 40 OR frequency > 4.5 OR very low ROAS)
- **Severity_Level**: Classification of issue importance (critical, high, medium, low)
- **Impact_Level**: Expected effect magnitude of recommended action (high, medium, low)
- **Campaign_Metrics**: Performance data including CTR, CVR, ROAS, CPA, CPM, frequency
- **Groq_API**: External AI service using llama-3.3-70b-versatile model
- **Profit_Simulation**: Projected revenue and commission changes based on recommendations
- **Industry_Benchmark**: Sector-specific performance comparison data
- **Client_Justification**: Turkish-language explanation for Kill decisions to show clients

## Requirements

### Requirement 1: Campaign Selection Interface

**User Story:** As a digital marketing consultant, I want to select campaigns for AI analysis, so that I can get intelligent recommendations for specific campaigns.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL display a sidebar menu item labeled "AI Media Buyer" with a bot icon
2. WHEN the AI Media Buyer page loads, THE AI_Media_Buyer SHALL fetch and display all active campaigns for the authenticated user
3. THE AI_Media_Buyer SHALL allow selection of one campaign at a time for analysis
4. WHEN a campaign is selected, THE AI_Media_Buyer SHALL enable the analysis button
5. THE AI_Media_Buyer SHALL display campaign basic information (name, status, budget) in the selection interface

### Requirement 2: Performance Score Calculation

**User Story:** As a digital marketing consultant, I want campaigns scored objectively, so that I can quickly assess campaign health.

#### Acceptance Criteria

1. WHEN calculating Performance_Score, THE AI_Media_Buyer SHALL apply 40% weight to CTR and CVR metrics
2. WHEN calculating Performance_Score, THE AI_Media_Buyer SHALL apply 20% weight to frequency and fatigue indicators
3. WHEN calculating Performance_Score, THE AI_Media_Buyer SHALL apply 30% weight to ROAS and CPA metrics
4. WHEN calculating Performance_Score, THE AI_Media_Buyer SHALL apply 10% weight to CPM and audience metrics
5. THE AI_Media_Buyer SHALL produce a Performance_Score between 0 and 100 (inclusive)
6. THE AI_Media_Buyer SHALL use the most recent 30 days of Campaign_Metrics for score calculation

### Requirement 3: Scale/Hold/Kill Decision Logic

**User Story:** As a digital marketing consultant, I want clear Scale/Hold/Kill recommendations, so that I can make confident budget decisions.

#### Acceptance Criteria

1. WHEN Performance_Score is 70 or above AND ROAS exceeds target AND frequency is less than 3, THE AI_Media_Buyer SHALL recommend Scale_Decision
2. WHEN Performance_Score is between 40 and 69 (inclusive), THE AI_Media_Buyer SHALL recommend Hold_Decision
3. WHEN Performance_Score is below 40 OR frequency exceeds 4.5 OR ROAS is significantly below target, THE AI_Media_Buyer SHALL recommend Kill_Decision
4. THE AI_Media_Buyer SHALL provide a Turkish-language justification for each decision
5. WHERE a Kill_Decision is recommended, THE AI_Media_Buyer SHALL generate Client_Justification suitable for client presentation

### Requirement 4: Campaign Analysis Data Collection

**User Story:** As a digital marketing consultant, I want comprehensive campaign data analyzed, so that recommendations are based on complete information.

#### Acceptance Criteria

1. WHEN analysis is triggered, THE AI_Media_Buyer SHALL fetch campaign-level data from the database
2. WHEN analysis is triggered, THE AI_Media_Buyer SHALL fetch all associated ad set data
3. WHEN analysis is triggered, THE AI_Media_Buyer SHALL fetch all associated ad creative data
4. WHEN analysis is triggered, THE AI_Media_Buyer SHALL fetch Campaign_Metrics for the last 30 days
5. THE AI_Media_Buyer SHALL aggregate metrics across all ad sets and ads within the campaign
6. IF metric data is incomplete or missing, THEN THE AI_Media_Buyer SHALL return an error message indicating insufficient data

### Requirement 5: AI-Powered Analysis Generation

**User Story:** As a digital marketing consultant, I want AI-generated insights, so that I can understand campaign performance deeply.

#### Acceptance Criteria

1. WHEN generating analysis, THE AI_Media_Buyer SHALL send campaign data to Groq_API using llama-3.3-70b-versatile model
2. THE AI_Media_Buyer SHALL request analysis in Turkish language
3. THE AI_Media_Buyer SHALL include campaign summary and KPI overview in the analysis
4. THE AI_Media_Buyer SHALL identify issues with assigned Severity_Level (critical, high, medium, low)
5. THE AI_Media_Buyer SHALL generate recommended actions with assigned Impact_Level (high, medium, low)
6. THE AI_Media_Buyer SHALL suggest next test opportunities based on current performance
7. IF Groq_API request fails, THEN THE AI_Media_Buyer SHALL retry up to 3 times with exponential backoff
8. IF all retry attempts fail, THEN THE AI_Media_Buyer SHALL return a user-friendly error message in Turkish

### Requirement 6: Profit Simulation

**User Story:** As a digital marketing consultant, I want to see projected profit impact, so that I can justify recommendations to clients.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL calculate current profit based on ROAS and commission model
2. THE AI_Media_Buyer SHALL project profit after implementing recommendations
3. THE AI_Media_Buyer SHALL display before/after comparison with percentage change
4. THE AI_Media_Buyer SHALL format currency values in Turkish Lira (₺) with Turkish locale formatting
5. WHERE commission model is percentage-based, THE AI_Media_Buyer SHALL calculate commission from projected revenue
6. WHERE commission model is fixed-fee, THE AI_Media_Buyer SHALL maintain fixed commission in projections

### Requirement 7: Industry Benchmark Comparison

**User Story:** As a digital marketing consultant, I want to compare campaigns against industry standards, so that I can set realistic expectations.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL retrieve Industry_Benchmark data for the client's sector
2. THE AI_Media_Buyer SHALL compare campaign CTR against industry average
3. THE AI_Media_Buyer SHALL compare campaign CVR against industry average
4. THE AI_Media_Buyer SHALL compare campaign ROAS against industry average
5. THE AI_Media_Buyer SHALL display comparison results with visual indicators (above/below/at benchmark)
6. IF Industry_Benchmark data is unavailable for the sector, THEN THE AI_Media_Buyer SHALL display a message indicating no benchmark available

### Requirement 8: Analysis Results Display

**User Story:** As a digital marketing consultant, I want analysis results clearly presented, so that I can quickly understand and act on recommendations.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL display Performance_Score prominently with visual indicator (color-coded by range)
2. THE AI_Media_Buyer SHALL display Scale/Hold/Kill decision with justification
3. THE AI_Media_Buyer SHALL display campaign summary and KPI metrics
4. THE AI_Media_Buyer SHALL list identified issues sorted by Severity_Level (critical first)
5. THE AI_Media_Buyer SHALL list recommended actions sorted by Impact_Level (high first)
6. THE AI_Media_Buyer SHALL display next test suggestions
7. THE AI_Media_Buyer SHALL display Profit_Simulation with before/after comparison
8. THE AI_Media_Buyer SHALL display Industry_Benchmark comparison
9. WHERE Kill_Decision is recommended, THE AI_Media_Buyer SHALL display Client_Justification in a copyable format
10. THE AI_Media_Buyer SHALL display all text content in Turkish

### Requirement 9: API Endpoint Implementation

**User Story:** As a developer, I want a dedicated API endpoint for media buyer analysis, so that the frontend can request analysis asynchronously.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL expose a POST endpoint at /api/ai/media-buyer
2. WHEN the endpoint receives a request, THE AI_Media_Buyer SHALL validate the campaign ID parameter
3. WHEN the endpoint receives a request, THE AI_Media_Buyer SHALL verify the authenticated user owns the campaign
4. IF the user does not own the campaign, THEN THE AI_Media_Buyer SHALL return a 403 Forbidden error
5. THE AI_Media_Buyer SHALL return analysis results in JSON format
6. THE AI_Media_Buyer SHALL return appropriate HTTP status codes (200 for success, 400 for bad request, 500 for server error)
7. THE AI_Media_Buyer SHALL log all analysis requests for audit purposes

### Requirement 10: Configuration Integration

**User Story:** As a developer, I want media buyer configuration integrated with existing AI config, so that the system is maintainable and consistent.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL add media_buyer feature configuration to lib/ai/config.ts
2. THE AI_Media_Buyer SHALL define prompt templates for campaign analysis
3. THE AI_Media_Buyer SHALL define retry configuration for Groq_API calls
4. THE AI_Media_Buyer SHALL define timeout values for API requests
5. THE AI_Media_Buyer SHALL use consistent configuration patterns with existing AI features

### Requirement 11: Error Handling and User Feedback

**User Story:** As a digital marketing consultant, I want clear error messages, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN analysis fails due to insufficient data, THE AI_Media_Buyer SHALL display a Turkish message explaining which data is missing
2. WHEN analysis fails due to API error, THE AI_Media_Buyer SHALL display a Turkish message suggesting retry
3. WHEN analysis is in progress, THE AI_Media_Buyer SHALL display a loading indicator with progress message
4. THE AI_Media_Buyer SHALL display success confirmation when analysis completes
5. IF network error occurs, THEN THE AI_Media_Buyer SHALL display a Turkish message indicating connection issue

### Requirement 12: Performance and Caching

**User Story:** As a digital marketing consultant, I want fast analysis results, so that I can work efficiently.

#### Acceptance Criteria

1. THE AI_Media_Buyer SHALL cache analysis results for 5 minutes per campaign
2. WHEN cached results exist and are fresh, THE AI_Media_Buyer SHALL return cached results without calling Groq_API
3. THE AI_Media_Buyer SHALL invalidate cache when campaign metrics are updated
4. THE AI_Media_Buyer SHALL complete analysis within 10 seconds for campaigns with standard data volume
5. THE AI_Media_Buyer SHALL use database indexes on campaign_id and date fields for efficient metric queries
