# AI Media Buyer - Design Document

## Overview

The AI Media Buyer is an intelligent campaign analysis system that consolidates campaign management and strategic decision-making into a unified interface. It analyzes Meta Ads campaigns using 30-day historical performance data, calculates objective performance scores, and provides actionable Scale/Hold/Kill recommendations with Turkish-language justifications suitable for client presentation.

The system leverages the Groq API (llama-3.3-70b-versatile model) to generate deep campaign insights, identifies issues by severity, recommends actions by impact level, and projects profit changes based on recommendations. It integrates with existing commission models to provide revenue-focused decision support.

### Key Capabilities

- Objective performance scoring (0-100) based on weighted metrics
- Scale/Hold/Kill decision logic with client-ready justifications
- AI-powered campaign analysis in Turkish
- Profit simulation with before/after projections
- Industry benchmark comparisons
- 5-minute result caching for performance
- Comprehensive error handling with Turkish user feedback

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Media Buyer Page                                  │  │
│  │  - Campaign Selection Interface                       │  │
│  │  - Analysis Trigger                                   │  │
│  │  - Results Display                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  POST /api/ai/media-buyer                            │  │
│  │  - Request validation                                 │  │
│  │  - Authorization check                                │  │
│  │  - Cache lookup                                       │  │
│  │  - Analysis orchestration                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Media Buyer Analyzer                                 │  │
│  │  - Data Collection                                    │  │
│  │  - Performance Score Calculation                      │  │
│  │  - Decision Logic Engine                              │  │
│  │  - Profit Simulator                                   │  │
│  │  - Benchmark Comparator                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Supabase Database      │  │      Groq API            │
│  - Campaigns             │  │  - Campaign Analysis     │
│  - Ad Sets               │  │  - Issue Identification  │
│  - Ads                   │  │  - Recommendations       │
│  - Meta Metrics          │  │  - Turkish Content       │
│  - Clients               │  │                          │
│  - Commission Models     │  │                          │
└──────────────────────────┘  └──────────────────────────┘
```

### Data Flow

1. **User Initiates Analysis**: User selects a campaign and clicks analyze
2. **API Request**: Frontend sends POST to `/api/ai/media-buyer` with campaign_id
3. **Authorization**: API verifies user owns the campaign via RLS policies
4. **Cache Check**: System checks if fresh cached results exist (< 5 min old)
5. **Data Collection**: If cache miss, system fetches campaign, ad sets, ads, and 30-day metrics
6. **Performance Scoring**: System calculates weighted performance score (0-100)
7. **Decision Logic**: System applies Scale/Hold/Kill rules based on score, ROAS, frequency
8. **AI Analysis**: System sends data to Groq API for deep insights in Turkish
9. **Profit Simulation**: System calculates current and projected profit with commission
10. **Benchmark Comparison**: System compares metrics against industry standards
11. **Cache Storage**: System caches complete results for 5 minutes
12. **Response**: API returns comprehensive analysis to frontend
13. **Display**: Frontend renders results with visual indicators and copyable justifications

### Technology Stack Integration

- **Frontend**: Next.js 14 App Router page at `/app/dashboard/ai-media-buyer/page.tsx`
- **API**: Next.js API route at `/app/api/ai/media-buyer/route.ts`
- **AI Provider**: Groq API via `/lib/ai/index.ts` abstraction layer
- **Database**: Supabase PostgreSQL with RLS policies
- **Caching**: In-memory cache with TTL (5 minutes)
- **UI Components**: Shadcn/UI components with TailwindCSS
- **Charts**: Recharts for performance score visualization

## Components and Interfaces

### Frontend Components

#### MediaBuyerPage Component
```typescript
// app/dashboard/ai-media-buyer/page.tsx
interface MediaBuyerPageProps {
  // Server component, no props needed
}

// Renders:
// - Campaign selection dropdown
// - Analyze button
// - Loading state
// - Results display
// - Error messages in Turkish
```

#### CampaignSelector Component
```typescript
// components/ai/CampaignSelector.tsx
interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelect: (campaignId: string) => void;
  disabled?: boolean;
}

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget?: number;
}
```

#### AnalysisResults Component
```typescript
// components/ai/AnalysisResults.tsx
interface AnalysisResultsProps {
  analysis: MediaBuyerAnalysis;
  onCopyJustification?: () => void;
}

