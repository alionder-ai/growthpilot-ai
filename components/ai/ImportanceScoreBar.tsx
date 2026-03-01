import * as React from 'react';
import { cn } from '@/lib/utils/cn';

interface ImportanceScoreBarProps {
  score: number;
  label: string;
}

/**
 * ImportanceScoreBar Component
 * 
 * Displays an importance score (1-10) as a horizontal progress bar with color gradient.
 * Colors transition from red (low scores) to yellow (medium) to green (high scores).
 * Responsive: Smaller text and bar height on mobile devices.
 * 
 * @param score - Numeric score between 1 and 10
 * @param label - Text label describing what is being scored
 */
export function ImportanceScoreBar({ score, label }: ImportanceScoreBarProps) {
  // Clamp score to valid range (1-10)
  const clampedScore = Math.max(1, Math.min(10, score));
  
  // Calculate percentage for progress bar width
  const percentage = (clampedScore / 10) * 100;
  
  // Determine color based on score
  // 1-3: Red (#ef4444)
  // 4-6: Yellow (#f59e0b)
  // 7-10: Green (#10b981)
  const getColorClass = (score: number): string => {
    if (score <= 3) return 'bg-red-500';
    if (score <= 6) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const colorClass = getColorClass(clampedScore);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs sm:text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {clampedScore}/10
        </span>
      </div>
      <div className="h-1.5 sm:h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            colorClass
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={clampedScore}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-label={`${label}: ${clampedScore} üzerinden 10`}
        />
      </div>
    </div>
  );
}
