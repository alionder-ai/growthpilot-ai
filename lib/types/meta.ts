/**
 * Type definitions for Meta API integration
 */

export interface MetaToken {
  token_id: string;
  user_id: string;
  encrypted_access_token: string;
  ad_account_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface MetaCampaign {
  campaign_id: string;
  client_id: string;
  meta_campaign_id: string;
  campaign_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MetaAdSet {
  ad_set_id: string;
  campaign_id: string;
  meta_ad_set_id: string;
  ad_set_name: string;
  budget: number | null;
  status: string;
  created_at: string;
}

export interface MetaAd {
  ad_id: string;
  ad_set_id: string;
  meta_ad_id: string;
  ad_name: string;
  creative_url: string | null;
  status: string;
  created_at: string;
}

export interface MetaMetric {
  metric_id: string;
  ad_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  cpa: number | null;
  frequency: number | null;
  add_to_cart: number;
  purchases: number;
  created_at: string;
}

export interface SyncStatus {
  isConnected: boolean;
  lastSyncAt: string | null;
  adAccountId: string | null;
  tokenExpiresAt: string | null;
}