interface MediaBuyerAnalysis {
  performanceScore: number;
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
  clientJustification?: string; // Only for kill decisions
  summary: string;
  kpiOverview: KPIMetrics;
  issues: Issue[];
  recommendations: Recommendation[];
  nextTests: string[];
  profitSimulation: ProfitSimulation;
  industryBenchmark?: BenchmarkComparison;
}
```

#### PerformanceScoreCard Component
```typescript
// components/ai/PerformanceScoreCard.tsx
interface PerformanceScoreCardProps {
  score: number; // 0-100
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
}

// Visual representation:
// - Circular progress indicator
// - Color coding: green (70+), yellow (40-69), red (<40)
// - Decision badge
// - Justification text
```

#### DecisionBadge Component
```typescript
// components/ai/DecisionBadge.tsx
interface DecisionBadgeProps {
  decision: 'scale' | 'hold' | 'kill';
  size?: 'sm' | 'md' | 'lg';
}

// Turkish labels:
// - scale: "Ölçeklendir" (green)
// - hold: "Beklet" (yellow)
// - kill: "Durdur" (red)
```

#### IssuesList Component
```typescript
// components/ai/IssuesList.tsx
interface IssuesListProps {
  issues: Issue[];
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

// Sorted by severity (critical first)
// Color-coded severity indicators
```

#### RecommendationsList Component
```typescript
// components/ai/RecommendationsList.tsx
interface RecommendationsListProps {
  recommendations: Recommendation[];
}

interface Recommendation {
  impact: 'high' | 'medium' | 'low';
  action: string;
}

// Sorted by impact (high first)
// Impact level badges
```

#### ProfitSimulationCard Component
```typescript
// components/ai/ProfitSimulationCard.tsx
interface ProfitSimulationCardProps {
  simulation: ProfitSimulation;
}

interface ProfitSimulation {
  currentProfit: number;
  projectedProfit: number;
  percentageChange: number;
  currentRevenue: number;
  projectedRevenue: number;
  commission: number;
}

// Turkish Lira formatting: ₺1.234,56
// Percentage change with +/- indicator
// Visual comparison chart
```

#### BenchmarkComparison Component
```typescript
// components/ai/BenchmarkComparison.tsx
interface BenchmarkComparisonProps {
  comparison: BenchmarkComparison;
}

interface BenchmarkComparison {
  industry: string;
  metrics: {
    ctr: { campaign: number; benchmark: number; status: 'above' | 'below' | 'at' };
    cvr: { campaign: number; benchmark: number; status: 'above' | 'below' | 'at' };
    roas: { campaign: number; benchmark: number; status: 'above' | 'below' | 'at' };
  };
}

// Visual indicators for above/below/at benchmark
// Turkish labels for metrics
```

### API Interfaces

#### Media Buyer API Endpoint
```typescript
// app/api/ai/media-buyer/route.ts

// POST Request
interface MediaBuyerRequest {
  campaignId: string;
}

// Response
interface MediaBuyerResponse {
  success: boolean;
  data?: MediaBuyerAnalysis;
  error?: string;
  cached?: boolean;
}

// Error responses (Turkish):
// - 400: "Kampanya ID gereklidir"
// - 403: "Bu kampanyaya erişim yetkiniz yok"
// - 404: "Kampanya bulunamadı"
// - 500: "Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin"
```

### Business Logic Interfaces

#### Media Buyer Analyzer
```typescript
// lib/ai/media-buyer-analyzer.ts

export class MediaBuyerAnalyzer {
  async analyzeCampaign(campaignId: string, userId: string): Promise<MediaBuyerAnalysis>;
  
