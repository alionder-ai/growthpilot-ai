'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Client } from '@/lib/types';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  meta_campaign_id: string;
  last_synced_at: string;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const rawId = params.id;
  const clientId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [client, setClient] = useState<Client | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const errorParam = urlParams.get('error');
    
    if (success === 'meta_connected') {
      setSuccessMessage('Meta hesabı başarıyla bağlandı!');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    if (errorParam) {
      setError(`Meta bağlantı hatası: ${errorParam}`);
    }
  }, []);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setError('Müşteri ID bulunamadı');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Müşteri bilgileri yüklenemedi');
      }

      const data = await response.json();
      
      if (!data.client) {
        throw new Error('Müşteri verisi bulunamadı');
      }
      
      setClient(data.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchCampaigns = useCallback(async () => {
    if (!clientId) return;

    try {
      const response = await fetch(`/api/campaigns?clientId=${clientId}`);
      
      if (response.ok) {
        const data = await response.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Kampanyalar yüklenemedi:', err);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  useEffect(() => {
    if (client?.meta_connected) {
      fetchCampaigns();
    }
  }, [client?.meta_connected, fetchCampaigns]);

  const handleConnectMeta = () => {
    if (!client?.client_id) {
      setError('Müşteri ID bulunamadı');
      return;
    }

    setConnecting(true);
    setError(null);

    window.location.href = `/api/meta/connect?clientId=${client.client_id}`;
  };

  const handleSyncData = async () => {
    if (!client?.meta_connected) {
      setError('Önce Meta hesabını bağlamalısınız');
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/campaigns/sync', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Senkronizasyon başarısız oldu');
      }

      setSuccessMessage(
        `Senkronizasyon tamamlandı! ${data.stats.campaignsProcessed} kampanya, ${data.stats.adsProcessed} reklam işlendi.`
      );
      
      await fetchCampaigns();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Senkronizasyon hatası');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}>
          ← Geri Dön
        </Button>
        <Card className="p-6 bg-red-50 border-red-200">
          <p className="text-red-800 font-semibold mb-2">Hata</p>
          <p className="text-red-700">{error}</p>
          <Button 
            variant="outline" 
            onClick={fetchClient}
            className="mt-4"
          >
            Tekrar Dene
          </Button>
        </Card>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            ← Geri Dön
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
          <p className="text-gray-600 mt-1">Müşteri Detayları</p>
        </div>
      </div>

      {successMessage && (
        <Card className="p-4 bg-green-50 border-green-200">
          <p className="text-sm text-green-800">{successMessage}</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Genel Bilgiler</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Müşteri Adı</label>
              <p className="text-gray-900">{client.name}</p>
            </div>
            {client.industry && (
              <div>
                <label className="text-sm font-medium text-gray-500">Sektör</label>
                <p className="text-gray-900">{client.industry}</p>
              </div>
            )}
            {client.contact_email && (
              <div>
                <label className="text-sm font-medium text-gray-500">E-posta</label>
                <p className="text-gray-900">{client.contact_email}</p>
              </div>
            )}
            {client.contact_phone && (
              <div>
                <label className="text-sm font-medium text-gray-500">Telefon</label>
                <p className="text-gray-900">{client.contact_phone}</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Meta Ads Entegrasyonu</h2>
          
          {client.meta_connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Bağlı</span>
              </div>
              
              {client.meta_ad_account_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Hesap ID</label>
                  <p className="text-gray-900 font-mono text-sm">act_{client.meta_ad_account_id}</p>
                </div>
              )}
              
              {client.meta_connected_at && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bağlanma Tarihi</label>
                  <p className="text-gray-900">
                    {new Date(client.meta_connected_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              <Button 
                onClick={handleSyncData} 
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Senkronize Ediliyor...
                  </>
                ) : (
                  'Verileri Senkronize Et'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-gray-300 rounded-full"></div>
                <span className="text-sm font-medium text-gray-600">Bağlı Değil</span>
              </div>
              
              <p className="text-sm text-gray-600">
                Meta Ads hesabını bağlayarak kampanya verilerinizi otomatik olarak senkronize edebilirsiniz.
              </p>

              <Button 
                onClick={handleConnectMeta} 
                disabled={connecting || loading}
                className="w-full"
              >
                {connecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Bağlanıyor...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Meta Reklam Hesabını Bağla
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Kampanya Verileri</h2>
          {campaigns.length > 0 && (
            <span className="text-sm text-gray-500">{campaigns.length} kampanya</span>
          )}
        </div>
        
        {client.meta_connected ? (
          campaigns.length > 0 ? (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div 
                  key={campaign.campaign_id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{campaign.campaign_name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Durum: <span className="capitalize">{campaign.status}</span>
                      </p>
                    </div>
                    {campaign.last_synced_at && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Son Senkronizasyon</p>
                        <p className="text-sm text-gray-700">
                          {new Date(campaign.last_synced_at).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Henüz kampanya verisi yok. Verileri senkronize etmek için yukarıdaki butona tıklayın.
              </p>
              <Button 
                onClick={handleSyncData} 
                disabled={syncing}
                variant="outline"
              >
                {syncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500">
            Kampanya verilerini görmek için önce Meta Ads hesabını bağlayın.
          </div>
        )}
      </Card>
    </div>
  );
}
