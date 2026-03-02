'use client';

/**
 * Performance Score Card Component
 * 
 * Displays performance score with circular progress indicator,
 * color coding, decision badge, and justification.
 */

import { Card } from '@/components/ui/card';
import { DecisionBadge } from './DecisionBadge';

interface PerformanceScoreCardProps {
  score: number; // 0-100
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
}

export function PerformanceScoreCard({
  score,
  decision,
  justification,
}: PerformanceScoreCardProps) {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = () => {
    if (score >= 70) return 'bg-green-50';
    if (score >= 40) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const getProgressColor = () => {
    if (score >= 70) return 'stroke-green-600';
    if (score >= 40) return 'stroke-yellow-600';
    return 'stroke-red-600';
  };

  // Calculate circle progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <Card className={`p-6 ${getScoreBgColor()}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Performans Skoru</h3>
          <DecisionBadge decision={decision} size="md" />
        </div>

        {/* Circular Progress */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg width="180" height="180" className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-gray-200"
              />
              {/* Progress circle */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                strokeLinecap="round"
                className={getProgressColor()}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
              />
            </svg>
            {/* Score text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor()}`}>
                  {Math.round(score)}
                </div>
                <div className="text-sm text-gray-600">/ 100</div>
              </div>
            </div>
          </div>
        </div>

        {/* Justification */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Değerlendirme</h4>
          <p className="text-sm text-gray-600 leading-relaxed">
            {justification}
          </p>
        </div>

        {/* Score interpretation */}
        <div className="text-xs text-gray-500 border-t pt-4">
          <div className="flex items-center justify-between">
            <span>0-39: Düşük</span>
            <span>40-69: Orta</span>
            <span>70-100: Yüksek</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
