'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileText, Download, Loader2 } from 'lucide-react';

interface Client {
  client_id: string;
  name: string;
}

interface ReportGeneratorProps {
  clients: Client[];
}

export default function ReportGenerator({ clients }: ReportGeneratorProps) {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [format, setFormat] = useState<'whatsapp' | 'pdf'>('whatsapp');
  const [periodStart, setPeriodStart] = useState<string>('');
  const [periodEnd, setPeriodEnd] = useState<string>('');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'totalSpend',
    'totalRevenue',
    'roas',
    'leadCount',
    'costPerLead'
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set default date range based on report type
  useEffect(() => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    
    if (reportType === 'weekly') {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      setPeriodStart(start.toISOString().split('T')[0]);
    } else {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 1);
      setPeriodStart(start.toISOString().split('T')[0]);
    }
    
    setPeriodEnd(end);
  }, [reportType]);

  const availableMetrics = [
    { id: 'totalSpend', label: 'Toplam Harcama' },
    { id: 'totalRevenue', label: 'Toplam Gelir' },
    { id: 'roas', label: 'ROAS' },
    { id: 'leadCount', label: 'Lead Sayısı' },
    { id: 'costPerLead', label: 'Lead Başına Maliyet' },
    { id: 'impressions', label: 'Gösterim' },
    { id: 'clicks', label: 'Tıklama' },
    { id: 'ctr', label: 'CTR' },
    { id: 'cpc', label: 'CPC' },
    { id: 'conversions', label: 'Dönüşüm' },
    { id: 'purchases', label: 'Satın Alma' }
  ];

  const toggleMetric = (metricId: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
    );
  };

  const handleGenerate = async () => {
    setError(null);
    setGeneratedReport(null);

    // Validation
    if (!selectedClient) {
      setError('Lütfen bir müşteri seçin');
      return;
    }

    if (!periodStart || !periodEnd) {
      setError('Lütfen tarih aralığı seçin');
      return;
    }

    if (selectedMetrics.length === 0) {
      setError('Lütfen en az bir metrik seçin');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedClient,
          reportType,
          periodStart,
          periodEnd,
          selectedMetrics,
          format
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rapor oluşturulamadı');
      }

      if (format === 'whatsapp') {
        setGeneratedReport(data.content);
      } else {
        // For PDF, show success message and provide download link
        setGeneratedReport(`PDF raporu başarıyla oluşturuldu. Rapor ID: ${data.report.report_id}`);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedReport) {
      navigator.clipboard.writeText(generatedReport);
      alert('Rapor panoya kopyalandı!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Client Selection */}
      <div>
        <Label htmlFor="client">Müşteri</Label>
        <select
          id="client"
          value={selectedClient}
          onChange={(e) => setSelectedClient(e.target.value)}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Müşteri seçin...</option>
          {clients.map((client) => (
            <option key={client.client_id} value={client.client_id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Report Type */}
      <div>
        <Label>Rapor Türü</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="weekly"
              checked={reportType === 'weekly'}
              onChange={(e) => setReportType(e.target.value as 'weekly')}
              className="w-4 h-4 text-blue-600"
            />
            <span>Haftalık</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="monthly"
              checked={reportType === 'monthly'}
              onChange={(e) => setReportType(e.target.value as 'monthly')}
              className="w-4 h-4 text-blue-600"
            />
            <span>Aylık</span>
          </label>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="periodStart">Başlangıç Tarihi</Label>
          <input
            type="date"
            id="periodStart"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <Label htmlFor="periodEnd">Bitiş Tarihi</Label>
          <input
            type="date"
            id="periodEnd"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <Label>Format</Label>
        <div className="flex gap-4 mt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="whatsapp"
              checked={format === 'whatsapp'}
              onChange={(e) => setFormat(e.target.value as 'whatsapp')}
              className="w-4 h-4 text-blue-600"
            />
            <span>WhatsApp</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="pdf"
              checked={format === 'pdf'}
              onChange={(e) => setFormat(e.target.value as 'pdf')}
              className="w-4 h-4 text-blue-600"
            />
            <span>PDF</span>
          </label>
        </div>
      </div>

      {/* Metrics Selection */}
      <div>
        <Label>Metrikler</Label>
        <div className="grid grid-cols-2 gap-3 mt-2">
          {availableMetrics.map((metric) => (
            <label
              key={metric.id}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={selectedMetrics.includes(metric.id)}
                onCheckedChange={() => toggleMetric(metric.id)}
              />
              <span className="text-sm">{metric.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Generate Button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Oluşturuluyor...
          </>
        ) : (
          <>
            <FileText className="w-4 h-4 mr-2" />
            Rapor Oluştur
          </>
        )}
      </Button>

      {/* Generated Report Preview (WhatsApp) */}
      {generatedReport && format === 'whatsapp' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Oluşturulan Rapor</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
            >
              Kopyala
            </Button>
          </div>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {generatedReport}
            </pre>
          </div>
        </div>
      )}

      {/* PDF Success Message */}
      {generatedReport && format === 'pdf' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-600">{generatedReport}</p>
        </div>
      )}
    </div>
  );
}
