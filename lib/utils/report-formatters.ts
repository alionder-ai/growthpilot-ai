/**
 * Report formatting utilities for WhatsApp and PDF formats
 * Handles Turkish locale formatting for reports
 */

import { formatCurrency, formatDate, formatDateRange, formatNumber, formatPercentage } from './locale';

export interface ReportMetrics {
  totalSpend: number;
  totalRevenue: number;
  leadCount: number;
  roas: number;
  costPerLead: number;
  impressions?: number;
  clicks?: number;
  conversions?: number;
  purchases?: number;
  ctr?: number;
  cpc?: number;
}

/**
 * Generate WhatsApp formatted report (plain text)
 * Uses Turkish locale and formatting
 */
export function generateWhatsAppReport(
  clientName: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  metrics: ReportMetrics
): string {
  const reportTypeText = reportType === 'weekly' ? 'Haftalık' : 'Aylık';
  const dateRange = formatDateRange(periodStart, periodEnd);
  
  let report = `📊 *${reportTypeText} Performans Raporu*\n\n`;
  report += `👤 *Müşteri:* ${clientName}\n`;
  report += `📅 *Dönem:* ${dateRange}\n`;
  report += `\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `\n`;
  
  // Core metrics (always included)
  report += `💰 *Toplam Harcama*\n`;
  report += `${formatCurrency(metrics.totalSpend)}\n`;
  report += `\n`;
  
  report += `💵 *Toplam Gelir (Komisyon)*\n`;
  report += `${formatCurrency(metrics.totalRevenue)}\n`;
  report += `\n`;
  
  report += `📈 *ROAS (Reklam Getirisi)*\n`;
  report += `${formatNumber(metrics.roas, 2)}\n`;
  report += `\n`;
  
  report += `👥 *Lead Sayısı*\n`;
  report += `${metrics.leadCount} adet\n`;
  report += `\n`;
  
  report += `💸 *Lead Başına Maliyet*\n`;
  report += `${formatCurrency(metrics.costPerLead)}\n`;
  report += `\n`;
  
  // Optional metrics (if available)
  if (metrics.impressions !== undefined && metrics.impressions > 0) {
    report += `━━━━━━━━━━━━━━━━━━━━\n`;
    report += `\n`;
    report += `📊 *Detaylı Metrikler*\n`;
    report += `\n`;
    
    report += `👁️ Gösterim: ${formatNumber(metrics.impressions, 0)}\n`;
    
    if (metrics.clicks !== undefined) {
      report += `🖱️ Tıklama: ${formatNumber(metrics.clicks, 0)}\n`;
    }
    
    if (metrics.ctr !== undefined) {
      report += `📊 CTR: ${formatPercentage(metrics.ctr, 2)}\n`;
    }
    
    if (metrics.cpc !== undefined) {
      report += `💰 CPC: ${formatCurrency(metrics.cpc)}\n`;
    }
    
    if (metrics.conversions !== undefined) {
      report += `✅ Dönüşüm: ${formatNumber(metrics.conversions, 0)}\n`;
    }
    
    if (metrics.purchases !== undefined) {
      report += `🛒 Satın Alma: ${formatNumber(metrics.purchases, 0)}\n`;
    }
    
    report += `\n`;
  }
  
  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `\n`;
  report += `📱 *GrowthPilot AI* ile oluşturuldu\n`;
  report += `${formatDate(new Date())}\n`;
  
  return report;
}

/**
 * Generate customized WhatsApp report with selected metrics only
 */
export function generateCustomWhatsAppReport(
  clientName: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  metrics: ReportMetrics,
  selectedMetrics: string[]
): string {
  const reportTypeText = reportType === 'weekly' ? 'Haftalık' : 'Aylık';
  const dateRange = formatDateRange(periodStart, periodEnd);
  
  let report = `📊 *${reportTypeText} Performans Raporu*\n\n`;
  report += `👤 *Müşteri:* ${clientName}\n`;
  report += `📅 *Dönem:* ${dateRange}\n`;
  report += `\n`;
  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `\n`;
  
  // Add only selected metrics
  if (selectedMetrics.includes('totalSpend')) {
    report += `💰 *Toplam Harcama*\n`;
    report += `${formatCurrency(metrics.totalSpend)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('totalRevenue')) {
    report += `💵 *Toplam Gelir (Komisyon)*\n`;
    report += `${formatCurrency(metrics.totalRevenue)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('roas')) {
    report += `📈 *ROAS (Reklam Getirisi)*\n`;
    report += `${formatNumber(metrics.roas, 2)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('leadCount')) {
    report += `👥 *Lead Sayısı*\n`;
    report += `${metrics.leadCount} adet\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('costPerLead')) {
    report += `💸 *Lead Başına Maliyet*\n`;
    report += `${formatCurrency(metrics.costPerLead)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('impressions') && metrics.impressions !== undefined) {
    report += `👁️ *Gösterim*\n`;
    report += `${formatNumber(metrics.impressions, 0)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('clicks') && metrics.clicks !== undefined) {
    report += `🖱️ *Tıklama*\n`;
    report += `${formatNumber(metrics.clicks, 0)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('ctr') && metrics.ctr !== undefined) {
    report += `📊 *CTR*\n`;
    report += `${formatPercentage(metrics.ctr, 2)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('cpc') && metrics.cpc !== undefined) {
    report += `💰 *CPC*\n`;
    report += `${formatCurrency(metrics.cpc)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('conversions') && metrics.conversions !== undefined) {
    report += `✅ *Dönüşüm*\n`;
    report += `${formatNumber(metrics.conversions, 0)}\n`;
    report += `\n`;
  }
  
  if (selectedMetrics.includes('purchases') && metrics.purchases !== undefined) {
    report += `🛒 *Satın Alma*\n`;
    report += `${formatNumber(metrics.purchases, 0)}\n`;
    report += `\n`;
  }
  
  report += `━━━━━━━━━━━━━━━━━━━━\n`;
  report += `\n`;
  report += `📱 *GrowthPilot AI* ile oluşturuldu\n`;
  report += `${formatDate(new Date())}\n`;
  
  return report;
}
