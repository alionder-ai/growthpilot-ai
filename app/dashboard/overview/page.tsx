'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { OverviewCards } from '@/components/dashboard/OverviewCards';
import { ClientFilter } from '@/components/dashboard/ClientFilter';

// Lazy load chart components for better initial load performance
const SpendingChart = lazy(() => import('@/components/dashboard/SpendingChart').then(mod => ({ default: mod.SpendingChart })));
const RevenueChart = lazy(() => import('@/components/dashboard/RevenueChart').then(mod => ({ default: mod.RevenueChart })));

interface OverviewMetrics {
  totalClients: number;
  totalSpendThisMonth: number;
  totalSpendToday: number;
  totalRevenueThisMonth: number;
  activeCampaigns: number;
}

interface TrendDataPoint {
  date: string;
  spend: number;
  revenue: number;
}

export default function OverviewPage() {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [isLoadingTrends, setIsLoadingTrends] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchTrends();
  }, [selectedClientId]);

  const fetchMetrics = async () => {
    try {
      setIsLoadingMetrics(true);
      setError(null);

      const url = selectedClientId
        ? `/api/metrics/overview?clientId=${selectedClientId}`
        : '/api/metrics/overview';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Metrikler yüklenemedi');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Metrikler yüklenirken hata oluştu');
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchTrends = async () => {
    try {
      setIsLoadingTrends(true);

      const url = selectedClientId
        ? `/api/metrics/trends?clientId=${selectedClientId}`
        : '/api/metrics/trends';

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Trend verileri yüklenemedi');
      }

      const data = await response.json();
      setTrendData(data);
    } catch (err) {
      console.error('Error fetching trends:', err);
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gösterge Paneli</h1>
        <ClientFilter
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <OverviewCards
        totalClients={metrics?.totalClients || 0}
        totalSpendThisMonth={metrics?.totalSpendThisMonth || 0}
        totalRevenueThisMonth={metrics?.totalRevenueThisMonth || 0}
        activeCampaigns={metrics?.activeCampaigns || 0}
        isLoading={isLoadingMetrics}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<ChartSkeleton />}>
          <SpendingChart
            data={trendData.map((d) => ({ date: d.date, spend: d.spend }))}
            isLoading={isLoadingTrends}
          />
        </Suspense>
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart
            data={trendData.map((d) => ({ date: d.date, revenue: d.revenue }))}
            isLoading={isLoadingTrends}
          />
        </Suspense>
      </div>
    </div>
  );
}

// Loading skeleton for charts
function ChartSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>
  );
}
