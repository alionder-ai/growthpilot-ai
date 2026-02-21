'use client';

import React from 'react';
import { MetaMetrics } from '@/lib/types';
import { formatCurrency, formatNumber, formatPercentage, formatDate } from '@/lib/utils/locale';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface MetricsTableProps {
  metrics: MetaMetrics;
}

type SortField = 'spend' | 'roas' | 'ctr' | 'cpc' | 'cpm' | 'cpa' | 'frequency' | 'add_to_cart' | 'purchases';
type SortDirection = 'asc' | 'desc' | null;

export function MetricsTable({ metrics }: MetricsTableProps) {
  const [sortField, setSortField] = React.useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 text-blue-600" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const metricsData = [
    {
      label: 'Harcama',
      value: formatCurrency(metrics.spend),
      field: 'spend' as SortField,
      rawValue: metrics.spend
    },
    {
      label: 'ROAS',
      value: metrics.roas !== null ? formatNumber(metrics.roas, 2) : '-',
      field: 'roas' as SortField,
      rawValue: metrics.roas || 0
    },
    {
      label: 'CTR',
      value: metrics.ctr !== null ? formatPercentage(metrics.ctr, 2) : '-',
      field: 'ctr' as SortField,
      rawValue: metrics.ctr || 0
    },
    {
      label: 'CPC',
      value: metrics.cpc !== null ? formatCurrency(metrics.cpc) : '-',
      field: 'cpc' as SortField,
      rawValue: metrics.cpc || 0
    },
    {
      label: 'CPM',
      value: metrics.cpm !== null ? formatCurrency(metrics.cpm) : '-',
      field: 'cpm' as SortField,
      rawValue: metrics.cpm || 0
    },
    {
      label: 'CPA',
      value: metrics.cpa !== null ? formatCurrency(metrics.cpa) : '-',
      field: 'cpa' as SortField,
      rawValue: metrics.cpa || 0
    },
    {
      label: 'Frekans',
      value: metrics.frequency !== null ? formatNumber(metrics.frequency, 2) : '-',
      field: 'frequency' as SortField,
      rawValue: metrics.frequency || 0
    },
    {
      label: 'Sepete Ekleme',
      value: metrics.add_to_cart.toString(),
      field: 'add_to_cart' as SortField,
      rawValue: metrics.add_to_cart
    },
    {
      label: 'Satın Alma',
      value: metrics.purchases.toString(),
      field: 'purchases' as SortField,
      rawValue: metrics.purchases
    }
  ];

  // Sort metrics data if a sort is active
  const sortedMetrics = sortField && sortDirection
    ? [...metricsData].sort((a, b) => {
        if (a.field !== sortField && b.field !== sortField) return 0;
        if (a.field !== sortField) return 1;
        if (b.field !== sortField) return -1;
        
        const aValue = a.rawValue;
        const bValue = b.rawValue;
        
        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      })
    : metricsData;

  return (
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-xs font-semibold text-gray-700 uppercase">Metrikler</h6>
        {metrics.date && (
          <span className="text-xs text-gray-500">
            {formatDate(metrics.date)}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {sortedMetrics.map((metric) => (
          <div
            key={metric.field}
            className="bg-white rounded p-2 border border-gray-100 hover:border-gray-300 transition-colors cursor-pointer"
            onClick={() => handleSort(metric.field)}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600 font-medium flex items-center">
                {metric.label}
                {getSortIcon(metric.field)}
              </span>
            </div>
            <div className="text-sm font-semibold text-gray-900">
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Additional metrics info */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600">Gösterim:</span>
            <span className="ml-1 font-medium text-gray-900">
              {metrics.impressions.toLocaleString('tr-TR')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Tıklama:</span>
            <span className="ml-1 font-medium text-gray-900">
              {metrics.clicks.toLocaleString('tr-TR')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Dönüşüm:</span>
            <span className="ml-1 font-medium text-gray-900">
              {metrics.conversions.toLocaleString('tr-TR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
