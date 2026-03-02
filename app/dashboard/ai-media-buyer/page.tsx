'use client';

/**
 * AI Media Buyer Page
 * 
 * Main page for campaign analysis with Scale/Hold/Kill recommendations.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { CampaignSelector } from '@/components/ai/CampaignSelector';
import { AnalysisResults } from '@/components/ai/AnalysisResults';
import { MediaBuyerAnalysis } from '@/lib/types/media-buyer';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget?: number;
}

export default function MediaBuyerPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MediaBuyerAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoadingCampaigns(true);
      
      const response = await fetch('/api/campaigns?limit=100');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kampanyalar yüklenemedi');
      }

      // Filter only active campaigns and map to simple format
      const activeCampaigns = result.campaigns
        ?.filter((c: any) => c.status === 'ACTIVE')
        .map((c: any) => ({
          campaign_id: c.campaign_id,
          campaign_name: c.campaign_name || c.name,
          status: c.status,
          budget: c.budget,
        })) || [];

      setCampaigns(activeCampaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setError('Kampanyalar yüklenirken bir hata oluştu');
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedCampaignId) return;

    try {
      setLoading(true);
      setError(null);
      setAnalysis(null);

      const response = await fetch('/api/ai/media-buyer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId: selectedCampaignId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analiz sırasında bir hata oluştu');
      }

      setAnalysis(result.data);
    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Beklenmeyen bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setAnalysis(null);
    setSelectedCampaignId(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Media Buyer</h1>
        <p className="text-gray-600">
          Kampanyalarınızı analiz edin ve AI destekli Scale/Hold/Kill önerileri alın
        </p>
      </div>

      {/* Campaign Selection */}
      {!analysis && (
        <div className="space-y-6">
          {loadingCampaigns ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Kampanyalar yükleniyor...</p>
            </div>
          ) : (
            <>
              <CampaignSelector
                campaigns={campaigns}
                selectedCampaignId={selectedCampaignId}
                onSelect={setSelectedCampaignId}
                disabled={loading}
              />

              {/* Analyze Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedCampaignId || loading}
                  size="lg"
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Analiz Ediliyor...
                    </>
                  ) : (
                    <>
                      🤖 Analiz Et
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Hata</h3>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Analiz Yapılıyor</h3>
                  <p className="text-sm text-blue-700">
                    Kampanya verileri toplanıyor ve AI analizi gerçekleştiriliyor. 
                    Bu işlem 10-15 saniye sürebilir...
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <h3 className="font-semibold text-green-900">Analiz Tamamlandı</h3>
                  <p className="text-sm text-green-700">
                    Kampanya başarıyla analiz edildi
                  </p>
                </div>
              </div>
              <Button onClick={handleNewAnalysis} variant="outline" size="sm">
                Yeni Analiz
              </Button>
            </div>
          </div>

          {/* Results */}
          <AnalysisResults analysis={analysis} />
        </div>
      )}
    </div>
  );
}
