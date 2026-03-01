# Requirements Document

## Introduction

The Target Audience & Offer Generator (Sektörel Hedef Kitle ve Teklif Jeneratörü) is an AI-driven strategic analysis feature that transforms GrowthPilot AI into a comprehensive Marketing Strategy Engine. Users input their industry/sector and receive a detailed strategic report based on Alex Hormozi's "Grand Slam Offer" methodology, including customer segmentation, desire/barrier analysis, and irresistible offer recommendations.

## Glossary

- **System**: The Target Audience & Offer Generator feature
- **User**: Authenticated marketing consultant or business owner using GrowthPilot AI
- **Industry_Input**: Text string representing the business sector (e.g., "Güzellik Merkezi", "Gayrimenkul")
- **Strategic_Analysis**: Complete JSON-formatted report containing customer segments and offers
- **Customer_Segment**: One of three categories: Mükemmel Müşteri (Perfect), Mecburi Müşteri (Necessary), or Gereksiz Müşteri (Unnecessary)
- **Importance_Score**: Numeric value between 1 and 10 indicating priority or significance
- **Gemini_API**: Google Gemini AI service used for content generation
- **Analysis_Record**: Database entry storing generated strategic analysis
- **Hormozi_Framework**: Alex Hormozi's Grand Slam Offer methodology for creating irresistible offers
- **Desire_Barrier_Analysis**: Structured evaluation of internal/external desires and barriers
- **Database**: Supabase PostgreSQL database with RLS policies

## Requirements

### Requirement 1: Industry Input Collection

**User Story:** As a marketing consultant, I want to input my client's industry sector, so that I can receive tailored strategic analysis.

#### Acceptance Criteria

1. THE System SHALL provide a text input field labeled "Sektör/Endüstri" for Industry_Input
2. THE System SHALL provide an "Analiz Et" button to trigger analysis generation
3. WHEN Industry_Input is empty AND User clicks "Analiz Et", THE System SHALL display validation message "Bu alan zorunludur"
4. THE System SHALL accept Industry_Input in any language
5. THE System SHALL trim whitespace from Industry_Input before processing

### Requirement 2: AI-Powered Strategic Analysis Generation

**User Story:** As a user, I want the system to generate comprehensive strategic analysis using AI, so that I receive expert-level insights based on proven methodologies.

#### Acceptance Criteria

1. WHEN User clicks "Analiz Et" with valid Industry_Input, THE System SHALL send request to Gemini_API
2. THE System SHALL include "Alex Hormozi'nin Grand Slam Offer (Reddedilemez Teklif) formülünü kullan" in the Gemini_API prompt
3. THE System SHALL request Turkish language output explicitly in the Gemini_API prompt
4. THE System SHALL request formal business Turkish ("siz" form) in the Gemini_API prompt
5. THE System SHALL request JSON-formatted response from Gemini_API
6. THE Strategic_Analysis SHALL include exactly three Customer_Segment categories
7. THE Strategic_Analysis SHALL include irresistible offers section based on Hormozi_Framework

### Requirement 3: Perfect Customer Segment Structure

**User Story:** As a strategist, I want detailed analysis of perfect customers (low effort, high profit), so that I can focus on the most valuable prospects.

#### Acceptance Criteria

1. THE System SHALL generate "Mükemmel Müşteri" segment with profile description
2. THE System SHALL generate minimum 3 internal desires (İçsel Arzular) with Importance_Score for Mükemmel Müşteri
3. THE System SHALL generate minimum 3 external desires (Dışsal Arzular) with Importance_Score for Mükemmel Müşteri
4. THE System SHALL generate minimum 3 internal barriers (İçsel Engeller) with Importance_Score for Mükemmel Müşteri
5. THE System SHALL generate minimum 3 external barriers (Dışsal Engeller) with Importance_Score for Mükemmel Müşteri
6. THE System SHALL generate minimum 3 needs (İhtiyaçlar) with Importance_Score for Mükemmel Müşteri
7. FOR ALL Importance_Score values, THE System SHALL ensure values are integers between 1 and 10 inclusive

