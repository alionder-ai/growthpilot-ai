/**
 * Feature: growthpilot-ai, Property 11: Database Schema Completeness
 * 
 * Property: For any table in the database schema (Users, Clients, Commission_Models, 
 * Campaigns, Ad_Sets, Ads, Meta_Metrics, Leads, AI_Recommendations, Creative_Library, 
 * Reports, Notifications), all required fields as specified in the requirements should be present.
 * 
 * Validates: Requirements 5.1-5.4, 12.1-12.11
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Define required fields for each table based on requirements
const REQUIRED_SCHEMA = {
  users: ['user_id', 'email', 'created_at', 'updated_at'],
  clients: ['client_id', 'user_id', 'name', 'industry', 'contact_email', 'contact_phone', 'created_at', 'updated_at'],
  commission_models: ['model_id', 'client_id', 'commission_percentage', 'calculation_basis', 'created_at'],
  campaigns: ['campaign_id', 'client_id', 'campaign_name', 'status', 'created_at'],
  ad_sets: ['ad_set_id', 'campaign_id', 'ad_set_name', 'budget', 'status'],
  ads: ['ad_id', 'ad_set_id', 'ad_name', 'creative_url', 'status'],
  meta_metrics: [
    'metric_id', 'ad_id', 'date', 'spend', 'impressions', 'clicks', 
    'conversions', 'roas', 'ctr', 'cpc', 'cpm', 'cpa', 'frequency', 
    'add_to_cart', 'purchases'
  ],
  leads: ['lead_id', 'ad_id', 'lead_source', 'contact_info', 'converted_status', 'created_at', 'updated_at'],
  ai_recommendations: ['recommendation_id', 'client_id', 'recommendation_type', 'content', 'priority', 'status', 'created_at'],
  creative_library: ['creative_id', 'user_id', 'industry', 'content_type', 'content_text', 'created_at'],
  reports: ['report_id', 'client_id', 'report_type', 'period_start', 'period_end', 'file_url', 'created_at'],
  notifications: ['notification_id', 'user_id', 'message', 'type', 'read_status', 'created_at'],
};

/**
 * Fetch the actual schema from the database for a given table using the get_table_columns function
 */
async function getTableSchema(tableName: string): Promise<string[]> {
  try {
    // Use the get_table_columns RPC function created in migration
    const { data, error } = await supabase.rpc('get_table_columns', {
      p_table_name: tableName
    });

    if (error) {
      console.error(`Error fetching schema for ${tableName}:`, error);
      return [];
    }

    return data?.map((row: any) => row.column_name) || [];
  } catch (err) {
    console.error(`Exception querying schema for ${tableName}:`, err);
    return [];
  }
}

/**
 * Check if all required fields exist in the actual schema
 */
function validateTableSchema(tableName: string, actualColumns: string[], requiredColumns: string[]): {
  isValid: boolean;
  missingFields: string[];
} {
  const missingFields = requiredColumns.filter(
    (requiredCol) => !actualColumns.includes(requiredCol)
  );

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

describe('Property 11: Database Schema Completeness', () => {
  // Test each table individually for better error reporting
  describe('Users table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('users');
      const { isValid, missingFields } = validateTableSchema(
        'users',
        actualColumns,
        REQUIRED_SCHEMA.users
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in users table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Clients table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('clients');
      const { isValid, missingFields } = validateTableSchema(
        'clients',
        actualColumns,
        REQUIRED_SCHEMA.clients
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in clients table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Commission_Models table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('commission_models');
      const { isValid, missingFields } = validateTableSchema(
        'commission_models',
        actualColumns,
        REQUIRED_SCHEMA.commission_models
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in commission_models table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Campaigns table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('campaigns');
      const { isValid, missingFields } = validateTableSchema(
        'campaigns',
        actualColumns,
        REQUIRED_SCHEMA.campaigns
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in campaigns table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Ad_Sets table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('ad_sets');
      const { isValid, missingFields } = validateTableSchema(
        'ad_sets',
        actualColumns,
        REQUIRED_SCHEMA.ad_sets
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in ad_sets table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Ads table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('ads');
      const { isValid, missingFields } = validateTableSchema(
        'ads',
        actualColumns,
        REQUIRED_SCHEMA.ads
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in ads table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Meta_Metrics table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('meta_metrics');
      const { isValid, missingFields } = validateTableSchema(
        'meta_metrics',
        actualColumns,
        REQUIRED_SCHEMA.meta_metrics
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in meta_metrics table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Leads table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('leads');
      const { isValid, missingFields } = validateTableSchema(
        'leads',
        actualColumns,
        REQUIRED_SCHEMA.leads
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in leads table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('AI_Recommendations table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('ai_recommendations');
      const { isValid, missingFields } = validateTableSchema(
        'ai_recommendations',
        actualColumns,
        REQUIRED_SCHEMA.ai_recommendations
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in ai_recommendations table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Creative_Library table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('creative_library');
      const { isValid, missingFields } = validateTableSchema(
        'creative_library',
        actualColumns,
        REQUIRED_SCHEMA.creative_library
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in creative_library table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Reports table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('reports');
      const { isValid, missingFields } = validateTableSchema(
        'reports',
        actualColumns,
        REQUIRED_SCHEMA.reports
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in reports table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  describe('Notifications table schema', () => {
    it('should have all required fields', async () => {
      const actualColumns = await getTableSchema('notifications');
      const { isValid, missingFields } = validateTableSchema(
        'notifications',
        actualColumns,
        REQUIRED_SCHEMA.notifications
      );

      expect(isValid).toBe(true);
      if (!isValid) {
        console.error(`Missing fields in notifications table: ${missingFields.join(', ')}`);
      }
      expect(missingFields).toEqual([]);
    });
  });

  // Property-based test: For any table in the schema, all required fields should exist
  describe('Property-based schema validation', () => {
    it('should validate that all tables have their required fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...Object.keys(REQUIRED_SCHEMA)),
          async (tableName) => {
            const actualColumns = await getTableSchema(tableName);
            const requiredColumns = REQUIRED_SCHEMA[tableName as keyof typeof REQUIRED_SCHEMA];
            
            const { isValid, missingFields } = validateTableSchema(
              tableName,
              actualColumns,
              requiredColumns
            );

            if (!isValid) {
              console.error(
                `Table ${tableName} is missing required fields: ${missingFields.join(', ')}`
              );
            }

            return isValid;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
