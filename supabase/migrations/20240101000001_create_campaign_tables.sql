-- Campaigns Table
CREATE TABLE campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  meta_campaign_id VARCHAR(255) UNIQUE NOT NULL,
  campaign_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_campaigns_client_id ON campaigns(client_id);
CREATE INDEX idx_campaigns_meta_campaign_id ON campaigns(meta_campaign_id);

-- RLS Policy for Campaigns
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access campaigns for their clients"
  ON campaigns FOR ALL
  USING (client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid()));

-- Ad_Sets Table
CREATE TABLE ad_sets (
  ad_set_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  meta_ad_set_id VARCHAR(255) UNIQUE NOT NULL,
  ad_set_name VARCHAR(255) NOT NULL,
  budget DECIMAL(12,2),
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_ad_sets_campaign_id ON ad_sets(campaign_id);
CREATE INDEX idx_ad_sets_meta_ad_set_id ON ad_sets(meta_ad_set_id);

-- RLS Policy for Ad_Sets
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access ad sets for their campaigns"
  ON ad_sets FOR ALL
  USING (campaign_id IN (
    SELECT campaign_id FROM campaigns WHERE client_id IN (
      SELECT client_id FROM clients WHERE user_id = auth.uid()
    )
  ));

-- Ads Table
CREATE TABLE ads (
  ad_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_set_id UUID NOT NULL REFERENCES ad_sets(ad_set_id) ON DELETE CASCADE,
  meta_ad_id VARCHAR(255) UNIQUE NOT NULL,
  ad_name VARCHAR(255) NOT NULL,
  creative_url TEXT,
  status VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_ads_ad_set_id ON ads(ad_set_id);
CREATE INDEX idx_ads_meta_ad_id ON ads(meta_ad_id);

-- RLS Policy for Ads
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access ads for their ad sets"
  ON ads FOR ALL
  USING (ad_set_id IN (
    SELECT ad_set_id FROM ad_sets WHERE campaign_id IN (
      SELECT campaign_id FROM campaigns WHERE client_id IN (
        SELECT client_id FROM clients WHERE user_id = auth.uid()
      )
    )
  ));

-- Meta_Metrics Table
CREATE TABLE meta_metrics (
  metric_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(ad_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  spend DECIMAL(12,2) NOT NULL DEFAULT 0,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  roas DECIMAL(10,2),
  ctr DECIMAL(5,2),
  cpc DECIMAL(10,2),
  cpm DECIMAL(10,2),
  cpa DECIMAL(10,2),
  frequency DECIMAL(5,2),
  add_to_cart INTEGER DEFAULT 0,
  purchases INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ad_id, date)
);

-- Create indexes for faster queries
CREATE INDEX idx_meta_metrics_ad_id ON meta_metrics(ad_id);
CREATE INDEX idx_meta_metrics_date ON meta_metrics(date);
CREATE INDEX idx_meta_metrics_ad_id_date ON meta_metrics(ad_id, date);

-- RLS Policy for Meta_Metrics
ALTER TABLE meta_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access metrics for their ads"
  ON meta_metrics FOR ALL
  USING (ad_id IN (
    SELECT ad_id FROM ads WHERE ad_set_id IN (
      SELECT ad_set_id FROM ad_sets WHERE campaign_id IN (
        SELECT campaign_id FROM campaigns WHERE client_id IN (
          SELECT client_id FROM clients WHERE user_id = auth.uid()
        )
      )
    )
  ));
