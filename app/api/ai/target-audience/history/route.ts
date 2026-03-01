import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      );
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 50;
    const offset = (page - 1) * limit;

    // Fetch user's analyses sorted by created_at DESC
    const { data: analyses, error: fetchError, count } = await supabase
      .from('target_audience_analyses')
      .select('id, industry, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchError) {
      console.error('Error fetching analysis history:', fetchError);
      return NextResponse.json(
        { error: 'Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      analyses: analyses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error in history endpoint:', error);
    return NextResponse.json(
      { error: 'Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
