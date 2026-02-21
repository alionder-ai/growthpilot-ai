'use client';

import React from 'react';
import { CampaignList } from './CampaignList';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface Campaign {
  campaign_id: string;
  client_id: string;
  meta_campaign_id: string;
  campaign_name: string;
  status: string;
  created_at: string;
  updated_at: string;
  ad_sets: AdSet[];
}

interface AdSet {
  ad_set_id: string;
  campaign_id: string;
  meta_ad_set_id: string;
  ad_set_name: string;
  budget: number | null;
  status: string;
  created_at: string;
  ads: Ad[];
}

interface Ad {
  ad_id: string;
  ad_set_id: string;
  meta_ad_id: string;
  ad_name: string;
  creative_url: string | null;
  status: string;
  created_at: string;
  metrics: any | null;
}

interface Client {
  client_id: string;
  name: string;
}

export function CampaignListWrapper() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  // Fetch clients for filter dropdown
  React.useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Müşteriler yüklenemedi');
        }
        const data = await response.json();
        setClients(data.clients || []);
      } catch (err) {
        console.error('Error fetching clients:', err);
      }
    }
    fetchClients();
  }, []);

  // Fetch campaigns
  React.useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          limit: pagination.limit.toString()
        });

        if (selectedClientId) {
          params.append('client_id', selectedClientId);
        }

        const response = await fetch(`/api/campaigns?${params}`);
        
        if (!response.ok) {
          throw new Error('Kampanyalar yüklenemedi');
        }

        const data = await response.json();
        setCampaigns(data.campaigns || []);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
        setError(err instanceof Error ? err.message : 'Bir hata oluştu');
      } finally {
        setLoading(false);
      }
    }

    fetchCampaigns();
  }, [pagination.page, selectedClientId]);

  const handleClientFilterChange = (value: string) => {
    setSelectedClientId(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-gray-500 mt-4">Kampanyalar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Tekrar Dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      {clients.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Müşteri Filtrele:
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientFilterChange(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Müşteriler</option>
              {clients.map(client => (
                <option key={client.client_id} value={client.client_id}>
                  {client.name}
                </option>
              ))}
            </select>
            {selectedClientId && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleClientFilterChange('')}
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Campaign List */}
      <CampaignList campaigns={campaigns} />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Toplam {pagination.total} kampanya • Sayfa {pagination.page} / {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Sonraki
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
