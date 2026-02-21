/**
 * Mock Google Gemini API Responses
 * 
 * Provides mock data for Gemini API endpoints used in testing.
 */

export const mockActionPlanResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify([
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
        ],
      },
    },
  ],
};

export const mockStrategyCardResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
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
        ],
      },
    },
  ],
};

export const mockCreativeContentResponse = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
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
        ],
      },
    },
  ],
};

export const mockGeminiAPIError = {
  error: {
    code: 429,
    message: 'Resource has been exhausted (e.g. check quota).',
    status: 'RESOURCE_EXHAUSTED',
  },
};

export const mockGeminiInvalidAPIKeyError = {
  error: {
    code: 400,
    message: 'API key not valid. Please pass a valid API key.',
    status: 'INVALID_ARGUMENT',
  },
};

/**
 * Mock Gemini API Client
 */
export class MockGeminiAPIClient {
  private shouldFail: boolean = false;
  private shouldTimeout: boolean = false;
  private callCount: number = 0;
  private responseDelay: number = 0;

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

  async generateContent(prompt: string) {
    this.callCount++;
    await this.delay();

    if (this.shouldFail) {
      throw new Error(JSON.stringify(mockGeminiAPIError));
    }

    if (this.shouldTimeout) {
      await new Promise(resolve => setTimeout(resolve, 35000)); // Longer than typical timeout
    }

    // Determine response type based on prompt content
    if (prompt.includes('aksiyon') || prompt.includes('action')) {
      return mockActionPlanResponse;
    } else if (prompt.includes('strateji') || prompt.includes('strategy')) {
      return mockStrategyCardResponse;
    } else if (prompt.includes('kreatif') || prompt.includes('creative')) {
      return mockCreativeContentResponse;
    }

    // Default response
    return mockActionPlanResponse;
  }

  async generateActionPlan(context: any) {
    return this.generateContent('aksiyon planı oluştur');
  }

  async generateStrategyCard(context: any) {
    return this.generateContent('strateji kartı oluştur');
  }

  async generateCreativeContent(params: any) {
    return this.generateContent('kreatif içerik oluştur');
  }
}

/**
 * Create a mock Gemini API client instance
 */
export function createMockGeminiClient() {
  return new MockGeminiAPIClient();
}