### Requirement 4: Necessary Customer Segment Structure

**User Story:** As a business owner, I want to understand necessary customers (high effort, high profit), so that I can decide if they're worth pursuing.

#### Acceptance Criteria

1. THE System SHALL generate "Mecburi Müşteri" segment with profile description
2. THE System SHALL generate minimum 3 internal desires with Importance_Score for Mecburi Müşteri
3. THE System SHALL generate minimum 3 external desires with Importance_Score for Mecburi Müşteri
4. THE System SHALL generate minimum 3 internal barriers with Importance_Score for Mecburi Müşteri
5. THE System SHALL generate minimum 3 external barriers with Importance_Score for Mecburi Müşteri
6. THE System SHALL generate minimum 3 needs with Importance_Score for Mecburi Müşteri
7. FOR ALL Importance_Score values, THE System SHALL ensure values are integers between 1 and 10 inclusive

### Requirement 5: Unnecessary Customer Identification

**User Story:** As a consultant, I want to identify unprofitable customer types (high effort, low profit), so that I can avoid wasting resources.

#### Acceptance Criteria

1. THE System SHALL generate "Gereksiz Müşteri" segment with profile description
2. THE System SHALL describe characteristics that make these customers unprofitable
3. THE System SHALL explain why these customers waste time and money

### Requirement 6: Irresistible Offer Generation

**User Story:** As a strategist, I want AI-generated offers based on Alex Hormozi's methodology, so that I can create compelling value propositions.

#### Acceptance Criteria

1. THE System SHALL generate specific offer for Mükemmel Müşteri segment
2. THE System SHALL generate specific offer for Mecburi Müşteri segment
3. THE System SHALL generate filtering or low-effort offer for Gereksiz Müşteri segment
4. THE System SHALL base all offers on Hormozi_Framework principles
5. THE System SHALL generate offers in Turkish language

### Requirement 7: Analysis Display Interface

**User Story:** As a user, I want to see analysis results in an organized, visually appealing format, so that I can quickly understand the insights.

#### Acceptance Criteria

1. WHEN Strategic_Analysis is received, THE System SHALL display results in organized layout
2. THE System SHALL display each Customer_Segment in separate visual section
3. THE System SHALL render Importance_Score values as visual progress bars
4. THE System SHALL use color coding to differentiate Customer_Segment types
5. THE System SHALL display all text content in Turkish
6. THE System SHALL provide clear visual hierarchy for profile, desires, barriers, needs, and offers

### Requirement 8: Performance and User Experience

**User Story:** As a user, I want fast analysis generation with clear feedback, so that I have a smooth experience.

#### Acceptance Criteria

1. WHEN User clicks "Analiz Et", THE System SHALL display loading indicator
2. WHILE analysis is generating, THE System SHALL show progress feedback to User
3. THE System SHALL complete analysis generation within 10 seconds under normal conditions
4. WHEN analysis generation exceeds 10 seconds, THE System SHALL continue showing loading state
5. THE System SHALL disable "Analiz Et" button while analysis is in progress

### Requirement 9: Analysis Persistence

**User Story:** As a consultant, I want to save and reference past analyses, so that I can track my strategic thinking over time.

#### Acceptance Criteria

1. WHEN Strategic_Analysis is successfully generated, THE System SHALL store Analysis_Record in Database
2. THE Analysis_Record SHALL include user_id for access control
3. THE Analysis_Record SHALL include Industry_Input value
4. THE Analysis_Record SHALL include complete Strategic_Analysis JSON
5. THE Analysis_Record SHALL include created_at timestamp
6. THE System SHALL enforce RLS policies on Analysis_Record table
7. THE System SHALL allow User to access only their own Analysis_Record entries

### Requirement 10: Error Handling and Recovery

