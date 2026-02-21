import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { invalidateUserCache, invalidateClientCache } from '@/lib/utils/cache';

// GET /api/clients/:id - Get single client
export async function GET(
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

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('client_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Unexpected error in GET /api/clients/:id:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/clients/:id - Update client
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
    const { name, industry, contact_email, contact_phone } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Müşteri adı zorunludur' },
        { status: 400 }
      );
    }

    // Validate email format if provided
    if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
      return NextResponse.json(
        { error: 'Geçerli bir e-posta adresi giriniz' },
        { status: 400 }
      );
    }

    // Check if client exists and belongs to user
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Update client
    const { data: client, error } = await supabase
      .from('clients')
      .update({
        name: name.trim(),
        industry: industry || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        updated_at: new Date().toISOString()
      })
      .eq('client_id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating client:', error);
      return NextResponse.json(
        { error: 'Müşteri güncellenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Invalidate caches
    invalidateUserCache(user.id);
    invalidateClientCache(params.id);

    return NextResponse.json({ client });
  } catch (error) {
    console.error('Unexpected error in PUT /api/clients/:id:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/:id - Delete client
export async function DELETE(
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

    // Check if client exists and belongs to user
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('client_id')
      .eq('client_id', params.id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingClient) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    // Delete client (cascade will handle associated campaigns)
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('client_id', params.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting client:', error);
      return NextResponse.json(
        { error: 'Müşteri silinirken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Invalidate caches
    invalidateUserCache(user.id);
    invalidateClientCache(params.id);

    return NextResponse.json({ 
      message: 'Müşteri başarıyla silindi',
      success: true 
    });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/clients/:id:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
