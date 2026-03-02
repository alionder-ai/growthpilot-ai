'use client';

/**
 * Benchmark Comparison Component
 * 
 * Displays campaign metrics compared to industry benchmarks.
 */

import { Card } from '@/components/ui/card';
import { BenchmarkComparison as BenchmarkComparisonType } from '@/lib/types/media-buyer';

interface BenchmarkComparisonProps {
  comparison: BenchmarkComparisonType;
}

export function BenchmarkComparison({ comparison }: BenchmarkComparisonProps) {
  const getStatusIcon = (status: 'above' | 'below' | 'at') => {
    switch (status) {
      case 'above':
        return '✅';
      case 'below':
        return '⚠️';
      case 'at':
        return '➡️';
    }
  };

  const getStatusText = (status: 'above' | 'below' | 'at') => {
    switch (status) {
      case 'above':
        return 'Ortalamanın Üstünde';
      case 'below':
        return 'Ortalamanın Altında';
      case 'at':
        return 'Ortalama Seviyede';
    }
  };

  const getStatusColor = (status: 'above' | 'below' | 'at') => {
    switch (status) {
      case 'above':
        return 'text-green-700 bg-green-50';
      case 'below':
        return 'text-orange-700 bg-orange-50';
      case 'at':
        return 'text-blue-700 bg-blue-50';
    }
  };

  const formatMetric = (value: number, metric: string) => {
    switch (metric) {
      case 'ctr':
      case 'cvr':
        return `${value.toFixed(2)}%`;
      case 'roas':
        return value.toFixed(2);
      default:
        return value.toString();
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'ctr':
        return 'Tıklama Oranı (CTR)';
      case 'cvr':
        return 'Dönüşüm Oranı (CVR)';
      case 'roas':
        return 'Yatırım Getirisi (ROAS)';
      default:
        return metric.toUpperCase();
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sektör Karşılaştırması</h3>
          <p className="text-sm text-gray-600 mt-1">
            Sektör: <span className="font-medium">{comparison.industry}</span>
          </p>
        </div>

        <div className="space-y-3">
          {Object.entries(comparison.metrics).map(([key, metric]) => (
            <div
              key={key}
              className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {getMetricLabel(key)}
                </span>
                <span className="text-lg">{getStatusIcon(metric.status)}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-xs text-gray-600">Kampanyanız</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatMetric(metric.campaign, key)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Sektör Ortalaması</div>
                  <div className="text-lg font-semibold text-gray-600">
                    {formatMetric(metric.benchmark, key)}
                  </div>
                </div>
              </div>

              <div className={`text-xs font-medium px-2 py-1 rounded inline-block ${getStatusColor(metric.status)}`}>
                {getStatusText(metric.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <p>
            📊 Sektör ortalamaları Türkiye pazarı verilerine dayanmaktadır. 
            Kampanyanızın hedef kitlesi ve ürün kategorisi sonuçları etkileyebilir.
          </p>
        </div>
      </div>
    </Card>
  );
}
