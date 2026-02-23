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

interface AdAccount {
  id: string;
  accountId: string;
  name: string;
  status: number;
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
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [selectedAdAccountId, setSelectedAdAccountId] = useState<string>('');
  const [loadingAdAccounts, setLoadingAdAccounts] = useState(false);
  const [savingAdAccount, setSavingAdAccount] = useState(false);
  const [isEditingAdAccount, setIsEditingAdAccount] = useState(false);

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
      fetchAdAccounts();
    }
  }, [client?.meta_connected, fetchCampaigns]);

  const fetchAdAccounts = async () => {
    setLoadingAdAccounts(true);
    try {
      const response = await fetch('/api/meta/ad-accounts');
      
      if (response.ok) {
        const data = await response.json();
        setAdAccounts(data.adAccounts || []);
        
        // Set current ad account as selected if exists
        if (client?.meta_ad_account_id) {
          setSelectedAdAccountId(client.meta_ad_account_id);
        }
      }
    } catch (err) {
      console.error('Reklam hesapları yüklenemedi:', err);
    } finally {
      setLoadingAdAccounts(false);
    }
  };

  const handleSaveAdAccount = async () => {
    if (!selectedAdAccountId || !client?.client_id) {
      setError('Lütfen bir reklam hesabı seçin');
      return;
    }

    setSavingAdAccount(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/clients/${client.client_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_ad_account_id: selectedAdAccountId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Reklam hesabı kaydedilemedi');
      }

      setSuccessMessage('Reklam hesabı başarıyla güncellendi!');
      setIsEditingAdAccount(false);
      await fetchClient();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reklam hesabı güncellenirken hata oluştu');
    } finally {
      setSavingAdAccount(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!client?.client_id) return;

    if (!confirm('Meta bağlantısını kaldırmak istediğinizden emin misiniz? Bu işlem kampanya verilerinizi silmez.')) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${client.client_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meta_connected: false,
          meta_ad_account_id: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Bağlantı kaldırılamadı');
      }

      setSuccessMessage('Meta bağlantısı başarıyla kaldırıldı');
      await fetchClient();
      
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bağlantı kaldırılırken hata oluştu');
    }
  };

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

    if (!client?.client_id) {
      setError('Müşteri ID bulunamadı');
      return;
    }

    setSyncing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/campaigns/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: client.client_id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Show detailed error with debug info
        let errorMessage = data.error || 'Senkronizasyon başarısız oldu';
        
        if (data.debugInfo) {
          errorMessage += '\n\n📋 Debug Bilgileri:\n';
          errorMessage += `• Hesap ID: ${data.debugInfo.checks?.[0] || 'Bilinmiyor'}\n`;
          if (data.allErrors && data.allErrors.length > 0) {
            errorMessage += `• Hatalar: ${data.allErrors.join(', ')}`;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Show success with debug info
      let successMsg = `Senkronizasyon tamamlandı! ${data.stats.campaignsProcessed} kampanya, ${data.stats.adsProcessed} reklam işlendi.`;
      
      if (data.debugInfo) {
        successMsg += `\n\n📋 Debug: Hesap ${data.debugInfo.adAccountId}, Tarih: ${data.debugInfo.dateRange?.since} - ${data.debugInfo.dateRange?.until}`;
        if (data.debugInfo.errors && data.debugInfo.errors.length > 0) {
          successMsg += `\n⚠️ ${data.debugInfo.errors.length} uyarı var`;
        }
      }
      
      setSuccessMessage(successMsg);
      
      await fetchCampaigns();
      
      setTimeout(() => setSuccessMessage(null), 10000); // 10 seconds for debug info
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
          <p className="text-sm text-green-800 whitespace-pre-line">{successMessage}</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-green-700">Bağlı</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDisconnectMeta}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Bağlantıyı Kaldır
                </Button>
              </div>
              
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

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">Reklam Hesabı</label>
                  {!isEditingAdAccount && client.meta_ad_account_id && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setIsEditingAdAccount(true);
                        setSelectedAdAccountId(client.meta_ad_account_id || '');
                      }}
                    >
                      Değiştir
                    </Button>
                  )}
                </div>

                {isEditingAdAccount ? (
                  <div className="space-y-3">
                    {loadingAdAccounts ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                      </div>
                    ) : adAccounts.length > 0 ? (
                      <>
                        <select
                          value={selectedAdAccountId}
                          onChange={(e) => setSelectedAdAccountId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Reklam hesabı seçin...</option>
                          {adAccounts.map((account) => (
                            <option key={account.id} value={account.accountId}>
                              {account.name} (act_{account.accountId})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleSaveAdAccount}
                            disabled={savingAdAccount || !selectedAdAccountId}
                            className="flex-1"
                          >
                            {savingAdAccount ? 'Kaydediliyor...' : 'Kaydet'}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setIsEditingAdAccount(false);
                              setSelectedAdAccountId(client.meta_ad_account_id || '');
                            }}
                            disabled={savingAdAccount}
                          >
                            İptal
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-600 py-2">
                        Reklam hesabı bulunamadı. Lütfen Meta Business Manager'da hesap erişiminizi kontrol edin.
                      </div>
                    )}
                  </div>
                ) : client.meta_ad_account_id ? (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-gray-900 font-mono text-sm">
                      act_{client.meta_ad_account_id}
                    </p>
                    {adAccounts.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {adAccounts.find(acc => acc.accountId === client.meta_ad_account_id)?.name || 'Hesap adı yükleniyor...'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                      ⚠️ Henüz bir reklam hesabı seçilmedi. Veri senkronizasyonu için bir hesap seçmelisiniz.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setIsEditingAdAccount(true);
                        fetchAdAccounts();
                      }}
                      className="w-full"
                    >
                      Reklam Hesabı Seç
                    </Button>
                  </div>
                )}
              </div>

              <Button 
                onClick={handleSyncData} 
                disabled={syncing || !client.meta_ad_account_id}
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
              
              {!client.meta_ad_account_id && (
                <p className="text-xs text-gray-500 text-center">
                  Senkronizasyon için önce bir reklam hesabı seçmelisiniz
                </p>
              )}
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
