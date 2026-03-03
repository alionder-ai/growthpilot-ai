/**
 * Media Buyer AI Analysis
 * 
 * Integrates with Groq API to generate AI-powered campaign insights.
 * Includes retry logic with exponential backoff.
 */

import { generateAI } from '@/lib/ai/index';
import { CampaignData, AggregatedMetrics, AIAnalysisResult } from '@/lib/types/media-buyer';
import { MEDIA_BUYER_PROMPT, MEDIA_BUYER_ERRORS } from '@/lib/ai/prompts';
import { TOKEN_LIMITS } from '@/lib/ai/index';

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000, // ms
  maxDelay: 8000, // ms
  backoffMultiplier: 2,
};

/**
 * Generate AI analysis for campaign
 * 
 * @param campaignData - Complete campaign data
 * @param metrics - Aggregated metrics
 * @returns AI analysis result with insights
 * @throws Error if all retry attempts fail
 */
export async function generateAIAnalysis(
  campaignData: CampaignData,
  metrics: AggregatedMetrics
): Promise<AIAnalysisResult> {
  // Prepare campaign data summary for prompt
  const campaignSummary = {
    kampanya_adi: campaignData.campaign.campaign_name,
    kampanya_amaci: campaignData.campaign.objective || 'BILINMIYOR',
    musteri: campaignData.client.client_name,
    sektor: campaignData.client.industry,
    tarih_araligi: `${metrics.dateRange.start} - ${metrics.dateRange.end}`,
    metrikler: {
      toplam_harcama: `₺${metrics.totalSpend.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`,
      toplam_gorunum: metrics.totalImpressions.toLocaleString('tr-TR'),
      toplam_tiklanma: metrics.totalClicks.toLocaleString('tr-TR'),
      toplam_donusum: metrics.totalConversions,
      ortalama_ctr: `${metrics.avgCTR.toFixed(2)}%`,
      ortalama_cvr: `${metrics.avgCVR.toFixed(2)}%`,
      ortalama_roas: metrics.avgROAS.toFixed(2),
      ortalama_cpa: `₺${metrics.avgCPA.toFixed(2)}`,
      ortalama_cpm: `₺${metrics.avgCPM.toFixed(2)}`,
      ortalama_frekans: metrics.avgFrequency.toFixed(2),
      toplam_mesajlasma: metrics.totalConversations || 0,
      toplam_link_tiklama: metrics.totalLinkClicks || 0,
      toplam_etkilesim: metrics.totalPostEngagement || 0,
      toplam_lead: metrics.totalLeads || 0,
    },
    reklam_setleri: campaignData.adSets.length,
    reklamlar: campaignData.ads.length,
    onemli_not: campaignData.campaign.objective?.includes('ENGAGEMENT') || campaignData.campaign.objective?.includes('ETKILESIM')
      ? 'BU ETKİLEŞİM KAMPANYASIDIR. ROAS ve dönüşüm 0 olması tamamen normaldir, sorun olarak GÖSTERME.'
      : campaignData.campaign.objective?.includes('MESSAGE') || campaignData.campaign.objective?.includes('MESAJ')
      ? 'BU MESAJ KAMPANYASIDIR. ROAS ve dönüşüm 0 olması tamamen normaldir. Mesajlaşma sayısına ve maliyetine odaklan.'
      : ''
  };

  // Build prompt with campaign data
  const prompt = MEDIA_BUYER_PROMPT.replace(
    '{campaignData}',
    JSON.stringify(campaignSummary, null, 2)
  );

  // Call Groq API with retry logic
  return await retryWithBackoff(async () => {
    try {
      const result = await generateAI<AIAnalysisResult>(
        'media_buyer',
        prompt,
        TOKEN_LIMITS.MEDIA_BUYER
      );

      // Validate response structure
      validateAIResponse(result);

      return result;
    } catch (error) {
      console.error('Groq API error:', error);
      throw new Error(MEDIA_BUYER_ERRORS.API_ERROR);
    }
  });
}

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  attempt: number = 1
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (attempt >= RETRY_CONFIG.maxAttempts) {
      throw new Error(MEDIA_BUYER_ERRORS.API_ERROR);
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1),
      RETRY_CONFIG.maxDelay
    );

    console.log(`Retry attempt ${attempt + 1} after ${delay}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));

    return retryWithBackoff(fn, attempt + 1);
  }
}

/**
 * Validate AI response structure
 */
function validateAIResponse(result: any): asserts result is AIAnalysisResult {
  if (!result || typeof result !== 'object') {
    throw new Error('Invalid AI response format');
  }

  if (!result.summary || typeof result.summary !== 'string') {
    throw new Error('Missing or invalid summary in AI response');
  }

  // kpiOverview should be an array of KPI objects
  if (!Array.isArray(result.kpiOverview)) {
    throw new Error('Missing or invalid kpiOverview in AI response');
  }

  // Validate each KPI in kpiOverview
  result.kpiOverview.forEach((kpi: any, index: number) => {
    if (!kpi.name || !kpi.value || !kpi.status || !kpi.benchmark) {
      throw new Error(`Invalid KPI structure at index ${index}`);
    }
    const validStatuses = ['good', 'warning', 'bad'];
    if (!validStatuses.includes(kpi.status)) {
      throw new Error(`Invalid status at KPI ${index}: ${kpi.status}`);
    }
  });

  if (!Array.isArray(result.issues)) {
    throw new Error('Missing or invalid issues array in AI response');
  }

  if (!Array.isArray(result.recommendations)) {
    throw new Error('Missing or invalid recommendations array in AI response');
  }

  if (!Array.isArray(result.nextTests)) {
    throw new Error('Missing or invalid nextTests array in AI response');
  }

  // Validate issue severity values
  const validSeverities = ['critical', 'high', 'medium', 'low'];
  result.issues.forEach((issue: any, index: number) => {
    if (!issue.description || !issue.severity) {
      throw new Error(`Invalid issue structure at index ${index}`);
    }
    if (!validSeverities.includes(issue.severity)) {
      throw new Error(`Invalid severity at issue ${index}: ${issue.severity}`);
    }
  });

  // Validate recommendation structure
  const validImpacts = ['high', 'medium', 'low'];
  result.recommendations.forEach((rec: any, index: number) => {
    if (!rec.action || !rec.explanation || !rec.impact) {
      throw new Error(`Invalid recommendation structure at index ${index}`);
    }
    if (!validImpacts.includes(rec.impact)) {
      throw new Error(`Invalid impact at recommendation ${index}: ${rec.impact}`);
    }
  });
}