  private async collectCampaignData(campaignId: string): Promise<CampaignData>;
  private calculatePerformanceScore(metrics: AggregatedMetrics): number;
  private determineDecision(score: number, metrics: AggregatedMetrics): DecisionResult;
  private async generateAIAnalysis(data: CampaignData): Promise<AIAnalysisResult>;
  private simulateProfit(data: CampaignData, decision: DecisionResult): ProfitSimulation;
  private async compareToBenchmark(data: CampaignData): Promise<BenchmarkComparison | null>;
}

interface CampaignData {
  campaign: Campaign;
  adSets: AdSet[];
  ads: Ad[];
  metrics: MetricsByDate[];
  client: Client;
  commissionModel: CommissionModel;
}

interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCVR: number;
  avgROAS: number;
  avgCPA: number;
  avgCPM: number;
  avgFrequency: number;
}

interface DecisionResult {
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
  clientJustification?: string;
}
```

#### Performance Score Calculator
```typescript
// lib/ai/performance-score-calculator.ts

export class PerformanceScoreCalculator {
  calculate(metrics: AggregatedMetrics): number;
  
  private calculateEngagementScore(ctr: number, cvr: number): number; // 40% weight
  private calculateFatigueScore(frequency: number): number; // 20% weight
  private calculateEfficiencyScore(roas: number, cpa: number): number; // 30% weight
  private calculateAudienceScore(cpm: number): number; // 10% weight
}

// Scoring logic:
// - Engagement (40%): CTR and CVR normalized against industry standards
// - Fatigue (20%): Frequency penalty (optimal: 1.5-2.5, penalty above 3)
// - Efficiency (30%): ROAS and CPA performance
// - Audience (10%): CPM relative to industry average
```

#### Decision Engine
```typescript
// lib/ai/decision-engine.ts

export class DecisionEngine {
  determine(score: number, metrics: AggregatedMetrics, targetROAS: number): DecisionResult;
  
  private shouldScale(score: number, roas: number, frequency: number, targetROAS: number): boolean;
  private shouldKill(score: number, roas: number, frequency: number, targetROAS: number): boolean;
  private generateJustification(decision: string, score: number, metrics: AggregatedMetrics): string;
  private generateClientJustification(metrics: AggregatedMetrics): string;
}

// Decision rules:
// Scale: score >= 70 AND roas > targetROAS AND frequency < 3
// Kill: score < 40 OR frequency > 4.5 OR roas < (targetROAS * 0.5)
// Hold: everything else
```

#### Profit Simulator
```typescript
// lib/ai/profit-simulator.ts

export class ProfitSimulator {
  simulate(
    currentMetrics: AggregatedMetrics,
    decision: DecisionResult,
    commissionModel: CommissionModel
  ): ProfitSimulation;
  
  private projectMetrics(current: AggregatedMetrics, decision: string): AggregatedMetrics;
  private calculateRevenue(metrics: AggregatedMetrics): number;
  private calculateCommission(revenue: number, model: CommissionModel): number;
}

// Projection logic:
// Scale: +30% spend, +25% revenue (assuming slight efficiency loss)
// Hold: no change
// Kill: -100% spend, -100% revenue
```

### AI Configuration

```typescript
// lib/ai/config.ts (update)

export type AIFeature = 
  | 'target_audience'
  | 'action_plan'
  | 'strategy_card'
  | 'creative'
  | 'recommendations'
  | 'media_buyer'; // NEW

export const AI_CONFIG: Record<AIFeature, AIProvider> = {
  target_audience: 'groq',
  action_plan: 'groq',
  strategy_card: 'groq',
  creative: 'groq',
  recommendations: 'groq',
  media_buyer: 'groq', // NEW
};

// Token limits
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 4000,
  MEDIA_BUYER: 2000, // NEW
} as const;
```

### Prompt Templates

```typescript
// lib/ai/prompts.ts (update)

