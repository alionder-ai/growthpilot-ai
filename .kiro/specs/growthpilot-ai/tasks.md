# Implementation Plan: GrowthPilot AI

## Overview

GrowthPilot AI, dijital pazarlama danışmanlarının müşteri portföylerini ve Meta Ads kampanyalarını yönetmelerini sağlayan yapay zeka destekli bir B2B SaaS platformudur. Bu implementation plan, Next.js 14, Supabase, Meta Ads API ve Google Gemini API kullanarak sistemi adım adım inşa eder.

## Tasks

- [x] 1. Proje kurulumu ve temel yapılandırma
  - Next.js 14 projesi oluştur (App Router ile)
  - TypeScript, TailwindCSS, Shadcn/UI kur
  - Supabase client yapılandırması
  - Environment variables tanımla
  - _Requirements: 13.5, 13.6_

- [x] 2. Veritabanı şeması ve RLS politikaları
  - [x] 2.1 Core tabloları oluştur (Users, Clients, Commission_Models)
    - SQL migration dosyaları yaz
    - Foreign key constraints tanımla
    - Indexes oluştur
    - _Requirements: 12.1, 12.2, 12.3, 12.12, 12.13_
  
  - [x] 2.2 Kampanya tabloları oluştur (Campaigns, Ad_Sets, Ads, Meta_Metrics)
    - SQL migration dosyaları yaz
    - Cascade delete yapılandırması
    - Date ve client_id indexleri
    - _Requirements: 12.4, 12.5, 12.6, 12.7, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 2.3 AI ve destek tabloları oluştur (Leads, AI_Recommendations, Creative_Library, Reports, Notifications, Meta_Tokens)
    - SQL migration dosyaları yaz
    - JSONB alanları için yapılandırma
    - Check constraints tanımla
    - _Requirements: 12.8, 12.9, 12.10, 12.11_
  
  - [x] 2.4 RLS politikalarını tüm tablolara uygula
    - Her tablo için user_id bazlı RLS policy
    - Policy test senaryoları yaz
    - _Requirements: 1.4, 12.13, 15.3_
  
  - [ ] 2.5 Veritabanı şeması için property test yaz
    - **Property 11: Database Schema Completeness**
    - **Validates: Requirements 5.1-5.4, 12.1-12.11**

- [x] 3. Authentication sistemi
  - [x] 3.1 Supabase Auth entegrasyonu
    - Email/password authentication
    - Google OAuth yapılandırması
    - Session management
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 3.2 Login ve Logout UI componentleri
    - LoginForm component (email/password)
    - GoogleAuthButton component
    - Logout fonksiyonalitesi
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [x] 3.3 Protected route middleware
    - Authentication check
    - Redirect logic
    - Session validation
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.4 Error handling ve validation
    - Descriptive error messages
    - Password strength validation
    - Rate limiting için hazırlık
    - _Requirements: 1.6, 15.4_
  
  - [x] 3.5 Authentication için property testler yaz
    - **Property 1: Authentication Session Round Trip**
    - **Property 3: Authentication Error Handling**
    - **Validates: Requirements 1.1-1.6**

- [x] 4. Dashboard layout ve navigation
  - [x] 4.1 DashboardLayout component
    - Sidebar navigation
    - Header with user profile
    - Responsive design (min 1024px)
    - _Requirements: 13.1, 13.2, 13.4_
  
  - [x] 4.2 Navigation links ve routing
    - Overview, Clients, Campaigns, Action Plan, Strategy Cards, Reports, Creative Generator, Leads sayfaları
    - Active state styling
    - _Requirements: 13.1_
  
  - [x] 4.3 Turkish locale yapılandırması
    - Tüm UI metinleri Türkçe
    - Currency formatting (TRY)
    - Date formatting (DD.MM.YYYY)
    - _Requirements: 19.1, 19.2, 19.3, 19.4_

