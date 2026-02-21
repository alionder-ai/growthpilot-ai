import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/ai/recommendations/:id
 * 
 * Updates the status of an AI recommendation (action plan or strategy card)
 * 
 * Request body:
 * - status: 'active' | 'completed' | 'dismissed'
 * 
 * Returns:
 * - Updated recommendation object
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recommendationId = params.id;

    // Parse request body
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Durum bilgisi gerekli' },
        { status: 400 }
      );
    }

    // Validate status value
    if (!['active', 'completed', 'dismissed'].includes(status)) {
      return NextResponse.json(
        { error: 'Geçersiz durum değeri' },
        { status: 400 }
      );
    }

    // Verify recommendation exists and belongs to user's client
    const { data: recommendation, error: fetchError } = await supabase
      .from('ai_recommendations')
      .select(`
        recommendation_id,
        client_id,
        clients!inner(user_id)
      `)
      .eq('recommendation_id', recommendationId)
      .single();

    if (fetchError || !recommendation) {
      return NextResponse.json(
        { error: 'Öneri bulunamadı' },
        { status: 404 }
      );
    }

    // Check if recommendation belongs to user's client
    const clientData = recommendation.clients as any;
    if (clientData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bu öneriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Update recommendation status
    const { data: updatedRecommendation, error: updateError } = await supabase
      .from('ai_recommendations')
      .update({ status })
      .eq('recommendation_id', recommendationId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating recommendation:', updateError);
      return NextResponse.json(
        { error: 'Öneri güncellenirken hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendation: updatedRecommendation,
    });
  } catch (error) {
    console.error('Error in recommendation update:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/recommendations/:id
 * 
 * Retrieves a specific AI recommendation
 * 
 * Returns:
 * - Recommendation object with client info
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recommendationId = params.id;

    // Fetch recommendation with client info
    const { data: recommendation, error: fetchError } = await supabase
      .from('ai_recommendations')
      .select(`
        *,
        clients!inner(
          client_id,
          name,
          user_id
        )
      `)
      .eq('recommendation_id', recommendationId)
      .single();

    if (fetchError || !recommendation) {
      return NextResponse.json(
        { error: 'Öneri bulunamadı' },
        { status: 404 }
      );
    }

    // Check if recommendation belongs to user's client
    const clientData = recommendation.clients as any;
    if (clientData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bu öneriye erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    return NextResponse.json(recommendation);
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
