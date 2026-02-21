'use client';

import { DollarSign, TrendingUp, Users, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/locale';

interface OverviewCardsProps {
  totalClients: number;
  totalSpendThisMonth: number;
  totalRevenueThisMonth: number;
  activeCampaigns: number;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
}

function StatCard({ title, value, icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${iconBgColor} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function OverviewCards({
  totalClients,
  totalSpendThisMonth,
  totalRevenueThisMonth,
  activeCampaigns,
  isLoading = false,
}: OverviewCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Toplam Müşteri"
        value={totalClients}
        icon={<Users className="w-6 h-6" />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
      />
      <StatCard
        title="Bu Ay Harcama"
        value={formatCurrency(totalSpendThisMonth)}
        icon={<DollarSign className="w-6 h-6" />}
        iconBgColor="bg-red-100"
        iconColor="text-red-600"
      />
      <StatCard
        title="Bu Ay Gelir"
        value={formatCurrency(totalRevenueThisMonth)}
        icon={<TrendingUp className="w-6 h-6" />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      <StatCard
        title="Aktif Kampanya"
        value={activeCampaigns}
        icon={<Target className="w-6 h-6" />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
    </div>
  );
}
