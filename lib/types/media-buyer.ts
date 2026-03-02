/**
 * AI Media Buyer Type Definitions
 * 
 * Type definitions for the AI Media Buyer feature that analyzes
 * Meta Ads campaigns and provides Scale/Hold/Kill recommendations.
 */

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

export interface DecisionResult {
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
  clientJustification?: string;
}

export interface AIAnalysisResult {
  summary: string;
  kpiOverview: {
    ctr: string;
    cvr: string;
    roas: string;
    cpa: string;
    frequency: string;
  };
  issues: Issue[];
  recommendations: Recommendation[];
  nextTests: string[];
}
