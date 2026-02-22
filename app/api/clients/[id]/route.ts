import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    console.log('[CLIENT_API] Starting request for client ID:', clientId);

    const supabase = await createClient();
    console.log('[CLIENT_API] Supabase client created');

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[CLIENT_API] Auth error:', authError);
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    console.log('[CLIENT_API] Fetching client:', clientId, 'for user:', user.id);

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('[CLIENT_API] SUPABASE FETCH HATASI:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        clientId: clientId,
        userId: user.id
      });
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Müşteri bulunamadı' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { 
          error: 'Veritabanı hatası',
          message: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    console.log('[CLIENT_API] Client found:', client?.name);
    return NextResponse.json({ client });
  } catch (error) {
    console.error('[CLIENT_API] Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen API hatası';
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
