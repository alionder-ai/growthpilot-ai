import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[CLIENT_API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    console.log('[CLIENT_API] Fetching client:', params.id, 'for user:', user.id);

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[CLIENT_API] SUPABASE FETCH HATASI:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        clientId: params.id,
        userId: user.id
      });
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Müşteri bulunamadı' },
          { status: 404 }
        );
      }
      throw error;
    }

    console.log('[CLIENT_API] Client found:', client?.name);
    return NextResponse.json({ client });
  } catch (error) {
    console.error('[CLIENT_API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Müşteri bilgileri alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
