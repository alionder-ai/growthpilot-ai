'use client';

import { lazy, Suspense, useEffect, useState } from 'react';

import { ClientFilter } from '@/components/dashboard/ClientFilter';
import { OverviewCards } from '@/components/dashboard/OverviewCards';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Silently fail for trends
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleClientChange = (clientId: string | null) => {
    setSelectedClientId(clientId);
  };

  const showEmptyState = !isLoadingMetrics && metrics?.totalClients === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gösterge Paneli</h1>
        <ClientFilter
          selectedClientId={selectedClientId}
          onClientChange={handleClientChange}
        />
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Henüz müşteri bulunmuyor
            </h2>
            <p className="text-gray-600 mb-8">
              İlk müşterinizi ekleyerek başlayın ve kampanyalarınızı yönetmeye başlayın.
            </p>
            <a
              href="/dashboard/clients"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Yeni Müşteri Ekle
            </a>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
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
