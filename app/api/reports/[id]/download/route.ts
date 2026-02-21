import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/reports/:id/download
 * Download a specific report
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    const reportId = params.id;

    // Fetch report and verify ownership
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        clients!inner(
          client_id,
          name,
          user_id
        )
      `)
      .eq('report_id', reportId)
      .eq('clients.user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Rapor bulunamadı' },
        { status: 404 }
      );
    }

    // Check if file_url exists
    if (!report.file_url) {
      return NextResponse.json(
        { error: 'Rapor dosyası bulunamadı' },
        { status: 404 }
      );
    }

    // In a real implementation, this would:
    // 1. Fetch the file from Supabase Storage or S3
    // 2. Return the file as a download response
    
    // For now, return the file URL
    // The frontend can use this URL to download or display the file
    return NextResponse.json({
      success: true,
      fileUrl: report.file_url,
      report: {
        report_id: report.report_id,
        client_name: report.clients.name,
        report_type: report.report_type,
        period_start: report.period_start,
        period_end: report.period_end,
        created_at: report.created_at
      }
    });

  } catch (error) {
    console.error('Error downloading report:', error);
    return NextResponse.json(
      { error: 'Rapor indirilirken hata oluştu' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/:id/download
 * Delete a specific report
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Kimlik doğrulama gerekli' },
        { status: 401 }
      );
    }

    const reportId = params.id;

    // Verify ownership before deletion
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select(`
        *,
        clients!inner(
          user_id
        )
      `)
      .eq('report_id', reportId)
      .eq('clients.user_id', user.id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: 'Rapor bulunamadı' },
        { status: 404 }
      );
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('report_id', reportId);

    if (deleteError) {
      console.error('Error deleting report:', deleteError);
      return NextResponse.json(
        { error: 'Rapor silinirken hata oluştu' },
        { status: 500 }
      );
    }

    // TODO: Also delete the file from storage if it exists
    // if (report.file_url) {
    //   await deleteFileFromStorage(report.file_url);
    // }

    return NextResponse.json({
      success: true,
      message: 'Rapor başarıyla silindi'
    });

  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}
