'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StrategyCardProps {
  recommendationId: string;
  trigger: string;
  metricValue: number;
  doActions: string[];
  dontActions: string[];
  reasoning?: string;
  onDismiss?: (recommendationId: string) => void;
}

const triggerLabels: Record<string, string> = {
  high_frequency: 'Yüksek Frekans',
  low_cart_conversion: 'Düşük Sepet Dönüşümü',
  low_roas: 'Düşük ROAS',
  cpc_increase: 'TBM Artışı',
};

export function StrategyCard({
  recommendationId,
  trigger,
  metricValue,
  doActions,
  dontActions,
  reasoning,
  onDismiss,
}: StrategyCardProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const handleDismiss = async () => {
    setIsDismissing(true);

    try {
      const response = await fetch(`/api/ai/recommendations/${recommendationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'dismissed' }),
      });

      if (response.ok && onDismiss) {
        onDismiss(recommendationId);
      }
    } catch (error) {
      console.error('Error dismissing strategy card:', error);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Card className="p-6 relative">
      {/* Dismiss button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 h-8 w-8 p-0"
        onClick={handleDismiss}
        disabled={isDismissing}
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Header */}
      <div className="mb-4 pr-8">
        <h3 className="text-lg font-semibold text-gray-900">
          Strateji Kartı
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
            {triggerLabels[trigger] || trigger}
          </span>
          <span className="text-sm text-gray-600">
            Değer: {metricValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      {reasoning && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-700">{reasoning}</p>
        </div>
      )}

      {/* Do Actions - Green */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <h4 className="font-semibold text-green-900">Yapılması Gerekenler</h4>
        </div>
        <ul className="space-y-2">
          {doActions.map((action, index) => (
            <li
              key={index}
              className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-green-600 text-white text-xs font-bold rounded-full mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-green-900">{action}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Don't Actions - Red */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle className="h-5 w-5 text-red-600" />
          <h4 className="font-semibold text-red-900">Yapılmaması Gerekenler</h4>
        </div>
        <ul className="space-y-2">
          {dontActions.map((action, index) => (
            <li
              key={index}
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-red-600 text-white text-xs font-bold rounded-full mt-0.5">
                {index + 1}
              </span>
              <span className="text-sm text-red-900">{action}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
