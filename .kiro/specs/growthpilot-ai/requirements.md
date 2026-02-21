# Requirements Document

## Introduction

GrowthPilot AI, dijital pazarlama danışmanlarının müşteri portföylerini, Meta Ads kampanyalarını ve komisyon gelirlerini tek bir platformdan yönetmelerini sağlayan yapay zeka destekli bir B2B SaaS web uygulamasıdır. Sistem, Meta Ads API üzerinden kampanya verilerini otomatik olarak çeker, Google Gemini API ile analiz eder ve kullanıcılara proaktif stratejiler, optimizasyon önerileri ve otomatik raporlama sunar.

## Glossary

- **System**: GrowthPilot AI platformu
- **User**: Dijital pazarlama danışmanı veya performans pazarlamacısı
- **Client**: Kullanıcının hizmet verdiği müşteri işletme
- **Dashboard**: Ana kontrol paneli arayüzü
- **Meta_API**: Meta (Facebook) Graph API entegrasyonu
- **Gemini_API**: Google Gemini yapay zeka API entegrasyonu
- **Campaign**: Meta Ads kampanya verisi
- **Ad_Set**: Reklam seti verisi
- **Ad**: Tekil reklam verisi
- **Commission_Model**: Müşteri bazlı komisyon hesaplama modeli (% X Komisyon)
- **Revenue**: Kullanıcının hak ettiği komisyon geliri
- **ROAS**: Return on Ad Spend (Reklam Harcaması Getirisi)
- **Lead**: Potansiyel müşteri
- **Lead_Quality_Feedback**: Lead'in satışa dönüşüp dönüşmediği bilgisi
- **Action_Plan**: Yapay zeka tarafından üretilen günlük aksiyon listesi
- **Strategy_Card**: Yapılması ve yapılmaması gereken aksiyonları gösteren UI kartı
- **Report_Module**: Müşteri raporlama modülü
- **Creative_Generator**: Kreatif içerik üretici modül
- **Database**: Supabase PostgreSQL veritabanı
- **Auth_System**: Supabase Authentication sistemi
- **RLS**: Row Level Security (Satır Seviyesi Güvenlik)

## Requirements

### Requirement 1: Kullanıcı Kimlik Doğrulama ve Yetkilendirme

**User Story:** As a User, I want to securely authenticate and access only my own data, so that my client information and business data remain private.

#### Acceptance Criteria

1. THE Auth_System SHALL authenticate users via email and password
2. THE Auth_System SHALL support OAuth authentication via Google
3. WHEN a user successfully authenticates, THE System SHALL create a session token
4. THE Database SHALL enforce RLS policies to restrict data access to authenticated users
5. WHEN a user logs out, THE System SHALL invalidate the session token
6. IF authentication fails, THEN THE System SHALL return a descriptive error message

### Requirement 2: Müşteri Portföyü Yönetimi

**User Story:** As a User, I want to manage my client portfolio, so that I can track multiple clients and their campaigns in one place.

#### Acceptance Criteria

1. THE System SHALL allow users to create client records with name, industry, and contact information
2. THE System SHALL allow users to edit existing client records
3. THE System SHALL allow users to delete client records
4. WHEN a client is deleted, THE System SHALL archive associated campaign data
5. THE System SHALL display a list of all clients on the Dashboard
6. THE Database SHALL store client records in a Clients table with user_id foreign key

### Requirement 3: Komisyon Modeli Tanımlama

**User Story:** As a User, I want to define commission models for each client, so that I can automatically calculate my revenue.

#### Acceptance Criteria

1. THE System SHALL allow users to set a commission percentage for each client
2. THE System SHALL support commission calculation based on client sales revenue
3. THE System SHALL support commission calculation based on client total revenue
4. WHEN a commission model is defined, THE Database SHALL store it in the Commission_Model table
5. THE System SHALL validate that commission percentage is between 0 and 100

### Requirement 4: Meta Ads API Entegrasyonu

**User Story:** As a User, I want to connect my Meta Ads accounts, so that campaign data is automatically imported.

#### Acceptance Criteria

1. THE System SHALL authenticate with Meta_API using OAuth 2.0
2. WHEN a user connects a Meta Ads account, THE System SHALL store the access token securely
3. THE System SHALL retrieve campaign, ad set, and ad level data from Meta_API
4. THE System SHALL import the following metrics: spend, ROAS, CTR, CPC, CPM, CPA, frequency, add_to_cart, purchases
5. THE Meta_API SHALL refresh data daily at 00:00 UTC
6. IF Meta_API authentication fails, THEN THE System SHALL notify the user to reconnect
7. THE Database SHALL store imported metrics in a Meta_Metrics table with timestamp

