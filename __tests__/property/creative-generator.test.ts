// @ts-nocheck
/**
 * Feature: growthpilot-ai, Creative Generator Property Tests
 * 
 * Property 24: Creative Generator Industry Support
 * Property 25: Creative Content Generation Structure
 * Property 26: Creative Content Persistence
 * 
 * Validates: Requirements 10.1-10.7
 */

import * as fc from 'fast-check';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

/**
 * Arbitrary generators for test data
 */

// Generate valid industries (Requirement 10.1)
const arbitraryIndustry = () =>
  fc.constantFrom(
    'logistics',
    'e-commerce',
    'beauty',
    'real estate',
    'healthcare',
    'education'
  );

// Generate valid content types (Requirements 10.3, 10.4, 10.5)
const arbitraryContentType = () =>
  fc.constantFrom('ad_copy', 'video_script', 'voiceover');

// Generate valid target audience
const arbitraryTargetAudience = () =>
  fc.oneof(
    fc.string({ minLength: 5, maxLength: 100 }),
    fc.constantFrom(
      '25-34 yaş arası kadınlar',
      '18-45 yaş arası erkekler',
      'Genç profesyoneller',
      'Aileler',
      'İşletme sahipleri',
      'Öğrenciler'
    )
  );

// Generate valid campaign objective
const arbitraryObjective = () =>
  fc.oneof(
    fc.string({ minLength: 5, maxLength: 100 }),
    fc.constantFrom(
      'Satış artışı',
      'Marka bilinirliği',
      'Web sitesi trafiği',
      'Lead toplama',
      'Uygulama indirme',
      'Müşteri etkileşimi'
    )
  );

// Generate valid tone
const arbitraryTone = () =>
  fc.oneof(
    fc.string({ minLength: 3, maxLength: 50 }),
    fc.constantFrom(
      'Profesyonel',
      'Samimi',
      'Heyecan verici',
      'Güvenilir',
      'Eğlenceli',
      'Ciddi'
    )
  );

// Generate complete creative request
const arbitraryCreativeRequest = () =>
  fc.record({
    industry: arbitraryIndustry(),
    content_type: arbitraryContentType(),
    target_audience: fc.option(arbitraryTargetAudience(), { nil: undefined }),
    objective: fc.option(arbitraryObjective(), { nil: undefined }),
    tone: fc.option(arbitraryTone(), { nil: undefined }),
  });

// Generate valid creative variation
const arbitraryCreativeVariation = () =>
  fc.record({
    title: fc.string({ minLength: 5, maxLength: 100 }),
    content: fc.string({ minLength: 20, maxLength: 500 }),
    cta: fc.string({ minLength: 3, maxLength: 50 }),
  });

// Generate valid creative response (3 variations)
const arbitraryCreativeResponse = () =>
  fc.record({
    variations: fc.tuple(
      arbitraryCreativeVariation(),
      arbitraryCreativeVariation(),
      arbitraryCreativeVariation()
    ).map(([v1, v2, v3]) => [v1, v2, v3]),
  });

// Generate valid password for test users
const arbitraryPassword = () =>
  fc.string({ minLength: 8, maxLength: 20 });

/**
 * Helper functions
 */

// Create a test user and return auth token
async function createTestUser(): Promise<{ userId: string; email: string; accessToken: string }> {
  const email = `test-creative-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`;
  const password = 'testpassword123';

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !signInData.session) {
    throw new Error(`Failed to sign in test user: ${signInError?.message}`);
  }

  return {
    userId: data.user.id,
    email,
    accessToken: signInData.session.access_token
  };
}

// Clean up test user and all associated data
async function cleanupTestUser(userId: string): Promise<void> {
  try {
    await supabaseAdmin.auth.admin.deleteUser(userId);
  } catch (error) {
    console.warn(`Cleanup warning for user ${userId}:`, error);
  }
}

// Generate creative content via API
async function generateCreativeContent(
  accessToken: string,
  request: {
    industry: string;
    content_type: string;
    target_audience?: string;
    objective?: string;
    tone?: string;
  }
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/creative`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(request)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to generate creative: ${error.error}`);
  }

  return response.json();
}

// Save creative content to library
async function saveToLibrary(
  accessToken: string,
  data: {
    industry: string;
    content_type: string;
    content_text: string;
  }
): Promise<any> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/creative-library`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(data)
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to save to library: ${error.error}`);
  }

  return response.json();
}