- [x] 5. Client management modülü
  - [x] 5.1 Client CRUD API routes
    - GET /api/clients - List clients
    - POST /api/clients - Create client
    - PUT /api/clients/:id - Update client
    - DELETE /api/clients/:id - Delete client
    - _Requirements: 2.1, 2.2, 2.3, 2.6_
  
  - [x] 5.2 ClientList component
    - Paginated table
    - Search/filter functionality
    - _Requirements: 2.5_
  
  - [x] 5.3 ClientForm component
    - Create/edit modal
    - Form validation
    - Industry selection
    - _Requirements: 2.1, 2.2_
  
  - [x] 5.4 Client deletion ve cascade logic
    - Confirmation dialog
    - Archive associated campaigns
    - _Requirements: 2.3, 2.4_
  
  - [x] 5.5 Client management için property testler
    - **Property 4: Client CRUD Operations Persistence**
    - **Property 5: Client List Completeness**
    - **Validates: Requirements 2.1-2.6**

- [x] 6. Commission model yönetimi
  - [x] 6.1 Commission model API routes
    - POST /api/commission-models - Create model
    - PUT /api/commission-models/:id - Update model
    - GET /api/commission-models/:clientId - Get by client
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.2 Commission calculation fonksiyonu
    - Sales revenue basis
    - Total revenue basis
    - Percentage validation (0-100)
    - _Requirements: 3.1, 3.2, 3.3, 3.5_
  
  - [x] 6.3 CommissionForm component
    - Percentage input
    - Calculation basis selector
    - Validation messages
    - _Requirements: 3.1, 3.5_
  
  - [x] 6.4 Commission için property testler
    - **Property 6: Commission Percentage Validation**
    - **Property 7: Commission Calculation Accuracy**
    - **Validates: Requirements 3.1-3.5**

- [x] 7. Checkpoint - Temel yapı tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Meta Ads API entegrasyonu
  - [x] 8.1 Meta OAuth flow
    - POST /api/meta/connect - Initiate OAuth
    - GET /api/meta/callback - Handle callback
    - Token encryption (AES-256)
    - _Requirements: 4.1, 4.2, 15.1_
  
  - [x] 8.2 Meta API client utility
    - getCampaigns() method
    - getAdSets() method
    - getAds() method
    - getAdInsights() method
    - _Requirements: 4.3, 4.4_
  
  - [x] 8.3 Metrics mapping ve storage
    - Parse Meta API response
    - Calculate derived metrics (ROAS, CTR, CPC, CPM, CPA)
    - Store in Meta_Metrics table
    - _Requirements: 4.4, 4.7, 5.4_
  
  - [x] 8.4 Error handling ve retry logic
    - Exponential backoff (1s, 2s, 4s)
    - Rate limit handling
    - User notification on failure
    - _Requirements: 4.6, 14.1, 14.4, 14.5_
  
  - [x] 8.5 Meta API için property testler
    - **Property 8: Meta API Token Encryption**
    - **Property 9: Meta Metrics Import Completeness**
    - **Property 10: Meta API Authentication Failure Notification**
    - **Validates: Requirements 4.1-4.7, 15.1**

- [x] 9. Daily sync cron job
  - [x] 9.1 Sync API route
    - POST /api/meta/sync
    - Fetch all active clients
    - Loop through campaigns
    - Update metrics
    - _Requirements: 4.5, 17.1_
  
  - [x] 9.2 Vercel cron yapılandırması
    - vercel.json cron config
    - Daily trigger at 00:00 UTC
    - _Requirements: 4.5_
  
  - [x] 9.3 Manual sync trigger
    - POST /api/campaigns/sync
    - Update last_synced_at timestamp
    - Display sync status
    - _Requirements: 17.2, 17.3, 17.4_
  
  - [x] 9.4 Sync için property testler
    - **Property 40: Manual Sync Trigger**
    - **Property 41: Sync Timestamp Update**
    - **Property 42: Sync Status Display**
    - **Validates: Requirements 17.2-17.5**