export const MEDIA_BUYER_PROMPT = `
Sen deneyimli bir dijital pazarlama uzmanısın. Aşağıdaki Meta Ads kampanya verilerini analiz et ve Türkçe olarak detaylı bir rapor hazırla.

KAMPANYA VERİLERİ:
{campaignData}

GÖREV:
1. Kampanya özetini çıkar (2-3 cümle)
2. Ana KPI'ları değerlendir (CTR, CVR, ROAS, CPA, CPM, Frekans)
3. Sorunları tespit et ve önem derecesine göre sırala (critical, high, medium, low)
4. Eyleme geçirilebilir öneriler sun ve etki seviyesine göre sırala (high, medium, low)
5. Sonraki test fırsatlarını öner (3-5 tane)

ÇIKTI FORMATI (JSON):
{
  "summary": "Kampanya özeti",
  "kpiOverview": {
    "ctr": "CTR değerlendirmesi",
    "cvr": "CVR değerlendirmesi",
    "roas": "ROAS değerlendirmesi",
    "cpa": "CPA değerlendirmesi",
    "frequency": "Frekans değerlendirmesi"
  },
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "description": "Sorun açıklaması"
    }
  ],
  "recommendations": [
    {
      "impact": "high|medium|low",
      "action": "Öneri açıklaması"
    }
  ],
  "nextTests": [
    "Test önerisi 1",
    "Test önerisi 2"
  ]
}

Sadece JSON formatında yanıt ver, başka açıklama ekleme.
`;
```

## Data Models

### Database Schema Extensions

No new tables required. The feature uses existing tables:
- `campaigns`
- `ad_sets`
- `ads`
- `meta_metrics`
- `clients`
- `commission_models`

### TypeScript Types

```typescript
// lib/types/media-buyer.ts

export interface MediaBuyerAnalysis {
  performanceScore: number;
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
  clientJustification?: string;
  summary: string;
  kpiOverview: KPIMetrics;
  issues: Issue[];
  recommendations: Recommendation[];
  nextTests: string[];
  profitSimulation: ProfitSimulation;
  industryBenchmark?: BenchmarkComparison;
  analyzedAt: string; // ISO timestamp
}

export interface KPIMetrics {
  ctr: string;
  cvr: string;
  roas: string;
  cpa: string;
  cpm: string;
  frequency: string;
}

export interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
}

export interface Recommendation {
  impact: 'high' | 'medium' | 'low';
  action: string;
}

export interface ProfitSimulation {
  currentProfit: number;
  projectedProfit: number;
  percentageChange: number;
  currentRevenue: number;
  projectedRevenue: number;
  commission: number;
}

export interface BenchmarkComparison {
  industry: string;
  metrics: {
    ctr: MetricComparison;
    cvr: MetricComparison;
    roas: MetricComparison;
  };
}

export interface MetricComparison {
  campaign: number;
  benchmark: number;
  status: 'above' | 'below' | 'at';
}

export interface CampaignData {
  campaign: {
    campaign_id: string;
    campaign_name: string;
    status: string;
    meta_campaign_id: string;
  };
  adSets: Array<{
    ad_set_id: string;
    ad_set_name: string;
    budget: number;
    status: string;
  }>;
  ads: Array<{
    ad_id: string;
    ad_name: string;
    status: string;
  }>;
  metrics: Array<{
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    roas: number;
    ctr: number;
    cpc: number;
    cpm: number;
    cpa: number;
    frequency: number;
  }>;
  client: {
    client_id: string;
    client_name: string;
    industry: string;
  };
  commissionModel: {
    model_type: 'percentage' | 'fixed';
    rate: number;
    target_roas?: number;
  };
}

export interface AggregatedMetrics {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCTR: number;
  avgCVR: number;
  avgROAS: number;
  avgCPA: number;
  avgCPM: number;
  avgFrequency: number;
  dateRange: {
    start: string;
    end: string;
  };
}
```

### Cache Structure

```typescript
// In-memory cache with TTL
interface CacheEntry {
  data: MediaBuyerAnalysis;
  timestamp: number;
  campaignId: string;
}

// Cache key format: `media-buyer:${campaignId}`
// TTL: 5 minutes (300000 ms)
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all 60 acceptance criteria, I identified several areas of redundancy:

1. **Weight calculation properties (2.1-2.4)** can be combined into a single comprehensive property that validates the entire scoring formula
2. **Data fetching properties (4.1-4.3)** can be combined into one property about complete data collection
3. **Benchmark comparison properties (7.2-7.4)** are repetitive and can be combined into one property
4. **Display properties (8.3, 8.6, 8.7, 8.8)** about output presence can be consolidated
5. **Configuration properties (10.1-10.4)** are examples, not properties, and test static configuration
6. **Error message properties (11.1, 11.2, 11.5)** share the same pattern and can be combined

