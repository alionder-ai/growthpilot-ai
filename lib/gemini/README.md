# Gemini API Integration

Google Gemini AI entegrasyonu için modül. Aksiyon planları, strateji kartları ve kreatif içerik üretimi için kullanılır.

## Kurulum

```bash
npm install @google/generative-ai
```

## Yapılandırma

`.env.local` dosyasına Gemini API anahtarını ekleyin:

```env
GEMINI_API_KEY=your_api_key_here
```

## Kullanım

### Action Plan Üretimi

```typescript
import { getGeminiClient, buildActionPlanPrompt, TOKEN_LIMITS } from '@/lib/gemini';

const client = getGeminiClient();
const prompt = buildActionPlanPrompt({
  clientName: 'Örnek Müşteri',
  industry: 'E-ticaret',
  spend: 15000,
  roas: 2.5,
  conversions: 120,
  budgetUtilization: 85,
  frequency: 3.2,
  addToCart: 450,
  purchases: 120,
});

const response = await client.generateJSON(prompt, TOKEN_LIMITS.ACTION_PLAN);
```

### Strategy Card Üretimi

```typescript
import { buildStrategyCardPrompt } from '@/lib/gemini';

const prompt = buildStrategyCardPrompt({
  situation: 'Frekans eşiği aşıldı',
  metricName: 'Frekans',
  metricValue: 4.5,
  threshold: 4.0,
  campaignName: 'Yaz Kampanyası',
});

const response = await client.generateJSON(prompt, TOKEN_LIMITS.STRATEGY_CARD);
```

### Creative Content Üretimi

```typescript
import { buildCreativePrompt } from '@/lib/gemini';

const prompt = buildCreativePrompt({
  industry: 'e-commerce',
  contentType: 'ad_copy',
  targetAudience: '25-40 yaş arası kadınlar',
  objective: 'Satış artışı',
  tone: 'Samimi ve güvenilir',
});

const response = await client.generateJSON(prompt, TOKEN_LIMITS.CREATIVE_CONTENT);
```

### Cache Fallback ile Kullanım

```typescript
import { executeWithFallback, getUserFriendlyErrorMessage } from '@/lib/gemini';

try {
  const { data, fromCache } = await executeWithFallback(
    'action_plan',
    context,
    async () => {
      const prompt = buildActionPlanPrompt(context);
      return await client.generateJSON(prompt, TOKEN_LIMITS.ACTION_PLAN);
    }
  );
  
  if (fromCache) {
    console.log('Önbellekten yüklendi');
  }
} catch (error) {
  const message = getUserFriendlyErrorMessage(error);
  // Kullanıcıya Türkçe hata mesajı göster
}
```

## Özellikler

### Retry Logic
- 3 deneme ile exponential backoff (1s, 2s, 4s)
- Otomatik yeniden deneme mekanizması

### Cache Fallback
- API başarısız olduğunda önbellekten yükleme
- 1 saat TTL ile cache yönetimi

### Token Limits
- Action Plan: 500 token
- Strategy Card: 300 token
- Creative Content: 1000 token

### Error Handling
- Türkçe kullanıcı dostu hata mesajları
- Detaylı error logging
- Graceful degradation

## Prompt Şablonları

Tüm prompt'lar Türkçe çıktı üretecek şekilde tasarlanmıştır:
- Formal iş Türkçesi ("siz" formu)
- Türk pazarına uygun öneriler
- Sektöre özel içerik

## Test

```bash
npm test -- lib/gemini
```

## Notlar

- Production ortamında cache için Redis kullanılması önerilir
- Error tracking için Sentry entegrasyonu eklenebilir
- Rate limiting için ek kontroller gerekebilir
