/**
 * Mock Meta Graph API Responses
 * 
 * Provides mock data for Meta API endpoints used in testing.
 */

export const mockMetaCampaign = {
  id: '123456789',
  name: 'Test Campaign',
  status: 'ACTIVE',
  objective: 'CONVERSIONS',
  created_time: '2024-01-01T00:00:00+0000',
  updated_time: '2024-01-15T00:00:00+0000',
};

export const mockMetaAdSet = {
  id: '987654321',
  campaign_id: '123456789',
  name: 'Test Ad Set',
  status: 'ACTIVE',
  daily_budget: '10000',
  lifetime_budget: null,
  created_time: '2024-01-01T00:00:00+0000',
};

export const mockMetaAd = {
  id: '555666777',
  ad_set_id: '987654321',
  name: 'Test Ad',
  status: 'ACTIVE',
  creative: {
    id: '111222333',
    image_url: 'https://example.com/image.jpg',
  },
  created_time: '2024-01-01T00:00:00+0000',
};

export const mockMetaInsights = {
  data: [
    {
      date_start: '2024-01-01',
      date_stop: '2024-01-01',
      spend: '5000.00',
      impressions: '10000',
      clicks: '500',
      actions: [
        { action_type: 'purchase', value: '10' },
        { action_type: 'add_to_cart', value: '50' },
      ],
      action_values: [
        { action_type: 'purchase', value: '15000.00' },
      ],
      frequency: '2.5',
      cpc: '10.00',
      cpm: '500.00',
      ctr: '5.00',
    },
  ],
};

export const mockMetaAPIError = {
  error: {
    message: 'Invalid OAuth access token',
    type: 'OAuthException',
    code: 190,
    error_subcode: 463,
  },
};

export const mockMetaRateLimitError = {
  error: {
    message: 'Application request limit reached',
    type: 'OAuthException',
    code: 4,
  },
};

/**
 * Mock Meta API Client
 */
export class MockMetaAPIClient {
  private shouldFail: boolean = false;
  private shouldRateLimit: boolean = false;
  private callCount: number = 0;

  setFailure(fail: boolean) {
    this.shouldFail = fail;
  }

  setRateLimit(limit: boolean) {
    this.shouldRateLimit = limit;
  }

  getCallCount() {
    return this.callCount;
  }

  resetCallCount() {
    this.callCount = 0;
  }

  async getCampaigns(adAccountId: string) {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error(JSON.stringify(mockMetaAPIError));
    }
    
    if (this.shouldRateLimit) {
      throw new Error(JSON.stringify(mockMetaRateLimitError));
    }

    return {
      data: [mockMetaCampaign],
      paging: {},
    };
  }

  async getAdSets(campaignId: string) {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error(JSON.stringify(mockMetaAPIError));
    }

    return {
      data: [mockMetaAdSet],
      paging: {},
    };
  }

  async getAds(adSetId: string) {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error(JSON.stringify(mockMetaAPIError));
    }

    return {
      data: [mockMetaAd],
      paging: {},
    };
  }

  async getAdInsights(adId: string, dateRange: { since: string; until: string }) {
    this.callCount++;
    
    if (this.shouldFail) {
      throw new Error(JSON.stringify(mockMetaAPIError));
    }

    return mockMetaInsights;
  }
}

/**
 * Create a mock Meta API client instance
 */
export function createMockMetaClient() {
  return new MockMetaAPIClient();
}
