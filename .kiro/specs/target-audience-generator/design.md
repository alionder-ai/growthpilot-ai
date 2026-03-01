# Design Document: Target Audience & Offer Generator

## Overview

The Target Audience & Offer Generator (Sektörel Hedef Kitle ve Teklif Jeneratörü) is an AI-powered strategic analysis feature that transforms GrowthPilot AI into a comprehensive Marketing Strategy Engine. This feature leverages Google Gemini API and Alex Hormozi's "Grand Slam Offer" methodology to generate detailed customer segmentation and irresistible offer recommendations based on industry input.

### Purpose

Enable marketing consultants to receive expert-level strategic analysis for any industry sector, providing actionable insights on customer segmentation (Perfect, Necessary, and Unnecessary customers) and tailored offer strategies.

### Key Capabilities

- Industry-specific strategic analysis generation
- Three-tier customer segmentation with desire/barrier analysis
- Importance scoring (1-10) for all strategic factors
- Irresistible offer generation based on Hormozi Framework
- Analysis persistence and history tracking
- Visual importance score representation
- Full Turkish localization

### Integration Points

- Existing Gemini API client (`lib/gemini/client.ts`)
- Supabase database with RLS policies
- Dashboard navigation and layout
- Shadcn/UI component library
- Existing error handling infrastructure


## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│  /dashboard/target-audience (Next.js Page + React Components)  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Layer (Next.js)                        │
│              POST /api/ai/target-audience                       │
│  - Authentication validation                                    │
│  - Input validation                                             │
│  - Orchestration                                                │
└──────────┬──────────────────────────────────┬───────────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────────┐    ┌────────────────────────────────┐
│   Gemini API Client      │    │   Supabase Database            │
│   (lib/gemini/client.ts) │    │   - target_audience_analyses   │
│   - Retry logic          │    │   - RLS policies               │
│   - JSON parsing         │    │   - User isolation             │
│   - Error handling       │    └────────────────────────────────┘
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│   Google Gemini API      │
│   (gemini-1.5-flash)     │
│   - Strategic analysis   │
│   - Turkish output       │
└──────────────────────────┘
```

### Component Architecture

```
TargetAudiencePage
├── TargetAudienceForm
│   ├── Input (industry)
│   └── Button (Analiz Et)
├── LoadingState
│   └── Spinner + Progress text
├── AnalysisDisplay
│   ├── CustomerSegmentCard (Mükemmel Müşteri)
│   │   ├── ProfileSection
│   │   ├── DesiresSection (İçsel + Dışsal)
│   │   ├── BarriersSection (İçsel + Dışsal)
│   │   └── NeedsSection
│   ├── CustomerSegmentCard (Mecburi Müşteri)
│   │   └── [same structure]
│   ├── CustomerSegmentCard (Gereksiz Müşteri)
│   │   └── ProfileSection only
│   └── OffersSection
│       ├── OfferCard (Mükemmel)
│       ├── OfferCard (Mecburi)
│       └── OfferCard (Gereksiz)
└── AnalysisHistory
    └── HistoryList
        └── HistoryItem[]
```


### Data Flow

1. **User Input Flow**
   ```
   User enters industry → Form validation → API request → Loading state
   ```

2. **Analysis Generation Flow**
   ```
   API receives request
   → Authenticate user
   → Validate input
   → Build Gemini prompt
   → Call Gemini API (with retry)
   → Parse JSON response
   → Validate structure
   → Store in database
   → Return to frontend
   → Display results
   ```

3. **History Retrieval Flow**
   ```
   User navigates to history
   → API fetches user's analyses (RLS enforced)
   → Sort by created_at DESC
   → Paginate if > 50 records
   → Display list
   → User selects analysis
   → Display full analysis
   ```

### Technology Stack

- **Frontend**: Next.js 14 App Router, React 18, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL with RLS)
- **AI**: Google Gemini API (gemini-1.5-flash model)
- **State Management**: React hooks (useState, useEffect)
- **Error Handling**: Existing error handler utilities
- **Localization**: Turkish (TR) locale formatting


## Components and Interfaces

### API Endpoint

**POST /api/ai/target-audience**

Request:
```typescript
{
  industry: string  // e.g., "Güzellik Merkezi", "Gayrimenkul"
}
```

Response (Success - 200):
```typescript
{
  success: true,
  analysis_id: string,  // UUID
  analysis: StrategicAnalysis
}
```

Response (Error - 400/401/500):
```typescript
{
  error: string  // Turkish error message
}
```

### TypeScript Interfaces

```typescript
// Core analysis structure
interface StrategicAnalysis {
  mukemmelMusteri: CustomerSegment;
  mecburiMusteri: CustomerSegment;
  gereksizMusteri: UnnecessaryCustomer;
  reddedilemezTeklifler: IrresistibleOffers;
}

interface CustomerSegment {
  profil: string;
  icselArzular: ScoredItem[];
  dissalArzular: ScoredItem[];
  icselEngeller: ScoredItem[];
  dissalEngeller: ScoredItem[];
  ihtiyaclar: ScoredItem[];
}

interface UnnecessaryCustomer {
  profil: string;
}

interface ScoredItem {
  text: string;
  score: number;  // 1-10
}

interface IrresistibleOffers {
  mukemmelMusteriTeklif: string;
  mecburiMusteriTeklif: string;
  gereksizMusteriTeklif: string;
}

