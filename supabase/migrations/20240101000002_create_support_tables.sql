-- Leads Table
CREATE TABLE leads (
  lead_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_id UUID NOT NULL REFERENCES ads(ad_id) ON DELETE CASCADE,
  lead_source VARCHAR(100),
  contact_info JSONB,
  converted_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_leads_ad_id ON leads(ad_id);
CREATE INDEX idx_leads_converted_status ON leads(converted_status);

-- RLS Policy for Leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access leads for their ads"
  ON leads FOR ALL
  USING (ad_id IN (
    SELECT ad_id FROM ads WHERE ad_set_id IN (
      SELECT ad_set_id FROM ad_sets WHERE campaign_id IN (
        SELECT campaign_id FROM campaigns WHERE client_id IN (
          SELECT client_id FROM clients WHERE user_id = auth.uid()
        )
      )
    )
  ));

-- AI_Recommendations Table
CREATE TABLE ai_recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('action_plan', 'strategy_card')),
  content JSONB NOT NULL,
  priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_ai_recommendations_client_id ON ai_recommendations(client_id);
CREATE INDEX idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX idx_ai_recommendations_created_at ON ai_recommendations(created_at);

-- RLS Policy for AI_Recommendations
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access recommendations for their clients"
  ON ai_recommendations FOR ALL
  USING (client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid()));

-- Creative_Library Table
CREATE TABLE creative_library (
  creative_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  industry VARCHAR(100) NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('ad_copy', 'video_script', 'voiceover')),
  content_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_creative_library_user_id ON creative_library(user_id);
CREATE INDEX idx_creative_library_industry ON creative_library(industry);

-- RLS Policy for Creative_Library
ALTER TABLE creative_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own creative library"
  ON creative_library FOR ALL
  USING (user_id = auth.uid());

-- Reports Table
CREATE TABLE reports (
  report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE CASCADE,
  report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_reports_client_id ON reports(client_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- RLS Policy for Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access reports for their clients"
  ON reports FOR ALL
  USING (client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid()));

-- Notifications Table
CREATE TABLE notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('roas_alert', 'budget_alert', 'sync_error', 'general')),
  read_status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_status ON notifications(read_status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- RLS Policy for Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own notifications"
  ON notifications FOR ALL
  USING (user_id = auth.uid());

-- Meta_Tokens Table (for secure token storage)
CREATE TABLE meta_tokens (
  token_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  encrypted_access_token TEXT NOT NULL,
  ad_account_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_meta_tokens_user_id ON meta_tokens(user_id);

-- RLS Policy for Meta_Tokens
ALTER TABLE meta_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own tokens"
  ON meta_tokens FOR ALL
  USING (user_id = auth.uid());
