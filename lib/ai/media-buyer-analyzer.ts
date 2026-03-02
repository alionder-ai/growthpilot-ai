/**
 * Media Buyer Analyzer
 * 
 * Main orchestrator that coordinates all analysis components:
 * - Data collection
 * - Performance scoring
 * - Decision logic
 * - AI analysis
 * - Profit simulation
 * - Benchmark comparison
 */

import { MediaBuyerAnalysis } from '@/lib/types/media-buyer';
import { collectCampaignData, aggregateMetrics } from '@/lib/ai/media-buyer-data';
import { PerformanceScoreCalculator } from '@/lib/ai/performance-score-calculator';
import { DecisionEngine } from '@/lib/ai/decision-engine';
import { ProfitSimulator } from '@/lib/ai/profit-simulator';
import { compareToBenchmark } from '@/lib/ai/benchmark-comparator';
import { generateAIAnalysis } from '@/lib/ai/media-buyer-ai';
import { MEDIA_BUYER_ERRORS } from '@/lib/ai/prompts';

export class MediaBuyerAnalyzer {
  private scoreCalculator: PerformanceScoreCalculator;
  private decisionEngine: DecisionEngine;
  private profitSimulator: ProfitSimulator;

  constructor() {
    this.scoreCalculator = new PerformanceScoreCalculator();
    this.decisionEngine = new DecisionEngine();
    this.profitSimulator = new ProfitSimulator();
  }

  /**
   * Analyze campaign and generate comprehensive recommendations
   * 
   * @param campaignId - Campaign UUID
   * @param userId - User UUID for authorization
   * @returns Complete media buyer analysis
   * @throws Error with Turkish message if analysis fails
   */
  async analyzeCampaign(
    campaignId: string,
    userId: string
  ): Promise<MediaBuyerAnalysis> {
    try {
      // Step 1: Collect campaign data
      const campaignData = await collectCampaignData(campaignId, userId);

      // Step 2: Aggregate metrics
      const metrics = aggregateMetrics(campaignData.metrics);

      // Step 3: Calculate performance score
      const performanceScore = this.scoreCalculator.calculate(metrics);

      // Step 4: Determine Scale/Hold/Kill decision
      const decision = this.decisionEngine.determine(
        performanceScore,
        metrics,
        campaignData.commissionModel.target_roas || 2.0
      );

      // Step 5: Generate AI analysis (parallel with other operations)
      const aiAnalysisPromise = generateAIAnalysis(campaignData, metrics);

      // Step 6: Simulate profit impact
      const profitSimulation = this.profitSimulator.simulate(
        metrics,
        decision,
        campaignData.commissionModel
      );

      // Step 7: Compare to industry benchmarks
      const industryBenchmark = compareToBenchmark(
        metrics,
        campaignData.client.industry
      );

      // Wait for AI analysis to complete
      const aiAnalysis = await aiAnalysisPromise;

      // Step 8: Combine all results
      return {
        performanceScore,
        decision: decision.decision,
        justification: decision.justification,
        clientJustification: decision.clientJustification,
        summary: aiAnalysis.summary,
        kpiOverview: aiAnalysis.kpiOverview,
        issues: aiAnalysis.issues,
        recommendations: aiAnalysis.recommendations,
        nextTests: aiAnalysis.nextTests,
        profitSimulation,
        industryBenchmark: industryBenchmark || undefined,
        analyzedAt: new Date().toISOString(),
      };
    } catch (error) {
      // Handle and translate errors to Turkish
      if (error instanceof Error) {
        // If error message is already in Turkish (from our error constants), use it
        if (Object.values(MEDIA_BUYER_ERRORS).includes(error.message as any)) {
          throw error;
        }
        
        // Otherwise, provide a generic Turkish error
        console.error('Media buyer analysis error:', error);
        throw new Error(MEDIA_BUYER_ERRORS.UNKNOWN_ERROR);
      }
      
      throw new Error(MEDIA_BUYER_ERRORS.UNKNOWN_ERROR);
    }
  }
}