- [x] 10. Dashboard overview ve metrics
  - [x] 10.1 OverviewCards component
    - Total clients card
    - Total spend this month card
    - Total revenue this month card
    - Active campaigns card
    - _Requirements: 13.3, 6.1, 6.2, 6.4_
  
  - [x] 10.2 Financial metrics API
    - GET /api/metrics/overview
    - Aggregate spend by period
    - Calculate revenue with commission models
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 10.3 SpendingChart ve RevenueChart components
    - Line charts (Recharts library)
    - Last 30 days data
    - _Requirements: 6.5, 6.6_
  
  - [x] 10.4 Client filtering
    - Client selector dropdown
    - Filter all metrics by selected client
    - _Requirements: 6.7_
  
  - [x] 10.5 Dashboard metrics için property testler
    - **Property 13: Financial Metrics Calculation Accuracy**
    - **Property 14: Dashboard Client Filtering**
    - **Validates: Requirements 6.1-6.7**

- [x] 11. Campaign görüntüleme
  - [x] 11.1 Campaign list API
    - GET /api/campaigns
    - Optional client filter
    - Pagination (50 records per page)
    - _Requirements: 16.2_
  
  - [x] 11.2 CampaignList component
    - Hierarchical view (Campaign > Ad Set > Ad)
    - Expandable rows
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 11.3 MetricsTable component
    - Display spend, ROAS, CTR, CPC, CPM, CPA, frequency, add_to_cart, purchases
    - Sortable columns
    - _Requirements: 4.4, 5.4_
  
  - [x] 11.4 Pagination için property test
    - **Property 37: Pagination for Large Lists**
    - **Validates: Requirements 16.2**

- [x] 12. Checkpoint - Data flow tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Google Gemini API entegrasyonu
  - [x] 13.1 Gemini API client utility
    - Initialize Gemini client
    - generateContent() wrapper
    - Token limit enforcement
    - _Requirements: 18.4, 18.5, 18.6_
  
  - [x] 13.2 Prompt template fonksiyonları
    - buildActionPlanPrompt()
    - buildStrategyCardPrompt()
    - buildCreativePrompt()
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [x] 13.3 Error handling ve retry logic
    - Exponential backoff
    - Fallback to cached recommendations
    - _Requirements: 14.2, 14.3_
  
  - [x] 13.4 Gemini API için property testler
    - **Property 31: API Retry Logic with Exponential Backoff**
    - **Property 43: AI Response Token Limits**
    - **Validates: Requirements 14.2, 18.4-18.6**

- [x] 14. AI Action Plan modülü
  - [x] 14.1 Action plan generation API
    - POST /api/ai/action-plan
    - Fetch recent metrics
    - Build prompt with context
    - Parse Gemini response
    - _Requirements: 7.1, 7.2, 7.6_
  
  - [x] 14.2 Action plan storage
    - Store in AI_Recommendations table
    - recommendation_type = 'action_plan'
    - _Requirements: 7.4_
  
  - [x] 14.3 ActionPlanCard component
    - Display top 3 actions
    - Priority badges (high/medium/low)
    - Checkbox to mark complete
    - _Requirements: 7.3, 7.5_
  
  - [x] 14.4 Action status update API
    - PUT /api/ai/recommendations/:id
    - Update status to 'completed'
    - _Requirements: 7.5_
  
  - [x] 14.5 Daily cron job for action plan
    - Vercel cron at 01:00 UTC
    - Generate for all active clients
    - _Requirements: 7.1_
  
  - [x] 14.6 Action plan için property testler
    - **Property 15: AI Action Plan Structure**
    - **Property 16: AI Action Plan Persistence and Status Updates**
    - **Property 17: AI Prompt Context Completeness**
    - **Validates: Requirements 7.1-7.6**

