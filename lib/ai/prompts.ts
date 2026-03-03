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

ÖNEMLİ - KAMPANYA AMACINA GÖRE KPI ÖNCELİKLERİ:
Kampanya amacını (objective) kontrol et ve SADECE o amaca uygun KPI'lara göre değerlendirme yap:

- MESSAGES / Mesaj Kampanyaları:
  * Ana KPI'lar: conversations, messaging_conversations_started, cost_per_conversation
  * İkincil KPI'lar: link_clicks, CTR
  * DİKKAT: Purchases veya ROAS sıfır olabilir - bu NORMAL ve SORUN DEĞİL
  * Mesaj kampanyalarında dönüşüm (satış) beklenmez

- ENGAGEMENT / Etkileşim Kampanyaları:
  * Ana KPI'lar: post_engagement, post_reactions, CTR
  * İkincil KPI'lar: impressions, frequency
  * DİKKAT: Purchases veya conversions düşük olabilir - bu NORMAL

- TRAFFIC / Trafik Kampanyaları:
  * Ana KPI'lar: link_clicks, landing_page_views, CPC
  * İkincil KPI'lar: CTR, CPM
  * DİKKAT: Conversions düşük olabilir - amaç trafik çekmek

- CONVERSIONS / SALES / Satış Kampanyaları:
  * Ana KPI'lar: purchases, ROAS, conversions, CPA
  * İkincil KPI'lar: add_to_cart, CVR, CTR

- LEAD_GENERATION / Lead Kampanyaları:
  * Ana KPI'lar: leads, cost_per_lead
  * İkincil KPI'lar: CTR, CPM

GÖREV:
1. Kampanya amacını belirle ve özetini çıkar (2-3 cümle)
2. SADECE kampanya amacına uygun KPI'ları değerlendir
3. Sorunları tespit et ve önem derecesine göre sırala (critical, high, medium, low)
4. Eyleme geçirilebilir öneriler sun ve etki seviyesine göre sırala (high, medium, low)
5. Sonraki test fırsatlarını öner (3-5 tane)

ÇIKTI FORMATI (JSON):
{
  "summary": "Kampanya özeti ve amacı",
  "kpiOverview": {
    "primary": "Ana KPI'ların değerlendirmesi (kampanya amacına göre)",
    "secondary": "İkincil KPI'ların değerlendirmesi"
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
