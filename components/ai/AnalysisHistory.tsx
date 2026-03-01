'use client';

import { formatDate } from '@/lib/utils/locale';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react';

interface TargetAudienceAnalysis {
  id: string;
  industry: string;
  created_at: string;
}

interface AnalysisHistoryProps {
  analyses: TargetAudienceAnalysis[];
  onSelect: (id: string) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export default function AnalysisHistory({
  analyses,
  onSelect,
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false
}: AnalysisHistoryProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 sm:space-y-4" role="status" aria-live="polite" aria-label="Yükleniyor">
        <h2 className="text-base sm:text-lg font-semibold">Geçmiş Analizler</h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-3 sm:p-4 animate-pulse" aria-hidden="true">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
        <span className="sr-only">Geçmiş analizler yükleniyor...</span>
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12" role="status">
        <FileText className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-4" aria-hidden="true" />
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          Henüz Analiz Yok
        </h2>
        <p className="text-xs sm:text-sm text-gray-600">
          İlk hedef kitle analizinizi oluşturmak için yukarıdaki formu kullanın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-base sm:text-lg font-semibold">Geçmiş Analizler</h2>
      
      <ul className="space-y-2" role="list" aria-label="Analiz listesi">
        {analyses.map((analysis) => (
          <li key={analysis.id}>
            <Card
              className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
              onClick={() => onSelect(analysis.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(analysis.id);
                }
              }}
              aria-label={`${analysis.industry} analizi, ${formatDate(analysis.created_at)} tarihinde oluşturuldu`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 mb-1 text-sm sm:text-base truncate">
                    {analysis.industry}
                  </h3>
                  <div className="flex items-center text-xs sm:text-sm text-gray-600">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" aria-hidden="true" />
                    <time dateTime={analysis.created_at}>
                      {formatDate(analysis.created_at)}
                    </time>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0 text-xs sm:text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(analysis.id);
                  }}
                  aria-label={`${analysis.industry} analizini görüntüle`}
                >
                  Görüntüle
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      {totalPages > 1 && (
        <nav 
          className="flex items-center justify-between pt-4 border-t gap-2"
          role="navigation"
          aria-label="Sayfalama"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="text-xs sm:text-sm"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" aria-hidden="true" />
            <span className="hidden sm:inline">Önceki</span>
          </Button>
          
          <span className="text-xs sm:text-sm text-gray-600" aria-current="page" aria-live="polite">
            Sayfa {currentPage} / {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="text-xs sm:text-sm"
            aria-label="Sonraki sayfa"
          >
            <span className="hidden sm:inline">Sonraki</span>
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}