// Database record
interface TargetAudienceAnalysis {
  id: string;
  user_id: string;
  industry: string;
  analysis_data: StrategicAnalysis;
  created_at: string;
}
```


### React Components

**TargetAudiencePage** (`app/dashboard/target-audience/page.tsx`)
- Main page component
- Manages analysis state (loading, data, error)
- Handles form submission
- Displays results or history

**TargetAudienceForm** (`components/ai/TargetAudienceForm.tsx`)
- Industry input field with validation
- Submit button with loading state
- Error message display
- Props: `onSubmit: (industry: string) => Promise<void>`, `isLoading: boolean`

**AnalysisDisplay** (`components/ai/AnalysisDisplay.tsx`)
- Renders complete strategic analysis
- Organizes three customer segments
- Displays offers section
- Props: `analysis: StrategicAnalysis`

**CustomerSegmentCard** (`components/ai/CustomerSegmentCard.tsx`)
- Displays single customer segment
- Color-coded by segment type
- Collapsible sections for desires/barriers/needs
- Props: `segment: CustomerSegment`, `type: 'perfect' | 'necessary' | 'unnecessary'`, `title: string`

**ImportanceScoreBar** (`components/ai/ImportanceScoreBar.tsx`)
- Visual progress bar for importance scores
- Color gradient (red → yellow → green)
- Numeric display (e.g., "8/10")
- Props: `score: number`, `label: string`

**AnalysisHistory** (`components/ai/AnalysisHistory.tsx`)
- Lists past analyses
- Pagination support
- Click to view full analysis
- Props: `analyses: TargetAudienceAnalysis[]`, `onSelect: (id: string) => void`


## Data Models

### Database Schema

**Table: target_audience_analyses**

```sql
CREATE TABLE target_audience_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_target_audience_analyses_user_id 
  ON target_audience_analyses(user_id);
CREATE INDEX idx_target_audience_analyses_created_at 
  ON target_audience_analyses(created_at DESC);

-- RLS Policy
ALTER TABLE target_audience_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access only their own analyses"
  ON target_audience_analyses FOR ALL
  USING (user_id = auth.uid());
