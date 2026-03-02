'use client';

/**
 * Profit Simulation Card Component
 * 
 * Displays before/after profit comparison with Turkish Lira formatting.
 */

import { Card } from '@/components/ui/card';
import { ProfitSimulation } from '@/lib/types/media-buyer';

interface ProfitSimulationCardProps {
  simulation: ProfitSimulation;
}

export function ProfitSimulationCard({ simulation }: ProfitSimulationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const isPositiveChange = simulation.percentageChange > 0;
  const isNegativeChange = simulation.percentageChange < 0;

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Kar Simülasyonu</h3>
      
      <div className="space-y-4">
        {/* Current vs Projected */}
        <div className="grid grid-cols-2 gap-4">
          {/* Current */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-xs text-gray-600 mb-1">Mevcut Durum</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(simulation.currentProfit)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Gelir: {formatCurrency(simulation.currentRevenue)}
            </div>
          </div>

          {/* Projected */}
          <div className={`p-4 rounded-lg ${
            isPositiveChange ? 'bg-green-50' : isNegativeChange ? 'bg-red-50' : 'bg-gray-50'
          }`}>
            <div className="text-xs text-gray-600 mb-1">Tahmini Durum</div>
            <div className={`text-2xl font-bold ${
              isPositiveChange ? 'text-green-700' : isNegativeChange ? 'text-red-700' : 'text-gray-900'
            }`}>
              {formatCurrency(simulation.projectedProfit)}
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Gelir: {formatCurrency(simulation.projectedRevenue)}
            </div>
          </div>
        </div>

        {/* Change Indicator */}
        <div className="flex items-center justify-center py-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            isPositiveChange 
              ? 'bg-green-100 text-green-800' 
              : isNegativeChange 
              ? 'bg-red-100 text-red-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            <span className="text-lg">
              {isPositiveChange ? '📈' : isNegativeChange ? '📉' : '➡️'}
            </span>
            <span className="font-semibold">
              {isPositiveChange && '+'}
              {simulation.percentageChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Commission Info */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Komisyon</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(simulation.commission)}
            </span>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <p>
            💡 Bu simülasyon, önerilen aksiyonun uygulanması durumunda 
            beklenen kar değişimini gösterir. Gerçek sonuçlar pazar koşullarına 
            göre değişiklik gösterebilir.
          </p>
        </div>
      </div>
    </Card>
  );
}
