import { createClient } from '@/lib/supabase/server';
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportHistory from '@/components/reports/ReportHistory';

export default async function ReportsPage() {
  const supabase = createClient();
  
  // Fetch user's clients for the dropdown
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: clients } = await supabase
    .from('clients')
    .select('client_id, name')
    .eq('user_id', user?.id || '')
    .order('name');

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Raporlar</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report Generator */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Yeni Rapor Oluştur
          </h2>
          <ReportGenerator clients={clients || []} />
        </div>

        {/* Report History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rapor Geçmişi
          </h2>
          <ReportHistory />
        </div>
      </div>
    </div>
  );
}
