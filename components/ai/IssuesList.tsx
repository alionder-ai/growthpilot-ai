'use client';

/**
 * Issues List Component
 * 
 * Displays identified issues sorted by severity with color-coded indicators.
 */

import { Card } from '@/components/ui/card';
import { Issue } from '@/lib/types/media-buyer';

interface IssuesListProps {
  issues: Issue[];
}

export function IssuesList({ issues }: IssuesListProps) {
  if (issues.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Tespit Edilen Sorunlar</h3>
        <p className="text-sm text-gray-600">✓ Kritik sorun tespit edilmedi</p>
      </Card>
    );
  }

  // Sort by severity (critical > high > medium > low)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  const sortedIssues = [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );

  const getSeverityLabel = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'Kritik';
      case 'high':
        return 'Yüksek';
      case 'medium':
        return 'Orta';
      case 'low':
        return 'Düşük';
    }
  };

  const getSeverityColor = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: Issue['severity']) => {
    switch (severity) {
      case 'critical':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Tespit Edilen Sorunlar ({issues.length})
      </h3>
      <div className="space-y-3">
        {sortedIssues.map((issue, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <span className="text-xl flex-shrink-0">
              {getSeverityIcon(issue.severity)}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded border ${getSeverityColor(
                    issue.severity
                  )}`}
                >
                  {getSeverityLabel(issue.severity)}
                </span>
              </div>
              <p className="text-sm text-gray-700">{issue.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
