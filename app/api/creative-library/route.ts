import { NextRequest, NextResponse } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/creative-library
 * Save generated creative content to library
 * 
 * Requirement: 10.7
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { industry, content_type, content_text } = body;

    // Validate required fields
    if (!industry || !content_type || !content_text) {
      return NextResponse.json(
        { error: 'Sektör, içerik tipi ve içerik metni zorunludur' },
        { status: 400 }
      );
    }

    // Validate content type
    const validContentTypes = ['ad_copy', 'video_script', 'voiceover'];
    if (!validContentTypes.includes(content_type)) {
      return NextResponse.json(
        { error: 'Geçersiz içerik tipi' },
        { status: 400 }
      );
    }

    // Insert into creative_library table
    const { data, error } = await supabase
      .from('creative_library')
      .insert({
        user_id: user.id,
        industry,
        content_type,
        content_text,
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'İçerik kaydedilirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Creative library save error:', error);
    return NextResponse.json(
      { error: 'İçerik kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/creative-library
 * Retrieve user's saved creative content
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const contentType = searchParams.get('content_type');

    // Build query
    let query = supabase
      .from('creative_library')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (industry) {
      query = query.eq('industry', industry);
    }
    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'İçerikler yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Creative library fetch error:', error);
    return NextResponse.json(
      { error: 'İçerikler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}
