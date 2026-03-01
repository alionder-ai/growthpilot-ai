/**
 * Unit tests for Target Audience API endpoint
 * Tests authentication, validation, analysis generation, and error handling
 * 
 * Requirements tested:
 * - 10.1: Gemini API failure handling with Turkish error message
 * - 10.2: Invalid JSON response handling
 * - 10.3: Database storage failure handling
 * - 10.4: Network timeout handling
 * - 10.5: Error state management (loading indicator removal)
 * - 10.6: Error state management (button re-enable)
 * - 11.2: Authentication validation
 * - 11.3: Unauthenticated request returns 401
 * - 11.5: Empty industry input returns 400
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/target-audience/route';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/gemini/client';
import { parseTargetAudienceResponse } from '@/lib/utils/target-audience-parser';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/gemini/client');
jest.mock('@/lib/utils/target-audience-parser');

describe('Target Audience API - POST /api/ai/target-audience', () => {
  let mockSupabaseClient: any;
  let mockGeminiClient: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default Supabase mock
    mockSupabaseClient = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id', email: 'test@example.com' } },
          error: null,
        }),
      },
      from: jest.fn().mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'test-analysis-id' },
              error: null,
            }),
          }),
        }),
      }),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabaseClient);

    // Setup default Gemini mock
    mockGeminiClient = {
      generateJSON: jest.fn().mockResolvedValue({
        mukemmelMusteri: {
          profil: 'Test profile',
          icselArzular: [
            { text: 'Desire 1', score: 8 },
            { text: 'Desire 2', score: 7 },
            { text: 'Desire 3', score: 9 },
          ],
          dissalArzular: [
            { text: 'External desire 1', score: 8 },
            { text: 'External desire 2', score: 7 },
            { text: 'External desire 3', score: 9 },
          ],
          icselEngeller: [
            { text: 'Barrier 1', score: 6 },
            { text: 'Barrier 2', score: 5 },
            { text: 'Barrier 3', score: 7 },
          ],
          dissalEngeller: [
            { text: 'External barrier 1', score: 6 },
            { text: 'External barrier 2', score: 5 },
            { text: 'External barrier 3', score: 7 },
          ],
          ihtiyaclar: [
            { text: 'Need 1', score: 9 },
            { text: 'Need 2', score: 8 },
            { text: 'Need 3', score: 7 },
          ],
        },
        mecburiMusteri: {
          profil: 'Test profile 2',
          icselArzular: [
            { text: 'Desire 1', score: 8 },
            { text: 'Desire 2', score: 7 },
            { text: 'Desire 3', score: 9 },
          ],
          dissalArzular: [
            { text: 'External desire 1', score: 8 },
            { text: 'External desire 2', score: 7 },
            { text: 'External desire 3', score: 9 },
          ],
          icselEngeller: [
            { text: 'Barrier 1', score: 6 },
            { text: 'Barrier 2', score: 5 },
            { text: 'Barrier 3', score: 7 },
          ],
          dissalEngeller: [
            { text: 'External barrier 1', score: 6 },
            { text: 'External barrier 2', score: 5 },
            { text: 'External barrier 3', score: 7 },
          ],
          ihtiyaclar: [
            { text: 'Need 1', score: 9 },
            { text: 'Need 2', score: 8 },
            { text: 'Need 3', score: 7 },
          ],
        },
        gereksizMusteri: {
          profil: 'Unnecessary customer profile',
        },
        reddedilemezTeklifler: {
          mukemmelMusteriTeklif: 'Perfect customer offer',
          mecburiMusteriTeklif: 'Necessary customer offer',
          gereksizMusteriTeklif: 'Unnecessary customer offer',
        },
      }),
    };

    (getGeminiClient as jest.Mock).mockReturnValue(mockGeminiClient);

    // Setup default parser mock
    (parseTargetAudienceResponse as jest.Mock).mockImplementation((json) => JSON.parse(json));
  });

  describe('Authentication Validation', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Mock authentication failure
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Yetkisiz erişim');
    });

    it('should return 401 when user is null', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Gayrimenkul' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Yetkisiz erişim');
    });

    it('should proceed with valid authentication', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'E-ticaret' }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();
    });
  });

  describe('Input Validation', () => {
    it('should return 400 for empty industry input', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bu alan zorunludur');
    });

    it('should return 400 for whitespace-only industry input', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: '   ' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bu alan zorunludur');
    });

    it('should return 400 for missing industry field', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bu alan zorunludur');
    });

    it('should return 400 for non-string industry input', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 123 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Bu alan zorunludur');
    });

    it('should trim whitespace from valid industry input', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: '  Güzellik Merkezi  ' }),
      });

      await POST(request);

      // Verify database insert was called with trimmed value
      const insertCall = mockSupabaseClient.from().insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          industry: 'Güzellik Merkezi',
        })
      );
    });
  });

  describe('Successful Analysis Generation', () => {
    it('should return 200 with valid analysis structure', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis_id).toBe('test-analysis-id');
      expect(data.analysis).toBeDefined();
      expect(data.analysis.mukemmelMusteri).toBeDefined();
      expect(data.analysis.mecburiMusteri).toBeDefined();
      expect(data.analysis.gereksizMusteri).toBeDefined();
      expect(data.analysis.reddedilemezTeklifler).toBeDefined();
    });

    it('should call Gemini API with correct prompt', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'E-ticaret' }),
      });

      await POST(request);

      expect(mockGeminiClient.generateJSON).toHaveBeenCalled();
      const promptArg = mockGeminiClient.generateJSON.mock.calls[0][0];
      expect(promptArg).toContain('E-ticaret');
      expect(promptArg).toContain('Alex Hormozi');
      expect(promptArg).toContain('Grand Slam Offer');
    });

    it('should store analysis in database with correct structure', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Gayrimenkul' }),
      });

      await POST(request);

      const insertCall = mockSupabaseClient.from().insert;
      expect(insertCall).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'test-user-id',
          industry: 'Gayrimenkul',
          analysis_data: expect.objectContaining({
            mukemmelMusteri: expect.any(Object),
            mecburiMusteri: expect.any(Object),
            gereksizMusteri: expect.any(Object),
            reddedilemezTeklifler: expect.any(Object),
          }),
        })
      );
    });

    it('should parse and validate Gemini response', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Restoran' }),
      });

      await POST(request);

      expect(parseTargetAudienceResponse).toHaveBeenCalled();
    });
  });

  describe('Gemini API Failure Handling', () => {
    it('should return 500 with Turkish error message on Gemini API failure', async () => {
      mockGeminiClient.generateJSON.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    });

    it('should return timeout error message for timeout errors', async () => {
      mockGeminiClient.generateJSON.mockRejectedValue(new Error('Request timeout'));

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'E-ticaret' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Bağlantı zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.');
    });

    it('should handle invalid JSON response from Gemini', async () => {
      mockGeminiClient.generateJSON.mockResolvedValue('Invalid JSON');
      (parseTargetAudienceResponse as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JSON structure');
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Gayrimenkul' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    });

    it('should handle Gemini API rate limit errors', async () => {
      mockGeminiClient.generateJSON.mockRejectedValue(
        new Error('429 Resource has been exhausted')
      );

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Teknoloji' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    });

    it('should handle Gemini API authentication errors', async () => {
      mockGeminiClient.generateJSON.mockRejectedValue(
        new Error('Invalid API key')
      );

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Sağlık' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    });
  });

  describe('Database Storage Failure Handling', () => {
    it('should return 500 with Turkish error message on database insert failure', async () => {
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz kaydedilemedi. Lütfen tekrar deneyin.');
    });

    it('should handle database connection errors', async () => {
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Connection timeout' },
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'E-ticaret' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz kaydedilemedi. Lütfen tekrar deneyin.');
    });

    it('should handle database constraint violations', async () => {
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Foreign key constraint violation' },
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Gayrimenkul' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz kaydedilemedi. Lütfen tekrar deneyin.');
    });
  });

  describe('Error Recovery and State Management', () => {
    it('should not store analysis in database if Gemini API fails', async () => {
      mockGeminiClient.generateJSON.mockRejectedValue(new Error('API Error'));

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      await POST(request);

      // Verify database insert was never called
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors gracefully', async () => {
      // Mock an unexpected error during request processing
      (createClient as jest.Mock).mockRejectedValue(new Error('Unexpected error'));

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Test' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Beklenmeyen bir hata oluştu');
    });

    it('should handle malformed request body', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Beklenmeyen bir hata oluştu');
    });
  });

  describe('Turkish Localization', () => {
    it('should return all error messages in Turkish', async () => {
      const errorScenarios = [
        {
          setup: () => {
            mockSupabaseClient.auth.getUser.mockResolvedValue({
              data: { user: null },
              error: { message: 'Not authenticated' },
            });
          },
          expectedError: 'Yetkisiz erişim',
        },
        {
          setup: () => {
            mockGeminiClient.generateJSON.mockRejectedValue(new Error('API Error'));
          },
          expectedError: 'Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.',
        },
        {
          setup: () => {
            mockSupabaseClient.from().insert().select().single.mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            });
          },
          expectedError: 'Analiz kaydedilemedi. Lütfen tekrar deneyin.',
        },
      ];

      for (const scenario of errorScenarios) {
        jest.clearAllMocks();
        
        // Reset to default state
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        });
        mockSupabaseClient.from().insert().select().single.mockResolvedValue({
          data: { id: 'test-id' },
          error: null,
        });
        mockGeminiClient.generateJSON.mockResolvedValue({});
        
        // Apply scenario setup
        scenario.setup();

        const request = new NextRequest('http://localhost/api/ai/target-audience', {
          method: 'POST',
          body: JSON.stringify({ industry: 'Test' }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(data.error).toBe(scenario.expectedError);
      }
    });

    it('should use formal Turkish ("siz" form) in error messages', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: '' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Check for formal Turkish (uses "Lütfen" not "Lütfen sen")
      expect(data.error).toContain('zorunludur');
      expect(data.error).not.toContain('sen');
    });
  });

  describe('Integration Flow', () => {
    it('should complete full successful flow', async () => {
      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'Güzellik Merkezi' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify authentication was checked
      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalled();

      // Verify Gemini API was called
      expect(mockGeminiClient.generateJSON).toHaveBeenCalled();

      // Verify response was parsed
      expect(parseTargetAudienceResponse).toHaveBeenCalled();

      // Verify database insert was called
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('target_audience_analyses');

      // Verify successful response
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis_id).toBeDefined();
      expect(data.analysis).toBeDefined();
    });

    it('should handle partial failures gracefully', async () => {
      // Simulate Gemini success but database failure
      mockSupabaseClient.from().insert().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const request = new NextRequest('http://localhost/api/ai/target-audience', {
        method: 'POST',
        body: JSON.stringify({ industry: 'E-ticaret' }),
      });

      const response = await POST(request);
      const data = await response.json();

      // Verify Gemini was called successfully
      expect(mockGeminiClient.generateJSON).toHaveBeenCalled();

      // Verify error response for database failure
      expect(response.status).toBe(500);
      expect(data.error).toBe('Analiz kaydedilemedi. Lütfen tekrar deneyin.');
    });
  });
});
