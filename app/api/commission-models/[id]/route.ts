import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/commission-models/:id - Update commission model
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Parse request body
    const body = await request.json();
    const { commission_percentage, calculation_basis } = body;

    // Validate commission percentage if provided
    if (commission_percentage !== undefined && commission_percentage !== null) {
      if (commission_percentage < 0 || commission_percentage > 100) {
        return NextResponse.json(
          { error: 'Komisyon yüzdesi 0 ile 100 arasında olmalıdır' },
          { status: 400 }
        );
      }
    }

    // Validate calculation basis if provided
    if (calculation_basis && !['sales_revenue', 'total_revenue'].includes(calculation_basis)) {
      return NextResponse.json(
        { error: 'Geçerli bir hesaplama temeli seçiniz (sales_revenue veya total_revenue)' },
        { status: 400 }
      );
    }

    // Check if commission model exists and user has access
    const { data: existingModel, error: checkError } = await supabase
      .from('commission_models')
      .select('model_id, client_id, clients!inner(user_id)')
      .eq('model_id', params.id)
      .single();

    if (checkError || !existingModel) {
      return NextResponse.json(
        { error: 'Komisyon modeli bulunamadı' },
        { status: 404 }
      );
    }

    // Verify user owns the client
    const clientData = existingModel.clients as any;
    if (clientData.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Bu komisyon modeline erişim yetkiniz yok' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {};
    if (commission_percentage !== undefined && commission_percentage !== null) {
      updateData.commission_percentage = commission_percentage;
    }
    if (calculation_basis) {
      updateData.calculation_basis = calculation_basis;
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Güncellenecek alan belirtilmedi' },
        { status: 400 }
      );
    }

    // Update commission model
    const { data: commissionModel, error } = await supabase
      .from('commission_models')
      .update(updateData)
      .eq('model_id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating commission model:', error);
      return NextResponse.json(
        { error: 'Komisyon modeli güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ commissionModel });
  } catch (error) {
    console.error('Unexpected error in PUT /api/commission-models/:id:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
