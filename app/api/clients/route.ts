import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Client } from '@/lib/types';
import cache, { CACHE_TTL, generateCacheKey, invalidateUserCache } from '@/lib/utils/cache';

// GET /api/clients - List all clients for authenticated user
export async function GET(request: NextRequest) {
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

    // Get search params for filtering
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Generate cache key
    const cacheKey = generateCacheKey('client-list', {
      userId: user.id,
      search: search || '',
      industry: industry || '',
      page,
      limit
    });

    // Check cache
    const cachedData = cache.get<any>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    // Build query
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    if (industry) {
      query = query.eq('industry', industry);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: clients, error, count } = await query;

    if (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { error: 'Müşteriler yüklenirken bir hata oluştu' },
        { status: 500 }
      );
    }

    const result = {
      clients: clients || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };

    // Cache the result
    cache.set(cacheKey, result, CACHE_TTL.CLIENT_LIST);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error in GET /api/clients:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create new client
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

    // Create client
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: name.trim(),
        industry: industry || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating client:', error);
      return NextResponse.json(
        { error: 'Müşteri oluşturulurken bir hata oluştu' },
        { status: 500 }
      );
    }

    // Invalidate user's client cache
    invalidateUserCache(user.id);

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/clients:', error);
    return NextResponse.json(
      { error: 'Beklenmeyen bir hata oluştu' },
      { status: 500 }
    );
  }
}
