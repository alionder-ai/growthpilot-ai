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
  try {
    const supabase = await createClient();

    console.log('[RECOMMENDATIONS API] Starting request');

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[RECOMMENDATIONS API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    console.log('[RECOMMENDATIONS API] User authenticated:', user.id);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    console.log('[RECOMMENDATIONS API] Query params:', { clientId, type, status, limit });

    // Build query
    let query = supabase
      .from('ai_recommendations')
      .select(`
        recommendation_id,
        client_id,
        recommendation_type,
        content,
        priority,
        status,
        created_at
      `)
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
    console.log('[RECOMMENDATIONS API] Executing query...');
    const { data: recommendations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[RECOMMENDATIONS API] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Öneriler alınırken hata oluştu', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('[RECOMMENDATIONS API] Found', recommendations?.length || 0, 'recommendations');

    // RLS policy already filters by user's clients
    const result = recommendations || [];

    return NextResponse.json(result);
  } catch (error) {
    console.error('[RECOMMENDATIONS API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
