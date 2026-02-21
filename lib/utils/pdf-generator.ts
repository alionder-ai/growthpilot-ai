/**
 * PDF Report Generator
 * Generates PDF reports with charts and tables
 * 
 * NOTE: Requires jsPDF library to be installed:
 * npm install jspdf
 */

import { formatCurrency, formatDate, formatDateRange, formatNumber, formatPercentage } from './locale';
import type { ReportMetrics } from './report-formatters';

/**
 * Generate PDF report
 * Returns a base64 encoded PDF string that can be stored or downloaded
 */
export async function generatePDFReport(
  clientName: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  metrics: ReportMetrics
): Promise<string> {
  // Dynamic import to avoid SSR issues
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = margin;
  
  // Helper function to add text with automatic line wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
    doc.text(lines, margin, yPosition);
    yPosition += (lines.length * fontSize * 0.5) + 5;
  };
  
  // Header
  doc.setFillColor(59, 130, 246); // Blue color
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GrowthPilot AI', margin, 25);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  const reportTypeText = reportType === 'weekly' ? 'Haftalık' : 'Aylık';
  doc.text(`${reportTypeText} Performans Raporu`, margin, 35);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  yPosition = 55;
  
  // Client and period info
  addText(`Müşteri: ${clientName}`, 14, true);
  addText(`Dönem: ${formatDateRange(periodStart, periodEnd)}`, 12);
  addText(`Rapor Tarihi: ${formatDate(new Date())}`, 10);
  
  yPosition += 5;
  
  // Draw separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;
  
  // Core Metrics Section
  addText('Temel Metrikler', 16, true);
  yPosition += 5;
  
  // Create metrics table
  const metricsData = [
    ['Toplam Harcama', formatCurrency(metrics.totalSpend)],
    ['Toplam Gelir (Komisyon)', formatCurrency(metrics.totalRevenue)],
    ['ROAS (Reklam Getirisi)', formatNumber(metrics.roas, 2)],
    ['Lead Sayısı', `${metrics.leadCount} adet`],
    ['Lead Başına Maliyet', formatCurrency(metrics.costPerLead)]
  ];
  
  // Draw metrics table
  const tableStartY = yPosition;
  const rowHeight = 12;
  const col1Width = 100;
  const col2Width = 70;
  
  doc.setFontSize(11);
  metricsData.forEach((row, index) => {
    const currentY = tableStartY + (index * rowHeight);
    
    // Alternating row colors
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, currentY - 8, col1Width + col2Width, rowHeight, 'F');
    }
    
    // Label (bold)
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], margin + 5, currentY);
    
    // Value (normal)
    doc.setFont('helvetica', 'normal');
    doc.text(row[1], margin + col1Width + 5, currentY);
  });
  
  yPosition = tableStartY + (metricsData.length * rowHeight) + 10;
  
  // Detailed Metrics Section (if available)
  if (metrics.impressions !== undefined && metrics.impressions > 0) {
    // Check if we need a new page
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }
    
    // Draw separator line
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
    
    addText('Detaylı Metrikler', 16, true);
    yPosition += 5;
    
    const detailedMetrics = [];
    
    if (metrics.impressions !== undefined) {
      detailedMetrics.push(['Gösterim', formatNumber(metrics.impressions, 0)]);
    }
    if (metrics.clicks !== undefined) {
      detailedMetrics.push(['Tıklama', formatNumber(metrics.clicks, 0)]);
    }
    if (metrics.ctr !== undefined) {
      detailedMetrics.push(['CTR (Tıklama Oranı)', formatPercentage(metrics.ctr, 2)]);
    }
    if (metrics.cpc !== undefined) {
      detailedMetrics.push(['CPC (Tıklama Başına Maliyet)', formatCurrency(metrics.cpc)]);
    }
    if (metrics.conversions !== undefined) {
      detailedMetrics.push(['Dönüşüm', formatNumber(metrics.conversions, 0)]);
    }
    if (metrics.purchases !== undefined) {
      detailedMetrics.push(['Satın Alma', formatNumber(metrics.purchases, 0)]);
    }
    
    // Draw detailed metrics table
    const detailedTableStartY = yPosition;
    doc.setFontSize(11);
    detailedMetrics.forEach((row, index) => {
      const currentY = detailedTableStartY + (index * rowHeight);
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, currentY - 8, col1Width + col2Width, rowHeight, 'F');
      }
      
      // Label (bold)
      doc.setFont('helvetica', 'bold');
      doc.text(row[0], margin + 5, currentY);
      
      // Value (normal)
      doc.setFont('helvetica', 'normal');
      doc.text(row[1], margin + col1Width + 5, currentY);
    });
    
    yPosition = detailedTableStartY + (detailedMetrics.length * rowHeight) + 10;
  }
  
  // Footer
  const footerY = pageHeight - 20;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.setFont('helvetica', 'italic');
  doc.text('Bu rapor GrowthPilot AI tarafından otomatik olarak oluşturulmuştur.', pageWidth / 2, footerY, { align: 'center' });
  
  // Generate PDF as base64 string
  const pdfBase64 = doc.output('datauristring');
  
  return pdfBase64;
}

/**
 * Save PDF to file system (for server-side storage)
 * Returns the file path
 */
export async function savePDFToFile(
  pdfBase64: string,
  fileName: string
): Promise<string> {
  // In a real implementation, this would:
  // 1. Upload to Supabase Storage or S3
  // 2. Return the public URL
  
  // For now, we'll return a placeholder URL
  // This should be implemented based on your storage solution
  
  const timestamp = Date.now();
  const fileUrl = `/reports/${fileName}_${timestamp}.pdf`;
  
  // TODO: Implement actual file upload to storage
  // Example with Supabase Storage:
  // const { data, error } = await supabase.storage
  //   .from('reports')
  //   .upload(fileUrl, pdfBuffer, {
  //     contentType: 'application/pdf',
  //     upsert: false
  //   });
  
  return fileUrl;
}

/**
 * Convert base64 PDF to downloadable blob
 */
export function pdfBase64ToBlob(base64: string): Blob {
  // Remove data URI prefix if present
  const base64Data = base64.split(',')[1] || base64;
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'application/pdf' });
}