**User Story:** As a user, I want clear error messages in Turkish when something goes wrong, so that I understand what happened and what to do next.

#### Acceptance Criteria

1. WHEN Gemini_API request fails, THE System SHALL display error message "Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
2. WHEN Gemini_API returns invalid JSON, THE System SHALL log technical error and display user-friendly message
3. WHEN Database storage fails, THE System SHALL display error message "Analiz kaydedilemedi. Lütfen tekrar deneyin."
4. WHEN network timeout occurs, THE System SHALL display error message "Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin."
5. FOR ALL error conditions, THE System SHALL remove loading indicator
6. FOR ALL error conditions, THE System SHALL re-enable "Analiz Et" button

### Requirement 11: API Endpoint Implementation

**User Story:** As a developer, I want a well-defined API endpoint for analysis generation, so that the frontend can reliably request analyses.

#### Acceptance Criteria

1. THE System SHALL provide POST endpoint at /api/ai/target-audience
2. WHEN request is received, THE System SHALL validate User authentication
3. WHEN User is not authenticated, THE System SHALL return 401 status code
4. THE System SHALL accept request body with "industry" string field
5. WHEN "industry" field is missing or empty, THE System SHALL return 400 status code with validation error
6. WHEN analysis succeeds, THE System SHALL return 200 status code with Strategic_Analysis JSON
7. WHEN analysis fails, THE System SHALL return 500 status code with error message

### Requirement 12: JSON Response Structure Validation

**User Story:** As a frontend developer, I want consistent JSON structure from the API, so that I can reliably parse and display results.

#### Acceptance Criteria

1. THE Strategic_Analysis JSON SHALL include "mukemmelMusteri" object
2. THE Strategic_Analysis JSON SHALL include "mecburiMusteri" object
3. THE Strategic_Analysis JSON SHALL include "gereksizMusteri" object
4. THE Strategic_Analysis JSON SHALL include "reddedilemezTeklifler" object
5. THE "mukemmelMusteri" object SHALL include "profil", "icselArzular", "dissalArzular", "icselEngeller", "dissalEngeller", and "ihtiyaclar" fields
6. THE "mecburiMusteri" object SHALL include "profil", "icselArzular", "dissalArzular", "icselEngeller", "dissalEngeller", and "ihtiyaclar" fields
7. THE "gereksizMusteri" object SHALL include "profil" field
8. THE "reddedilemezTeklifler" object SHALL include "mukemmelMusteriTeklif", "mecburiMusteriTeklif", and "gereksizMusteriTeklif" fields
9. FOR ALL desire, barrier, and need arrays, THE System SHALL ensure each item includes "text" and "score" fields

### Requirement 13: Analysis History Access

**User Story:** As a user, I want to view my previously generated analyses, so that I can reference past strategic work.

#### Acceptance Criteria

1. THE System SHALL provide interface to list User's past Analysis_Record entries
2. THE System SHALL display analyses sorted by created_at timestamp in descending order
3. THE System SHALL display Industry_Input and created_at for each Analysis_Record
4. WHEN User selects an Analysis_Record, THE System SHALL display full Strategic_Analysis
5. THE System SHALL implement pagination for analysis history when count exceeds 50 records

### Requirement 14: Gemini API Integration Requirements

**User Story:** As a system administrator, I want reliable Gemini API integration with proper error handling, so that the feature works consistently.

#### Acceptance Criteria

1. THE System SHALL use existing Gemini_API client from lib/gemini/client.ts
2. THE System SHALL add target audience prompt template to lib/gemini/prompts.ts
3. THE System SHALL implement retry logic with exponential backoff for Gemini_API failures
4. THE System SHALL retry failed requests maximum 3 times
5. WHEN all retries fail, THE System SHALL return error to User
6. THE System SHALL log all Gemini_API requests and responses for debugging
7. THE System SHALL validate Gemini_API response structure before returning to frontend

