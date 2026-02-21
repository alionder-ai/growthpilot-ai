'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Lazy load ActionPlanCard for better performance
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

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Fetch action plan when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchActionPlan(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Müşteriler yüklenemedi');
      const data = await response.json();
      setClients(data);
      
      // Auto-select first client if available
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].client_id);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Müşteriler yüklenirken hata oluştu');
    }
  };

  const fetchActionPlan = async (clientId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch latest active action plan for this client
      const response = await fetch(`/api/ai/recommendations?clientId=${clientId}&type=action_plan&status=active&limit=1`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setActionPlan(null);
          return;
        }
        throw new Error('Aksiyon planı yüklenemedi');
      }
      
      const data = await response.json();
      if (data.length > 0) {
        setActionPlan(data[0]);
      } else {
        setActionPlan(null);
      }
    } catch (err) {
      console.error('Error fetching action plan:', err);
      setError('Aksiyon planı yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const generateActionPlan = async () => {
    if (!selectedClientId) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/action-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId: selectedClientId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Aksiyon planı oluşturulamadı');
      }
      
      const data = await response.json();
      
      // Refresh action plan
      await fetchActionPlan(selectedClientId);
    } catch (err) {
      console.error('Error generating action plan:', err);
      setError(err instanceof Error ? err.message : 'Aksiyon planı oluşturulurken hata oluştu');
    } finally {
      setGenerating(false);
    }
  };

  const handleActionComplete = () => {
    // Refresh action plan after completion
    if (selectedClientId) {
      fetchActionPlan(selectedClientId);
    }
  };

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

      {/* Client Selection */}
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
                {clients.map((client: Client) => (
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

      {/* Error Message */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3 text-gray-600">Yükleniyor...</span>
          </div>
        </Card>
      )}

      {/* Action Plan Display */}
      {!loading && selectedClientId && actionPlan && (
        <Suspense fallback={<ActionPlanSkeleton />}>
          <ActionPlanCard
            recommendationId={actionPlan.recommendation_id}
            actions={actionPlan.content}
            onActionComplete={handleActionComplete}
          />
        </Suspense>
      )}

      {/* No Action Plan State */}
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

      {/* No Client Selected State */}
      {!selectedClientId && clients.length === 0 && !loading && (
        <Card className="p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">
              Aksiyon planı oluşturmak için önce bir müşteri ekleyin.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Loading skeleton for action plan
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
