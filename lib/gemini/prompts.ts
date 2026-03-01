/**
 * Prompt template builders for Gemini API
 * All prompts request Turkish output for user-facing content
 */

interface ActionPlanContext {
  clientName: string;
  industry?: string;
  totalSpend: number;
  roas: number;
  conversions: number;
  budgetUtilization: number;
  frequency: number;
  addToCart: number;
  purchases: number;
  cpc: number;
  ctr: number;
  leadQuality?: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
  };
}

interface StrategyCardContext {
  situation: string;
  metricName: string;
  metricValue: number;
  threshold: number;
  leadQuality?: {
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
  };
}

interface CreativeContext {
  industry: string;
  targetAudience?: string;
  objective?: string;
  tone?: string;
  contentType: 'ad_copy' | 'video_script' | 'voiceover';
}

/**
 * Token limits for different prompt types
 */
export const TOKEN_LIMITS = {
  ACTION_PLAN: 500,
  STRATEGY_CARD: 300,
  CREATIVE_CONTENT: 1000,
  TARGET_AUDIENCE: 2000,
} as const;

/**
 * Build action plan prompt for Gemini API
 * Requests top 3 priority actions in Turkish
 */
export function buildActionPlanPrompt(context: ActionPlanContext): string {
  const leadQualityText = context.leadQuality
    ? `\n- Lead Kalitesi: ${context.leadQuality.totalLeads} potansiyel müşteriden ${context.leadQuality.convertedLeads} tanesi dönüşüm sağladı (Dönüşüm Oranı: %${context.leadQuality.conversionRate.toFixed(1)})`
    : '';

  return `Sen bir dijital pazarlama uzmanısın. Aşağıdaki kampanya verilerini analiz et ve bugün yapılması gereken en önemli 3 aksiyonu belirle.

Müşteri: ${context.clientName}
${context.industry ? `Sektör: ${context.industry}` : ''}
Kampanya Performansı:
- Toplam Harcama: ₺${context.totalSpend.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- ROAS: ${context.roas.toFixed(2)}
- Dönüşüm Sayısı: ${context.conversions}
- Bütçe Kullanımı: ${context.budgetUtilization.toFixed(1)}%
- Frekans: ${context.frequency.toFixed(2)}
- Sepete Ekleme: ${context.addToCart}
- Satın Alma: ${context.purchases}
- TBM (CPC): ₺${context.cpc.toFixed(2)}
- TBO (CTR): ${context.ctr.toFixed(2)}%${leadQualityText}

Her aksiyon için:
1. Aksiyonun açıklaması (net ve uygulanabilir)
2. Öncelik seviyesi (high, medium, veya low)
3. Beklenen etki (kısa açıklama)

${context.leadQuality ? 'Lead kalite verilerini dikkate alarak, düşük dönüşüm oranı varsa hedef kitle veya reklam kreatifleri üzerinde iyileştirme öner.' : ''}

JSON formatında yanıt ver:
[
  {
    "action": "string",
    "priority": "high|medium|low",
    "expected_impact": "string"
  }
]

Sadece JSON yanıtı ver, başka açıklama ekleme.`;
}

/**
 * Build strategy card prompt for Gemini API
 * Requests do's and don'ts in Turkish
 */
export function buildStrategyCardPrompt(context: StrategyCardContext): string {
  const leadQualityText = context.leadQuality
    ? `\nLead Kalitesi: ${context.leadQuality.totalLeads} potansiyel müşteriden ${context.leadQuality.convertedLeads} tanesi dönüşüm sağladı (Dönüşüm Oranı: %${context.leadQuality.conversionRate.toFixed(1)})`
    : '';

  return `Sen bir dijital pazarlama stratejistisin. Aşağıdaki metrik için "Yapılması Gerekenler" ve "Yapılmaması Gerekenler" listesi oluştur.

Durum: ${context.situation}
Metrik: ${context.metricName} = ${context.metricValue}
Eşik: ${context.threshold}${leadQualityText}

${context.leadQuality ? 'Lead kalite verilerini dikkate alarak, düşük dönüşüm oranı varsa hedef kitle kalitesi ve reklam mesajları üzerinde öneriler sun.' : ''}

JSON formatında yanıt ver:
{
  "do_actions": ["string", "string", "string"],
  "dont_actions": ["string", "string", "string"],
  "reasoning": "string"
}

Her liste için 3 madde ver. Kısa, net ve uygulanabilir olsun.
Sadece JSON yanıtı ver, başka açıklama ekleme.`;
}

/**
 * Build creative content prompt for Gemini API
 * Requests content variations in Turkish
 */