The following properties represent the unique, non-redundant validation requirements:

### Property 1: Campaign Selection State Management

*For any* set of campaigns, when a user selects one campaign, only that campaign should be marked as selected and all others should be unselected.

**Validates: Requirements 1.3**

### Property 2: Analysis Button Enablement

*For any* UI state, the analysis button should be enabled if and only if exactly one campaign is selected.

**Validates: Requirements 1.4**

### Property 3: Campaign Information Display

*For any* campaign in the selection interface, the rendered output should contain the campaign name, status, and budget fields.

**Validates: Requirements 1.5**

### Property 4: Performance Score Calculation Formula

*For any* set of campaign metrics, the performance score should be calculated as: (engagement_score × 0.4) + (fatigue_score × 0.2) + (efficiency_score × 0.3) + (audience_score × 0.1), where changing any component metric should produce a proportional change in the final score according to its weight.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 5: Performance Score Range Invariant

*For any* campaign metrics (regardless of values), the calculated performance score must be between 0 and 100 (inclusive).

**Validates: Requirements 2.5**

### Property 6: 30-Day Metrics Window

*For any* campaign analysis, only metrics with dates within the last 30 days from the analysis date should be included in the calculation.

**Validates: Requirements 2.6**

### Property 7: Scale Decision Conditions

*For any* campaign with performance score ≥ 70 AND ROAS > target ROAS AND frequency < 3, the system should recommend a Scale decision.

**Validates: Requirements 3.1**

### Property 8: Hold Decision Conditions

*For any* campaign with performance score between 40 and 69 (inclusive) AND not meeting scale or kill conditions, the system should recommend a Hold decision.

**Validates: Requirements 3.2**

### Property 9: Kill Decision Conditions

*For any* campaign where (performance score < 40) OR (frequency > 4.5) OR (ROAS < target ROAS × 0.5), the system should recommend a Kill decision.

**Validates: Requirements 3.3**

### Property 10: Turkish Justification Presence

*For any* analysis result, the justification field should be non-empty and contain at least one Turkish character (from the Turkish alphabet or common Turkish words).

**Validates: Requirements 3.4**

### Property 11: Client Justification for Kill Decisions

*For any* analysis result with a Kill decision, the clientJustification field should be present and non-empty.

**Validates: Requirements 3.5**

### Property 12: Complete Campaign Data Collection

*For any* campaign analysis, the system should fetch the campaign record, all associated ad sets, all associated ads, and all metrics from the last 30 days.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 13: Metrics Aggregation Correctness

*For any* campaign with multiple ads, the aggregated total spend should equal the sum of spend across all ads for all dates in the 30-day window.

**Validates: Requirements 4.5**

### Property 14: Insufficient Data Error Handling

*For any* campaign with missing or incomplete metric data, the system should return an error response indicating insufficient data rather than proceeding with analysis.

**Validates: Requirements 4.6**

### Property 15: Groq API Model Specification

*For any* AI analysis request, the system should specify the llama-3.3-70b-versatile model in the API call.

**Validates: Requirements 5.1**

### Property 16: Turkish Language Prompt

*For any* AI analysis request, the prompt sent to Groq API should contain Turkish language instructions (e.g., "Türkçe", "analiz et").

**Validates: Requirements 5.2**

### Property 17: Analysis Structure Completeness

*For any* successful AI analysis response, the result should include summary, kpiOverview, issues array, recommendations array, and nextTests array fields.

**Validates: Requirements 5.3, 5.6**

### Property 18: Issue Severity Validation

*For any* issue in the analysis results, the severity field should be one of: 'critical', 'high', 'medium', or 'low'.

**Validates: Requirements 5.4**

### Property 19: Recommendation Impact Validation

*For any* recommendation in the analysis results, the impact field should be one of: 'high', 'medium', or 'low'.

**Validates: Requirements 5.5**

### Property 20: Groq API Retry Logic

*For any* Groq API request that fails, the system should retry up to 3 times with exponential backoff before returning an error.

**Validates: Requirements 5.7**

### Property 21: Turkish Error Messages After Retry Exhaustion

*For any* Groq API request where all 3 retry attempts fail, the system should return an error message in Turkish.

**Validates: Requirements 5.8**

