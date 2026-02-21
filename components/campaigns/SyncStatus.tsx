'use client';

import { Clock, CheckCircle, XCircle } from 'lucide-react';

interface SyncStatusProps {
  lastSyncedAt: string | null;
  status?: 'success' | 'error' | 'pending';
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return 'az önce';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} dakika önce`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} saat önce`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} gün önce`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} ay önce`;
}

export function SyncStatus({ lastSyncedAt, status = 'success' }: SyncStatusProps) {
  if (!lastSyncedAt) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Clock className="h-4 w-4" />
        <span>Henüz senkronize edilmedi</span>
      </div>
    );
  }

  const date = new Date(lastSyncedAt);
  const timeAgo = getTimeAgo(date);

  const statusIcons = {
    success: <CheckCircle className="h-4 w-4 text-green-600" />,
    error: <XCircle className="h-4 w-4 text-red-600" />,
    pending: <Clock className="h-4 w-4 text-yellow-600" />,
  };

  const statusTexts = {
    success: 'Son senkronizasyon',
    error: 'Senkronizasyon hatası',
    pending: 'Senkronizasyon bekleniyor',
  };

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      {statusIcons[status]}
      <span>
        {statusTexts[status]}: {timeAgo}
      </span>
    </div>
  );
}
