'use client';

/**
 * Recommendations List Component
 * 
 * Displays actionable recommendations sorted by impact level.
 */

import { Card } from '@/components/ui/card';
import { Recommendation } from '@/lib/types/media-buyer';

interface RecommendationsListProps {
  recommendations: Recommendation[];
}

export function RecommendationsList({ recommendations }: RecommendationsListProps) {
  if (recommendations.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Öneriler</h3>
        <p className="text-sm text-gray-600">Şu anda öneri bulunmuyor</p>
      </Card>
    );
  }

  // Sort by impact (high > medium > low)
  const impactOrder = { high: 0, medium: 1, low: 2 };
  const sortedRecommendations = [...recommendations].sort(
    (a, b) => impactOrder[a.impact] - impactOrder[b.impact]
  );

  const getImpactLabel = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'high':
        return 'Yüksek Etki';
      case 'medium':
        return 'Orta Etki';
      case 'low':
        return 'Düşük Etki';
    }
  };

  const getImpactColor = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getImpactIcon = (impact: Recommendation['impact']) => {
    switch (impact) {
      case 'high':
        return '⚡';
      case 'medium':
        return '💡';
      case 'low':
        return '📝';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Öneriler ({recommendations.length})
      </h3>
      <div className="space-y-3">
        {sortedRecommendations.map((rec, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-xl flex-shrink-0">
              {getImpactIcon(rec.impact)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${getImpactColor(
                    rec.impact
                  )}`}
                >
                  {getImpactLabel(rec.impact)}
                </span>
              </div>
              <p className="text-sm text-gray-700">{rec.action}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
