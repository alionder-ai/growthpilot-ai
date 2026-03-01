'use client';

import { useState, useEffect } from 'react';
import { TargetAudienceForm } from '@/components/ai/TargetAudienceForm';
import { AnalysisDisplay } from '@/components/ai/AnalysisDisplay';
import AnalysisHistory from '@/components/ai/AnalysisHistory';
import { StrategicAnalysis } from '@/lib/types/target-audience';
import { useToast } from '@/lib/contexts/ToastContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, History, X } from 'lucide-react';

// Force dynamic rendering to avoid prerendering issues with ToastContext
export const dynamic = 'force-dynamic';

export default function TargetAudiencePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<StrategicAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const handleSubmit = async (industry: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/ai/target-audience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ industry }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      }

      const data = await response.json();
      
      if (!data.analysis) {
        throw new Error('Analiz verisi alınamadı');
      }

      setAnalysis(data.analysis);
      setError(null);
      
      // Show success toast
      toast.success('Analiz Tamamlandı', 'Hedef kitle analizi başarıyla oluşturuldu');
    } catch (err) {
      console.error('Error generating analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Analiz oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.';
      setError(errorMessage);
      setAnalysis(null);
      
      // Show error toast
      toast.error('Hata', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (page: number = 1) => {
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/ai/target-audience/history?page=${page}`);
      
      if (!response.ok) {
        throw new Error('Geçmiş analizler yüklenemedi');
      }

      const data = await response.json();
      setHistoryData(data.analyses || []);
      setCurrentPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Hata', 'Geçmiş analizler yüklenemedi');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectAnalysis = async (id: string) => {
    try {
      const response = await fetch(`/api/ai/target-audience/${id}`);
      
      if (!response.ok) {
        throw new Error('Analiz yüklenemedi');
      }

      const data = await response.json();
      setAnalysis(data.analysis.analysis_data);
      setShowHistory(false);
      setError(null);
    } catch (err) {
      console.error('Error loading analysis:', err);
      toast.error('Hata', 'Analiz yüklenemedi');
    }
  };

  const handlePageChange = (page: number) => {
    fetchHistory(page);
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchHistory(1);
    }
    setShowHistory(!showHistory);
  };

  useEffect(() => {
    if (showHistory) {
      fetchHistory(currentPage);
    }
  }, [showHistory]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Hedef Kitle Analizi</h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-600">
            Sektörünüz için yapay zeka destekli müşteri segmentasyonu ve teklif stratejisi oluşturun
          </p>
        </div>
        <Button
          variant="outline"
          onClick={toggleHistory}
          className="flex items-center gap-2 w-full sm:w-auto"
          aria-expanded={showHistory}
          aria-controls="analysis-history-section"
        >
          {showHistory ? (
            <>
              <X className="h-4 w-4" aria-hidden="true" />
              Kapat
            </>
          ) : (
            <>
              <History className="h-4 w-4" aria-hidden="true" />
              Geçmiş Analizler
            </>
          )}
        </Button>
      </header>

      {/* History View */}
      {showHistory && (
        <section id="analysis-history-section" aria-label="Geçmiş Analizler">
          <Card className="p-4 sm:p-6">
            <AnalysisHistory
              analyses={historyData}
              onSelect={handleSelectAnalysis}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              isLoading={historyLoading}
            />
          </Card>
        </section>
      )}

      {/* Form Section */}
      <section aria-label="Analiz Formu">
        <Card className="p-4 sm:p-6">
          <TargetAudienceForm
            onSubmit={handleSubmit}
            isLoading={isLoading}
            error={error}
          />
        </Card>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section aria-live="polite" aria-busy="true" aria-label="Yükleniyor">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center py-6 sm:py-8">
              <div 
                className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mb-4"
                role="status"
                aria-label="Analiz ediliyor"
              ></div>
              <p className="text-gray-600 font-medium text-sm sm:text-base">Analiz ediliyor...</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                Bu işlem birkaç saniye sürebilir
              </p>
            </div>
          </Card>
        </section>
      )}

      {/* Analysis Results */}
      {!isLoading && analysis && (
        <section aria-live="polite" aria-label="Analiz Sonuçları">
          <AnalysisDisplay analysis={analysis} />
        </section>
      )}

      {/* Empty State */}
      {!isLoading && !analysis && !error && (
        <section aria-label="Başlangıç Durumu">
          <Card className="p-8 sm:p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary" aria-hidden="true" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Hedef Kitle Analizine Başlayın
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Sektörünüzü girin ve Alex Hormozi'nin Grand Slam Offer metodolojisine dayalı 
                detaylı müşteri segmentasyonu ve teklif stratejisi alın.
              </p>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
