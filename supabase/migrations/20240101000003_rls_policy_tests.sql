-- RLS Policy Test Scenarios
-- This file documents the RLS policies applied to all tables
-- and provides test scenarios to verify user isolation

-- ============================================
-- RLS POLICY SUMMARY
-- ============================================

-- All tables have RLS enabled with the following policies:

-- 1. USERS TABLE
--    Policy: Users can only access their own data
--    Condition: auth.uid() = user_id

-- 2. CLIENTS TABLE
--    Policy: Users can only access their own clients
--    Condition: user_id = auth.uid()

-- 3. COMMISSION_MODELS TABLE
--    Policy: Users can access commission models for their clients
--    Condition: client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid())

-- 4. CAMPAIGNS TABLE
--    Policy: Users can access campaigns for their clients
--    Condition: client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid())

-- 5. AD_SETS TABLE
--    Policy: Users can access ad sets for their campaigns
--    Condition: campaign_id IN (SELECT campaign_id FROM campaigns WHERE client_id IN (...))

-- 6. ADS TABLE
--    Policy: Users can access ads for their ad sets
--    Condition: ad_set_id IN (SELECT ad_set_id FROM ad_sets WHERE campaign_id IN (...))

-- 7. META_METRICS TABLE
--    Policy: Users can access metrics for their ads
--    Condition: ad_id IN (SELECT ad_id FROM ads WHERE ad_set_id IN (...))

-- 8. LEADS TABLE
--    Policy: Users can access leads for their ads
--    Condition: ad_id IN (SELECT ad_id FROM ads WHERE ad_set_id IN (...))

-- 9. AI_RECOMMENDATIONS TABLE
--    Policy: Users can access recommendations for their clients
--    Condition: client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid())

-- 10. CREATIVE_LIBRARY TABLE
--     Policy: Users can only access their own creative library
--     Condition: user_id = auth.uid()

-- 11. REPORTS TABLE
--     Policy: Users can access reports for their clients
--     Condition: client_id IN (SELECT client_id FROM clients WHERE user_id = auth.uid())

-- 12. NOTIFICATIONS TABLE
--     Policy: Users can only access their own notifications
--     Condition: user_id = auth.uid()

-- 13. META_TOKENS TABLE
--     Policy: Users can only access their own tokens
--     Condition: user_id = auth.uid()

-- ============================================
-- TEST SCENARIOS
-- ============================================

-- Test Scenario 1: User A cannot access User B's clients
-- Expected: User A queries clients table and only sees their own clients

-- Test Scenario 2: User A cannot access User B's campaigns
-- Expected: User A queries campaigns table and only sees campaigns for their clients

-- Test Scenario 3: User A cannot access User B's metrics
-- Expected: User A queries meta_metrics and only sees metrics for their ads

-- Test Scenario 4: User A cannot access User B's recommendations
-- Expected: User A queries ai_recommendations and only sees recommendations for their clients

-- Test Scenario 5: User A cannot access User B's creative library
-- Expected: User A queries creative_library and only sees their own content

-- Test Scenario 6: User A cannot access User B's notifications
-- Expected: User A queries notifications and only sees their own notifications

-- Test Scenario 7: User A cannot access User B's tokens
-- Expected: User A queries meta_tokens and only sees their own tokens

-- Test Scenario 8: Cascade delete works correctly
-- Expected: When a client is deleted, all associated campaigns, ad_sets, ads, metrics, leads, recommendations, and reports are also deleted

-- Test Scenario 9: Foreign key constraints prevent orphaned records
-- Expected: Cannot create a campaign without a valid client_id
-- Expected: Cannot create an ad_set without a valid campaign_id
-- Expected: Cannot create an ad without a valid ad_set_id
-- Expected: Cannot create a metric without a valid ad_id

-- ============================================
-- VERIFICATION QUERIES (Run as different users)
-- ============================================

-- To verify RLS policies, run these queries as different authenticated users:

-- 1. Check user isolation for clients:
-- SELECT * FROM clients;
-- Should only return clients where user_id = auth.uid()

-- 2. Check user isolation for campaigns:
-- SELECT * FROM campaigns;
-- Should only return campaigns for the authenticated user's clients

-- 3. Check user isolation for metrics:
-- SELECT * FROM meta_metrics;
-- Should only return metrics for the authenticated user's ads

-- 4. Check cascade delete:
-- DELETE FROM clients WHERE client_id = '<some_client_id>';
-- Should also delete all campaigns, ad_sets, ads, metrics, leads, recommendations, and reports

-- 5. Check foreign key constraints:
-- INSERT INTO campaigns (client_id, meta_campaign_id, campaign_name, status) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'test', 'test', 'active');
-- Should fail with foreign key violation

-- ============================================
-- NOTES
-- ============================================

-- 1. All RLS policies use auth.uid() to identify the current user
-- 2. Supabase Auth automatically sets auth.uid() based on the JWT token
-- 3. RLS policies are enforced at the database level, not application level
-- 4. Even if application code is compromised, RLS prevents data leakage
-- 5. All foreign keys use ON DELETE CASCADE to maintain referential integrity
-- 6. Indexes are created on foreign key columns for query performance
