// Database types
export interface User {
  user_id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  client_id: string;
  user_id: string;
  name: string;
  industry: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  meta_ad_account_id: string | null;
  meta_connected: boolean;
  meta_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CommissionModel {
  model_id: string;
  client_id: string;
  commission_percentage: number;
  calculation_basis: 'sales_revenue' | 'total_revenue';
  created_at: string;
}

export interface Campaign {
  campaign_id: string;
  client_id: string;
  meta_campaign_id: string;
  campaign_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AdSet {
  ad_set_id: string;
  campaign_id: string;
  meta_ad_set_id: string;
  ad_set_name: string;
  budget: number | null;
  status: string;
  created_at: string;
}

export interface Ad {
  ad_id: string;
  ad_set_id: string;
  meta_ad_id: string;
  ad_name: string;
  creative_url: string | null;
  status: string;
  created_at: string;
}

export interface MetaMetrics {
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

export interface Lead {
  lead_id: string;
  ad_id: string;
  lead_source: string | null;
  contact_info: Record<string, any> | null;
  converted_status: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIRecommendation {
  recommendation_id: string;
  client_id: string;
  recommendation_type: 'action_plan' | 'strategy_card';
  content: Record<string, any>;
  priority: 'high' | 'medium' | 'low' | null;
  status: 'active' | 'completed' | 'dismissed';
  created_at: string;
}

export interface CreativeLibrary {
  creative_id: string;
  user_id: string;
  industry: string;
  content_type: 'ad_copy' | 'video_script' | 'voiceover';
  content_text: string;
  created_at: string;
}

export interface Report {
  report_id: string;
  client_id: string;
  report_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  file_url: string | null;
  created_at: string;
}

export interface Notification {
  notification_id: string;
  user_id: string;
  message: string;
  type: 'roas_alert' | 'budget_alert' | 'sync_error' | 'general';
  read_status: boolean;
  created_at: string;
}

export interface MetaToken {
  token_id: string;
  user_id: string;
  encrypted_access_token: string;
  ad_account_id: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
