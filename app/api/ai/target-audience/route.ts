import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient, TOKEN_LIMITS } from '@/lib/gemini/client';
import { buildTargetAudiencePrompt } from '@/lib/gemini/prompts';
import { parseTargetAudienceResponse, type StrategicAnalysis } from '@/lib/utils/target-audience-parser';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/target-audience
 * 
 * Generates AI-powered strategic analysis for target audience and offers
 * Based on Alex Hormozi's Grand Slam Offer methodology
 * 
 * Request body:
 * - industry: string (e.g., "Güzellik Merkezi", "Gayrimenkul")
 * 
 * Returns:
 * - analysis_id: UUID of stored analysis
 * - analysis: StrategicAnalysis object with customer segments and offers
 */
export async function POST(request: NextRequest) {
  console.log('[TARGET AUDIENCE API] ========== REQUEST START ==========');
  
  try {
    // Step 1: Authentication validation
    console.log('[TARGET AUDIENCE API] Step 1: Creating Supabase client...');
    const supabase = await createClient();
    console.log('[TARGET AUDIENCE API] ✓ Supabase client created');

    console.log('[TARGET AUDIENCE API] Step 2: Getting authenticated user...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[TARGET AUDIENCE API] ✗ Auth error:', authError);
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    console.log('[TARGET AUDIENCE API] ✓ User authenticated:', user.id);

    // Step 2: Input validation
    console.log('[TARGET AUDIENCE API] Step 3: Parsing request body...');
    const body = await request.json();
    const { industry } = body;

    console.log('[TARGET AUDIENCE API] Industry input:', industry);

    if (!industry || typeof industry !== 'string' || industry.trim() === '') {
      console.error('[TARGET AUDIENCE API] ✗ Invalid industry input');
      return NextResponse.json(
        { error: 'Bu alan zorunludur' },
        { status: 400 }
      );
    }

    // Normalize input (trim whitespace)
    const normalizedIndustry = industry.trim();
    console.log('[TARGET AUDIENCE API] ✓ Normalized industry:', normalizedIndustry);

    // Step 3: Generate analysis using Gemini API with retry logic
    console.log('[TARGET AUDIENCE API] Step 4: Generating strategic analysis...');
    const geminiClient = getGeminiClient();
    const prompt = buildTargetAudiencePrompt(normalizedIndustry);

    let analysis: StrategicAnalysis;
    let rawResponse: any;
    
    try {
      // SINGLE API CALL - No retry logic
      rawResponse = await geminiClient.generateJSON<any>(
        prompt,
        TOKEN_LIMITS.TARGET_AUDIENCE
      );

      console.log('[TARGET AUDIENCE API] ✓ Received response from Gemini API');
      console.log('[TARGET AUDIENCE API] RAW GEMINI RESPONSE TYPE:', typeof rawResponse);
      console.log('[TARGET AUDIENCE API] RAW GEMINI RESPONSE:', JSON.stringify(rawResponse, null, 2));
    } catch (error) {
      console.error('[TARGET AUDIENCE API] ========== GEMINI API ERROR ==========');
      console.error('[TARGET AUDIENCE API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[TARGET AUDIENCE API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[TARGET AUDIENCE API] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('[TARGET AUDIENCE API] Full error object:', JSON.stringify(error, null, 2));
      console.error('[TARGET AUDIENCE API] =======================================');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Gemini API hatası',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error instanceof Error ? error.constructor.name : typeof error
        },
        { status: 500 }
      );
    }

    // Parse and validate response structure
    try {
      console.log('[TARGET AUDIENCE API] Step 4b: Parsing response...');
      
      // If rawResponse is already an object, pass it directly
      // If it's a string, parseTargetAudienceResponse will handle it
      const responseToValidate = typeof rawResponse === 'string' 
        ? rawResponse 
        : JSON.stringify(rawResponse);
      
      analysis = parseTargetAudienceResponse(responseToValidate);
      console.log('[TARGET AUDIENCE API] ✓ Response validated and parsed');
    } catch (error) {
      console.error('[TARGET AUDIENCE API] ========== PARSER ERROR ==========');
      console.error('[TARGET AUDIENCE API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[TARGET AUDIENCE API] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[TARGET AUDIENCE API] Error stack:', error instanceof Error ? error.stack : 'N/A');
      console.error('[TARGET AUDIENCE API] Raw response that failed:', JSON.stringify(rawResponse, null, 2));
      console.error('[TARGET AUDIENCE API] =======================================');
      
      return NextResponse.json(
        { 
          success: false,
          error: 'Yanıt işleme hatası',
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          errorType: error instanceof Error ? error.constructor.name : typeof error,
          rawResponse: rawResponse
        },
        { status: 500 }
      );
    }

    // Step 4: Store analysis in database
    console.log('[TARGET AUDIENCE API] Step 5: Storing analysis in database...');
    const { data: analysisRecord, error: insertError } = await supabase
      .from('target_audience_analyses')
      .insert({
        user_id: user.id,
        industry: normalizedIndustry,
        analysis_data: analysis,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[TARGET AUDIENCE API] ✗ Error storing analysis:', insertError);
      return NextResponse.json(
        { error: 'Analiz kaydedilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    console.log('[TARGET AUDIENCE API] ✓ Analysis stored with ID:', analysisRecord.id);
    console.log('[TARGET AUDIENCE API] ========== REQUEST SUCCESS ==========');

    // Step 5: Return success response
    return NextResponse.json({
      success: true,
      analysis_id: analysisRecord.id,
      analysis,
    });
  } catch (error) {
    console.error('[TARGET AUDIENCE API] ========== CRITICAL OUTER ERROR ==========');
    console.error('[TARGET AUDIENCE API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[TARGET AUDIENCE API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[TARGET AUDIENCE API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('[TARGET AUDIENCE API] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    console.error('[TARGET AUDIENCE API] ========================================');
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Beklenmeyen sistem hatası',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorDetails: JSON.stringify(error, Object.getOwnPropertyNames(error))
      },
      { status: 500 }
    );
  }
}
