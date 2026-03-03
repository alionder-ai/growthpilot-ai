/**
 * Decision Engine
 * 
 * Determines Scale/Hold/Kill recommendations based on performance score,
 * campaign objective, and key metrics with Turkish-language justifications.
 */

import { AggregatedMetrics, DecisionResult } from '@/lib/types/media-buyer';

export class DecisionEngine {
  /**
   * Determine Scale/Hold/Kill decision based on campaign objective
   * 
   * @param score - Performance score (0-100)
   * @param metrics - Aggregated campaign metrics
   * @param targetROAS - Target ROAS from commission model
   * @param objective - Campaign objective
   * @returns Decision result with justification
   */
  determine(
    score: number,
    metrics: AggregatedMetrics,
    targetROAS: number,
    objective?: string
  ): DecisionResult {
    const obj = (objective || '').toUpperCase();
    const isEngagement = obj.includes('ENGAGEMENT') || obj.includes('ETK') || 
                         obj.includes('MESSAGE') || obj.includes('MESAJ');

    // Etkileşim/Mesaj kampanyalarında ROAS kontrolü yapma
    if (isEngagement) {
      return this.determineEngagementCampaign(score, metrics);
    }

    // Satış/Dönüşüm kampanyaları için ROAS kontrolü
    return this.determineConversionCampaign(score, metrics, targetROAS);
  }

  /**
   * Decision logic for engagement/message campaigns (no ROAS check)
   */
  private determineEngagementCampaign(
    score: number,
    metrics: AggregatedMetrics
  ): DecisionResult {
    const { avgFrequency } = metrics;

    // Scale: high score and low frequency
    if (score >= 70 && avgFrequency < 3) {
      return {
        decision: 'scale',
        justification: this.generateEngagementJustification('scale', score, metrics),
      };
    }

    // Kill: low score or high fatigue
    if (score < 40 || avgFrequency > 4.5) {
      return {
        decision: 'kill',
        justification: this.generateEngagementJustification('kill', score, metrics),
        clientJustification: this.generateClientJustification(metrics, 0),
      };
    }

    // Hold: moderate performance
    return {
      decision: 'hold',
      justification: this.generateEngagementJustification('hold', score, metrics),
    };
  }

  /**
   * Decision logic for conversion/sales campaigns (with ROAS check)
   */
  private determineConversionCampaign(
    score: number,
    metrics: AggregatedMetrics,
    targetROAS: number
  ): DecisionResult {
    const { avgROAS, avgFrequency } = metrics;

    // Scale: high score, good ROAS, low frequency
    if (score >= 70 && avgROAS > targetROAS && avgFrequency < 3) {
      return {
        decision: 'scale',
        justification: this.generateConversionJustification('scale', score, metrics, targetROAS),
      };
    }

    // Kill: low score, poor ROAS, or high fatigue
    if (score < 40 || avgFrequency > 4.5 || avgROAS < targetROAS * 0.5) {
      return {
        decision: 'kill',
        justification: this.generateConversionJustification('kill', score, metrics, targetROAS),
        clientJustification: this.generateClientJustification(metrics, targetROAS),
      };
    }

    // Hold: moderate performance
    return {
      decision: 'hold',
      justification: this.generateConversionJustification('hold', score, metrics, targetROAS),
    };
  }

  /**
   * Generate justification for engagement/message campaigns
   */
  private generateEngagementJustification(
    decision: string,
    score: number,
    metrics: AggregatedMetrics
  ): string {
    const { avgFrequency, avgCTR, totalConversations } = metrics;

    switch (decision) {
      case 'scale':
        return `Kampanya mükemmel performans gösteriyor (Skor: ${score.toFixed(0)}/100). ` +
          `Etkileşim metrikleri güçlü (CTR: ${avgCTR.toFixed(2)}%` +
          (totalConversations ? `, Konuşmalar: ${totalConversations}` : '') +
          `), reklam yorgunluğu düşük (Frekans: ${avgFrequency.toFixed(2)}). ` +
          `Bütçe artırımı önerilir.`;

      case 'kill':
        const reasons: string[] = [];
        if (score < 40) reasons.push(`düşük performans skoru (${score.toFixed(0)}/100)`);
        if (avgFrequency > 4.5) reasons.push(`yüksek reklam yorgunluğu (Frekans: ${avgFrequency.toFixed(2)})`);
        return `Kampanya durdurulmalı. Tespit edilen sorunlar: ${reasons.join(', ')}. ` +
          `Mevcut metrikler: CTR ${avgCTR.toFixed(2)}%, Frekans ${avgFrequency.toFixed(2)}.`;

      case 'hold':
        return `Kampanya orta seviye performans gösteriyor (Skor: ${score.toFixed(0)}/100). ` +
          `Frekans ${avgFrequency.toFixed(2)}, CTR ${avgCTR.toFixed(2)}%. ` +
          `Mevcut bütçe ile devam edilmeli, optimizasyon fırsatları değerlendirilmeli.`;

      default:
        return 'Karar belirlenemedi.';
    }
  }

