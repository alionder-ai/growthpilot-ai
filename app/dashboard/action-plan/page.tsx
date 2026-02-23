'use client';

import { lazy, Suspense, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ActionPlanCard = lazy(() => import('@/components/ai/ActionPlanCard'));

interface Client {
  client_id: string;
  name: string;
}

interface ActionItem {
  action: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: string;
}

interface ActionPlan {
  recommendation_id: string;
  content: ActionItem[];
  created_at: string;
  status: string;
}

export default function ActionPlanPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [actionPlan, setActionPlan] = useState<ActionPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchActionPlan(selectedClientId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Müşteriler yüklenemedi');
      const data = await response.json();
      const clientList = data?.clients || [];
      setClients(clientList);
      
      if (clientList.length > 0 && !selectedClientId) {
        setSelectedClientId(clientList[0].client_id);
      }
    } catch (err) {
      setError('Müşteriler yüklenirken hata oluştu');
      setClients([]);
    }
  };

  const fetchActionPlan = async (clientId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('[ACTION PLAN] Fetching for client:', clientId);
      const response = await fetch(`/api/ai/recommendations?clientId=${clientId}&type=action_plan&status=active&limit=1`);
      
      console.log('[ACTION PLAN] Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('[ACTION PLAN] No action plan found');
          setActionPlan(null);
          return;
        }
        
        const errorData = await response.json().catch(() => ({}));
        console.error('[ACTION PLAN] Error response:', errorData);
        throw new Error(errorData.error || 'Aksiyon planı yüklenemedi');
      }
      
      const data = await response.json();
      console.log('[ACTION PLAN] Received data:', data);
      
      const plans = Array.isArray(data) ? data : [];
      if (plans.length > 0) {
        setActionPlan(plans[0]);
      } else {
        setActionPlan(null);
      }
    } catch (err) {
      console.error('[ACTION PLAN] Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Aksiyon planı yüklenirken hata oluştu');
      setActionPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const generateActionPlan = async () => {
    if (!selectedClientId) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log('[ACTION PLAN] Generating for client:', selectedClientId);
      const response = await fetch('/api/ai/action-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      
      console.log('[ACTION PLAN] Generate response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ACTION PLAN] Generate error:', errorData);
        
        // Provide more specific error messages
        if (response.status === 404) {
          throw new Error(errorData.error || 'Bu müşteri için kampanya verisi bulunamadı. Lütfen önce Meta verilerini senkronize edin.');
        }
        
        throw new Error(errorData.error || 'Aksiyon planı oluşturulamadı');
      }
      
      const result = await response.json();
      console.log('[ACTION PLAN] Generated successfully:', result);
      
      await fetchActionPlan(selectedClientId);
    } catch (err) {
      console.error('[ACTION PLAN] Generation error:', err);
      setError(err instanceof Error ? err.message : 'Aksiyon planı oluşturulurken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const handleActionComplete = () => {
    if (selectedClientId) {
      fetchActionPlan(selectedClientId);
    }
  };

  const showEmptyState = !loading && clients.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aksiyon Planı</h1>
          <p className="text-sm text-gray-600 mt-1">
            Yapay zeka destekli günlük öncelikli aksiyonlar
          </p>
        </div>
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Henüz veri yok
            </h2>
            <p className="text-gray-600 mb-8">
              Aksiyon planı oluşturmak için önce müşteri ekleyin ve kampanyalarınızı yönetmeye başlayın.
            </p>
            <a
              href="/dashboard/clients"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Yeni Müşteri Ekle
            </a>
          </div>
        </div>
      ) : (
        <>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Müşteri Seçin
                </label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Müşteri seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client: Client) => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="pt-6">
                <Button
                  onClick={generateActionPlan}
                  disabled={!selectedClientId || generating}
                >
                  {generating ? 'Oluşturuluyor...' : 'Yeni Plan Oluştur'}
                </Button>
              </div>
            </div>
          </Card>

          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </Card>
          )}

          {loading && (
            <Card className="p-6">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-gray-600">Yükleniyor...</span>
              </div>
            </Card>
          )}

          {!loading && selectedClientId && actionPlan && (
            <Suspense fallback={<ActionPlanSkeleton />}>
              <ActionPlanCard
                recommendationId={actionPlan.recommendation_id}
                actions={actionPlan.content}
                onActionComplete={handleActionComplete}
              />
            </Suspense>
          )}

          {!loading && selectedClientId && !actionPlan && !error && (
            <Card className="p-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">
                  Bu müşteri için henüz aksiyon planı oluşturulmamış.
                </p>
                <Button onClick={generateActionPlan} disabled={generating}>
                  {generating ? 'Oluşturuluyor...' : 'İlk Planı Oluştur'}
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function ActionPlanSkeleton() {
  return (
    <Card className="p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    </Card>
  );
}