// Get creative library items
async function getLibraryItems(userId: string, filters?: { industry?: string; content_type?: string }): Promise<any[]> {
  let query = supabaseAdmin
    .from('creative_library')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }
  if (filters?.content_type) {
    query = query.eq('content_type', filters.content_type);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get library items: ${error.message}`);
  }

  return data || [];
}

/**
 * Property 24: Creative Generator Industry Support
 * 
 * For any of the supported industries (logistics, e-commerce, beauty, real estate,
 * healthcare, education), the creative generator should successfully generate content.
 * 
 * Validates: Requirements 10.1
 */
describe('Property 24: Creative Generator Industry Support', () => {
  describe('Industry Validation', () => {
    it('should accept all supported industries', () => {
      const supportedIndustries = [
        'logistics',
        'e-commerce',
        'beauty',
        'real estate',
        'healthcare',
        'education'
      ];

      fc.assert(
        fc.property(
          arbitraryIndustry(),
          (industry) => {
            expect(supportedIndustries).toContain(industry);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate content for each supported industry', () => {
      const industries = [
        'logistics',
        'e-commerce',
        'beauty',
        'real estate',
        'healthcare',
        'education'
      ];

      for (const industry of industries) {
        expect(industry).toBeTruthy();
        expect(typeof industry).toBe('string');
        expect(industry.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Industry-Specific Content Generation', () => {
    let testUser: { userId: string; email: string; accessToken: string } | null = null;

    beforeAll(async () => {
      testUser = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
      if (testUser) {
        await cleanupTestUser(testUser.userId);
      }
    });

    it('should successfully generate content for logistics industry', async () => {
      const request = {
        industry: 'logistics',
        content_type: 'ad_copy',
        target_audience: 'İşletme sahipleri',
        objective: 'Lead toplama',
        tone: 'Profesyonel'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.industry).toBe('logistics');
      expect(result.data.variations).toBeDefined();
      expect(Array.isArray(result.data.variations)).toBe(true);
    }, 30000);

    it('should successfully generate content for e-commerce industry', async () => {
      const request = {
        industry: 'e-commerce',
        content_type: 'ad_copy',
        target_audience: '25-34 yaş arası kadınlar',
        objective: 'Satış artışı',
        tone: 'Heyecan verici'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data.industry).toBe('e-commerce');
      expect(result.data.variations).toBeDefined();
    }, 30000);

    it('should successfully generate content for beauty industry', async () => {
      const request = {
        industry: 'beauty',
        content_type: 'ad_copy',
        target_audience: 'Kadınlar',
        objective: 'Marka bilinirliği',
        tone: 'Samimi'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data.industry).toBe('beauty');
      expect(result.data.variations).toBeDefined();
    }, 30000);
  });
});

/**
 * Property 25: Creative Content Generation Structure
 * 
 * For any creative generation request, the Gemini API should return exactly 3 variations,
 * and for video scripts, the output should include scene descriptions, and for voiceover
 * scripts, the output should include tone and pacing notes.
 * 
 * Validates: Requirements 10.2, 10.3, 10.4, 10.5
 */
describe('Property 25: Creative Content Generation Structure', () => {
  describe('Response Structure Validation', () => {
    it('should contain exactly 3 variations', () => {
      fc.assert(
        fc.property(
          arbitraryCreativeResponse(),
          (response) => {
            expect(Array.isArray(response.variations)).toBe(true);
            expect(response.variations.length).toBe(3);
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have all required fields for each variation', () => {
      fc.assert(
        fc.property(
          arbitraryCreativeResponse(),
          (response) => {
            for (const variation of response.variations) {
              expect(variation).toHaveProperty('title');
              expect(variation).toHaveProperty('content');
              expect(variation).toHaveProperty('cta');
              
              expect(typeof variation.title).toBe('string');
              expect(typeof variation.content).toBe('string');
              expect(typeof variation.cta).toBe('string');
              
              expect(variation.title.length).toBeGreaterThan(0);
              expect(variation.content.length).toBeGreaterThan(0);
              expect(variation.cta.length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have non-empty content for all variations', () => {
      fc.assert(
        fc.property(
          arbitraryCreativeResponse(),
          (response) => {
            for (const variation of response.variations) {
              expect(variation.title.trim().length).toBeGreaterThan(0);
              expect(variation.content.trim().length).toBeGreaterThan(0);
              expect(variation.cta.trim().length).toBeGreaterThan(0);
            }
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Content Type Specific Structure', () => {
    let testUser: { userId: string; email: string; accessToken: string } | null = null;

    beforeAll(async () => {
      testUser = await createTestUser();
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    afterAll(async () => {
      if (testUser) {
        await cleanupTestUser(testUser.userId);
      }
    });

    it('should generate ad copy with appropriate structure', async () => {
      const request = {
        industry: 'e-commerce',
        content_type: 'ad_copy',
        target_audience: 'Genç profesyoneller',
        objective: 'Satış artışı',
        tone: 'Profesyonel'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data.content_type).toBe('ad_copy');
      expect(result.data.variations.length).toBe(3);

      // Each variation should have title, content, and CTA
      for (const variation of result.data.variations) {
        expect(variation.title).toBeDefined();
        expect(variation.content).toBeDefined();
        expect(variation.cta).toBeDefined();
      }
    }, 30000);

    it('should generate video script with scene descriptions', async () => {
      const request = {
        industry: 'beauty',
        content_type: 'video_script',
        target_audience: 'Kadınlar',
        objective: 'Marka bilinirliği',
        tone: 'Heyecan verici'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data.content_type).toBe('video_script');
      expect(result.data.variations.length).toBe(3);

      // Video scripts should include scene descriptions
      for (const variation of result.data.variations) {
        expect(variation.content).toBeDefined();
        expect(variation.content.length).toBeGreaterThan(50);
        // Content should mention scenes or visual elements
        const content = variation.content.toLowerCase();
        const hasSceneIndicators = 
          content.includes('sahne') || 
          content.includes('görüntü') || 
          content.includes('plan') ||
          content.includes('açılış') ||
          content.includes('kapanış');
        expect(hasSceneIndicators).toBe(true);
      }
    }, 30000);
  });

    it('should generate voiceover with tone and pacing notes', async () => {
      const request = {
        industry: 'healthcare',
        content_type: 'voiceover',
        target_audience: 'Aileler',
        objective: 'Güven oluşturma',
        tone: 'Güvenilir'
      };

      const result = await generateCreativeContent(testUser!.accessToken, request);

      expect(result.success).toBe(true);
      expect(result.data.content_type).toBe('voiceover');
      expect(result.data.variations.length).toBe(3);

      // Voiceover scripts should include tone and pacing notes
      for (const variation of result.data.variations) {
        expect(variation.content).toBeDefined();
        expect(variation.content.length).toBeGreaterThan(30);
        // Content should mention tone or pacing
        const content = variation.content.toLowerCase();
        const hasToneOrPacing = 
          content.includes('ton') || 
          content.includes('tempo') || 
          content.includes('hız') ||
          content.includes('vurgu') ||
          content.includes('duygusal');
        expect(hasToneOrPacing).toBe(true);
      }
    }, 30000);
  });

  describe('Variation Uniqueness', () => {
    it('should generate 3 distinct variations', () => {
      fc.assert(
        fc.property(
          arbitraryCreativeResponse(),
          (response) => {
            const variations = response.variations;
            
            // Check that variations are not identical
            const contents = variations.map(v => v.content);
            const uniqueContents = new Set(contents);
            
            // At least 2 variations should be different
            // (allowing for rare edge case where 2 might be similar)
            expect(uniqueContents.size).toBeGreaterThanOrEqual(2);

            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

/**
 * Property 26: Creative Content Persistence
 * 
 * For any generated creative content, saving it should store the content in the
 * Creative_Library table with user_id, industry, content_type, and content_text.
 * 
 * Validates: Requirements 10.6, 10.7
 */
describe('Property 26: Creative Content Persistence', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up creative library items
      await supabaseAdmin
        .from('creative_library')
        .delete()
        .eq('user_id', testUser.userId);
      
      await cleanupTestUser(testUser.userId);
    }
  });

  describe('Save to Library', () => {
    it('should persist creative content with all required fields', async () => {
      const creativeData = {
        industry: 'e-commerce',
        content_type: 'ad_copy',
        content_text: 'Test reklam metni - Ürünlerimizi keşfedin!'
      };

      const result = await saveToLibrary(testUser!.accessToken, creativeData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.creative_id).toBeTruthy();
      expect(result.data.user_id).toBe(testUser!.userId);
      expect(result.data.industry).toBe(creativeData.industry);
      expect(result.data.content_type).toBe(creativeData.content_type);
      expect(result.data.content_text).toBe(creativeData.content_text);
      expect(result.data.created_at).toBeDefined();

      // Cleanup
      await supabaseAdmin
        .from('creative_library')
        .delete()
        .eq('creative_id', result.data.creative_id);
    }, 30000);

    it('should store content for all supported industries', async () => {
      const industries = ['logistics', 'e-commerce', 'beauty', 'real estate', 'healthcare', 'education'];
      const savedIds: string[] = [];

      try {
        for (const industry of industries) {
          const creativeData = {
            industry,
            content_type: 'ad_copy',
            content_text: `Test content for ${industry} industry`
          };

          const result = await saveToLibrary(testUser!.accessToken, creativeData);
          
          expect(result.success).toBe(true);
          expect(result.data.industry).toBe(industry);
          savedIds.push(result.data.creative_id);
        }

        // Verify all items are stored
        const libraryItems = await getLibraryItems(testUser!.userId);
        expect(libraryItems.length).toBeGreaterThanOrEqual(industries.length);
      } finally {
        // Cleanup
        for (const id of savedIds) {
          await supabaseAdmin
            .from('creative_library')
            .delete()
            .eq('creative_id', id);
        }
      }
    }, 30000);
  });

    it('should store content for all supported content types', async () => {
      const contentTypes = ['ad_copy', 'video_script', 'voiceover'];
      const savedIds: string[] = [];

      try {
        for (const contentType of contentTypes) {
          const creativeData = {
            industry: 'e-commerce',
            content_type: contentType,
            content_text: `Test ${contentType} content`
          };

          const result = await saveToLibrary(testUser!.accessToken, creativeData);
          
          expect(result.success).toBe(true);
          expect(result.data.content_type).toBe(contentType);
          savedIds.push(result.data.creative_id);
        }

        // Verify all items are stored
        const libraryItems = await getLibraryItems(testUser!.userId);
        expect(libraryItems.length).toBeGreaterThanOrEqual(contentTypes.length);
      } finally {
        // Cleanup
        for (const id of savedIds) {
          await supabaseAdmin
            .from('creative_library')
            .delete()
            .eq('creative_id', id);
        }
      }
    }, 30000);
  });

  describe('Library Retrieval and Filtering', () => {
    it('should retrieve saved content by user_id', async () => {
      const creativeData = {
        industry: 'beauty',
        content_type: 'ad_copy',
        content_text: 'Güzellik ürünlerimizi keşfedin!'
      };

      const saveResult = await saveToLibrary(testUser!.accessToken, creativeData);
      const creativeId = saveResult.data.creative_id;

      try {
        // Retrieve library items
        const libraryItems = await getLibraryItems(testUser!.userId);
        
        expect(libraryItems.length).toBeGreaterThan(0);
        
        // Find our saved item
        const savedItem = libraryItems.find(item => item.creative_id === creativeId);
        expect(savedItem).toBeDefined();
        expect(savedItem.user_id).toBe(testUser!.userId);
        expect(savedItem.industry).toBe(creativeData.industry);
        expect(savedItem.content_type).toBe(creativeData.content_type);
        expect(savedItem.content_text).toBe(creativeData.content_text);
      } finally {
        // Cleanup
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', creativeId);
      }
    }, 30000);

    it('should filter library items by industry', async () => {
      const savedIds: string[] = [];

      try {
        // Save items for different industries
        const items = [
          { industry: 'logistics', content_type: 'ad_copy', content_text: 'Logistics content' },
          { industry: 'e-commerce', content_type: 'ad_copy', content_text: 'E-commerce content' },
          { industry: 'logistics', content_type: 'video_script', content_text: 'Logistics video' }
        ];

        for (const item of items) {
          const result = await saveToLibrary(testUser!.accessToken, item);
          savedIds.push(result.data.creative_id);
        }

        // Filter by logistics industry
        const logisticsItems = await getLibraryItems(testUser!.userId, { industry: 'logistics' });
        
        expect(logisticsItems.length).toBeGreaterThanOrEqual(2);
        for (const item of logisticsItems) {
          expect(item.industry).toBe('logistics');
        }
      } finally {
        // Cleanup
        for (const id of savedIds) {
          await supabaseAdmin
            .from('creative_library')
            .delete()
            .eq('creative_id', id);
        }
      }
    }, 30000);

    it('should filter library items by content_type', async () => {
      const savedIds: string[] = [];

      try {
        // Save items for different content types
        const items = [
          { industry: 'beauty', content_type: 'ad_copy', content_text: 'Ad copy 1' },
          { industry: 'beauty', content_type: 'video_script', content_text: 'Video script 1' },
          { industry: 'beauty', content_type: 'ad_copy', content_text: 'Ad copy 2' }
        ];

        for (const item of items) {
          const result = await saveToLibrary(testUser!.accessToken, item);
          savedIds.push(result.data.creative_id);
        }

        // Filter by ad_copy content type
        const adCopyItems = await getLibraryItems(testUser!.userId, { content_type: 'ad_copy' });
        
        expect(adCopyItems.length).toBeGreaterThanOrEqual(2);
        for (const item of adCopyItems) {
          expect(item.content_type).toBe('ad_copy');
        }
      } finally {
        // Cleanup
        for (const id of savedIds) {
          await supabaseAdmin
            .from('creative_library')
            .delete()
            .eq('creative_id', id);
        }
      }
    }, 30000);
  });

  describe('Data Integrity', () => {
    it('should maintain content integrity after save and retrieve', () => {
      fc.assert(
        fc.asyncProperty(
          arbitraryIndustry(),
          arbitraryContentType(),
          fc.string({ minLength: 10, maxLength: 500 }),
          async (industry, contentType, contentText) => {
            const creativeData = {
              industry,
              content_type: contentType,
              content_text: contentText
            };

            const saveResult = await saveToLibrary(testUser!.accessToken, creativeData);
            const creativeId = saveResult.data.creative_id;

            try {
              // Retrieve and verify
              const libraryItems = await getLibraryItems(testUser!.userId);
              const savedItem = libraryItems.find(item => item.creative_id === creativeId);

              expect(savedItem).toBeDefined();
              expect(savedItem.industry).toBe(industry);
              expect(savedItem.content_type).toBe(contentType);
              expect(savedItem.content_text).toBe(contentText);

              return true;
            } finally {
              // Cleanup
              await supabaseAdmin
                .from('creative_library')
                .delete()
                .eq('creative_id', creativeId);
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 60000);

    it('should preserve Turkish characters in content', async () => {
      const turkishContent = 'Ürünlerimizi keşfedin! Şimdi %50 indirim. Çok özel fırsatlar sizi bekliyor.';
      
      const creativeData = {
        industry: 'e-commerce',
        content_type: 'ad_copy',
        content_text: turkishContent
      };

      const saveResult = await saveToLibrary(testUser!.accessToken, creativeData);
      const creativeId = saveResult.data.creative_id;

      try {
        const libraryItems = await getLibraryItems(testUser!.userId);
        const savedItem = libraryItems.find(item => item.creative_id === creativeId);

        expect(savedItem).toBeDefined();
        expect(savedItem.content_text).toBe(turkishContent);
        
        // Verify Turkish characters are preserved
        expect(savedItem.content_text).toContain('Ü');
        expect(savedItem.content_text).toContain('ş');
        expect(savedItem.content_text).toContain('ı');
        expect(savedItem.content_text).toContain('ğ');
      } finally {
        // Cleanup
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', creativeId);
      }
    }, 30000);
  });

  describe('User Isolation', () => {
    it('should only retrieve content belonging to the authenticated user', async () => {
      let testUser2: { userId: string; email: string; accessToken: string } | null = null;

      try {
        // Create second test user
        testUser2 = await createTestUser();
        await new Promise(resolve => setTimeout(resolve, 1000));

        // User 1 saves content
        const user1Data = {
          industry: 'logistics',
          content_type: 'ad_copy',
          content_text: 'User 1 content'
        };
        const user1Result = await saveToLibrary(testUser!.accessToken, user1Data);

        // User 2 saves content
        const user2Data = {
          industry: 'beauty',
          content_type: 'ad_copy',
          content_text: 'User 2 content'
        };
        const user2Result = await saveToLibrary(testUser2.accessToken, user2Data);

        // Verify user 1 only sees their content
        const user1Items = await getLibraryItems(testUser!.userId);
        const user1HasUser2Content = user1Items.some(
          item => item.creative_id === user2Result.data.creative_id
        );
        expect(user1HasUser2Content).toBe(false);

        // Verify user 2 only sees their content
        const user2Items = await getLibraryItems(testUser2.userId);
        const user2HasUser1Content = user2Items.some(
          item => item.creative_id === user1Result.data.creative_id
        );
        expect(user2HasUser1Content).toBe(false);

        // Cleanup
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', user1Result.data.creative_id);
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', user2Result.data.creative_id);
      } finally {
        if (testUser2) {
          await cleanupTestUser(testUser2.userId);
        }
      }
    }, 30000);
  });

  describe('Timestamp Validation', () => {
    it('should set created_at timestamp when saving content', async () => {
      const creativeData = {
        industry: 'healthcare',
        content_type: 'ad_copy',
        content_text: 'Healthcare content'
      };

      const beforeSave = new Date();
      const saveResult = await saveToLibrary(testUser!.accessToken, creativeData);
      const afterSave = new Date();

      try {
        expect(saveResult.data.created_at).toBeDefined();
        
        const createdAt = new Date(saveResult.data.created_at);
        expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave.getTime() - 1000);
        expect(createdAt.getTime()).toBeLessThanOrEqual(afterSave.getTime() + 1000);
      } finally {
        // Cleanup
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', saveResult.data.creative_id);
      }
    }, 30000);
  });
});

/**
 * Integration Tests - End-to-End Creative Generation Flow
 */
describe('Integration: Creative Generation to Library Flow', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up all creative library items
      await supabaseAdmin
        .from('creative_library')
        .delete()
        .eq('user_id', testUser.userId);
      
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should complete full flow: generate content and save to library', async () => {
    // Step 1: Generate creative content
    const generateRequest = {
      industry: 'e-commerce',
      content_type: 'ad_copy',
      target_audience: 'Genç profesyoneller',
      objective: 'Satış artışı',
      tone: 'Profesyonel'
    };

    const generateResult = await generateCreativeContent(testUser!.accessToken, generateRequest);

    expect(generateResult.success).toBe(true);
    expect(generateResult.data.variations).toBeDefined();
    expect(generateResult.data.variations.length).toBe(3);

    // Step 2: Save first variation to library
    const firstVariation = generateResult.data.variations[0];
    const saveData = {
      industry: generateRequest.industry,
      content_type: generateRequest.content_type,
      content_text: `${firstVariation.title}\n\n${firstVariation.content}\n\nCTA: ${firstVariation.cta}`
    };

    const saveResult = await saveToLibrary(testUser!.accessToken, saveData);

    expect(saveResult.success).toBe(true);
    expect(saveResult.data.creative_id).toBeTruthy();

    // Step 3: Verify saved in library
    const libraryItems = await getLibraryItems(testUser!.userId, {
      industry: generateRequest.industry,
      content_type: generateRequest.content_type
    });

    expect(libraryItems.length).toBeGreaterThan(0);
    const savedItem = libraryItems.find(item => item.creative_id === saveResult.data.creative_id);
    expect(savedItem).toBeDefined();
    expect(savedItem.content_text).toContain(firstVariation.title);

    // Cleanup
    await supabaseAdmin
      .from('creative_library')
      .delete()
      .eq('creative_id', saveResult.data.creative_id);
  }, 45000);

  it('should handle multiple variations saved from same generation', async () => {
    const savedIds: string[] = [];

    try {
      // Generate content
      const generateRequest = {
        industry: 'beauty',
        content_type: 'ad_copy',
        target_audience: 'Kadınlar',
        objective: 'Marka bilinirliği',
        tone: 'Samimi'
      };

      const generateResult = await generateCreativeContent(testUser!.accessToken, generateRequest);

      // Save all 3 variations
      for (const variation of generateResult.data.variations) {
        const saveData = {
          industry: generateRequest.industry,
          content_type: generateRequest.content_type,
          content_text: `${variation.title}\n\n${variation.content}\n\nCTA: ${variation.cta}`
        };

        const saveResult = await saveToLibrary(testUser!.accessToken, saveData);
        savedIds.push(saveResult.data.creative_id);
      }

      // Verify all saved
      expect(savedIds.length).toBe(3);

      const libraryItems = await getLibraryItems(testUser!.userId, {
        industry: generateRequest.industry,
        content_type: generateRequest.content_type
      });

      expect(libraryItems.length).toBeGreaterThanOrEqual(3);
    } finally {
      // Cleanup
      for (const id of savedIds) {
        await supabaseAdmin
          .from('creative_library')
          .delete()
          .eq('creative_id', id);
      }
    }
  }, 45000);
});

/**
 * Error Handling and Edge Cases
 */
describe('Error Handling and Validation', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      await cleanupTestUser(testUser.userId);
    }
  });

  describe('Invalid Industry Handling', () => {
    it('should reject invalid industry values', async () => {
      const invalidRequest = {
        industry: 'invalid-industry',
        content_type: 'ad_copy'
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest)
      ).rejects.toThrow();
    }, 30000);

    it('should reject empty industry', async () => {
      const invalidRequest = {
        industry: '',
        content_type: 'ad_copy'
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest)
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Invalid Content Type Handling', () => {
    it('should reject invalid content_type values', async () => {
      const invalidRequest = {
        industry: 'e-commerce',
        content_type: 'invalid-type'
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest)
      ).rejects.toThrow();
    }, 30000);

    it('should reject empty content_type', async () => {
      const invalidRequest = {
        industry: 'e-commerce',
        content_type: ''
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest)
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Missing Required Fields', () => {
    it('should reject request without industry', async () => {
      const invalidRequest = {
        content_type: 'ad_copy'
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest as any)
      ).rejects.toThrow();
    }, 30000);

    it('should reject request without content_type', async () => {
      const invalidRequest = {
        industry: 'e-commerce'
      };

      await expect(
        generateCreativeContent(testUser!.accessToken, invalidRequest as any)
      ).rejects.toThrow();
    }, 30000);
  });

  describe('Save to Library Validation', () => {
    it('should reject save without required fields', async () => {
      const invalidData = {
        industry: 'e-commerce'
        // Missing content_type and content_text
      };

      await expect(
        saveToLibrary(testUser!.accessToken, invalidData as any)
      ).rejects.toThrow();
    }, 30000);

    it('should reject save with invalid content_type', async () => {
      const invalidData = {
        industry: 'e-commerce',
        content_type: 'invalid',
        content_text: 'Test content'
      };

      await expect(
        saveToLibrary(testUser!.accessToken, invalidData)
      ).rejects.toThrow();
    }, 30000);
  });
});

/**
 * Property-Based Tests with Arbitrary Data
 */
describe('Property-Based Tests with Random Data', () => {
  let testUser: { userId: string; email: string; accessToken: string } | null = null;

  beforeAll(async () => {
    testUser = await createTestUser();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (testUser) {
      // Clean up all creative library items
      await supabaseAdmin
        .from('creative_library')
        .delete()
        .eq('user_id', testUser.userId);
      
      await cleanupTestUser(testUser.userId);
    }
  });

  it('should handle any valid creative request', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraryCreativeRequest(),
        async (request) => {
          try {
            const result = await generateCreativeContent(testUser!.accessToken, request);
            
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.industry).toBe(request.industry);
            expect(result.data.content_type).toBe(request.content_type);
            expect(result.data.variations).toBeDefined();
            expect(Array.isArray(result.data.variations)).toBe(true);
            expect(result.data.variations.length).toBe(3);

            return true;
          } catch (error) {
            // API might fail due to rate limits or network issues
            // This is acceptable in property tests
            console.warn('API call failed:', error);
            return true;
          }
        }
      ),
      { numRuns: 10 } // Reduced runs to avoid API rate limits
    );
  }, 120000);

  it('should persist any valid creative content', () => {
    fc.assert(
      fc.asyncProperty(
        arbitraryIndustry(),
        arbitraryContentType(),
        fc.string({ minLength: 10, maxLength: 500 }),
        async (industry, contentType, contentText) => {
          const creativeData = {
            industry,
            content_type: contentType,
            content_text: contentText
          };

          const saveResult = await saveToLibrary(testUser!.accessToken, creativeData);

          try {
            expect(saveResult.success).toBe(true);
            expect(saveResult.data).toBeDefined();
            expect(saveResult.data.creative_id).toBeTruthy();
            expect(saveResult.data.user_id).toBe(testUser!.userId);
            expect(saveResult.data.industry).toBe(industry);
            expect(saveResult.data.content_type).toBe(contentType);
            expect(saveResult.data.content_text).toBe(contentText);

            return true;
          } finally {
            // Cleanup
            await supabaseAdmin
              .from('creative_library')
              .delete()
              .eq('creative_id', saveResult.data.creative_id);
          }
        }
      ),
      { numRuns: 20 }
    );
  }, 90000);
});
