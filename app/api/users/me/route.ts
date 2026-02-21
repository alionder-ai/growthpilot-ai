/**
 * User Data Management API
 * 
 * Handles user data operations including GDPR-compliant data deletion.
 * Validates Requirements: 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logAccountDeleted, getIpAddress, getUserAgent } from '@/lib/security/audit-logger';

/**
 * GET /api/users/me
 * Get current user information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama başarısız' },
        { status: 401 }
      );
    }
    
    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Kullanıcı bilgileri alınamadı' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: userData?.created_at,
        updated_at: userData?.updated_at,
      }
    });
  } catch (error) {
    console.error('Error in GET /api/users/me:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me
 * Delete user account and all associated data (GDPR compliance)
 * 
 * This endpoint permanently deletes:
 * - User account
 * - All clients
 * - All campaigns, ad sets, ads, and metrics
 * - All AI recommendations
 * - All reports
 * - All leads
 * - All creative library content
 * - All notifications
 * - All Meta tokens
 * 
 * Cascade delete is handled by database foreign key constraints.
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama başarısız' },
        { status: 401 }
      );
    }

    // Extract request metadata for audit logging
    const ipAddress = getIpAddress(request.headers);
    const userAgent = getUserAgent(request.headers);
    
    // Log account deletion before deleting
    await logAccountDeleted(user.id, user.email || 'unknown', ipAddress, userAgent);
    
    // Optional: Require password confirmation for extra security
    // const { password } = await request.json();
    // Verify password before deletion
    
    // Step 1: Delete user data from application tables
    // Due to ON DELETE CASCADE, deleting from users table will cascade to all related tables
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('Error deleting user data:', deleteError);
      return NextResponse.json(
        { error: 'Kullanıcı verileri silinemedi' },
        { status: 500 }
      );
    }
    
    // Step 2: Delete user from Supabase Auth
    // This requires service role key
    const supabaseAdmin = createServerClient();
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );
    
    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError);
      // User data is already deleted, but auth account remains
      // This is acceptable - user can't login anymore since data is gone
      return NextResponse.json(
        { 
          message: 'Kullanıcı verileri silindi',
          warning: 'Kimlik doğrulama hesabı silinemedi'
        },
        { status: 200 }
      );
    }
    
    // Success - all data deleted
    return NextResponse.json({
      message: 'Hesabınız ve tüm verileriniz kalıcı olarak silindi',
      deleted_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in DELETE /api/users/me:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Update user information
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama başarısız' },
        { status: 401 }
      );
    }
    
    // Get update data from request
    const body = await request.json();
    const { email } = body;
    
    // Update email in Supabase Auth if provided
    if (email && email !== user.email) {
      const { error: updateError } = await supabase.auth.updateUser({
        email: email,
      });
      
      if (updateError) {
        console.error('Error updating email:', updateError);
        return NextResponse.json(
          { error: 'E-posta güncellenemedi' },
          { status: 400 }
        );
      }
    }
    
    // Update users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (userError) {
      console.error('Error updating user data:', userError);
      return NextResponse.json(
        { error: 'Kullanıcı bilgileri güncellenemedi' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Kullanıcı bilgileri güncellendi',
      user: userData,
    });
  } catch (error) {
    console.error('Error in PATCH /api/users/me:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
