'use client';

import { useState } from 'react';
import LeadList from '@/components/leads/LeadList';
import LeadQualityMetrics from '@/components/leads/LeadQualityMetrics';
import { Card } from '@/components/ui/card';

export default function LeadsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Potansiyel Müşteriler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lead kalitesi ve dönüşüm oranlarını takip edin
          </p>
        </div>
      </div>

      {/* Lead Quality Metrics */}
      <LeadQualityMetrics 
        showAdBreakdown={true}
        refreshTrigger={refreshTrigger}
      />

      {/* Lead List */}
      <LeadList refreshTrigger={refreshTrigger} />
    </div>
  );
}