- [x] 15. Strategy Cards modülü
  - [x] 15.1 Strategy card generation logic
    - Metric threshold checks (frequency > 4, ROAS < 2, CPC increase > 20%, add_to_cart vs purchases)
    - POST /api/ai/strategy-cards
    - _Requirements: 8.1, 8.2, 8.3, 8.4_
  
  - [x] 15.2 Strategy card storage
    - Store in AI_Recommendations table
    - recommendation_type = 'strategy_card'
    - Include campaign_id, do_actions, dont_actions
    - _Requirements: 8.7_
  
  - [x] 15.3 StrategyCard component
    - Green "Do" actions
    - Red "Don't" actions
    - Dismiss button
    - _Requirements: 8.5, 8.6_
  
  - [x] 15.4 Dismiss functionality
    - Update status to 'dismissed'
    - _Requirements: 8.6_
  
  - [x] 15.5 Strategy cards için property testler
    - **Property 18: Metric-Based Strategy Card Generation**
    - **Property 19: Strategy Card Display and Interaction**
    - **Property 20: Strategy Card Schema Completeness**
    - **Validates: Requirements 8.1-8.7**

- [x] 16. Report generation modülü
  - [x] 16.1 Report generation API
    - POST /api/reports/generate
    - Accept period (weekly/monthly) and metrics selection
    - Aggregate data for period
    - _Requirements: 9.1, 9.2, 9.6_
  
  - [x] 16.2 WhatsApp format generator
    - Plain text formatting
    - Turkish locale
    - _Requirements: 9.3, 19.2, 19.3_
  
  - [x] 16.3 PDF format generator
    - Use library (e.g., jsPDF or Puppeteer)
    - Include charts and tables
    - _Requirements: 9.4_
  
  - [x] 16.4 Report storage ve download
    - Store in Reports table with file_url
    - GET /api/reports/:id/download
    - _Requirements: 9.7_
  
  - [x] 16.5 ReportGenerator component
    - Period selector
    - Metrics checkboxes
    - Format selector (WhatsApp/PDF)
    - Generate button
    - _Requirements: 9.1, 9.6_
  
  - [x] 16.6 Async processing
    - Process report generation asynchronously
    - Display loading state
    - Complete within 5 seconds
    - _Requirements: 9.5, 16.5_
  
  - [x] 16.7 Report generation için property testler
    - **Property 21: Report Generation Completeness**
    - **Property 22: Report Customization**
    - **Property 23: Report Persistence**
    - **Property 39: Asynchronous Report Processing**
    - **Validates: Requirements 9.1-9.7, 16.5**

- [x] 17. Checkpoint - AI features tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 18. Creative Generator modülü
  - [x] 18.1 Creative generation API
    - POST /api/ai/creative
    - Accept industry, content_type, target_audience, objective, tone
    - Build Gemini prompt
    - _Requirements: 10.1, 10.2_
  
  - [x] 18.2 Industry-specific prompts
    - Support: logistics, e-commerce, beauty, real estate, healthcare, education
    - Generate 3 variations
    - _Requirements: 10.1, 10.3_
  
  - [x] 18.3 Content type handling
    - Ad copy generation
    - Video script with scene descriptions
    - Voiceover with tone and pacing notes
    - _Requirements: 10.3, 10.4, 10.5_
  
  - [x] 18.4 Creative library storage
    - POST /api/creative-library
    - Save generated content
    - _Requirements: 10.7_
  
  - [x] 18.5 CreativeGenerator component
    - IndustrySelector dropdown
    - ContentTypeSelector radio buttons
    - GeneratedContentEditor textarea
    - Save to library button
    - _Requirements: 10.2, 10.6, 10.7_
  
  - [x] 18.6 Creative generator için property testler
    - **Property 24: Creative Generator Industry Support**
    - **Property 25: Creative Content Generation Structure**
    - **Property 26: Creative Content Persistence**
    - **Validates: Requirements 10.1-10.7**

