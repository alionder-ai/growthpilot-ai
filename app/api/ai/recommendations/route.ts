import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/ai/recommendations
 * 
 * Retrieves AI recommendations with optional filters
 * 
 * Query parameters:
 * - clientId (optional): Filter by client ID
 * - type (optional): Filter by recommendation type ('action_plan' | 'strategy_card')
 * - status (optional): Filter by status ('active' | 'completed' | 'dismissed')
 * - limit (optional): Limit number of results (default: 10)
 * 
 * Returns:
 * - Array of recommendations with client info
 */
export async function GET(request: NextRequest) {
  console.log('[RECOMMENDATIONS API] ========== REQUEST START ==========');
  
  try {
    console.log('[RECOMMENDATIONS API] Step 1: Creating Supabase client...');
    const supabase = await createClient();
    console.log('[RECOMMENDATIONS API] ✓ Supabase client created');

    console.log('[RECOMMENDATIONS API] Step 2: Getting authenticated user...');
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[RECOMMENDATIONS API] ✗ Auth error:', authError);
      return NextResponse.json(
        { error: 'Kimlik doğrulama hatası', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.error('[RECOMMENDATIONS API] ✗ No user found');
      return NextResponse.json(
        { error: 'Oturum bulunamadı' },
        { status: 401 }
      );
    }

    console.log('[RECOMMENDATIONS API] ✓ User authenticated:', user.id);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    console.log('[RECOMMENDATIONS API] Step 3: Query params:', { clientId, type, status, limit });

    // Build query
    console.log('[RECOMMENDATIONS API] Step 4: Building query...');
    let query = supabase
      .from('ai_recommendations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    if (type) {
      query = query.eq('recommendation_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    // Execute query
    console.log('[RECOMMENDATIONS API] Step 5: Executing query...');
    const { data: recommendations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[RECOMMENDATIONS API] ✗ Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Veritabanı sorgusu başarısız', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('[RECOMMENDATIONS API] ✓ Query successful, found', recommendations?.length || 0, 'recommendations');

    const result = recommendations || [];
    
    console.log('[RECOMMENDATIONS API] ========== REQUEST END (SUCCESS) ==========');
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('[RECOMMENDATIONS API] ========== CRITICAL ERROR ==========');
    console.error('[RECOMMENDATIONS API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[RECOMMENDATIONS API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[RECOMMENDATIONS API] Stack trace:', error instanceof Error ? error.stack : 'N/A');
    console.error('[RECOMMENDATIONS API] ========================================');
    
    return NextResponse.json(
      { 
        error: 'Sunucu hatası', 
        details: error instanceof Error ? error.message : 'Bilinmeyen hata',
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    );
  }
}
