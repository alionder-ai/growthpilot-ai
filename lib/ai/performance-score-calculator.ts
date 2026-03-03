/**
 * Performance Score Calculator
 * 
 * Calculates objective performance scores (0-100) for Meta Ads campaigns
 * using campaign objective-specific metrics and weights.
 */

import { AggregatedMetrics } from '@/lib/types/media-buyer';

export class PerformanceScoreCalculator {
  /**
   * Calculate overall performance score (0-100) based on campaign objective
   * 
   * @param metrics - Aggregated campaign metrics
   * @param objective - Campaign objective (MESSAGES, ENGAGEMENT, TRAFFIC, CONVERSIONS, LEAD_GENERATION)
   * @returns Performance score between 0 and 100
   */
  calculate(metrics: AggregatedMetrics, objective?: string): number {
    const obj = (objective || '').toUpperCase();

    // MESSAGES / MESAJ kampanyası
    if (obj.includes('MESSAGE') || obj.includes('MESAJ')) {
      return this.calculateMessagesScore(metrics);
    }

    // ENGAGEMENT / ETKİLEŞİM kampanyası
    if (obj.includes('ENGAGEMENT') || obj.includes('ETK')) {
      return this.calculateEngagementScore(metrics);
    }

    // TRAFFIC / TRAFİK kampanyası
    if (obj.includes('TRAFFIC') || obj.includes('TRAF') || obj.includes('LINK')) {
      return this.calculateTrafficScore(metrics);
    }

    // LEAD_GENERATION kampanyası
    if (obj.includes('LEAD')) {
      return this.calculateLeadScore(metrics);
    }

    // CONVERSIONS / SALES / default (satış kampanyası)
    return this.calculateConversionsScore(metrics);
  }

  /**
   * Calculate score for MESSAGES campaigns
   * Focus: conversations, messaging_conversations_started, cost_per_conversation, CTR
   */
  private calculateMessagesScore(metrics: AggregatedMetrics): number {
    const conversationScore = this.scoreConversations(metrics.totalConversations || 0);
    const ctrScore = this.scoreCTR(metrics.avgCTR);
    const frequencyScore = this.scoreFrequency(metrics.avgFrequency);

    // Weights: conversations (40%), CTR (40%), frequency (20%)
    return Math.round(conversationScore * 0.4 + ctrScore * 0.4 + frequencyScore * 0.2);
  }

  /**
   * Calculate score for ENGAGEMENT campaigns
   * Focus: post_engagement, post_reactions, CTR, frequency
   */
  private calculateEngagementScore(metrics: AggregatedMetrics): number {
    const ctrScore = this.scoreCTR(metrics.avgCTR);
    const frequencyScore = this.scoreFrequency(metrics.avgFrequency);
    const cpmScore = this.scoreCPM(metrics.avgCPM);

    // Weights: CTR (50%), frequency (30%), CPM (20%)
    return Math.round(ctrScore * 0.5 + frequencyScore * 0.3 + cpmScore * 0.2);
  }

  /**
   * Calculate score for TRAFFIC campaigns
   * Focus: link_clicks, landing_page_views, CPC, CTR
   */
  private calculateTrafficScore(metrics: AggregatedMetrics): number {
    const ctrScore = this.scoreCTR(metrics.avgCTR);
    const cpcScore = this.scoreCPC(metrics.avgCPC || 0);
    const frequencyScore = this.scoreFrequency(metrics.avgFrequency);

    // Weights: CTR (40%), CPC (40%), frequency (20%)
    return Math.round(ctrScore * 0.4 + cpcScore * 0.4 + frequencyScore * 0.2);
  }

  /**
   * Calculate score for LEAD_GENERATION campaigns
   * Focus: leads, cost_per_lead
   */
  private calculateLeadScore(metrics: AggregatedMetrics): number {
    const leadScore = this.scoreLeads(metrics.totalLeads || 0);
    const cplScore = this.scoreCostPerLead(metrics.avgCostPerLead || 0);
    const frequencyScore = this.scoreFrequency(metrics.avgFrequency);

    // Weights: leads (40%), cost_per_lead (40%), frequency (20%)
    return Math.round(leadScore * 0.4 + cplScore * 0.4 + frequencyScore * 0.2);
  }

  /**
   * Calculate score for CONVERSIONS/SALES campaigns
   * Focus: purchases, ROAS, conversions, CPA, CTR
   */
  private calculateConversionsScore(metrics: AggregatedMetrics): number {
    const engagementScore = this.scoreCTR(metrics.avgCTR) * 0.4;
    const fatigueScore = this.scoreFrequency(metrics.avgFrequency) * 0.2;
    const efficiencyScore = this.scoreROAS(metrics.avgROAS) * 0.3;
    const audienceScore = this.scoreCPM(metrics.avgCPM) * 0.1;

    return Math.round(engagementScore + fatigueScore + efficiencyScore + audienceScore);
  }

  // Individual metric scoring functions

  private scoreConversations(conversations: number): number {
    if (conversations === 0) return 30;
    return Math.min(100, conversations * 10);
  }

  private scoreCTR(ctr: number): number {
    // CTR benchmarks: 2% = 100 points
    return Math.min(100, (ctr / 2) * 100);
  }

  private scoreFrequency(frequency: number): number {
    if (frequency < 3) return 100;
    if (frequency < 4.5) return 60;
    return 20;
  }

  private scoreCPM(cpm: number): number {
    if (cpm < 50) return 100;
    if (cpm < 100) return 70;
    return 40;
  }

  private scoreCPC(cpc: number): number {
    if (cpc === 0) return 50;
    if (cpc < 5) return 100;
    if (cpc < 15) return 70;
    return 30;
  }

  private scoreLeads(leads: number): number {
    if (leads === 0) return 20;
    return Math.min(100, leads * 5);
  }

  private scoreCostPerLead(cpl: number): number {
    if (cpl === 0) return 50;
    if (cpl < 50) return 100;
    if (cpl < 150) return 60;
    return 20;
  }

  private scoreROAS(roas: number): number {
    return Math.min(100, roas * 25);
  }
}