- [x] 19. Lead management modülü
  - [x] 19.1 Lead CRUD API
    - GET /api/leads - List leads
    - PUT /api/leads/:id/status - Update conversion status
    - _Requirements: 11.1, 11.2_
  
  - [x] 19.2 Lead conversion rate calculation
    - Calculate per ad
    - Calculate per campaign
    - _Requirements: 11.4, 11.6_
  
  - [x] 19.3 LeadList component
    - Table with toggle buttons
    - Converted/Not Converted status
    - _Requirements: 11.1_
  
  - [x] 19.4 LeadQualityMetrics component
    - Display conversion rate per campaign
    - Display conversion rate per ad
    - _Requirements: 11.6_
  
  - [x] 19.5 Lead quality in AI context
    - Include lead quality feedback in AI prompts
    - _Requirements: 11.5_
  
  - [x] 19.6 Lead management için property testler
    - **Property 27: Lead Status Update and Persistence**
    - **Property 28: Lead Foreign Key Relationship**
    - **Property 29: Lead Conversion Rate Calculation**
    - **Property 30: Lead Quality in AI Context**
    - **Validates: Requirements 11.1-11.6**

- [x] 20. Notification sistemi
  - [x] 20.1 Notification creation logic
    - ROAS < 1.5 trigger
    - Daily spend > 120% of budget trigger
    - Meta API sync failure trigger
    - _Requirements: 20.1, 20.2, 20.3_
  
  - [x] 20.2 Notification API
    - GET /api/notifications - Get user notifications
    - PUT /api/notifications/:id/read - Mark as read
    - _Requirements: 20.4, 20.5_
  
  - [x] 20.3 NotificationCenter component
    - Dropdown in header
    - Unread count badge
    - Click to mark as read
    - _Requirements: 20.4, 20.5_
  
  - [x] 20.4 Notification cleanup cron
    - Delete read notifications > 30 days
    - Vercel cron at 02:00 UTC
    - _Requirements: 20.6_
  
  - [x] 20.5 Notification için property testler
    - **Property 46: Conditional Notification Creation**
    - **Property 47: Notification Read Status Update**
    - **Property 48: Notification Schema Completeness**
    - **Validates: Requirements 20.1-20.6**

- [x] 21. Security ve data protection
  - [x] 21.1 RLS policy testing
    - Test user isolation
    - Test cross-user access prevention
    - _Requirements: 1.4, 12.13, 15.3_
  
  - [x] 21.2 Token encryption implementation
    - AES-256 encryption for Meta tokens
    - Secure key management
    - _Requirements: 4.2, 15.1_
  
  - [x] 21.3 HTTPS enforcement
    - Vercel automatic HTTPS
    - Redirect HTTP to HTTPS
    - _Requirements: 15.2_
  
  - [x] 21.4 Password hashing
    - Bcrypt with 10+ salt rounds
    - Supabase handles this by default
    - _Requirements: 15.4_
  
  - [x] 21.5 GDPR compliance
    - User data deletion endpoint
    - DELETE /api/users/me
    - Cascade delete all user data
    - _Requirements: 15.5_
  
  - [x] 21.6 Authentication audit logging
    - Log all auth attempts
    - Store in audit_logs table
    - _Requirements: 15.6_
  
  - [x] 21.7 Security için property testler
    - **Property 2: Row-Level Security Isolation**
    - **Property 34: Password Hashing Security**
    - **Property 35: GDPR Data Deletion**
    - **Property 36: Authentication Audit Logging**
    - **Validates: Requirements 1.4, 12.13, 15.1-15.6**

- [x] 22. Performance optimization
  - [x] 22.1 Caching implementation
    - Dashboard metrics cache (5 min TTL)
    - Client list cache (10 min TTL)
    - AI recommendations cache (1 hour TTL)
    - _Requirements: 16.4_
  
  - [x] 22.2 Database query optimization
    - Verify all indexes created
    - Connection pooling configuration
    - _Requirements: 5.5, 16.3_
  
  - [x] 22.3 Dashboard load time optimization
    - Code splitting
    - Lazy loading components
    - Target < 2 seconds load time
    - _Requirements: 16.1_
  
  - [x] 22.4 Performance için property testler
    - **Property 38: Cache Validity Duration**
    - **Validates: Requirements 16.4**

