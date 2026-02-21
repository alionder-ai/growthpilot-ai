import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/commission-models/client/:clientId - Get commission model by client ID
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', params.clientId)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      );
    }

    // Get commission model for the client
    const { data: commissionModel, error } = await supabase
      .from('commission_models')
      .select('*')
      .eq('client_id', params.clientId)
      .single();

    if (error) {
      // If no commission model exists, return null instead of error
      if (error.code === 'PGRST116') {
        return NextResponse.json({ commissionModel: null });
      }
      
      console.error('Error fetching commission model:', error);
      return NextResponse.json(
        { error: 'Komisyon modeli yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ commissionModel });
  } catch (error) {
    console.error('Unexpected error in GET /api/commission-models/client/:clientId:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
