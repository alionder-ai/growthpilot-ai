'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Client } from '@/lib/types';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) {
        throw new Error('Müşteri bilgileri yüklenemedi');
      }

      const data = await response.json();
      setClient(data.client);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectMeta = async () => {
    try {
      setConnecting(true);
      setError(null);

      const response = await fetch('/api/meta/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Meta bağlantısı başlatılamadı');
      }

      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setConnecting(false);
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
          <p className="text-red-800">{error}</p>
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
                  <p className="text-gray-900">{new Date(client.meta_connected_at).toLocaleDateString('tr-TR')}</p>
                </div>
              )}

              <Button variant="outline" className="w-full" disabled>
                Bağlantıyı Yenile
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
                disabled={connecting}
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
        <h2 className="text-xl font-semibold mb-4">Kampanya Verileri</h2>
        {client.meta_connected ? (
          <div className="text-center py-8 text-gray-600">
            Kampanya verileri yakında burada görüntülenecek...
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Kampanya verilerini görmek için önce Meta Ads hesabını bağlayın.
          </div>
        )}
      </Card>
    </div>
  );
}