```

### JSONB Structure (analysis_data)

```json
{
  "mukemmelMusteri": {
    "profil": "Detaylı müşteri profili açıklaması...",
    "icselArzular": [
      { "text": "Özgüven kazanmak", "score": 9 },
      { "text": "Kendini değerli hissetmek", "score": 8 },
      { "text": "Sosyal onay almak", "score": 7 }
    ],
    "dissalArzular": [
      { "text": "Daha genç görünmek", "score": 9 },
      { "text": "Profesyonel görünüm", "score": 8 },
      { "text": "Beğeni almak", "score": 7 }
    ],
    "icselEngeller": [
      { "text": "Sonuç alamama korkusu", "score": 8 },
      { "text": "Zaman ayıramama endişesi", "score": 6 },
      { "text": "Kararsızlık", "score": 5 }
    ],
    "dissalEngeller": [
      { "text": "Yüksek fiyat algısı", "score": 9 },
      { "text": "Güven eksikliği", "score": 7 },
      { "text": "Ulaşım zorluğu", "score": 4 }
    ],
    "ihtiyaclar": [
      { "text": "Hızlı sonuç garantisi", "score": 9 },
      { "text": "Esnek randevu saatleri", "score": 8 },
      { "text": "Ödeme kolaylığı", "score": 7 }
    ]
  },
  "mecburiMusteri": {
    // Same structure as mukemmelMusteri
  },
  "gereksizMusteri": {
    "profil": "Kaçınılması gereken müşteri profili..."
  },
  "reddedilemezTeklifler": {
    "mukemmelMusteriTeklif": "İlk seans %50 indirimli + ücretsiz cilt analizi...",
    "mecburiMusteriTeklif": "3 aylık paket + ödeme planı seçeneği...",
    "gereksizMusteriTeklif": "Sadece tam fiyat, randevu iptali durumunda ücret..."
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Requirements 11.2 and 11.3 both test authentication validation (consolidated into Property 3)
- Multiple requirements about JSON structure validation (12.1-12.9) can be combined into comprehensive structure properties
- Prompt content requirements (2.2-2.7, 19.1-19.7) overlap and can be consolidated

The following properties represent unique, non-redundant validation requirements:

### Property 1: Input Whitespace Normalization

*For any* industry input string with leading or trailing whitespace, the processed input sent to the Gemini API should equal the trimmed version of the original input.

**Validates: Requirements 1.5**

### Property 2: Unicode Input Acceptance

*For any* valid Unicode string (including Turkish, Arabic, Chinese, emoji characters), the system should accept it as valid industry input without throwing validation errors.

**Validates: Requirements 1.4**

### Property 3: Authentication Enforcement

*For any* API request to /api/ai/target-audience without valid authentication credentials, the system should return HTTP 401 status code and deny access.

**Validates: Requirements 11.2, 11.3**

### Property 4: Empty Input Validation

*For any* API request with missing or empty industry field, the system should return HTTP 400 status code with validation error message.

**Validates: Requirements 11.5**


### Property 5: Perfect Customer Segment Structure Completeness

*For any* successfully generated strategic analysis, the mukemmelMusteri object should contain all required fields (profil, icselArzular, dissalArzular, icselEngeller, dissalEngeller, ihtiyaclar) with minimum 3 items in each array field.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

### Property 6: Necessary Customer Segment Structure Completeness

*For any* successfully generated strategic analysis, the mecburiMusteri object should contain all required fields (profil, icselArzular, dissalArzular, icselEngeller, dissalEngeller, ihtiyaclar) with minimum 3 items in each array field.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

### Property 7: Importance Score Range Validity

*For any* scored item in any customer segment (desires, barriers, needs), the score value should be an integer between 1 and 10 inclusive.

**Validates: Requirements 3.7, 4.7**

### Property 8: Unnecessary Customer Profile Existence

*For any* successfully generated strategic analysis, the gereksizMusteri object should contain a non-empty profil field describing unprofitable customer characteristics.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 9: Irresistible Offers Completeness

*For any* successfully generated strategic analysis, the reddedilemezTeklifler object should contain three non-empty offer strings (mukemmelMusteriTeklif, mecburiMusteriTeklif, gereksizMusteriTeklif).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 10: Analysis Persistence

*For any* successfully generated strategic analysis, a corresponding record should be created in the target_audience_analyses table with user_id, industry, analysis_data, and created_at fields populated.

**Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**


### Property 11: Row-Level Security Isolation

*For any* user querying the target_audience_analyses table, the returned results should contain only records where user_id matches the authenticated user's ID.

**Validates: Requirements 9.6, 9.7**

### Property 12: JSON Response Structure Validity

*For any* successful API response, the returned JSON should contain all required top-level fields (mukemmelMusteri, mecburiMusteri, gereksizMusteri, reddedilemezTeklifler) with correct nested structure.

**Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9**

### Property 13: Analysis History Sorting

*For any* user's analysis history retrieval, the results should be sorted by created_at timestamp in descending order (newest first).

**Validates: Requirements 13.2**

### Property 14: Gemini API Retry Behavior

*For any* Gemini API request that fails with a transient error, the system should retry the request up to 3 times with exponential backoff before returning an error to the user.

**Validates: Requirements 14.3, 14.4, 14.5**

### Property 15: Prompt Content Completeness

*For any* Gemini API request, the prompt should explicitly include: (1) Alex Hormozi's Grand Slam Offer framework reference, (2) Turkish language output request, (3) formal business Turkish ("siz" form) specification, (4) JSON format request, and (5) the user's industry input.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 19.1, 19.2, 19.5, 19.6**

### Property 16: JSON Parsing Resilience

*For any* Gemini API response, if the response contains JSON wrapped in markdown code blocks (```json...```), the system should successfully extract and parse the JSON content.

**Validates: Requirements 20.2**


### Property 17: Score Value Clamping

*For any* importance score value in the Gemini response that falls outside the 1-10 range, the system should clamp it to the nearest valid boundary (1 or 10).

**Validates: Requirements 20.5**

### Property 18: Invalid Score Default Handling

*For any* importance score value in the Gemini response that is non-numeric or cannot be parsed, the system should default it to 5.

**Validates: Requirements 20.6**

### Property 19: Turkish Localization in UI

*For any* user-facing UI element (labels, buttons, error messages, validation messages), the displayed text should be in Turkish language using formal business form ("siz").

**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5**

### Property 20: Button State Synchronization

*For any* analysis generation request, the submit button's disabled state should be true when loading is true, and false when loading is false.

**Validates: Requirements 8.5**


## Error Handling

### Error Categories and Responses

**1. Validation Errors (400)**
- Empty industry input: "Bu alan zorunludur"
- Missing required fields: "Gerekli alanlar eksik"
- Invalid request format: "Geçersiz istek formatı"

**2. Authentication Errors (401)**
- No authentication: "Yetkisiz erişim"
- Invalid token: "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."

**3. Not Found Errors (404)**
- Analysis not found: "Analiz bulunamadı"

**4. Gemini API Errors (500)**
- API request failure: "Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
- Invalid JSON response: "Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
- Timeout: "Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin."

**5. Database Errors (500)**
- Storage failure: "Analiz kaydedilemedi. Lütfen tekrar deneyin."
- Query failure: "Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin."

### Error Handling Strategy

**Retry Logic**
- Gemini API calls: 3 retries with exponential backoff (1s, 2s, 4s)
- Database operations: No automatic retry (fail fast)
- Network timeouts: 30 seconds per request

**Error Logging**
- Technical errors logged in English for debugging
- Include error type, message, stack trace, and context
- User-facing errors displayed in Turkish

**User Feedback**
- Clear, actionable error messages
- Remove loading indicators on error
- Re-enable submit button for retry
- Display error in toast notification or inline message

**Graceful Degradation**
- If analysis generation fails, preserve user input
- Allow immediate retry without re-entering data
- Maintain analysis history even if new generation fails


## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific error scenarios (empty input, invalid JSON, API failures)
- UI component rendering with specific props
- Integration between components
- Database schema validation
- Specific Turkish localization examples

**Property-Based Tests** focus on:
- Universal properties across all inputs (whitespace normalization, Unicode acceptance)
- JSON structure validation for any valid response
- Score range validation for any generated analysis
- Authentication enforcement for any unauthenticated request
- RLS isolation for any user query

Together, these approaches provide comprehensive coverage: unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across the input space.

### Property-Based Testing Configuration

**Library**: fast-check (existing in project)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: target-audience-generator, Property {number}: {property_text}`

**Test Organization**:
```
__tests__/
├── unit/
│   └── ai/
│       ├── target-audience-form.test.ts
│       ├── target-audience-api.test.ts
│       └── analysis-display.test.ts
└── property/
    └── target-audience.test.ts  (all 20 properties)
```


### Property Test Examples

**Property 1: Input Whitespace Normalization**
```typescript
// Feature: target-audience-generator, Property 1: Input whitespace normalization
fc.assert(
  fc.property(
    fc.string().filter(s => s.trim().length > 0),
    fc.nat(5), // leading spaces
    fc.nat(5), // trailing spaces
    async (baseInput, leadingSpaces, trailingSpaces) => {
      const paddedInput = ' '.repeat(leadingSpaces) + baseInput + ' '.repeat(trailingSpaces);
      const processedInput = await processIndustryInput(paddedInput);
      expect(processedInput).toBe(baseInput.trim());
    }
  ),
  { numRuns: 100 }
);
```

**Property 7: Importance Score Range Validity**
```typescript
// Feature: target-audience-generator, Property 7: Importance score range validity
fc.assert(
  fc.property(
    arbitraries.strategicAnalysis(),
    (analysis) => {
      const allScores = [
        ...analysis.mukemmelMusteri.icselArzular.map(i => i.score),
        ...analysis.mukemmelMusteri.dissalArzular.map(i => i.score),
        ...analysis.mukemmelMusteri.icselEngeller.map(i => i.score),
        ...analysis.mukemmelMusteri.dissalEngeller.map(i => i.score),
        ...analysis.mukemmelMusteri.ihtiyaclar.map(i => i.score),
        ...analysis.mecburiMusteri.icselArzular.map(i => i.score),
        ...analysis.mecburiMusteri.dissalArzular.map(i => i.score),
        ...analysis.mecburiMusteri.icselEngeller.map(i => i.score),
        ...analysis.mecburiMusteri.dissalEngeller.map(i => i.score),
        ...analysis.mecburiMusteri.ihtiyaclar.map(i => i.score),
      ];
      
      return allScores.every(score => 
        Number.isInteger(score) && score >= 1 && score <= 10
      );
    }
  ),
  { numRuns: 100 }
);
```

### Unit Test Examples

**Empty Input Validation**
```typescript
describe('Target Audience API - Validation', () => {
  it('should return 400 for empty industry input', async () => {
    const response = await POST(
      new Request('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: '' }),
      })
    );
    
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Bu alan zorunludur');
  });
});
```

**Gemini API Failure Error Message**
```typescript
describe('Target Audience API - Error Handling', () => {
  it('should return Turkish error message on Gemini API failure', async () => {
    mockGeminiClient.generateJSON.mockRejectedValue(new Error('API Error'));
    
    const response = await POST(
      new Request('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      })
    );
    
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe('Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
  });
});
```


## Prompt Engineering Strategy

### Prompt Template Design

The Gemini API prompt must be carefully engineered to produce consistent, high-quality strategic analyses. The prompt will be added to `lib/gemini/prompts.ts` following the existing pattern.

### Prompt Structure

```typescript
export function buildTargetAudiencePrompt(industry: string): string {
  return `Sen bir pazarlama stratejisti ve Alex Hormozi'nin Grand Slam Offer (Reddedilemez Teklif) metodolojisinde uzmansın.

Sektör: ${industry}

Bu sektör için detaylı bir hedef kitle analizi ve teklif stratejisi oluştur. Alex Hormozi'nin Grand Slam Offer formülünü kullanarak üç müşteri segmenti belirle:

1. MÜKEMMEL MÜŞTERİ (Düşük Efor, Yüksek Kar)
2. MECBURİ MÜŞTERİ (Yüksek Efor, Yüksek Kar)
3. GEREKSİZ MÜŞTERİ (Yüksek Efor, Düşük Kar)

Her segment için:
- Detaylı müşteri profili
- İçsel Arzular (minimum 3 adet, önem skoru 1-10)
- Dışsal Arzular (minimum 3 adet, önem skoru 1-10)
- İçsel Engeller (minimum 3 adet, önem skoru 1-10)
- Dışsal Engeller (minimum 3 adet, önem skoru 1-10)
- İhtiyaçlar (minimum 3 adet, önem skoru 1-10)

Ayrıca her segment için "Reddedilemez Teklif" oluştur:
- Mükemmel Müşteri için: Maksimum değer, kolay satış
- Mecburi Müşteri için: Yüksek değer, ama daha fazla eğitim/destek gerekli
- Gereksiz Müşteri için: Filtreleme veya minimum efor teklifi

ÖNEMLI:
- Tüm içerik Türkçe olmalı
- Resmi iş Türkçesi kullan (siz formu)
- Önem skorları 1-10 arası tam sayı olmalı
- Spesifik ve uygulanabilir içerik üret, genel tavsiyelerden kaçın
- Sektöre özgü örnekler ver

JSON formatında yanıt ver:
{
  "mukemmelMusteri": {
    "profil": "string",
    "icselArzular": [
      { "text": "string", "score": number }
    ],
    "dissalArzular": [
      { "text": "string", "score": number }
    ],
    "icselEngeller": [
      { "text": "string", "score": number }
    ],
    "dissalEngeller": [
      { "text": "string", "score": number }
    ],
    "ihtiyaclar": [
      { "text": "string", "score": number }
    ]
  },
  "mecburiMusteri": {
    "profil": "string",
    "icselArzular": [
      { "text": "string", "score": number }
    ],
    "dissalArzular": [
      { "text": "string", "score": number }
    ],
    "icselEngeller": [
      { "text": "string", "score": number }
    ],
    "dissalEngeller": [
      { "text": "string", "score": number }
    ],
    "ihtiyaclar": [
      { "text": "string", "score": number }
    ]
  },
  "gereksizMusteri": {
    "profil": "string"
  },
  "reddedilemezTeklifler": {
    "mukemmelMusteriTeklif": "string",
    "mecburiMusteriTeklif": "string",
    "gereksizMusteriTeklif": "string"
  }
}

Sadece JSON yanıtı ver, başka açıklama ekleme.`;
}
```

### Token Limit Configuration

```typescript
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,  // New: Larger limit for comprehensive analysis
} as const;
```

### Prompt Engineering Principles

1. **Explicit Framework Reference**: Directly mentions "Alex Hormozi'nin Grand Slam Offer" to activate relevant training data
2. **Structured Output Request**: Provides exact JSON schema to ensure consistent structure
3. **Minimum Requirements**: Specifies "minimum 3 adet" to ensure sufficient content
4. **Score Range Specification**: Explicitly states "1-10 arası tam sayı" for validation
5. **Language and Tone**: Requests "Resmi iş Türkçesi" and "siz formu" for appropriate formality
6. **Quality Guidance**: Asks for "Spesifik ve uygulanabilir içerik" to avoid generic advice
7. **Context Injection**: Includes user's industry input for personalization
8. **Format Enforcement**: Ends with "Sadece JSON yanıtı ver" to minimize extraneous text


## Performance Considerations

### Response Time Optimization

**Target Performance**:
- API response time: < 10 seconds (normal conditions)
- Database query time: < 100ms
- UI rendering time: < 500ms

**Optimization Strategies**:

1. **Gemini API Configuration**
   - Use `gemini-1.5-flash` model (faster than Pro)
   - Set appropriate token limit (2000 tokens)
   - Implement timeout handling (30 seconds)

2. **Database Performance**
   - Index on `user_id` for fast user-specific queries
   - Index on `created_at DESC` for efficient history sorting
   - JSONB storage for flexible analysis data structure
   - Pagination for history lists (50 records per page)

3. **Frontend Optimization**
   - Lazy load analysis history
   - Debounce input validation
   - Optimistic UI updates where possible
   - Skeleton loaders during data fetch

4. **Caching Strategy**
   - No caching for analysis generation (always fresh)
   - Consider caching analysis history for 5 minutes
   - Cache Gemini prompt template (static)

### Scalability Considerations

**Current Scale**:
- Expected users: 100-1000 marketing consultants
- Expected analyses per user: 10-50 per month
- Total monthly API calls: 1,000-50,000

**Scaling Strategies**:
- Gemini API has generous rate limits (60 requests/minute)
- Supabase connection pooling handles concurrent requests
- Stateless API design allows horizontal scaling
- JSONB storage scales well for flexible data structures

### Resource Usage

**Database Storage**:
- Average analysis size: ~5-10 KB (JSONB)
- 1000 analyses = ~10 MB
- Minimal storage impact

**API Costs**:
- Gemini API: ~2000 tokens per request
- Cost per analysis: ~$0.001-0.002
- Monthly cost (10,000 analyses): ~$10-20


## Security Considerations

### Authentication and Authorization

**Authentication**:
- All API endpoints require valid Supabase authentication
- Middleware protects dashboard routes
- JWT token validation on every request

**Authorization**:
- Row-Level Security (RLS) policies enforce user isolation
- Users can only access their own analyses
- No cross-user data leakage possible

### Data Privacy

**Sensitive Data Handling**:
- Industry input may contain business-sensitive information
- Analysis data stored with user_id for isolation
- No sharing or aggregation of user data
- GDPR-compliant data storage

**API Security**:
- HTTPS enforcement for all requests
- Gemini API key stored in environment variables
- No API keys exposed to frontend
- Rate limiting to prevent abuse

### Input Validation

**Server-Side Validation**:
- Industry input sanitized and trimmed
- Maximum input length enforced (500 characters)
- SQL injection prevention via parameterized queries
- XSS prevention via React's built-in escaping

**Response Validation**:
- Gemini API responses validated before storage
- JSON structure verification
- Score range validation and clamping
- Malformed data rejected with error

### Audit and Monitoring

**Logging**:
- All API requests logged with user_id
- Gemini API calls logged for debugging
- Error tracking for failure analysis
- No sensitive data in logs

**Monitoring**:
- Track API response times
- Monitor Gemini API success/failure rates
- Alert on unusual error patterns
- Database query performance monitoring


## Implementation Roadmap

### Phase 1: Database and API Foundation
1. Create database migration for `target_audience_analyses` table
2. Add RLS policies for user isolation
3. Create TypeScript interfaces for data structures
4. Implement API endpoint `/api/ai/target-audience`
5. Add prompt template to `lib/gemini/prompts.ts`
6. Implement response parsing and validation logic

### Phase 2: Core UI Components
1. Create `TargetAudiencePage` component
2. Implement `TargetAudienceForm` with validation
3. Build `AnalysisDisplay` component
4. Create `CustomerSegmentCard` component
5. Implement `ImportanceScoreBar` component
6. Add loading and error states

### Phase 3: Analysis History
1. Create `AnalysisHistory` component
2. Implement history retrieval API
3. Add pagination support
4. Build analysis selection and display

### Phase 4: Integration and Polish
1. Add navigation link to dashboard
2. Integrate with existing error handling
3. Add Turkish localization verification
4. Implement responsive design
5. Add accessibility features

### Phase 5: Testing
1. Write unit tests for API endpoint
2. Write unit tests for components
3. Implement property-based tests (20 properties)
4. Integration testing
5. Manual QA testing

### Phase 6: Documentation and Deployment
1. Update user documentation
2. Create migration guide
3. Deploy to staging environment
4. User acceptance testing
5. Production deployment


## UI/UX Design Specifications

### Visual Design

**Color Scheme** (aligned with existing dashboard):
- Perfect Customer (Mükemmel Müşteri): Green accent (#10b981)
- Necessary Customer (Mecburi Müşteri): Yellow accent (#f59e0b)
- Unnecessary Customer (Gereksiz Müşteri): Red accent (#ef4444)
- Background: Existing dashboard background
- Text: Existing dashboard text colors

**Typography**:
- Headings: Existing dashboard heading styles
- Body text: Existing dashboard body text
- Labels: Existing form label styles
- Consistent with Shadcn/UI components

### Component Layout

**Main Page Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Hedef Kitle Analizi                                    │
│  ─────────────────────────────────────────────────────  │
│                                                          │
│  [Sektör/Endüstri Input Field                        ]  │
│  [Analiz Et Button]                                     │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MÜKEMMEL MÜŞTERİ (Green border)                  │ │
│  │  Profil: ...                                       │ │
│  │  ▼ İçsel Arzular                                   │ │
│  │    • Item 1 [████████░░] 8/10                      │ │
│  │    • Item 2 [███████░░░] 7/10                      │ │
│  │  ▼ Dışsal Arzular                                  │ │
│  │  ▼ İçsel Engeller                                  │ │
│  │  ▼ Dışsal Engeller                                 │ │
│  │  ▼ İhtiyaçlar                                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  MECBURİ MÜŞTERİ (Yellow border)                  │ │
│  │  [Similar structure]                               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  GEREKSİZ MÜŞTERİ (Red border)                    │ │
│  │  Profil: ...                                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │  REDDEDİLEMEZ TEKLİFLER                           │ │
│  │  • Mükemmel Müşteri: ...                          │ │
│  │  • Mecburi Müşteri: ...                           │ │
│  │  • Gereksiz Müşteri: ...                          │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [Geçmiş Analizler Button]                             │
└─────────────────────────────────────────────────────────┘
```

### Interaction Patterns

**Form Submission**:
1. User enters industry
2. Clicks "Analiz Et"
3. Button shows loading spinner
4. Button text changes to "Analiz Ediliyor..."
5. Button disabled during loading
6. On success: Scroll to results, show success toast
7. On error: Show error message, re-enable button

**Collapsible Sections**:
- Each desire/barrier/need section collapsible
- Default: All expanded on first view
- Click header to toggle
- Smooth animation (200ms)
- Chevron icon indicates state

**Score Visualization**:
- Horizontal progress bar
- Width: 100% of container
- Height: 8px
- Rounded corners
- Color gradient based on score:
  - 1-3: Red (#ef4444)
  - 4-6: Yellow (#f59e0b)
  - 7-10: Green (#10b981)
- Numeric label: "8/10" aligned right

### Responsive Design

**Desktop (≥1024px)**:
- Two-column layout for customer segments
- Full-width offers section
- Side-by-side comparison view

**Tablet (768px-1023px)**:
- Single-column layout
- Stacked customer segments
- Full-width components

**Mobile (<768px)**:
- Single-column layout
- Condensed spacing
- Collapsible sections default closed
- Sticky submit button

### Accessibility

**WCAG 2.1 AA Compliance**:
- Semantic HTML elements
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators visible
- Color contrast ratios ≥4.5:1
- Screen reader announcements for loading states
- Alt text for all visual elements

**Keyboard Shortcuts**:
- Tab: Navigate between fields
- Enter: Submit form (when input focused)
- Space: Toggle collapsible sections
- Escape: Close modals/overlays


## Integration with Existing System

### Dashboard Navigation

**Menu Item Addition**:
- Location: Main dashboard sidebar
- Label: "Hedef Kitle Analizi"
- Icon: Target or bullseye icon (from existing icon set)
- Position: After "Strateji Kartları", before "Raporlar"
- Active state styling: Consistent with existing menu items

**Route Configuration**:
```typescript
// app/dashboard/target-audience/page.tsx
export const metadata = {
  title: 'Hedef Kitle Analizi | GrowthPilot AI',
  description: 'Sektörel hedef kitle ve teklif analizi',
};
```

### Component Reuse

**Existing Components to Reuse**:
- `DashboardLayout` - Main layout wrapper
- `Button` from Shadcn/UI - Form submit button
- `Input` from Shadcn/UI - Industry input field
- `Card` from Shadcn/UI - Customer segment cards
- `Progress` from Shadcn/UI - Importance score bars
- `Spinner` - Loading indicator
- `ErrorBoundary` - Error handling wrapper
- `Toast` - Success/error notifications

**Styling Consistency**:
- Use existing Tailwind classes
- Follow existing spacing patterns (p-4, p-6, gap-4)
- Match existing card shadows and borders
- Use existing color palette from tailwind.config.ts

### API Integration Pattern

**Following Existing Pattern**:
```typescript
// Similar to app/api/ai/action-plan/route.ts
export async function POST(request: NextRequest) {
  // 1. Create Supabase client
  const supabase = await createClient();
  
  // 2. Authenticate user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
  }
  
  // 3. Parse and validate request
  const body = await request.json();
  const { industry } = body;
  
  // 4. Call Gemini API
  const geminiClient = getGeminiClient();
  const analysis = await geminiClient.generateJSON<StrategicAnalysis>(
    buildTargetAudiencePrompt(industry),
    TOKEN_LIMITS.TARGET_AUDIENCE
  );
  
  // 5. Store in database
  const { data, error } = await supabase
    .from('target_audience_analyses')
    .insert({ user_id: user.id, industry, analysis_data: analysis })
    .select()
    .single();
  
  // 6. Return response
  return NextResponse.json({ success: true, analysis_id: data.id, analysis });
}
```

### Error Handling Integration

**Using Existing Error Handler**:
```typescript
import { handleApiError } from '@/lib/utils/error-handler';

try {
  // API logic
} catch (error) {
  return handleApiError(error, 'Analiz oluşturulurken bir hata oluştu');
}
```

**Toast Notifications**:
```typescript
import { useToast } from '@/lib/contexts/ToastContext';

const { showToast } = useToast();

// Success
showToast('Analiz başarıyla oluşturuldu', 'success');

// Error
showToast('Analiz oluşturulurken bir hata oluştu', 'error');
```

### Database Migration Integration

**Migration File Naming**:
- Follow existing pattern: `YYYYMMDD000000_description.sql`
- Example: `20260225000001_create_target_audience_analyses.sql`
- Place in `supabase/migrations/` directory

**Migration Dependencies**:
- Depends on: `auth.users` table (already exists)
- No dependencies on other feature tables
- Can be applied independently


## Monitoring and Observability

### Key Metrics to Track

**Performance Metrics**:
- API response time (p50, p95, p99)
- Gemini API call duration
- Database query duration
- Frontend render time

**Business Metrics**:
- Analyses generated per day
- Analyses generated per user
- Most common industries analyzed
- Success rate (successful generations / total attempts)

**Error Metrics**:
- Gemini API failure rate
- Database error rate
- Validation error rate
- Authentication error rate

### Logging Strategy

**API Request Logging**:
```typescript
console.log('[TARGET AUDIENCE API] Request received', {
  userId: user.id,
  industry: industry.substring(0, 50), // Truncate for privacy
  timestamp: new Date().toISOString(),
});
```

**Gemini API Logging**:
```typescript
console.log('[GEMINI API] Request sent', {
  promptLength: prompt.length,
  tokenLimit: TOKEN_LIMITS.TARGET_AUDIENCE,
});

console.log('[GEMINI API] Response received', {
  responseLength: response.length,
  duration: endTime - startTime,
});
```

**Error Logging**:
```typescript
console.error('[TARGET AUDIENCE API] Error occurred', {
  errorType: error.constructor.name,
  errorMessage: error.message,
  userId: user.id,
  industry: industry,
  stack: error.stack,
});
```

### Health Checks

**API Health Endpoint**:
```typescript
// app/api/health/target-audience/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabaseConnection(),
    gemini: await checkGeminiApiConnection(),
  };
  
  const healthy = Object.values(checks).every(c => c.status === 'ok');
  
  return NextResponse.json(
    { healthy, checks },
    { status: healthy ? 200 : 503 }
  );
}
```

### Alerting Rules

**Critical Alerts** (immediate notification):
- Gemini API failure rate > 50% for 5 minutes
- Database connection failures
- Authentication system failures

**Warning Alerts** (notification within 1 hour):
- API response time p95 > 15 seconds
- Gemini API failure rate > 20% for 15 minutes
- Error rate > 10% for 30 minutes

**Info Alerts** (daily digest):
- Daily usage statistics
- Popular industries analyzed
- User engagement metrics


## Future Enhancements

### Phase 2 Features (Post-MVP)

**1. Analysis Comparison**
- Compare multiple analyses side-by-side
- Highlight differences between industries
- Export comparison reports

**2. Analysis Sharing**
- Share analyses with team members
- Generate shareable links
- Export to PDF format

**3. Custom Frameworks**
- Allow users to define custom analysis frameworks
- Template library for different methodologies
- Framework marketplace

**4. AI-Powered Insights**
- Trend analysis across multiple analyses
- Industry benchmarking
- Automated recommendations based on patterns

**5. Integration with Campaign Data**
- Link analyses to specific clients
- Use campaign data to validate assumptions
- Automated A/B test suggestions

**6. Collaborative Features**
- Team comments on analyses
- Version history and rollback
- Approval workflows

### Technical Improvements

**1. Performance Optimization**
- Implement response caching for identical industries
- Parallel processing for multiple analyses
- Background job processing for large batches

**2. Enhanced Validation**
- Machine learning-based quality scoring
- Automated fact-checking for industry claims
- Consistency validation across segments

**3. Advanced Analytics**
- Usage analytics dashboard
- ROI tracking for implemented strategies
- Success rate correlation analysis

**4. Internationalization**
- Support for multiple languages beyond Turkish
- Regional customization options
- Cultural adaptation for different markets


## Appendix

### Glossary

- **Strategic Analysis**: Complete AI-generated report containing customer segmentation and offer recommendations
- **Customer Segment**: One of three categories (Perfect, Necessary, Unnecessary) with associated characteristics
- **Importance Score**: Numeric value (1-10) indicating priority or significance of a factor
- **Hormozi Framework**: Alex Hormozi's Grand Slam Offer methodology for creating irresistible offers
- **Desire/Barrier Analysis**: Structured evaluation of internal/external motivations and obstacles
- **RLS**: Row-Level Security - PostgreSQL feature for data isolation at database level
- **JSONB**: PostgreSQL data type for storing JSON with indexing and query capabilities

### References

**External Resources**:
- Alex Hormozi - "$100M Offers: How To Make Offers So Good People Feel Stupid Saying No"
- Google Gemini API Documentation: https://ai.google.dev/docs
- Supabase RLS Documentation: https://supabase.com/docs/guides/auth/row-level-security
- Next.js 14 Documentation: https://nextjs.org/docs
- Shadcn/UI Components: https://ui.shadcn.com/

**Internal Documentation**:
- GrowthPilot AI Product Overview: `.kiro/steering/product.md`
- Technology Stack: `.kiro/steering/tech.md`
- Project Structure: `.kiro/steering/structure.md`
- Localization Rules: `.kiro/steering/Chat Kuralları.md`

### API Response Examples

**Successful Response**:
```json
{
  "success": true,
  "analysis_id": "550e8400-e29b-41d4-a716-446655440000",
  "analysis": {
    "mukemmelMusteri": {
      "profil": "25-40 yaş arası, orta-üst gelir seviyesine sahip, estetik ve bakıma önem veren, düzenli geliri olan profesyoneller...",
      "icselArzular": [
        { "text": "Özgüven kazanmak ve kendini değerli hissetmek", "score": 9 },
        { "text": "Yaşlanma belirtilerini geciktirmek", "score": 8 },
        { "text": "Sosyal çevrede beğeni toplamak", "score": 7 }
      ],
      "dissalArzular": [
        { "text": "Daha genç ve dinç görünmek", "score": 9 },
        { "text": "Profesyonel iş görünümü sağlamak", "score": 8 },
        { "text": "Sosyal medyada paylaşılabilir sonuçlar", "score": 7 }
      ],
      "icselEngeller": [
        { "text": "Sonuç alamama ve para kaybetme korkusu", "score": 8 },
        { "text": "Ağrılı veya rahatsız edici işlemler endişesi", "score": 7 },
        { "text": "Zaman ayıramama düşüncesi", "score": 6 }
      ],
      "dissalEngeller": [
        { "text": "Yüksek fiyat algısı", "score": 9 },
        { "text": "Güvenilir merkez bulma zorluğu", "score": 7 },
        { "text": "Randevu alma ve ulaşım zorluğu", "score": 5 }
      ],
      "ihtiyaclar": [
        { "text": "Hızlı ve garantili sonuç", "score": 9 },
        { "text": "Esnek randevu saatleri", "score": 8 },
        { "text": "Taksit ve ödeme kolaylığı", "score": 7 }
      ]
    },
    "mecburiMusteri": { /* Similar structure */ },
    "gereksizMusteri": {
      "profil": "Sadece fiyata odaklanan, sürekli indirim bekleyen, sonuç beklentisi gerçekçi olmayan, taahhüt vermeyen müşteriler..."
    },
    "reddedilemezTeklifler": {
      "mukemmelMusteriTeklif": "İlk seans %50 indirimli + Ücretsiz cilt analizi + 6 ay garanti + Esnek ödeme planı",
      "mecburiMusteriTeklif": "3 aylık paket + Haftalık takip + Ücretsiz danışmanlık + 12 aya varan taksit",
      "gereksizMusteriTeklif": "Sadece tam fiyat, ön ödeme, randevu iptali durumunda %50 ücret"
    }
  }
}
```

**Error Response**:
```json
{
  "error": "Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin."
}
```

### Database Query Examples

**Insert Analysis**:
```sql
INSERT INTO target_audience_analyses (user_id, industry, analysis_data)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Güzellik Merkezi',
  '{"mukemmelMusteri": {...}, "mecburiMusteri": {...}, ...}'::jsonb
)
RETURNING *;
```

**Fetch User's Analyses**:
```sql
SELECT id, industry, created_at
FROM target_audience_analyses
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC
LIMIT 50;
```

**Fetch Specific Analysis**:
```sql
SELECT *
FROM target_audience_analyses
WHERE id = '550e8400-e29b-41d4-a716-446655440000'
  AND user_id = '550e8400-e29b-41d4-a716-446655440000';
```

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-25  
**Author**: Kiro AI Assistant  
**Status**: Ready for Review