- [x] 23. Checkpoint - Core features tamamlandı
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Error handling ve user experience
  - [x] 24.1 User-friendly error messages
    - API error formatting
    - Turkish error messages
    - _Requirements: 14.4_
  
  - [x] 24.2 Network error handling
    - Toast notifications
    - Retry options
    - _Requirements: 14.1, 14.2, 14.3_
  
  - [x] 24.3 Form validation
    - Inline validation messages
    - Field highlighting
    - _Requirements: 3.4_
  
  - [x] 24.4 Session expiration handling
    - Detect expired session
    - Redirect to login with return URL
    - _Requirements: 1.5_
  
  - [x] 24.5 Error handling için property test
    - **Property 32: User-Friendly Error Messages**
    - **Validates: Requirements 14.4**

- [x] 25. Locale ve internationalization
  - [x] 25.1 Turkish locale implementation
    - All UI text in Turkish
    - Currency formatting (TRY)
    - Date formatting (DD.MM.YYYY)
    - Number formatting
    - _Requirements: 19.1, 19.2, 19.3, 19.4_
  
  - [x] 25.2 i18n infrastructure (optional)
    - Language switching between TR/EN
    - Translation files
    - _Requirements: 19.5_
  
  - [x] 25.3 Locale için property testler
    - **Property 44: Turkish Locale Formatting**
    - **Property 45: Language Switching**
    - **Validates: Requirements 19.1-19.5**

- [x] 26. Testing infrastructure
  - [x] 26.1 Test environment setup
    - Jest configuration
    - fast-check library setup
    - Test database setup
    - _Testing Strategy_
  
  - [x] 26.2 Mock utilities
    - Mock Meta API responses
    - Mock Gemini API responses
    - Mock Supabase client
    - _Testing Strategy_
  
  - [x] 26.3 Test data generators
    - arbitraryUser()
    - arbitraryClient()
    - arbitraryCampaign()
    - arbitraryMetrics()
    - arbitraryDateRange()
    - _Testing Strategy_
  
  - [x] 26.4 Run all property-based tests
    - Execute all 48 property tests
    - Minimum 100 iterations each
    - Verify all pass
    - _Testing Strategy_

- [x] 27. Deployment ve monitoring
  - [x] 27.1 Vercel deployment configuration
    - Environment variables setup
    - Build configuration
    - _Implementation Notes_
  
  - [x] 27.2 Cron jobs configuration
    - vercel.json cron setup
    - Meta sync (00:00 UTC)
    - AI recommendations (01:00 UTC)
    - Notification cleanup (02:00 UTC)
    - _Implementation Notes_
  
  - [x] 27.3 Monitoring setup
    - Vercel Analytics
    - Error tracking (Sentry)
    - Performance monitoring
    - _Implementation Notes_
  
  - [x] 27.4 Alerts configuration
    - Meta API sync failure alerts
    - Gemini API error alerts
    - Performance degradation alerts
    - _Implementation Notes_

- [x] 28. Documentation ve final testing
  - [x] 28.1 API documentation
    - Document all API routes
    - Request/response examples
  
  - [x] 28.2 Component documentation
    - Props documentation
    - Usage examples
  
  - [x] 28.3 End-to-end testing
    - User registration flow
    - Client creation flow
    - Meta sync flow
    - Report generation flow
    - _Testing Strategy_
  
  - [x] 28.4 User acceptance testing
    - Test all user stories
    - Verify all acceptance criteria
    - _Requirements: All_

- [x] 29. Final checkpoint - Production ready
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- All code should be written in TypeScript with Next.js 14 App Router
- Follow TailwindCSS and Shadcn/UI patterns for consistent styling
- Ensure all API routes implement proper error handling and retry logic
- RLS policies must be tested thoroughly to prevent data leakage
- Turkish locale should be used throughout the application