### Requirement 15: Database Schema Requirements

**User Story:** As a database administrator, I want proper schema design with security policies, so that data is stored safely and efficiently.

#### Acceptance Criteria

1. THE System SHALL create "target_audience_analyses" table in Database
2. THE table SHALL include "id" column as UUID primary key
3. THE table SHALL include "user_id" column as UUID foreign key referencing auth.users
4. THE table SHALL include "industry" column as TEXT
5. THE table SHALL include "analysis_data" column as JSONB
6. THE table SHALL include "created_at" column as TIMESTAMP WITH TIME ZONE
7. THE table SHALL include RLS policy restricting access to User's own records
8. THE table SHALL include index on user_id column for query performance
9. THE table SHALL include index on created_at column for sorting performance

### Requirement 16: Importance Score Visualization

**User Story:** As a user, I want to see importance scores visualized clearly, so that I can quickly identify the most critical factors.

#### Acceptance Criteria

1. THE System SHALL render each Importance_Score as horizontal progress bar
2. THE progress bar SHALL fill proportionally to score value (10% per point)
3. THE System SHALL display numeric score value next to progress bar
4. THE System SHALL use color gradient for progress bars (low scores = red, high scores = green)
5. THE System SHALL display score label in Turkish (e.g., "Önem Skoru: 8/10")

### Requirement 17: Turkish Localization Compliance

**User Story:** As a Turkish user, I want all interface elements in Turkish, so that I can use the feature comfortably.

#### Acceptance Criteria

1. THE System SHALL display all UI labels in Turkish
2. THE System SHALL display all button text in Turkish
3. THE System SHALL display all error messages in Turkish
4. THE System SHALL display all validation messages in Turkish
5. THE System SHALL use formal business Turkish ("siz" form) in all text
6. THE System SHALL use consistent terminology from existing GrowthPilot AI application

### Requirement 18: Navigation and Integration

**User Story:** As a user, I want to access the target audience generator from the dashboard, so that I can easily find and use it.

#### Acceptance Criteria

1. THE System SHALL add navigation link in dashboard menu
2. THE navigation link SHALL be labeled "Hedef Kitle Analizi" or similar Turkish term
3. THE System SHALL create dedicated page at /dashboard/target-audience
4. THE System SHALL apply existing authentication middleware to the page
5. THE System SHALL use consistent styling with existing dashboard pages

### Requirement 19: Prompt Engineering for Quality Output

**User Story:** As a product owner, I want high-quality AI-generated content, so that users receive valuable strategic insights.

#### Acceptance Criteria

1. THE Gemini_API prompt SHALL explicitly request Alex Hormozi's Grand Slam Offer framework
2. THE Gemini_API prompt SHALL request specific JSON structure with all required fields
3. THE Gemini_API prompt SHALL request importance scores between 1-10 for all scored items
4. THE Gemini_API prompt SHALL request minimum 3 items for each desire, barrier, and need category
5. THE Gemini_API prompt SHALL request Turkish business language output
6. THE Gemini_API prompt SHALL provide Industry_Input as context
7. THE Gemini_API prompt SHALL request actionable, specific content rather than generic advice

### Requirement 20: Response Parsing and Validation

**User Story:** As a developer, I want robust parsing of AI responses, so that the system handles unexpected formats gracefully.

#### Acceptance Criteria

1. WHEN Gemini_API returns response, THE System SHALL attempt to parse as JSON
2. WHEN JSON parsing fails, THE System SHALL attempt to extract JSON from markdown code blocks
3. WHEN no valid JSON is found, THE System SHALL return error to User
4. WHEN JSON is valid but missing required fields, THE System SHALL return error to User
5. WHEN Importance_Score values are outside 1-10 range, THE System SHALL clamp to valid range
6. WHEN Importance_Score values are non-numeric, THE System SHALL default to 5
7. THE System SHALL validate all required Customer_Segment fields are present before returning response

