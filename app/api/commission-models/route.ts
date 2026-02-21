import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/commission-models - Create commission model
export async function POST(request: NextRequest) {
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

    // Parse request body
    const body = await request.json();
    const { client_id, commission_percentage, calculation_basis } = body;

    // Validate required fields
    if (!client_id) {
      return NextResponse.json(
        { error: 'Müşteri ID zorunludur' },
        { status: 400 }
      );
    }

    if (commission_percentage === undefined || commission_percentage === null) {
      return NextResponse.json(
        { error: 'Komisyon yüzdesi zorunludur' },
        { status: 400 }
      );
    }

    // Validate commission percentage range (0-100)
    if (commission_percentage < 0 || commission_percentage > 100) {
      return NextResponse.json(
        { error: 'Komisyon yüzdesi 0 ile 100 arasında olmalıdır' },
        { status: 400 }
      );
    }

    // Validate calculation basis
    if (!calculation_basis || !['sales_revenue', 'total_revenue'].includes(calculation_basis)) {
      return NextResponse.json(
        { error: 'Geçerli bir hesaplama temeli seçiniz (sales_revenue veya total_revenue)' },
        { status: 400 }
      );
    }

    // Verify client belongs to user
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', client_id)
      .eq('user_id', user.id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı veya erişim yetkiniz yok' },
        { status: 404 }
      );
    }

    // Check if commission model already exists for this client
    const { data: existingModel } = await supabase
      .from('commission_models')
      .select('model_id')
      .eq('client_id', client_id)
      .single();

    if (existingModel) {
      return NextResponse.json(
        { error: 'Bu müşteri için zaten bir komisyon modeli mevcut. Güncellemek için PUT metodunu kullanın.' },
        { status: 409 }
      );
    }

    // Create commission model
    const { data: commissionModel, error } = await supabase
      .from('commission_models')
      .insert({
        client_id,
        commission_percentage,
        calculation_basis
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating commission model:', error);
      return NextResponse.json(
        { error: 'Komisyon modeli oluşturulurken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ commissionModel }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/commission-models:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
