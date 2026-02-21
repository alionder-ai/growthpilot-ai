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

export type { ActionPlanContext, StrategyCardContext, CreativeContext };
