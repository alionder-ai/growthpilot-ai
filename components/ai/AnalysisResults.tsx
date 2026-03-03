'use client';

/**
 * Analysis Results Component
 * 
 * Main component that displays complete media buyer analysis results.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MediaBuyerAnalysis } from '@/lib/types/media-buyer';
import { PerformanceScoreCard } from './PerformanceScoreCard';
import { IssuesList } from './IssuesList';
import { RecommendationsList } from './RecommendationsList';
import { ProfitSimulationCard } from './ProfitSimulationCard';
import { BenchmarkComparison } from './BenchmarkComparison';

interface AnalysisResultsProps {
  analysis: MediaBuyerAnalysis;
  campaignObjective: string;
  onCopyJustification?: () => void;
}

export function AnalysisResults({ analysis, campaignObjective, onCopyJustification }: AnalysisResultsProps) {
  const [copiedJustification, setCopiedJustification] = useState(false);

  const handleCopyJustification = () => {
    if (analysis.clientJustification) {
      navigator.clipboard.writeText(analysis.clientJustification);
      setCopiedJustification(true);
      setTimeout(() => setCopiedJustification(false), 2000);
      onCopyJustification?.();
    }
  };

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analiz Sonuçları</h2>
            <p className="text-sm text-gray-600 mt-1">
              Analiz Tarihi: {formatDate(analysis.analyzedAt)}
            </p>
          </div>
          <span className="text-4xl">🤖</span>
        </div>
      </Card>

      {/* Performance Score */}
      <PerformanceScoreCard
        score={analysis.performanceScore}
        decision={analysis.decision}
        justification={analysis.justification}
      />

      {/* Campaign Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-3">Kampanya Özeti</h3>
        <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
      </Card>

      {/* KPI Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">KPI Değerlendirmesi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysis.kpiOverview.map((kpi, index) => {
            const statusColors = {
              good: 'bg-green-50 border-green-200',
              warning: 'bg-yellow-50 border-yellow-200',
              bad: 'bg-red-50 border-red-200',
            };
            const statusIcons = {
              good: '✓',
              warning: '⚠',
              bad: '✗',
            };
            const statusTextColors = {
              good: 'text-green-700',
              warning: 'text-yellow-700',
              bad: 'text-red-700',
            };

            return (
              <div
                key={index}
                className={`p-4 rounded-lg border ${statusColors[kpi.status]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">{kpi.name}</div>
                  <span className={`text-lg ${statusTextColors[kpi.status]}`}>
                    {statusIcons[kpi.status]}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{kpi.value}</div>
                <p className="text-xs text-gray-600">{kpi.benchmark}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Issues and Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssuesList issues={analysis.issues} />
        <RecommendationsList recommendations={analysis.recommendations} />
      </div>

      {/* Next Tests */}
      {analysis.nextTests.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sonraki Test Fırsatları</h3>
          <ul className="space-y-2">
            {analysis.nextTests.map((test, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                <span className="text-sm text-gray-700">{test}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Profit Simulation - Only for CONVERSIONS and SALES objectives */}
      {analysis.profitSimulation &&
        !['ENGAGEMENT', 'MESSAGES', 'TRAFFIC', 'LEAD_GENERATION'].includes(campaignObjective) && (
          <ProfitSimulationCard simulation={analysis.profitSimulation} />
        )}

      {/* Benchmark Comparison */}
      {analysis.industryBenchmark && (
        <BenchmarkComparison comparison={analysis.industryBenchmark} />
      )}

      {/* Client Justification (for Kill decisions) */}
      {analysis.clientJustification && (
        <Card className="p-6 border-2 border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-red-900">
              Müşteri Paylaşım Metni
            </h3>
            <Button
              onClick={handleCopyJustification}
              variant="outline"
              size="sm"
              className="bg-white"
            >
              {copiedJustification ? '✓ Kopyalandı' : '📋 Kopyala'}
            </Button>
          </div>
          <div className="bg-white p-4 rounded border border-red-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
              {analysis.clientJustification}
            </pre>
          </div>
          <p className="text-xs text-red-700 mt-2">
            Bu metin müşterinizle paylaşmak için hazırlanmıştır.
          </p>
        </Card>
      )}
    </div>
  );
}
