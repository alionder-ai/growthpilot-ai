import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const clientId = resolvedParams.id;

    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', clientId)
      .eq('user_id', user.id)
      .single();

    if (error) {
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

    return NextResponse.json({ client });
  } catch (error) {
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
