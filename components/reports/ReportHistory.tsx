'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils/locale';

interface Report {
  report_id: string;
  client_id: string;
  report_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  file_url: string | null;
  created_at: string;
  clients: {
    name: string;
  };
}

export default function ReportHistory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/reports');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Raporlar yüklenemedi');
      }

      setReports(data.reports);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rapor indirilemedi');
      }

      // Open the file URL in a new tab or trigger download
      if (data.fileUrl) {
        window.open(data.fileUrl, '_blank');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'İndirme hatası');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinizden emin misiniz?')) {
      return;
    }

    setDeletingId(reportId);

    try {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rapor silinemedi');
      }

      // Remove from list
      setReports(prev => prev.filter(r => r.report_id !== reportId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Silme hatası');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Henüz rapor oluşturulmamış</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div
          key={report.report_id}
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">
              {report.clients.name}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="capitalize">
                {report.report_type === 'weekly' ? 'Haftalık' : 'Aylık'}
              </span>
              <span>
                {formatDate(report.period_start)} - {formatDate(report.period_end)}
              </span>
              <span className="text-gray-400">
                {formatDate(report.created_at)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {report.file_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(report.report_id)}
              >
                <Download className="w-4 h-4 mr-1" />
                İndir
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(report.report_id)}
              disabled={deletingId === report.report_id}
            >
              {deletingId === report.report_id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-red-600" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