### Property 22: Current Profit Calculation

*For any* campaign with metrics and commission model, current profit should equal (total conversions × average order value × ROAS - total spend) × commission rate for percentage models, or (total conversions × average order value × ROAS - total spend) for fixed models.

**Validates: Requirements 6.1**

### Property 23: Profit Projection Based on Decision

*For any* analysis result, the projected profit should differ from current profit according to the decision: Scale should project higher profit, Kill should project zero profit, Hold should maintain current profit.

**Validates: Requirements 6.2**

### Property 24: Profit Simulation Structure

*For any* analysis result, the profitSimulation should include currentProfit, projectedProfit, percentageChange, currentRevenue, projectedRevenue, and commission fields.

**Validates: Requirements 6.3**

### Property 25: Turkish Lira Formatting

*For any* currency value in the profit simulation, the formatted string should match the Turkish locale pattern: ₺X.XXX,XX (dot for thousands, comma for decimals).

**Validates: Requirements 6.4**

### Property 26: Percentage Commission Calculation

*For any* campaign with a percentage-based commission model, the commission in profit simulation should equal projected revenue × commission rate.

**Validates: Requirements 6.5**

### Property 27: Fixed Commission Maintenance

*For any* campaign with a fixed-fee commission model, the commission value should remain constant in both current and projected profit calculations.

**Validates: Requirements 6.6**

### Property 28: Benchmark Comparison Completeness

*For any* campaign with available industry benchmark data, the comparison should include CTR, CVR, and ROAS comparisons, each with campaign value, benchmark value, and status ('above', 'below', or 'at').

**Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

### Property 29: Missing Benchmark Handling

*For any* campaign where industry benchmark data is unavailable, the industryBenchmark field should be null or undefined.

**Validates: Requirements 7.6**

### Property 30: Performance Score Color Coding

*For any* performance score, the visual indicator color class should be: green/success for score ≥ 70, yellow/warning for 40 ≤ score < 70, red/danger for score < 40.

**Validates: Requirements 8.1**

### Property 31: Decision and Justification Display

*For any* analysis result, both the decision and justification fields should be displayed in the UI.

**Validates: Requirements 8.2**

### Property 32: Issues Sorted by Severity

*For any* analysis result with multiple issues, the issues should be ordered with 'critical' first, then 'high', then 'medium', then 'low'.

**Validates: Requirements 8.4**

### Property 33: Recommendations Sorted by Impact

*For any* analysis result with multiple recommendations, the recommendations should be ordered with 'high' impact first, then 'medium', then 'low'.

**Validates: Requirements 8.5**

### Property 34: Client Justification Display for Kill

*For any* analysis result with a Kill decision, the clientJustification should be displayed in a copyable format (e.g., textarea or code block).

**Validates: Requirements 8.9**

### Property 35: Turkish UI Labels

*For any* UI element in the media buyer interface, the label text should be in Turkish (e.g., "Kampanya Seç", "Analiz Et", "Performans Skoru").

**Validates: Requirements 8.10**

### Property 36: Campaign ID Validation

*For any* API request to /api/ai/media-buyer without a valid campaign ID, the system should return a 400 Bad Request error.

**Validates: Requirements 9.2**

### Property 37: Campaign Ownership Authorization

*For any* API request where the authenticated user does not own the specified campaign, the system should return a 403 Forbidden error.

**Validates: Requirements 9.3, 9.4**

### Property 38: JSON Response Format

*For any* successful API response from /api/ai/media-buyer, the response body should be valid JSON parseable into a MediaBuyerResponse object.

**Validates: Requirements 9.5**

### Property 39: HTTP Status Code Correctness

*For any* API request to /api/ai/media-buyer, the response status code should be: 200 for success, 400 for invalid input, 403 for unauthorized access, 404 for campaign not found, 500 for server errors.

**Validates: Requirements 9.6**

### Property 40: Analysis Request Audit Logging

*For any* API request to /api/ai/media-buyer, a log entry should be created containing the user ID, campaign ID, and timestamp.

**Validates: Requirements 9.7**

### Property 41: Turkish Error Messages for Data Issues

