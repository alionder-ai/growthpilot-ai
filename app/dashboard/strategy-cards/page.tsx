'use client';

import { useEffect, useState } from 'react';
import { StrategyCard } from '@/components/ai/StrategyCard';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface StrategyCardData {
  recommendation_id: string;
  content: {
    trigger: string;
    metric_value: number;
    do_actions: string[];
    dont_actions: string[];
    reasoning: string;
  };
  created_at: string;
}

export default function StrategyCardsPage() {
  const [strategyCards, setStrategyCards] = useState<StrategyCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategyCards = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/ai/recommendations?type=strategy_card&status=active');
      
      if (!response.ok) {
        throw new Error('Strateji kartları yüklenemedi');
      }

      const data = await response.json();
      setStrategyCards(data || []);
    } catch (err) {
      console.error('Error fetching strategy cards:', err);
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategyCards();
  }, []);

  const handleDismiss = (recommendationId: string) => {
    setStrategyCards(prev => 
      prev.filter(card => card.recommendation_id !== recommendationId)
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Strateji Kartları</h1>
          <p className="text-sm text-gray-600 mt-1">
            Kampanyalarınız için yapılması ve yapılmaması gereken aksiyonlar
          </p>
        </div>
        <Button
          onClick={fetchStrategyCards}
          disabled={isLoading}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Hata</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
        </div>
      ) : strategyCards.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Harika! Şu anda strateji kartı yok
            </h3>
            <p className="text-gray-600">
              Kampanyalarınız iyi durumda. Metrik eşikleri aşıldığında burada strateji kartları görünecek.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {strategyCards.map((card) => (
            <StrategyCard
              key={card.recommendation_id}
              recommendationId={card.recommendation_id}
              trigger={card.content.trigger}
              metricValue={card.content.metric_value}
              doActions={card.content.do_actions}
              dontActions={card.content.dont_actions}
              reasoning={card.content.reasoning}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}
    </div>
  );
}
