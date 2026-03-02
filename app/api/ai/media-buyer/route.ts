/**
 * AI Media Buyer API Endpoint
 * 
 * POST /api/ai/media-buyer
 * Analyzes campaigns and provides Scale/Hold/Kill recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { MediaBuyerAnalyzer } from '@/lib/ai/media-buyer-analyzer';
import { getCachedAnalysis, setCachedAnalysis } from '@/lib/ai/media-buyer-cache';
import { MEDIA_BUYER_ERRORS } from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: MEDIA_BUYER_ERRORS.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { campaignId } = body;

    // Validate campaign ID
    if (!campaignId || typeof campaignId !== 'string') {
      return NextResponse.json(
        { success: false, error: MEDIA_BUYER_ERRORS.MISSING_CAMPAIGN_ID },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for debugging
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify campaign exists
    const { data: campaign, error: campaignError } = await serviceClient
      .from('campaigns')
      .select('campaign_id, client_id')
      .eq('campaign_id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Kampanya bulunamadı', details: campaignError?.message },
        { status: 404 }
      );
    }

    // Manual ownership check
    const { data: clientData } = await serviceClient
      .from('clients')
      .select('user_id')
      .eq('client_id', campaign.client_id)
      .single();

    if (!clientData || clientData.user_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Bu kampanyaya erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Check cache first
    const cachedResult = getCachedAnalysis(campaignId);
    if (cachedResult) {
      // Log cache hit
      console.log(`Cache hit for campaign ${campaignId}`);
      
      return NextResponse.json({
        success: true,
        data: cachedResult,
        cached: true,
      });
    }

    // Cache miss - perform analysis
    console.log(`Cache miss for campaign ${campaignId}, performing analysis`);
    
    const analyzer = new MediaBuyerAnalyzer();
    const analysis = await analyzer.analyzeCampaign(campaignId, user.id);

    // Store in cache
    setCachedAnalysis(campaignId, analysis);

    // Log analysis request for audit
    await logAnalysisRequest(supabase, user.id, campaignId, 'success');

    return NextResponse.json({
      success: true,
      data: analysis,
      cached: false,
    });

  } catch (error) {
    console.error('[AI MEDIA BUYER FATAL ERROR]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
        errorStack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * Log analysis request for audit purposes
 */
async function logAnalysisRequest(
  supabase: any,
  userId: string,
  campaignId: string,
  status: 'success' | 'error'
): Promise<void> {
  try {
    // You can implement audit logging to a dedicated table if needed
    console.log('Analysis request:', {
      userId,
      campaignId,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log analysis request:', error);
  }
}

/**
 * Map error messages to HTTP status codes
 */
function getStatusCodeForError(errorMessage: string): number {
  switch (errorMessage) {
    case MEDIA_BUYER_ERRORS.MISSING_CAMPAIGN_ID:
    case MEDIA_BUYER_ERRORS.INVALID_CAMPAIGN_ID:
    case MEDIA_BUYER_ERRORS.INSUFFICIENT_DATA:
    case MEDIA_BUYER_ERRORS.MISSING_METRICS:
      return 400;
    
    case MEDIA_BUYER_ERRORS.UNAUTHORIZED:
      return 403;
    
    case MEDIA_BUYER_ERRORS.CAMPAIGN_NOT_FOUND:
      return 404;
    
    case MEDIA_BUYER_ERRORS.API_ERROR:
    case MEDIA_BUYER_ERRORS.API_TIMEOUT:
    case MEDIA_BUYER_ERRORS.DATABASE_ERROR:
    case MEDIA_BUYER_ERRORS.UNKNOWN_ERROR:
      return 500;
    
    case MEDIA_BUYER_ERRORS.NETWORK_ERROR:
      return 503;
    
    default:
      return 500;
  }
}