### Requirement 5: Kampanya Verisi Saklama

**User Story:** As a User, I want campaign data stored in the database, so that I can analyze historical performance.

#### Acceptance Criteria

1. THE Database SHALL maintain a Campaigns table with fields: campaign_id, client_id, campaign_name, status, created_date
2. THE Database SHALL maintain an Ad_Sets table with fields: ad_set_id, campaign_id, ad_set_name, budget, status
3. THE Database SHALL maintain an Ads table with fields: ad_id, ad_set_id, ad_name, creative_url, status
4. THE Database SHALL maintain a Meta_Metrics table with fields: metric_id, ad_id, date, spend, impressions, clicks, conversions, ROAS, CTR, CPC, CPM, CPA, frequency, add_to_cart, purchases
5. THE Database SHALL create indexes on date and client_id fields for query performance
6. THE Database SHALL enforce foreign key constraints between related tables

### Requirement 6: Finans ve Bütçe Dashboard

**User Story:** As a User, I want to see financial metrics on the dashboard, so that I can monitor spending and revenue at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display total ad spend for the current month
2. THE Dashboard SHALL display total ad spend for the current day
3. THE Dashboard SHALL display calculated revenue based on Commission_Model for each client
4. THE Dashboard SHALL display total revenue across all clients
5. THE Dashboard SHALL visualize spending trends with a line chart for the last 30 days
6. THE Dashboard SHALL visualize revenue trends with a line chart for the last 30 days
7. WHEN a user selects a specific client, THE Dashboard SHALL filter metrics to show only that client's data

### Requirement 7: Günlük Aksiyon Planı Üretimi

**User Story:** As a User, I want AI-generated daily action plans, so that I know which tasks to prioritize each day.

#### Acceptance Criteria

1. THE System SHALL send campaign metrics to Gemini_API daily at 01:00 UTC
2. THE Gemini_API SHALL analyze metrics and generate the top 3 priority actions
3. THE System SHALL display the Action_Plan on the Dashboard with action description and priority level
4. THE Database SHALL store generated Action_Plan records in an AI_Recommendations table
5. WHEN a user marks an action as complete, THE System SHALL update the action status
6. THE System SHALL include context in the Gemini_API prompt: client name, campaign performance, budget utilization, and conversion metrics

### Requirement 8: Strateji Kartları (Do's & Don'ts)

**User Story:** As a User, I want to see actionable recommendations as strategy cards, so that I can quickly understand what to do and avoid.

#### Acceptance Criteria

1. WHEN frequency exceeds 4, THE Gemini_API SHALL generate a Strategy_Card recommending creative refresh
2. WHEN add_to_cart is high but purchases are low, THE Gemini_API SHALL generate a Strategy_Card recommending retargeting campaigns
3. WHEN ROAS is below 2, THE Gemini_API SHALL generate a Strategy_Card recommending budget reallocation or campaign pause
4. WHEN CPC increases by more than 20 percent in 7 days, THE Gemini_API SHALL generate a Strategy_Card recommending audience refinement
5. THE System SHALL display Strategy_Card elements with "Do" actions in green and "Don't" actions in red
6. THE System SHALL allow users to dismiss or archive Strategy_Card items
7. THE Database SHALL store Strategy_Card records with campaign_id, recommendation_type, do_actions, dont_actions, and created_date

### Requirement 9: Müşteri Raporlama Modülü

**User Story:** As a User, I want to generate client reports with one click, so that I can quickly share performance updates.

#### Acceptance Criteria

1. THE Report_Module SHALL generate reports for weekly or monthly time periods
2. THE Report_Module SHALL include the following metrics: total spend, total revenue, lead count, ROAS, cost per lead
3. THE Report_Module SHALL format reports as formatted text suitable for WhatsApp
4. THE Report_Module SHALL format reports as PDF documents
5. WHEN a user clicks generate report, THE System SHALL compile data within 5 seconds
6. THE Report_Module SHALL allow users to customize which metrics to include
7. THE System SHALL store generated reports in the Database with client_id, report_type, period_start, period_end, and file_url

