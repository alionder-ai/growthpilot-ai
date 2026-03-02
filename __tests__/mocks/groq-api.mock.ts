/**
 * Mock Groq API Responses
 * 
 * Provides mock data for Groq API endpoints used in testing.
 */

export const mockActionPlanResponse = {
  id: 'chatcmpl-123',
  object: 'chat.completion',
  created: Date.now(),
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify([
          {
            action: 'ROAS düşük kampanyaları optimize et',
            priority: 'high',
            expected_impact: 'ROAS değerini %20 artırabilir',
          },
          {
            action: 'Yüksek frekanslı reklamların kreatiflerini yenile',
            priority: 'medium',
            expected_impact: 'CTR değerini %15 artırabilir',
          },
          {
            action: 'Sepete ekleme oranı yüksek ürünler için retargeting kampanyası başlat',
            priority: 'high',
            expected_impact: 'Dönüşüm oranını %25 artırabilir',
          },
        ]),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 100,
    completion_tokens: 50,
    total_tokens: 150,
  },
};

export const mockStrategyCardResponse = {
  id: 'chatcmpl-456',
  object: 'chat.completion',
  created: Date.now(),
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          do_actions: [
            'Hedef kitleyi daralt ve daha spesifik segmentler oluştur',
            'Kreatif içeriği yenile ve A/B testi yap',
            'Bütçeyi daha iyi performans gösteren reklam setlerine kaydır',
          ],
          dont_actions: [
            'Kampanyayı tamamen durdurma',
            'Bütçeyi aniden artırma',
            'Hedef kitleyi çok geniş tutma',
          ],
          reasoning: 'Frekans değeri yüksek olduğu için kreatif yorgunluğu söz konusu',
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 80,
    completion_tokens: 40,
    total_tokens: 120,
  },
};

export const mockCreativeContentResponse = {
  id: 'chatcmpl-789',
  object: 'chat.completion',
  created: Date.now(),
  model: 'llama-3.3-70b-versatile',
  choices: [
    {
      index: 0,
      message: {
        role: 'assistant',
        content: JSON.stringify({
          variations: [
            {
              title: 'Hızlı Teslimat Garantisi',
              content: 'Siparişiniz 24 saat içinde kapınızda! Ücretsiz kargo fırsatını kaçırmayın.',
              cta: 'Hemen Sipariş Ver',
            },
            {
              title: 'Güvenli Alışveriş',
              content: 'Kapıda ödeme seçeneği ile güvenle alışveriş yapın. İade garantisi!',
              cta: 'Alışverişe Başla',
            },
            {
              title: 'Özel İndirim',
              content: 'İlk siparişinize özel %20 indirim! Kampanya sınırlı süreyle geçerli.',
              cta: 'İndirimi Kullan',
            },
          ],
        }),
      },
      finish_reason: 'stop',
    },
  ],
  usage: {
    prompt_tokens: 120,
    completion_tokens: 60,
    total_tokens: 180,
  },
};

export const mockGroqAPIError = {
  error: {
    message: 'Rate limit exceeded',
    type: 'rate_limit_error',
    code: 'rate_limit_exceeded',
  },
};

export const mockGroqInvalidAPIKeyError = {
  error: {
    message: 'Invalid API key',
    type: 'invalid_request_error',
    code: 'invalid_api_key',
  },
};

/**
 * Mock Groq API Client
 */
export class MockGroqAPIClient {
  private shouldFail: boolean = false;
  private shouldTimeout: boolean = false;
  private callCount: number = 0;
  private responseDelay: number = 0;

  chat = {
    completions: {
      create: async (params: any) => {
        this.callCount++;
        await this.delay();

        if (this.shouldFail) {
          throw new Error(JSON.stringify(mockGroqAPIError));
        }

        if (this.shouldTimeout) {
          await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than typical timeout
        }

        // Determine response type based on prompt content
        const prompt = params.messages[0]?.content || '';
        
        if (prompt.includes('aksiyon') || prompt.includes('action')) {
          return mockActionPlanResponse;
        } else if (prompt.includes('strateji') || prompt.includes('strategy')) {
          return mockStrategyCardResponse;
        } else if (prompt.includes('kreatif') || prompt.includes('creative')) {
          return mockCreativeContentResponse;
        }

        // Default response
        return mockActionPlanResponse;
      },
    },
  };

  setFailure(fail: boolean) {
    this.shouldFail = fail;
  }

  setTimeout(timeout: boolean) {
    this.shouldTimeout = timeout;
  }

  setResponseDelay(ms: number) {
    this.responseDelay = ms;
  }

  getCallCount() {
    return this.callCount;
  }

  resetCallCount() {
    this.callCount = 0;
  }

  private async delay() {
    if (this.responseDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.responseDelay));
    }
  }
}

/**
 * Create a mock Groq API client instance
 */
export function createMockGroqClient() {
  return new MockGroqAPIClient();
}
