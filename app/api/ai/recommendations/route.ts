import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import cache, { CACHE_TTL, generateCacheKey } from '@/lib/utils/cache';

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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get('clientId');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Generate cache key
    const cacheKey = generateCacheKey('ai-recommendations', {
      userId: user.id,
      clientId: clientId || 'all',
      type: type || 'all',
      status: status || 'all',
      limit
    });

    // Check cache
    const cachedData = cache.get<any[]>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build query - Use LEFT JOIN instead of INNER JOIN to avoid RLS issues
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
    const { data: recommendations, error: fetchError } = await query;

    if (fetchError) {
      console.error('[RECOMMENDATIONS API] Error fetching recommendations:', fetchError);
      return NextResponse.json(
        { error: 'Öneriler alınırken hata oluştu', details: fetchError.message },
        { status: 500 }
      );
    }

    console.log('[RECOMMENDATIONS API] Found', recommendations?.length || 0, 'recommendations');

    // RLS policy already filters by user's clients, so we don't need additional filtering
    const result = recommendations || [];

    // Cache the result
    cache.set(cacheKey, result, CACHE_TTL.AI_RECOMMENDATIONS);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in recommendations fetch:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
