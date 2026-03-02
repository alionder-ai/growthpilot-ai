/**
 * Performance Score Calculator
 * 
 * Calculates objective performance scores (0-100) for Meta Ads campaigns
 * using weighted metrics: engagement (40%), fatigue (20%), efficiency (30%), audience (10%)
 */

import { AggregatedMetrics } from '@/lib/types/media-buyer';

export class PerformanceScoreCalculator {
  /**
   * Calculate overall performance score (0-100)
   * 
   * @param metrics - Aggregated campaign metrics
   * @returns Performance score between 0 and 100
   */
  calculate(metrics: AggregatedMetrics): number {
    const engagementScore = this.calculateEngagementScore(metrics.avgCTR, metrics.avgCVR);
    const fatigueScore = this.calculateFatigueScore(metrics.avgFrequency);
    const efficiencyScore = this.calculateEfficiencyScore(metrics.avgROAS, metrics.avgCPA);
    const audienceScore = this.calculateAudienceScore(metrics.avgCPM);

    // Apply weights: engagement (40%), fatigue (20%), efficiency (30%), audience (10%)
    const totalScore = 
      (engagementScore * 0.4) +
      (fatigueScore * 0.2) +
      (efficiencyScore * 0.3) +
      (audienceScore * 0.1);

    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, totalScore));
  }

  /**
   * Calculate engagement score based on CTR and CVR (40% weight)
   * 
   * Industry benchmarks:
   * - CTR: 1-2% is average, 3%+ is excellent
   * - CVR: 2-5% is average, 8%+ is excellent
   */
  private calculateEngagementScore(ctr: number, cvr: number): number {
    // CTR scoring (50% of engagement score)
    let ctrScore = 0;
    if (ctr >= 3) {
      ctrScore = 100;
    } else if (ctr >= 2) {
      ctrScore = 80;
    } else if (ctr >= 1) {
      ctrScore = 60;
    } else if (ctr >= 0.5) {
      ctrScore = 40;
    } else {
      ctrScore = 20;
    }

    // CVR scoring (50% of engagement score)
    let cvrScore = 0;
    if (cvr >= 8) {
      cvrScore = 100;
    } else if (cvr >= 5) {
      cvrScore = 80;
    } else if (cvr >= 2) {
      cvrScore = 60;
    } else if (cvr >= 1) {
      cvrScore = 40;
    } else {
      cvrScore = 20;
    }

    return (ctrScore * 0.5) + (cvrScore * 0.5);
  }

  /**
   * Calculate fatigue score based on frequency (20% weight)
   * 
   * Optimal frequency: 1.5-2.5
   * Warning zone: 3-4
   * Danger zone: 4.5+
   */
  private calculateFatigueScore(frequency: number): number {
    if (frequency >= 4.5) {
      return 0; // Critical fatigue
    } else if (frequency >= 4) {
      return 30; // High fatigue
    } else if (frequency >= 3) {
      return 60; // Moderate fatigue
    } else if (frequency >= 1.5 && frequency <= 2.5) {
      return 100; // Optimal range
    } else if (frequency < 1.5) {
      return 80; // Low reach, but not fatigued
    } else {
      return 70; // Slightly elevated
    }
  }

  /**
   * Calculate efficiency score based on ROAS and CPA (30% weight)
   * 
   * ROAS benchmarks:
   * - 4+ is excellent
   * - 2-4 is good
   * - 1-2 is break-even zone
   * - <1 is losing money
   */
  private calculateEfficiencyScore(roas: number, cpa: number): number {
    // ROAS scoring (70% of efficiency score)
    let roasScore = 0;
    if (roas >= 4) {
      roasScore = 100;
    } else if (roas >= 3) {
      roasScore = 85;
    } else if (roas >= 2) {
      roasScore = 70;
    } else if (roas >= 1.5) {
      roasScore = 50;
    } else if (roas >= 1) {
      roasScore = 30;
    } else {
      roasScore = 10;
    }

    // CPA scoring (30% of efficiency score)
    // Lower CPA is better, but we need context
    // Using relative scoring: CPA < 50 is excellent, 50-100 is good, 100-200 is average, 200+ is poor
    let cpaScore = 0;
    if (cpa <= 50) {
      cpaScore = 100;
    } else if (cpa <= 100) {
      cpaScore = 80;
    } else if (cpa <= 200) {
      cpaScore = 60;
    } else if (cpa <= 300) {
      cpaScore = 40;
    } else {
      cpaScore = 20;
    }

    return (roasScore * 0.7) + (cpaScore * 0.3);
  }

  /**
   * Calculate audience score based on CPM (10% weight)
   * 
   * CPM benchmarks (Turkish market):
   * - <10 TL is excellent
   * - 10-20 TL is good
   * - 20-40 TL is average
   * - 40+ TL is expensive
   */
  private calculateAudienceScore(cpm: number): number {
    if (cpm <= 10) {
      return 100;
    } else if (cpm <= 20) {
      return 80;
    } else if (cpm <= 40) {
      return 60;
    } else if (cpm <= 60) {
      return 40;
    } else {
      return 20;
    }
  }
}