### Requirement 10: Kreatif İçerik Üretici

**User Story:** As a User, I want to generate creative content based on industry, so that I can quickly create new ad variations.

#### Acceptance Criteria

1. THE Creative_Generator SHALL support the following industries: logistics, e-commerce, beauty, real estate, healthcare, education
2. WHEN a user selects an industry, THE System SHALL send a prompt to Gemini_API requesting ad copy
3. THE Gemini_API SHALL generate 3 ad copy variations optimized for conversions
4. WHERE a user requests video scripts, THE Creative_Generator SHALL generate video scenario outlines with scene descriptions
5. WHERE a user requests voiceover scripts, THE Creative_Generator SHALL generate voiceover text with tone and pacing notes
6. THE System SHALL display generated content in an editable text area
7. THE System SHALL allow users to save generated content to a Creative_Library table

### Requirement 11: Lead Kalite Geri Bildirim Sistemi

**User Story:** As a User, I want to mark leads as converted or not converted, so that AI can optimize for quality leads instead of just volume.

#### Acceptance Criteria

1. THE System SHALL display a list of leads with toggle buttons for "Converted" and "Not Converted" status
2. WHEN a user marks a lead status, THE Database SHALL store the Lead_Quality_Feedback in a Leads table
3. THE Database SHALL link leads to specific ads via ad_id foreign key
4. THE System SHALL calculate conversion rate per ad based on Lead_Quality_Feedback
5. WHEN generating Action_Plan or Strategy_Card items, THE Gemini_API SHALL consider Lead_Quality_Feedback data
6. THE System SHALL display lead quality metrics on the Dashboard with conversion rate per campaign

### Requirement 12: Veritabanı Şeması ve İlişkiler

**User Story:** As a developer, I want a well-structured database schema, so that data integrity is maintained and queries are efficient.

#### Acceptance Criteria

1. THE Database SHALL implement a Users table with fields: user_id, email, created_at, updated_at
2. THE Database SHALL implement a Clients table with fields: client_id, user_id, name, industry, contact_email, contact_phone, created_at, updated_at
3. THE Database SHALL implement a Commission_Models table with fields: model_id, client_id, commission_percentage, calculation_basis, created_at
4. THE Database SHALL implement a Campaigns table with fields: campaign_id, client_id, meta_campaign_id, campaign_name, status, created_at, updated_at
5. THE Database SHALL implement an Ad_Sets table with fields: ad_set_id, campaign_id, meta_ad_set_id, ad_set_name, budget, status, created_at
6. THE Database SHALL implement an Ads table with fields: ad_id, ad_set_id, meta_ad_id, ad_name, creative_url, status, created_at
7. THE Database SHALL implement a Meta_Metrics table with fields: metric_id, ad_id, date, spend, impressions, clicks, conversions, ROAS, CTR, CPC, CPM, CPA, frequency, add_to_cart, purchases, created_at
8. THE Database SHALL implement a Leads table with fields: lead_id, ad_id, lead_source, contact_info, converted_status, created_at, updated_at
9. THE Database SHALL implement an AI_Recommendations table with fields: recommendation_id, client_id, recommendation_type, content, priority, status, created_at
10. THE Database SHALL implement a Creative_Library table with fields: creative_id, user_id, industry, content_type, content_text, created_at
11. THE Database SHALL implement a Reports table with fields: report_id, client_id, report_type, period_start, period_end, file_url, created_at
12. THE Database SHALL enforce foreign key constraints with ON DELETE CASCADE for dependent records
13. THE Database SHALL implement RLS policies on all tables to restrict access based on user_id

### Requirement 13: Dashboard Arayüz İskeleti

**User Story:** As a User, I want an intuitive dashboard interface, so that I can navigate the platform easily.

#### Acceptance Criteria

1. THE Dashboard SHALL include a sidebar with navigation links to: Overview, Clients, Campaigns, Action Plan, Strategy Cards, Reports, Creative Generator, Leads
2. THE Dashboard SHALL include a header with user profile menu and logout option
3. THE Dashboard SHALL display overview cards showing: total clients, total spend this month, total revenue this month, active campaigns
4. THE Dashboard SHALL be responsive and functional on desktop screens with minimum width 1024px
5. THE Dashboard SHALL use TailwindCSS for styling
6. THE Dashboard SHALL use Shadcn/UI components for buttons, cards, dialogs, and form elements