export function buildCreativePrompt(context: CreativeContext): string {
  const contentTypeLabel = {
    ad_copy: 'reklam metni',
    video_script: 'video senaryosu',
    voiceover: 'seslendirme metni',
  }[context.contentType];

  return `Sen bir kreatif içerik üreticisisin. Aşağıdaki bilgilere göre ${contentTypeLabel} oluştur.

Sektör: ${context.industry}
${context.targetAudience ? `Hedef Kitle: ${context.targetAudience}` : ''}
${context.objective ? `Kampanya Amacı: ${context.objective}` : ''}
${context.tone ? `Ton: ${context.tone}` : ''}

${contentTypeLabel} için 3 farklı varyasyon üret. Her varyasyon:
- Dikkat çekici olmalı
- Dönüşüm odaklı olmalı
- Sektöre uygun olmalı
- Türk pazarına ve kültürüne uygun olmalı
${context.contentType === 'video_script' ? '- Sahne açıklamaları içermeli' : ''}
${context.contentType === 'voiceover' ? '- Ton ve tempo notları içermeli' : ''}

JSON formatında yanıt ver:
{
  "variations": [
    {
      "title": "string",
      "content": "string",
      "cta": "string"
      ${context.contentType === 'video_script' ? ',\n      "scenes": ["string", "string"]' : ''}
      ${context.contentType === 'voiceover' ? ',\n      "tone_notes": "string",\n      "pacing_notes": "string"' : ''}
    }
  ]
}

Sadece JSON yanıtı ver, başka açıklama ekleme.`;
}

/**
 * Build target audience analysis prompt for Gemini API
 * Requests strategic analysis based on Alex Hormozi's Grand Slam Offer methodology
 * Returns customer segmentation and irresistible offers in Turkish
 */
export function buildTargetAudiencePrompt(industry: string): string {
  return `Sen bir pazarlama stratejisti ve Alex Hormozi'nin Grand Slam Offer (Reddedilemez Teklif) metodolojisinde uzmansın.

Sektör: ${industry}

Bu sektör için detaylı bir hedef kitle analizi ve teklif stratejisi oluştur. Alex Hormozi'nin Grand Slam Offer formülünü kullanarak üç müşteri segmenti belirle:

1. MÜKEMMEL MÜŞTERİ (Düşük Efor, Yüksek Kar)
2. MECBURİ MÜŞTERİ (Yüksek Efor, Yüksek Kar)
3. GEREKSİZ MÜŞTERİ (Yüksek Efor, Düşük Kar)

Her segment için:
- Detaylı müşteri profili
- İçsel Arzular (minimum 3 adet, önem skoru 1-10)
- Dışsal Arzular (minimum 3 adet, önem skoru 1-10)
- İçsel Engeller (minimum 3 adet, önem skoru 1-10)
- Dışsal Engeller (minimum 3 adet, önem skoru 1-10)
- İhtiyaçlar (minimum 3 adet, önem skoru 1-10)

Ayrıca her segment için "Reddedilemez Teklif" oluştur:
- Mükemmel Müşteri için: Maksimum değer, kolay satış
- Mecburi Müşteri için: Yüksek değer, ama daha fazla eğitim/destek gerekli
- Gereksiz Müşteri için: Filtreleme veya minimum efor teklifi

ÖNEMLI:
- Tüm içerik Türkçe olmalı
- Resmi iş Türkçesi kullan (siz formu)
- Önem skorları 1-10 arası tam sayı olmalı
- Spesifik ve uygulanabilir içerik üret, genel tavsiyelerden kaçın
- Sektöre özgü örnekler ver

KRİTİK: Çıktını KESİNLİKLE aşağıdaki JSON formatında ve anahtar kelimeleri (key names) BİREBİR AYNI tutarak ver.
Anahtar isimleri değiştirme, ekleme yapma, sadece değerleri doldur:

{
  "mukemmelMusteri": {
    "profil": "string",
    "icselArzular": [
      { "text": "string", "score": number }
    ],
    "dissalArzular": [
      { "text": "string", "score": number }
    ],
    "icselEngeller": [
      { "text": "string", "score": number }
    ],
    "dissalEngeller": [
      { "text": "string", "score": number }
    ],
    "ihtiyaclar": [
      { "text": "string", "score": number }
    ]
  },
  "mecburiMusteri": {
    "profil": "string",
    "icselArzular": [
      { "text": "string", "score": number }
    ],
    "dissalArzular": [
      { "text": "string", "score": number }
    ],
    "icselEngeller": [
      { "text": "string", "score": number }
    ],
    "dissalEngeller": [
      { "text": "string", "score": number }
    ],
    "ihtiyaclar": [
      { "text": "string", "score": number }
    ]
  },
  "gereksizMusteri": {
    "profil": "string"
  },
  "reddedilemezTeklifler": {
    "mukemmelMusteriTeklif": "string",
    "mecburiMusteriTeklif": "string",
    "gereksizMusteriTeklif": "string"
  }
}

TEKRAR: Yukarıdaki JSON şablonundaki anahtar isimlerini (mukemmelMusteri, icselArzular, dissalArzular, icselEngeller, dissalEngeller, ihtiyaclar, mecburiMusteri, gereksizMusteri, reddedilemezTeklifler, mukemmelMusteriTeklif, mecburiMusteriTeklif, gereksizMusteriTeklif) AYNEN kullan.`;
}

export type { ActionPlanContext, StrategyCardContext, CreativeContext };
