/**
 * Decision Engine
 * 
 * Determines Scale/Hold/Kill recommendations based on performance score,
 * ROAS, and frequency metrics with Turkish-language justifications.
 */

import { AggregatedMetrics, DecisionResult } from '@/lib/types/media-buyer';

export class DecisionEngine {
  /**
   * Determine Scale/Hold/Kill decision
   * 
   * Rules:
   * - Scale: score >= 70 AND ROAS > target AND frequency < 3
   * - Kill: score < 40 OR frequency > 4.5 OR ROAS < (target × 0.5)
   * - Hold: everything else
   * 
   * @param score - Performance score (0-100)
   * @param metrics - Aggregated campaign metrics
   * @param targetROAS - Target ROAS from commission model
   * @returns Decision result with justification
   */
  determine(
    score: number,
    metrics: AggregatedMetrics,
    targetROAS: number
  ): DecisionResult {
    const { avgROAS, avgFrequency } = metrics;

    // Check Kill conditions first (most critical)
    if (this.shouldKill(score, avgROAS, avgFrequency, targetROAS)) {
      return {
        decision: 'kill',
        justification: this.generateJustification('kill', score, metrics, targetROAS),
        clientJustification: this.generateClientJustification(metrics, targetROAS),
      };
    }

    // Check Scale conditions
    if (this.shouldScale(score, avgROAS, avgFrequency, targetROAS)) {
      return {
        decision: 'scale',
        justification: this.generateJustification('scale', score, metrics, targetROAS),
      };
    }

    // Default to Hold
    return {
      decision: 'hold',
      justification: this.generateJustification('hold', score, metrics, targetROAS),
    };
  }

  /**
   * Check if campaign should be scaled
   */
  private shouldScale(
    score: number,
    roas: number,
    frequency: number,
    targetROAS: number
  ): boolean {
    return score >= 70 && roas > targetROAS && frequency < 3;
  }

  /**
   * Check if campaign should be killed
   */
  private shouldKill(
    score: number,
    roas: number,
    frequency: number,
    targetROAS: number
  ): boolean {
    return score < 40 || frequency > 4.5 || roas < (targetROAS * 0.5);
  }

  /**
   * Generate Turkish justification for decision
   */
  private generateJustification(
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
        if (score < 40) {
          reasons.push(`düşük performans skoru (${score.toFixed(0)}/100)`);
        }
        if (avgFrequency > 4.5) {
          reasons.push(`yüksek reklam yorgunluğu (Frekans: ${avgFrequency.toFixed(2)})`);
        }
        if (avgROAS < (targetROAS * 0.5)) {
          reasons.push(`hedefin çok altında ROAS (${avgROAS.toFixed(2)} < ${(targetROAS * 0.5).toFixed(2)})`);
        }
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
   * This is suitable for sharing with clients
   */
  private generateClientJustification(
    metrics: AggregatedMetrics,
    targetROAS: number
  ): string {
    const { avgROAS, avgFrequency, totalSpend, totalConversions, avgCPA } = metrics;

    let justification = '📊 Kampanya Performans Raporu\n\n';
    justification += '❌ Kampanyanın durdurulması önerilmektedir.\n\n';
    justification += 'Sebep:\n';

    if (avgROAS < targetROAS) {
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