*For any* analysis failure due to insufficient data, missing data, API errors, or network errors, the error message should be in Turkish and provide actionable guidance.

**Validates: Requirements 11.1, 11.2, 11.5**

### Property 42: Loading State Display

*For any* analysis request in progress, the UI should display a loading indicator until the analysis completes or fails.

**Validates: Requirements 11.3**

### Property 43: Success Confirmation Display

*For any* completed analysis, the UI should display a success confirmation message or indicator.

**Validates: Requirements 11.4**

### Property 44: Cache Storage with TTL

*For any* successful analysis result, the system should store the result in cache with a 5-minute TTL keyed by campaign ID.

**Validates: Requirements 12.1**

### Property 45: Cache Hit Behavior

*For any* analysis request where cached results exist and are less than 5 minutes old, the system should return the cached results without calling Groq API.

**Validates: Requirements 12.2**

### Property 46: Cache Invalidation on Metric Update

*For any* campaign where metrics are updated, the cached analysis results for that campaign should be invalidated.

**Validates: Requirements 12.3**

## Error Handling

### Error Categories

1. **Input Validation Errors**
   - Missing campaign ID
   - Invalid campaign ID format
   - Campaign not found
   - User does not own campaign

2. **Data Availability Errors**
   - Insufficient metric data (< 7 days)
   - Missing campaign data
   - Missing ad set or ad data
   - No metrics in 30-day window

3. **External API Errors**
   - Groq API timeout
   - Groq API rate limit
   - Groq API authentication failure
   - Groq API response parsing error

4. **System Errors**
   - Database connection failure
   - Cache service unavailable
   - Unexpected calculation errors

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string; // Turkish error message
  errorCode?: string; // Machine-readable code
  details?: Record<string, any>; // Additional context
}
```

### Turkish Error Messages

```typescript
const ERROR_MESSAGES = {
  MISSING_CAMPAIGN_ID: 'Kampanya ID gereklidir',
  INVALID_CAMPAIGN_ID: 'Geçersiz kampanya ID formatı',
  CAMPAIGN_NOT_FOUND: 'Kampanya bulunamadı',
  UNAUTHORIZED: 'Bu kampanyaya erişim yetkiniz yok',
  INSUFFICIENT_DATA: 'Analiz için yeterli veri yok. En az 7 günlük metrik verisi gereklidir.',
  MISSING_METRICS: 'Son 30 gün içinde metrik verisi bulunamadı',
  API_ERROR: 'AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
  API_TIMEOUT: 'AI analizi zaman aşımına uğradı. Lütfen tekrar deneyin.',
  NETWORK_ERROR: 'Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin.',
  DATABASE_ERROR: 'Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.',
  UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu. Lütfen destek ekibiyle iletişime geçin.',
};
```

### Retry Strategy

```typescript
interface RetryConfig {
  maxAttempts: 3;
  initialDelay: 1000; // ms
  maxDelay: 8000; // ms
  backoffMultiplier: 2;
}

// Retry logic for Groq API:
// Attempt 1: immediate
// Attempt 2: wait 1000ms
// Attempt 3: wait 2000ms
// Attempt 4: wait 4000ms
// After 3 retries: return Turkish error message
```

### Error Logging

All errors should be logged with:
- Timestamp
- User ID
- Campaign ID
- Error type
- Error message
- Stack trace (for system errors)
- Request context

## Testing Strategy

### Dual Testing Approach

The AI Media Buyer feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs using randomized data

Both testing approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide range of inputs.

### Property-Based Testing Configuration

**Library**: fast-check (already used in the project)

**Configuration**:
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `// Feature: ai-media-buyer, Property {number}: {property_text}`

**Test Organization**:
```
__tests__/
├── property/
│   └── media-buyer.test.ts          # All 46 correctness properties
├── unit/
│   ├── ai/
│   │   ├── performance-score-calculator.test.ts
│   │   ├── decision-engine.test.ts
│   │   ├── profit-simulator.test.ts
│   │   └── media-buyer-analyzer.test.ts
│   └── api/
│       └── media-buyer-api.test.ts
└── generators/
    └── media-buyer-arbitraries.ts   # Custom generators for property tests
```

### Property Test Examples