  /**
   * Generate justification for conversion/sales campaigns
   */
  private generateConversionJustification(
    decision: string,
    score: number,
    metrics: AggregatedMetrics,
    targetROAS: number
  ): string {
    const { avgROAS, avgFrequency, avgCTR, avgCVR } = metrics;

    switch (decision) {
      case 'scale':
        return `Kampanya mükemmel performans gösteriyor (Skor: ${score.toFixed(0)}/100). ` +
          `ROAS hedefin üzerinde (${avgROAS.toFixed(2)} > ${targetROAS.toFixed(2)}), ` +
          `reklam yorgunluğu düşük (Frekans: ${avgFrequency.toFixed(2)}), ` +
          `ve engagement metrikleri güçlü (CTR: ${avgCTR.toFixed(2)}%, CVR: ${avgCVR.toFixed(2)}%). ` +
          `Bütçe artırımı önerilir.`;

      case 'kill':
        const reasons: string[] = [];
        if (score < 40) reasons.push(`düşük performans skoru (${score.toFixed(0)}/100)`);
        if (avgFrequency > 4.5) reasons.push(`yüksek reklam yorgunluğu (Frekans: ${avgFrequency.toFixed(2)})`);
        if (avgROAS < targetROAS * 0.5) reasons.push(`hedefin çok altında ROAS (${avgROAS.toFixed(2)} < ${(targetROAS * 0.5).toFixed(2)})`);
        return `Kampanya durdurulmalı. Tespit edilen sorunlar: ${reasons.join(', ')}. ` +
          `Mevcut metrikler: CTR ${avgCTR.toFixed(2)}%, CVR ${avgCVR.toFixed(2)}%, ROAS ${avgROAS.toFixed(2)}.`;

      case 'hold':
        return `Kampanya orta seviye performans gösteriyor (Skor: ${score.toFixed(0)}/100). ` +
          `ROAS ${avgROAS.toFixed(2)} (Hedef: ${targetROAS.toFixed(2)}), ` +
          `Frekans ${avgFrequency.toFixed(2)}, ` +
          `CTR ${avgCTR.toFixed(2)}%, CVR ${avgCVR.toFixed(2)}%. ` +
          `Mevcut bütçe ile devam edilmeli, optimizasyon fırsatları değerlendirilmeli.`;

      default:
        return 'Karar belirlenemedi.';
    }
  }

  /**
   * Generate client-friendly justification for Kill decisions
   */
  private generateClientJustification(
    metrics: AggregatedMetrics,
    targetROAS: number
  ): string {
    const { avgROAS, avgFrequency, totalSpend, totalConversions, avgCPA } = metrics;

    let justification = '📊 Kampanya Performans Raporu\n\n';
    justification += '❌ Kampanyanın durdurulması önerilmektedir.\n\n';
    justification += 'Sebep:\n';

    if (targetROAS > 0 && avgROAS < targetROAS) {
      justification += `• Yatırım getirisi hedefin altında (${avgROAS.toFixed(2)}x, Hedef: ${targetROAS.toFixed(2)}x)\n`;
    }

    if (avgFrequency > 4.5) {
      justification += `• Hedef kitleye çok sık gösterim yapılıyor (Frekans: ${avgFrequency.toFixed(2)})\n`;
      justification += '  → Aynı kişiler reklamı çok fazla görüyor, bu da maliyetleri artırıyor\n';
    }

    if (totalConversions === 0) {
      justification += '• Hiç dönüşüm alınamadı\n';
    } else if (avgCPA > 300) {
      justification += `• Dönüşüm maliyeti çok yüksek (₺${avgCPA.toFixed(2)})\n`;
    }

    justification += `\nToplam Harcama: ₺${totalSpend.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
    justification += `Toplam Dönüşüm: ${totalConversions}\n\n`;
    justification += '💡 Öneri: Kampanya stratejisini yeniden gözden geçirip, yeni bir yaklaşımla test etmek daha verimli olacaktır.';

    return justification;
  }
}
