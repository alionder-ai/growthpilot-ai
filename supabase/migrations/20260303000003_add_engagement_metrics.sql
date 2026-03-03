-- Add new engagement and video metrics columns to meta_metrics table
-- Migration: 20260303000003_add_engagement_metrics

-- Add engagement metrics
ALTER TABLE meta_metrics 
  ADD COLUMN IF NOT EXISTS conversations INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS link_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS post_engagement INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach INTEGER DEFAULT 0;

-- Add video completion percentage metrics
ALTER TABLE meta_metrics
  ADD COLUMN IF NOT EXISTS video_p25 DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p50 DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p75 DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS video_p95 DECIMAL(5,2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN meta_metrics.conversations IS 'Number of messaging conversations started';
COMMENT ON COLUMN meta_metrics.link_clicks IS 'Number of link clicks';
COMMENT ON COLUMN meta_metrics.post_engagement IS 'Number of post engagements';
COMMENT ON COLUMN meta_metrics.leads IS 'Number of leads generated';
COMMENT ON COLUMN meta_metrics.video_views IS 'Number of video views';
COMMENT ON COLUMN meta_metrics.reach IS 'Number of unique people reached';
COMMENT ON COLUMN meta_metrics.video_p25 IS 'Percentage of video watched to 25%';
COMMENT ON COLUMN meta_metrics.video_p50 IS 'Percentage of video watched to 50%';
COMMENT ON COLUMN meta_metrics.video_p75 IS 'Percentage of video watched to 75%';
COMMENT ON COLUMN meta_metrics.video_p95 IS 'Percentage of video watched to 95%';