```typescript
// Feature: ai-media-buyer, Property 5: Performance Score Range Invariant
it('should always produce performance score between 0 and 100', () => {
  fc.assert(
    fc.property(
      fc.record({
        avgCTR: fc.float({ min: 0, max: 100 }),
        avgCVR: fc.float({ min: 0, max: 100 }),
        avgFrequency: fc.float({ min: 0, max: 10 }),
        avgROAS: fc.float({ min: 0, max: 20 }),
        avgCPA: fc.float({ min: 0, max: 1000 }),
        avgCPM: fc.float({ min: 0, max: 100 }),
      }),
      (metrics) => {
        const calculator = new PerformanceScoreCalculator();
        const score = calculator.calculate(metrics);
        return score >= 0 && score <= 100;
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: ai-media-buyer, Property 7: Scale Decision Conditions
it('should recommend Scale when score >= 70 AND ROAS > target AND frequency < 3', () => {
  fc.assert(
    fc.property(
      fc.record({
        score: fc.integer({ min: 70, max: 100 }),
        roas: fc.float({ min: 3, max: 10 }),
        frequency: fc.float({ min: 0, max: 2.99 }),
        targetROAS: fc.float({ min: 1, max: 2.5 }),
      }),
      (data) => {
        const engine = new DecisionEngine();
        const result = engine.determine(
          data.score,
          { avgROAS: data.roas, avgFrequency: data.frequency } as AggregatedMetrics,
          data.targetROAS
        );
        return result.decision === 'scale';
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Focus Areas

1. **Performance Score Calculator**
   - Specific metric combinations
   - Edge cases (zero values, extreme values)
   - Weight distribution verification

2. **Decision Engine**
   - Boundary conditions (score = 40, 70)
   - Frequency thresholds (3.0, 4.5)
   - ROAS threshold calculations
   - Justification text generation

3. **Profit Simulator**
   - Percentage commission calculations
   - Fixed commission calculations
   - Scale projection logic (+30% spend, +25% revenue)
   - Kill projection (zero values)

4. **Media Buyer Analyzer**
   - Data collection integration
   - Component orchestration
   - Error handling flows
   - Cache integration

5. **API Endpoint**
   - Request validation
   - Authorization checks
   - Response formatting
   - Error responses

### Integration Testing

Integration tests should verify:
- End-to-end analysis flow from API request to response
- Database queries with RLS policies
- Groq API integration with retry logic
- Cache behavior across multiple requests
- Error propagation through layers

### Mock Data Strategy

**Generators for Property Tests**:
```typescript
// __tests__/generators/media-buyer-arbitraries.ts

export const campaignMetricsArbitrary = fc.record({
  totalSpend: fc.float({ min: 100, max: 100000 }),
  totalImpressions: fc.integer({ min: 1000, max: 1000000 }),
  totalClicks: fc.integer({ min: 10, max: 50000 }),
  totalConversions: fc.integer({ min: 0, max: 5000 }),
  avgCTR: fc.float({ min: 0, max: 10 }),
  avgCVR: fc.float({ min: 0, max: 20 }),
  avgROAS: fc.float({ min: 0, max: 15 }),
  avgCPA: fc.float({ min: 1, max: 500 }),
  avgCPM: fc.float({ min: 1, max: 100 }),
  avgFrequency: fc.float({ min: 1, max: 8 }),
});

export const commissionModelArbitrary = fc.oneof(
  fc.record({
    model_type: fc.constant('percentage'),
    rate: fc.float({ min: 0.05, max: 0.30 }),
    target_roas: fc.float({ min: 1.5, max: 4 }),
  }),
  fc.record({
    model_type: fc.constant('fixed'),
    rate: fc.float({ min: 500, max: 5000 }),
    target_roas: fc.float({ min: 1.5, max: 4 }),
  })
);
```

**Mocks for Unit Tests**:
- Supabase client mock (already exists)
- Groq API mock (already exists)
- Cache service mock

### Test Coverage Goals

- **Line coverage**: > 80%
- **Branch coverage**: > 75%
- **Function coverage**: > 85%
- **Property test iterations**: 100 per property (minimum)

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests before deployment
- Monitor test execution time (target: < 30 seconds for unit tests)

