/**
 * AI Prompt Templates
 * 
 * Centralized prompt templates for all AI features.
 * All prompts request Turkish language output.
 */

export const MEDIA_BUYER_PROMPT = `
Sen deneyimli bir dijital pazarlama uzmanısın. Aşağıdaki Meta Ads kampanya verilerini analiz et ve Türkçe olarak detaylı bir rapor hazırla.

KAMPANYA VERİLERİ:
{campaignData}

GÖREV:
1. Kampanya özetini çıkar (2-3 cümle)
2. Ana KPI'ları değerlendir (CTR, CVR, ROAS, CPA, CPM, Frekans)
3. Sorunları tespit et ve önem derecesine göre sırala (critical, high, medium, low)
4. Eyleme geçirilebilir öneriler sun ve etki seviyesine göre sırala (high, medium, low)
5. Sonraki test fırsatlarını öner (3-5 tane)

ÇIKTI FORMATI (JSON):
{
  "summary": "Kampanya özeti",
  "kpiOverview": {
    "ctr": "CTR değerlendirmesi",
    "cvr": "CVR değerlendirmesi",
    "roas": "ROAS değerlendirmesi",
    "cpa": "CPA değerlendirmesi",
    "frequency": "Frekans değerlendirmesi"
  },
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "description": "Sorun açıklaması"
    }
  ],
  "recommendations": [
    {
      "impact": "high|medium|low",
      "action": "Öneri açıklaması"
    }
  ],
  "nextTests": [
    "Test önerisi 1",
    "Test önerisi 2"
  ]
}

Sadece JSON formatında yanıt ver, başka açıklama ekleme.
`;

/**
 * Turkish error messages for AI Media Buyer feature
 */
export const MEDIA_BUYER_ERRORS = {
  MISSING_CAMPAIGN_ID: 'Kampanya ID gereklidir',
  INVALID_CAMPAIGN_ID: 'Geçersiz kampanya ID formatı',
  CAMPAIGN_NOT_FOUND: 'Kampanya bulunamadı',
  UNAUTHORIZED: 'Bu kampanyaya erişim yetkiniz yok',
  INSUFFICIENT_DATA: 'Analiz için yeterli veri yok. En az 7 günlük metrik verisi gereklidir.',
  MISSING_METRICS: 'Son 30 gün içinde metrik verisi bulunamadı',
  API_ERROR: 'AI analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.',
  API_TIMEOUT: 'AI analizi zaman aşımına uğradı. Lütfen tekrar deneyin.',
  NETWORK_ERROR: 'Bağlantı hatası oluştu. İnternet bağlantınızı kontrol edin.',
  DATABASE_ERROR: 'Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.',
  UNKNOWN_ERROR: 'Beklenmeyen bir hata oluştu. Lütfen destek ekibiyle iletişime geçin.',
} as const;
