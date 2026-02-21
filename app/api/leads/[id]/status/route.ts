import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PUT /api/leads/:id/status - Update lead conversion status
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

    const leadId = params.id;

    // Parse request body
    const body = await request.json();
    const { converted_status } = body;

    // Validate converted_status
    if (typeof converted_status !== 'boolean') {
      return NextResponse.json(
        { error: 'Dönüşüm durumu boolean olmalıdır' },
        { status: 400 }
      );
    }

    // First, verify the lead belongs to the authenticated user
    // This is enforced by RLS, but we check explicitly for better error messages
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select(`
        lead_id,
        ads!inner (
          ad_sets!inner (
            campaigns!inner (
              clients!inner (
                user_id
              )
            )
          )
        )
      `)
      .eq('lead_id', leadId)
      .single();

    if (fetchError || !existingLead) {
      return NextResponse.json(
        { error: 'Potansiyel müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Update lead status
    const { data: lead, error } = await supabase
      .from('leads')
      .update({
        converted_status,
        updated_at: new Date().toISOString()
      })
      .eq('lead_id', leadId)
      .select()
      .single();

    if (error) {
      console.error('Error updating lead status:', error);
      return NextResponse.json(
        { error: 'Potansiyel müşteri durumu güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Unexpected error in PUT /api/leads/:id/status:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
