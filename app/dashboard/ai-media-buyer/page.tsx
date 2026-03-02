'use client';

import { useEffect, useState } from 'react';
import { Bot, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Zap, TrendingUp, TrendingDown, Minus, DollarSign, BarChart2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Client {
  client_id: string;
  name: string;
  industry: string;
}

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  objective?: string;
}

interface CampaignAnalysis {
  performanceScore: number;
  decision: 'scale' | 'hold' | 'kill';
  justification: string;
  summary: string;
  issues: { description: string; severity: string }[];
  recommendations: { action: string; explanation: string; impact: string }[];
  nextTests: string[];
  profitSimulation?: {
    currentProfit: number;
    projectedProfit: number;
    percentageChange: number;
  };
}

export default function MediaBuyerPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<Record<string, CampaignAnalysis>>({});
  const [loadingAnalysis, setLoadingAnalysis] = useState<string | null>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Müşteriler yüklenemedi');
      const data = await response.json();
      setClients(data.clients || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchCampaigns = async (clientId: string) => {
    try {
      setIsLoadingCampaigns(true);
      setCampaigns([]);
      setAnalyses({});
      setExpandedCampaign(null);
      const response = await fetch(`/api/campaigns?clientId=${clientId}`);
      if (!response.ok) throw new Error('Kampanyalar yüklenemedi');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu');
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    if (clientId) fetchCampaigns(clientId);
  };

  const handleCampaignClick = async (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
      return;
    }
    setExpandedCampaign(campaignId);
    if (analyses[campaignId]) return;

    try {
      setLoadingAnalysis(campaignId);
      const response = await fetch('/api/ai/media-buyer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Analiz yapılamadı');
      setAnalyses(prev => ({ ...prev, [campaignId]: data.data }));
    } catch (err) {
      setAnalyses(prev => ({
        ...prev,
        [campaignId]: null as any
      }));
      setError(err instanceof Error ? err.message : 'Analiz hatası');
    } finally {
      setLoadingAnalysis(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'scale': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">🔥 SCALE</span>;
      case 'hold': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">⏳ HOLD</span>;
      case 'kill': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">💀 KILL</span>;
      default: return null;
    }
  };

  const getBorderColor = (decision: string) => {
    switch (decision) {
      case 'scale': return 'border-l-green-500';
      case 'hold': return 'border-l-yellow-500';
      case 'kill': return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high': return <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">Yüksek</span>;
      case 'medium': return <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">Orta</span>;
      case 'low': return <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">Düşük</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI Media Buyer</h1>
        </div>
        <p className="text-gray-600">Müşteri seçin, kampanyalarını görün ve AI analizi alın.</p>
      </div>

      {/* Client Selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Müşteri Seç</h2>
        {isLoadingClients ? (
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Müşteriler yükleniyor...</span>
          </div>
        ) : (
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClient}
            onChange={(e) => handleClientChange(e.target.value)}
          >
            <option value="">Müşteri seçin...</option>
            {clients.map((c) => (
              <option key={c.client_id} value={c.client_id}>
                {c.name} {c.industry ? `(${c.industry})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Campaigns List */}
      {isLoadingCampaigns ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-6 h-6 text-gray-400 animate-spin mr-2" />
          <span className="text-gray-500">Kampanyalar yükleniyor...</span>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="space-y-3">
          {campaigns.map((campaign) => {
            const analysis = analyses[campaign.campaign_id];
            const isExpanded = expandedCampaign === campaign.campaign_id;
            const isLoading = loadingAnalysis === campaign.campaign_id;

            return (
              <div
                key={campaign.campaign_id}
                className={`bg-white rounded-xl border border-gray-200 border-l-4 ${analysis ? getBorderColor(analysis.decision) : 'border-l-gray-300'} overflow-hidden`}
              >
                {/* Campaign Header - Tıklanabilir */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleCampaignClick(campaign.campaign_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900">{campaign.campaign_name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {campaign.status === 'ACTIVE' ? '● Aktif' : '○ ' + campaign.status}
                          </span>
                          {analysis && getDecisionBadge(analysis.decision)}
                        </div>
                        {campaign.objective && (
                          <p className="text-xs text-gray-500 mt-0.5">{campaign.objective}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {analysis && (
                        <div className={`w-10 h-10 rounded-xl ${getScoreColor(analysis.performanceScore)} flex items-center justify-center`}>
                          <span className="text-white font-bold text-sm">{analysis.performanceScore}</span>
                        </div>
                      )}
                      {isLoading ? (
                        <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Content - Açılır/Kapanır */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 space-y-4">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <RefreshCw className="w-6 h-6 text-blue-500 animate-spin mr-2" />
                        <span className="text-gray-500">AI analiz yapıyor...</span>
                      </div>
                    ) : analysis ? (
                      <>
                        {/* Karar ve Özet */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-12 h-12 rounded-xl ${getScoreColor(analysis.performanceScore)} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white font-black text-lg">{analysis.performanceScore}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getDecisionBadge(analysis.decision)}
                            </div>
                            <p className="text-sm text-gray-700">{analysis.justification}</p>
                          </div>
                        </div>

                        {/* Özet */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-blue-600" />
                            Kampanya Özeti
                          </h4>
                          <p className="text-sm text-gray-700">{analysis.summary}</p>
                        </div>

                        {/* Sorunlar */}
                        {analysis.issues?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-red-500" />
                              Tespit Edilen Sorunlar
                            </h4>
                            <div className="space-y-2">
                              {analysis.issues.map((issue, i) => (
                                <div key={i} className={`p-3 rounded-lg border-l-4 text-sm ${issue.severity === 'critical' || issue.severity === 'high' ? 'border-red-400 bg-red-50' : issue.severity === 'medium' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}>
                                  {issue.description}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Öneriler */}
                        {analysis.recommendations?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Target className="w-4 h-4 text-green-600" />
                              Önerilen Aksiyonlar
                            </h4>
                            <div className="space-y-2">
                              {analysis.recommendations.map((rec, i) => (
                                <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{i + 1}</div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-sm font-medium text-gray-900">{rec.action}</span>
                                      {getImpactBadge(rec.impact)}
                                    </div>
                                    <p className="text-xs text-gray-600">{rec.explanation}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Kar Simülasyonu */}
                        {analysis.profitSimulation && (
                          <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-green-600" />
                              Kâr Simülasyonu
                            </h4>
                            <div className="grid grid-cols-3 gap-3 text-center">
                              <div>
                                <p className="text-xs text-gray-500">Mevcut Kâr</p>
                                <p className="font-bold text-gray-900">₺{analysis.profitSimulation.currentProfit.toLocaleString('tr-TR')}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Tahmini Kâr</p>
                                <p className="font-bold text-green-600">₺{analysis.profitSimulation.projectedProfit.toLocaleString('tr-TR')}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Değişim</p>
                                <p className="font-bold text-green-600">+%{analysis.profitSimulation.percentageChange.toFixed(1)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Sonraki Testler */}
                        {analysis.nextTests?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                              <Zap className="w-4 h-4 text-yellow-500" />
                              Sonraki Test Önerileri
                            </h4>
                            <div className="space-y-1">
                              {analysis.nextTests.map((test, i) => (
                                <div key={i} className="flex items-center gap-2 p-2 bg-yellow-50 rounded text-sm text-gray-700">
                                  <span className="text-yellow-600 font-bold text-xs">#{i+1}</span>
                                  {test}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-4 text-red-500 text-sm">
                        Analiz yapılamadı. Tekrar tıklayın.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : selectedClient && !isLoadingCampaigns ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">Bu müşteri için kampanya bulunamadı.</p>
        </div>
      ) : null}
    </div>
  );
}
