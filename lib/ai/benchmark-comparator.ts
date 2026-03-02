/**
 * Benchmark Comparator
 * 
 * Compares campaign metrics against industry benchmarks.
 * Provides context for performance evaluation.
 */

import { AggregatedMetrics, BenchmarkComparison, MetricComparison } from '@/lib/types/media-buyer';

/**
 * Industry benchmark data (Turkish market averages)
 * Source: Meta Ads industry reports and Turkish market data
 */
const INDUSTRY_BENCHMARKS: Record<string, { ctr: number; cvr: number; roas: number }> = {
  'E-ticaret': { ctr: 1.8, cvr: 3.5, roas: 3.2 },
  'Eğitim': { ctr: 2.1, cvr: 4.2, roas: 2.8 },
  'Sağlık': { ctr: 1.5, cvr: 3.0, roas: 3.5 },
  'Finans': { ctr: 1.2, cvr: 2.5, roas: 4.0 },
  'Gayrimenkul': { ctr: 1.4, cvr: 2.0, roas: 3.8 },
  'Turizm': { ctr: 2.0, cvr: 3.2, roas: 2.5 },
  'Teknoloji': { ctr: 1.6, cvr: 3.8, roas: 3.0 },
  'Moda': { ctr: 2.2, cvr: 4.0, roas: 2.8 },
  'Yemek': { ctr: 2.5, cvr: 5.0, roas: 2.2 },
  'Otomotiv': { ctr: 1.3, cvr: 2.2, roas: 3.5 },
  'Genel': { ctr: 1.7, cvr: 3.5, roas: 3.0 }, // Default benchmark
};

/**
 * Compare campaign metrics to industry benchmarks
 * 
 * @param metrics - Aggregated campaign metrics
 * @param industry - Client industry
 * @returns Benchmark comparison or null if unavailable
 */
export function compareToBenchmark(
  metrics: AggregatedMetrics,
  industry: string
): BenchmarkComparison | null {
  // Get benchmark for industry (fallback to 'Genel' if not found)
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS['Genel'];
  
  if (!benchmark) {
    return null;
  }

  return {
    industry,
    metrics: {
      ctr: compareMetric(metrics.avgCTR, benchmark.ctr),
      cvr: compareMetric(metrics.avgCVR, benchmark.cvr),
      roas: compareMetric(metrics.avgROAS, benchmark.roas),
    },
  };
}

/**
 * Compare a single metric value to benchmark
 * 
 * @param campaignValue - Campaign metric value
 * @param benchmarkValue - Industry benchmark value
 * @returns Metric comparison with status
 */
function compareMetric(
  campaignValue: number,
  benchmarkValue: number
): MetricComparison {
  // Calculate percentage difference
  const percentDiff = ((campaignValue - benchmarkValue) / benchmarkValue) * 100;
  
  // Determine status (within 5% is considered "at" benchmark)
  let status: 'above' | 'below' | 'at';
  if (percentDiff > 5) {
    status = 'above';
  } else if (percentDiff < -5) {
    status = 'below';
  } else {
    status = 'at';
  }

  return {
    campaign: campaignValue,
    benchmark: benchmarkValue,
    status,
  };
}

/**
 * Get list of available industries
 */
export function getAvailableIndustries(): string[] {
  return Object.keys(INDUSTRY_BENCHMARKS);
}
