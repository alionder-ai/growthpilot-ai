import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    // Fetch specific analysis with RLS enforcement
    const { data: analysis, error: fetchError } = await supabase
      .from('target_audience_analyses')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Analiz bulunamadı' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching analysis:', fetchError);
      return NextResponse.json(
        { error: 'Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.' },
        { status: 500 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analiz bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Unexpected error in analysis retrieval:', error);
    return NextResponse.json(
      { error: 'Veriler alınırken bir hata oluştu. Lütfen tekrar deneyin.' },
      { status: 500 }
    );
  }
}
