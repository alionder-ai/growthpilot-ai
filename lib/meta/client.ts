import { decrypt } from '@/lib/utils/encryption';

const META_API_BASE_URL = 'https://graph.facebook.com/v18.0';
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

interface MetaAPIError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
}

interface MetaAPIResponse<T> {
  data?: T;
  error?: MetaAPIError;
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  created_time: string;
  updated_time: string;
}

export interface AdSet {
  id: string;
  name: string;
  campaign_id: string;
  status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time: string;
}

export interface Ad {
  id: string;
  name: string;
  adset_id: string;
  status: string;
  creative?: {
    id: string;
    thumbnail_url?: string;
  };
  created_time: string;
}

export interface AdInsights {
  ad_id: string;
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  clicks: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
  action_values?: Array<{
    action_type: string;
    value: string;
  }>;
  frequency?: string;
}

export interface DateRange {
  since: string; // YYYY-MM-DD
  until: string; // YYYY-MM-DD
}

/**
 * Meta API Client for fetching campaign data
 */
export class MetaAPIClient {
  private accessToken: string;

  constructor(encryptedAccessToken: string) {
    this.accessToken = decrypt(encryptedAccessToken);
  }

  /**
   * Makes a request to Meta Graph API with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string> = {}
  ): Promise<T> {
    const url = new URL(`${META_API_BASE_URL}${endpoint}`);
    url.searchParams.append('access_token', this.accessToken);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    // Log the request (without token for security)
    const urlForLog = new URL(url.toString());
    urlForLog.searchParams.set('access_token', '[REDACTED]');
    console.log('[META CLIENT] API İsteği:', {
      endpoint,
      params,
      fullUrl: urlForLog.toString(),
    });

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('[META CLIENT] API Yanıt Durumu:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        const data: MetaAPIResponse<T> = await response.json();

        console.log('[META CLIENT] API Yanıt Verisi:', {
          hasData: !!data.data,
          hasError: !!data.error,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          dataLength: Array.isArray(data.data) ? data.data.length : 'N/A',
          rawData: JSON.stringify(data).substring(0, 500), // First 500 chars
        });

        if (data.error) {
          console.error('[META CLIENT] API Hatası:', {
            code: data.error.code,
            type: data.error.type,
            message: data.error.message,
            subcode: data.error.error_subcode,
          });

          // Handle rate limiting
          if (data.error.code === 17 || data.error.code === 32) {
            throw new Error('RATE_LIMIT');
          }

          // Handle authentication errors
          if (data.error.code === 190) {
            throw new Error('AUTH_ERROR');
          }

          throw new Error(data.error.message);
        }

        return data.data as T;
      } catch (error) {
        lastError = error as Error;

        console.error('[META CLIENT] İstek Hatası:', {
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          error: lastError.message,
          willRetry: attempt < MAX_RETRIES - 1 && lastError.message !== 'AUTH_ERROR',
        });

        // Don't retry on authentication errors
        if (lastError.message === 'AUTH_ERROR') {
          throw lastError;
        }

        // Exponential backoff
        if (attempt < MAX_RETRIES - 1) {
          const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Fetches all campaigns for an ad account
   */
  async getCampaigns(adAccountId: string): Promise<Campaign[]> {
    console.log('[META CLIENT] getCampaigns çağrıldı:', {
      adAccountId,
      fullAccountId: `act_${adAccountId}`,
    });

    const campaigns = await this.makeRequest<Campaign[]>(
      `/act_${adAccountId}/campaigns`,
      {
        fields: 'id,name,status,objective,created_time,updated_time',
        limit: '100', // Ensure we get all campaigns
      }
    );

    console.log('[META CLIENT] getCampaigns yanıtı:', {
      campaignCount: campaigns?.length || 0,
      campaigns: campaigns || [],
    });

    return campaigns || [];
  }

  /**
   * Fetches all ad sets for a campaign
   */
  async getAdSets(campaignId: string): Promise<AdSet[]> {
    const adSets = await this.makeRequest<AdSet[]>(
      `/${campaignId}/adsets`,
      {
        fields: 'id,name,campaign_id,status,daily_budget,lifetime_budget,created_time',
      }
    );

    return adSets;
  }

  /**
   * Fetches all ads for an ad set
   */
  async getAds(adSetId: string): Promise<Ad[]> {
    const ads = await this.makeRequest<Ad[]>(
      `/${adSetId}/ads`,
      {
        fields: 'id,name,adset_id,status,creative{id,thumbnail_url},created_time',
      }
    );

    return ads;
  }

  /**
   * Fetches insights (metrics) for an ad
   */
  async getAdInsights(
    adId: string,
    dateRange: DateRange
  ): Promise<AdInsights | null> {
    try {
      const insights = await this.makeRequest<AdInsights[]>(
        `/${adId}/insights`,
        {
          fields: 'ad_id,date_start,date_stop,spend,impressions,clicks,actions,action_values,frequency',
          time_range: JSON.stringify({
            since: dateRange.since,
            until: dateRange.until,
          }),
        }
      );

      return insights.length > 0 ? insights[0] : null;
    } catch (error) {
      // Insights might not be available for all ads
      console.error(`Failed to fetch insights for ad ${adId}:`, error);
      return null;
    }
  }

  /**
   * Fetches insights for multiple ads in batch
   */
  async getBatchAdInsights(
    adIds: string[],
    dateRange: DateRange
  ): Promise<Map<string, AdInsights>> {
    const insightsMap = new Map<string, AdInsights>();

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < adIds.length; i += batchSize) {
      const batch = adIds.slice(i, i + batchSize);
      
      const promises = batch.map(async (adId) => {
        const insights = await this.getAdInsights(adId, dateRange);
        if (insights) {
          insightsMap.set(adId, insights);
        }
      });

      await Promise.all(promises);

      // Small delay between batches to respect rate limits
      if (i + batchSize < adIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return insightsMap;
  }
}

/**
 * Creates a Meta API client instance with encrypted token
 */
export function createMetaAPIClient(encryptedAccessToken: string): MetaAPIClient {
  return new MetaAPIClient(encryptedAccessToken);
}
