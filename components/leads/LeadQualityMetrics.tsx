'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdConversionRate {
  adId: string;
  adName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

interface CampaignConversionRate {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  adConversionRates: AdConversionRate[];
}

interface LeadQualityMetricsProps {
  campaignId?: string;
  showAdBreakdown?: boolean;
  refreshTrigger?: number;
}

export default function LeadQualityMetrics({
  campaignId,
  showAdBreakdown = true,
  refreshTrigger
}: LeadQualityMetricsProps) {
  const [conversionRates, setConversionRates] = useState<CampaignConversionRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const fetchConversionRates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      
      if (campaignId) {
        params.append('campaign_id', campaignId);
      }

      const response = await fetch(`/api/leads/conversion-rates?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Dönüşüm oranları yüklenemedi');
      }

      const data = await response.json();
      
      // Handle single campaign or multiple campaigns response
      if (data.conversionRate) {
        setConversionRates([data.conversionRate]);
      } else if (data.conversionRates) {
        setConversionRates(data.conversionRates);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversionRates();
  }, [campaignId, refreshTrigger]);

  const toggleCampaignExpansion = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const formatPercentage = (rate: number): string => {
    return `%${rate.toFixed(1)}`;
  };

  const getConversionRateColor = (rate: number): string => {
    if (rate >= 10) return 'text-green-600 font-semibold';
    if (rate >= 5) return 'text-yellow-600 font-medium';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Yükleniyor...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </Card>
    );
  }

  if (conversionRates.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Henüz lead kalite verisi bulunmuyor
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Lead Kalite Metrikleri</h3>
          <p className="text-sm text-muted-foreground">
            Kampanya ve reklam bazında dönüşüm oranları
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kampanya</TableHead>
              <TableHead className="text-center">Toplam Lead</TableHead>
              <TableHead className="text-center">Dönüşüm Sağlayan</TableHead>
              <TableHead className="text-center">Dönüşüm Oranı</TableHead>
              {showAdBreakdown && <TableHead className="text-center">Detay</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversionRates.map((campaign) => (
              <>
                <TableRow key={campaign.campaignId}>
                  <TableCell className="font-medium">
                    {campaign.campaignName}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.totalLeads}
                  </TableCell>
                  <TableCell className="text-center">
                    {campaign.convertedLeads}
                  </TableCell>
                  <TableCell className={`text-center ${getConversionRateColor(campaign.conversionRate)}`}>
                    {formatPercentage(campaign.conversionRate)}
                  </TableCell>
                  {showAdBreakdown && (
                    <TableCell className="text-center">
                      {campaign.adConversionRates.length > 0 && (
                        <button
                          onClick={() => toggleCampaignExpansion(campaign.campaignId)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {expandedCampaigns.has(campaign.campaignId)
                            ? 'Gizle'
                            : `${campaign.adConversionRates.length} Reklam`}
                        </button>
                      )}
                    </TableCell>
                  )}
                </TableRow>

                {/* Ad-level breakdown */}
                {showAdBreakdown &&
                  expandedCampaigns.has(campaign.campaignId) &&
                  campaign.adConversionRates.map((ad) => (
                    <TableRow
                      key={ad.adId}
                      className="bg-muted/50"
                    >
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        ↳ {ad.adName}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {ad.totalLeads}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {ad.convertedLeads}
                      </TableCell>
                      <TableCell className={`text-center text-sm ${getConversionRateColor(ad.conversionRate)}`}>
                        {formatPercentage(ad.conversionRate)}
                      </TableCell>
                      {showAdBreakdown && <TableCell />}
                    </TableRow>
                  ))}
              </>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Toplam Lead</div>
          <div className="text-2xl font-bold mt-1">
            {conversionRates.reduce((sum, c) => sum + c.totalLeads, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Dönüşüm Sağlayan</div>
          <div className="text-2xl font-bold mt-1 text-green-600">
            {conversionRates.reduce((sum, c) => sum + c.convertedLeads, 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Ortalama Dönüşüm Oranı</div>
          <div className="text-2xl font-bold mt-1">
            {(() => {
              const totalLeads = conversionRates.reduce((sum, c) => sum + c.totalLeads, 0);
              const totalConverted = conversionRates.reduce((sum, c) => sum + c.convertedLeads, 0);
              const avgRate = totalLeads > 0 ? (totalConverted / totalLeads) * 100 : 0;
              return formatPercentage(avgRate);
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