### Requirement 14: API Hata Yönetimi ve Yeniden Deneme

**User Story:** As a User, I want the system to handle API failures gracefully, so that temporary issues don't disrupt my workflow.

#### Acceptance Criteria

1. IF Meta_API returns an error, THEN THE System SHALL retry the request up to 3 times with exponential backoff
2. IF Gemini_API returns an error, THEN THE System SHALL retry the request up to 3 times with exponential backoff
3. IF all retry attempts fail, THEN THE System SHALL log the error and notify the user
4. THE System SHALL display API error messages in a user-friendly format
5. WHEN Meta_API rate limits are reached, THE System SHALL queue requests and retry after the rate limit window

### Requirement 15: Veri Güvenliği ve Gizlilik

**User Story:** As a User, I want my data to be secure, so that client information is protected.

#### Acceptance Criteria

1. THE System SHALL encrypt Meta_API access tokens at rest using AES-256
2. THE System SHALL transmit all data over HTTPS
3. THE System SHALL implement RLS policies to prevent users from accessing other users' data
4. THE System SHALL hash passwords using bcrypt with minimum 10 salt rounds
5. THE System SHALL comply with GDPR requirements for data deletion upon user request
6. THE System SHALL log all authentication attempts for security auditing

### Requirement 16: Performans ve Ölçeklenebilirlik

**User Story:** As a User, I want the platform to load quickly, so that I can work efficiently.

#### Acceptance Criteria

1. THE Dashboard SHALL load initial view within 2 seconds on a standard broadband connection
2. THE System SHALL paginate campaign lists when displaying more than 50 records
3. THE Database SHALL use connection pooling to handle concurrent user requests
4. THE System SHALL cache frequently accessed data for 5 minutes
5. WHEN generating reports, THE System SHALL process data asynchronously to avoid blocking the UI

### Requirement 17: Meta Ads Metrik Senkronizasyonu

**User Story:** As a User, I want campaign metrics to stay up to date, so that I'm making decisions based on current data.

#### Acceptance Criteria

1. THE System SHALL synchronize Meta_API data daily at 00:00 UTC
2. THE System SHALL allow users to manually trigger a sync for specific campaigns
3. WHEN a sync completes, THE System SHALL update the last_synced_at timestamp
4. THE System SHALL display sync status on the Dashboard with last sync time
5. IF a sync fails, THEN THE System SHALL display an error indicator and allow retry

### Requirement 18: Gemini API Prompt Yapılandırması

**User Story:** As a developer, I want well-structured prompts for Gemini API, so that AI responses are consistent and useful.

#### Acceptance Criteria

1. THE System SHALL use a prompt template for Action_Plan generation that includes: client context, campaign metrics, budget status, and conversion data
2. THE System SHALL use a prompt template for Strategy_Card generation that includes: specific metric thresholds, campaign performance, and industry best practices
3. THE System SHALL use a prompt template for Creative_Generator that includes: industry, target audience, campaign objective, and tone preferences
4. THE System SHALL limit Gemini_API responses to 500 tokens for Action_Plan items
5. THE System SHALL limit Gemini_API responses to 300 tokens for Strategy_Card items
6. THE System SHALL limit Gemini_API responses to 1000 tokens for Creative_Generator outputs

### Requirement 19: Çoklu Dil Desteği Hazırlığı

**User Story:** As a User, I want the interface in Turkish, so that I can use the platform in my native language.

#### Acceptance Criteria

1. THE System SHALL display all UI text in Turkish
2. THE System SHALL format currency values in Turkish Lira (TRY) with proper thousand separators
3. THE System SHALL format dates in DD.MM.YYYY format
4. THE System SHALL use Turkish locale for number formatting
5. WHERE internationalization is implemented, THE System SHALL support language switching between Turkish and English

### Requirement 20: Bildirim Sistemi

**User Story:** As a User, I want to receive notifications for important events, so that I don't miss critical issues.

#### Acceptance Criteria

1. WHEN a campaign ROAS drops below 1.5, THE System SHALL create a notification
2. WHEN daily spend exceeds 120 percent of average daily budget, THE System SHALL create a notification
3. WHEN Meta_API sync fails, THE System SHALL create a notification
4. THE System SHALL display notifications in a notification center accessible from the header
5. THE System SHALL mark notifications as read when a user clicks on them
6. THE Database SHALL store notifications in a Notifications table with user_id, message, type, read_status, and created_at

