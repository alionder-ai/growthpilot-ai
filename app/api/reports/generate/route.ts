import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Set a timeout to ensure response within 5 seconds
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Rapor oluşturma zaman aşımına uğradı')), 5000);
  });

  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { 
      clientId, 
      reportType, 
      periodStart, 
      periodEnd, 
      selectedMetrics,
      format 
    } = body;

    // Validate required fields
    if (!clientId || !reportType || !periodStart || !periodEnd || !format) {
      return NextResponse.json(
        { error: 'Eksik parametreler' },
        { status: 400 }
      );
    }

    // Validate report type
    if (reportType !== 'weekly' && reportType !== 'monthly') {
      return NextResponse.json(
        { error: 'Geçersiz rapor türü' },
        { status: 400 }
      );
    }

    // Validate format
    if (format !== 'whatsapp' && format !== 'pdf') {
      return NextResponse.json(
        { error: 'Geçersiz format' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id, name')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Process report generation with timeout protection
    const reportGenerationPromise = (async () => {
      // Aggregate metrics for the period
      const metricsData = await aggregateMetrics(
        supabase,
        clientId,
        periodStart,
        periodEnd,
        selectedMetrics
      );

      // Generate report based on format
      let reportContent: string;
      let fileUrl: string | null = null;

      if (format === 'whatsapp') {
        reportContent = await generateWhatsAppReport(
          client.name,
          reportType,
          periodStart,
          periodEnd,
          metricsData
        );
        // For WhatsApp, we return the text directly
        return {
          success: true,
          format: 'whatsapp',
          content: reportContent,
          metrics: metricsData
        };
      } else {
        // PDF generation
        reportContent = await generatePDFReport(
          client.name,
          reportType,
          periodStart,
          periodEnd,
          metricsData
        );
        fileUrl = reportContent; // This will be the file URL
      }

      // Store report in database
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          client_id: clientId,
          report_type: reportType,
          period_start: periodStart,
          period_end: periodEnd,
          file_url: fileUrl
        })
        .select()
        .single();

      if (reportError) {
        console.error('Error storing report:', reportError);
        throw new Error('Rapor kaydedilemedi');
      }

      return {
        success: true,
        report,
        metrics: metricsData,
        fileUrl
      };
    })();

    // Race between report generation and timeout
    const result = await Promise.race([reportGenerationPromise, timeoutPromise]);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Error generating report:', error);
    
    if (error instanceof Error && error.message === 'Rapor oluşturma zaman aşımına uğradı') {
      return NextResponse.json(
        { error: 'Rapor oluşturma çok uzun sürdü. Lütfen daha kısa bir dönem seçin.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json(
      { error: 'Rapor oluşturulurken hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * Aggregate metrics for a client within a date range
 */
async function aggregateMetrics(
  supabase: any,
  clientId: string,
  periodStart: string,
  periodEnd: string,
  selectedMetrics?: string[]
) {
  // Get all campaigns for the client
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('campaign_id')
    .eq('client_id', clientId);

  if (campaignsError || !campaigns || campaigns.length === 0) {
    return {
      totalSpend: 0,
      totalRevenue: 0,
      leadCount: 0,
      roas: 0,
      costPerLead: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0
    };
  }

  const campaignIds = campaigns.map(c => c.campaign_id);

  // Get all ad sets for these campaigns
  const { data: adSets } = await supabase
    .from('ad_sets')
    .select('ad_set_id')
    .in('campaign_id', campaignIds);

  if (!adSets || adSets.length === 0) {
    return {
      totalSpend: 0,
      totalRevenue: 0,
      leadCount: 0,
      roas: 0,
      costPerLead: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0
    };
  }

  const adSetIds = adSets.map(a => a.ad_set_id);

  // Get all ads for these ad sets
  const { data: ads } = await supabase
    .from('ads')
    .select('ad_id')
    .in('ad_set_id', adSetIds);

  if (!ads || ads.length === 0) {
    return {
      totalSpend: 0,
      totalRevenue: 0,
      leadCount: 0,
      roas: 0,
      costPerLead: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0
    };
  }

  const adIds = ads.map(a => a.ad_id);

  // Aggregate metrics from meta_metrics table
  const { data: metrics, error: metricsError } = await supabase
    .from('meta_metrics')
    .select('*')
    .in('ad_id', adIds)
    .gte('date', periodStart)
    .lte('date', periodEnd);

  if (metricsError || !metrics || metrics.length === 0) {
    return {
      totalSpend: 0,
      totalRevenue: 0,
      leadCount: 0,
      roas: 0,
      costPerLead: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0
    };
  }

  // Calculate aggregated metrics
  const totalSpend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
  const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
  const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);
  const totalPurchases = metrics.reduce((sum, m) => sum + (m.purchases || 0), 0);

  // Get commission model to calculate revenue
  const { data: commissionModel } = await supabase
    .from('commission_models')
    .select('commission_percentage')
    .eq('client_id', clientId)
    .single();

  const commissionPercentage = commissionModel?.commission_percentage || 0;
  const totalRevenue = (totalSpend * commissionPercentage) / 100;

  // Get lead count
  const { data: leads } = await supabase
    .from('leads')
    .select('lead_id')
    .in('ad_id', adIds)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const leadCount = leads?.length || 0;

  // Calculate derived metrics
  const avgRoas = metrics.length > 0
    ? metrics.reduce((sum, m) => sum + (m.roas || 0), 0) / metrics.length
    : 0;
  
  const costPerLead = leadCount > 0 ? totalSpend / leadCount : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  return {
    totalSpend,
    totalRevenue,
    leadCount,
    roas: avgRoas,
    costPerLead,
    impressions: totalImpressions,
    clicks: totalClicks,
    conversions: totalConversions,
    purchases: totalPurchases,
    ctr,
    cpc
  };
}

/**
 * Generate WhatsApp formatted report (plain text)
 */
async function generateWhatsAppReport(
  clientName: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  metrics: any
): Promise<string> {
  const { generateWhatsAppReport: formatWhatsAppReport } = await import('@/lib/utils/report-formatters');
  return formatWhatsAppReport(clientName, reportType, periodStart, periodEnd, metrics);
}

/**
 * Generate PDF report
 * Returns the file URL where the PDF is stored
 */
async function generatePDFReport(
  clientName: string,
  reportType: 'weekly' | 'monthly',
  periodStart: string,
  periodEnd: string,
  metrics: any
): Promise<string> {
  const { generatePDFReport: createPDF, savePDFToFile } = await import('@/lib/utils/pdf-generator');
  
  // Generate PDF as base64
  const pdfBase64 = await createPDF(clientName, reportType, periodStart, periodEnd, metrics);
  
  // Save to storage and get URL
  const fileName = `${clientName.replace(/\s+/g, '_')}_${reportType}_${periodStart}_${periodEnd}`;
  const fileUrl = await savePDFToFile(pdfBase64, fileName);
  
  return fileUrl;
}
