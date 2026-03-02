/**
 * Profit Simulator
 * 
 * Simulates profit impact of Scale/Hold/Kill decisions
 * with commission calculations based on model type.
 */

import { AggregatedMetrics, ProfitSimulation, DecisionResult, CampaignData } from '@/lib/types/media-buyer';

export class ProfitSimulator {
  /**
   * Simulate profit impact of recommendation
   * 
   * Projection logic:
   * - Scale: +30% spend, +25% revenue (slight efficiency loss expected)
   * - Hold: no change
   * - Kill: zero spend and revenue
   * 
   * @param currentMetrics - Current campaign metrics
   * @param decision - Scale/Hold/Kill decision
   * @param commissionModel - Commission model configuration
   * @returns Profit simulation with before/after comparison
   */
  simulate(
    currentMetrics: AggregatedMetrics,
    decision: DecisionResult,
    commissionModel: CampaignData['commissionModel']
  ): ProfitSimulation {
    // Calculate current state
    const currentRevenue = this.calculateRevenue(currentMetrics);
    const currentProfit = currentRevenue - currentMetrics.totalSpend;
    const currentCommission = this.calculateCommission(currentRevenue, commissionModel);

    // Project future state based on decision
    const projectedMetrics = this.projectMetrics(currentMetrics, decision.decision);
    const projectedRevenue = this.calculateRevenue(projectedMetrics);
    const projectedProfit = projectedRevenue - projectedMetrics.totalSpend;
    const projectedCommission = this.calculateCommission(projectedRevenue, commissionModel);

    // Calculate percentage change
    const percentageChange = currentProfit !== 0
      ? ((projectedProfit - currentProfit) / Math.abs(currentProfit)) * 100
      : projectedProfit > 0 ? 100 : 0;

    return {
      currentProfit,
      projectedProfit,
      percentageChange,
      currentRevenue,
      projectedRevenue,
      commission: commissionModel.model_type === 'percentage' ? projectedCommission : commissionModel.rate,
    };
  }

  /**
   * Project metrics based on decision
   */
  private projectMetrics(
    current: AggregatedMetrics,
    decision: 'scale' | 'hold' | 'kill'
  ): AggregatedMetrics {
    switch (decision) {
      case 'scale':
        // Scale: +30% spend, +25% revenue (efficiency slightly decreases)
        return {
          ...current,
          totalSpend: current.totalSpend * 1.30,
          totalImpressions: current.totalImpressions * 1.30,
          totalClicks: current.totalClicks * 1.28,
          totalConversions: current.totalConversions * 1.25,
          avgROAS: current.avgROAS * 0.96, // Slight ROAS decrease expected
        };

      case 'kill':
        // Kill: everything goes to zero
        return {
          ...current,
          totalSpend: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalConversions: 0,
          avgROAS: 0,
        };

      case 'hold':
      default:
        // Hold: no change
        return current;
    }
  }

  /**
   * Calculate revenue from metrics
   * Revenue = Total Spend × ROAS
   */
  private calculateRevenue(metrics: AggregatedMetrics): number {
    return metrics.totalSpend * metrics.avgROAS;
  }

  /**
   * Calculate commission based on model type
   * 
   * - Percentage model: commission = revenue × rate
   * - Fixed model: commission = fixed rate (regardless of revenue)
   */
  private calculateCommission(
    revenue: number,
    model: CampaignData['commissionModel']
  ): number {
    if (model.model_type === 'percentage') {
      return revenue * model.rate;
    } else {
      // Fixed commission
      return model.rate;
    }
  }
}
