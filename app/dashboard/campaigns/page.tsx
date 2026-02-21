import { SyncButton } from '@/components/campaigns/SyncButton';
import { SyncStatus } from '@/components/campaigns/SyncStatus';
import { CampaignListWrapper } from '@/components/campaigns/CampaignListWrapper';
import { createClient } from '@/lib/supabase/server';

export default async function CampaignsPage() {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get last sync time from most recent campaign
  let lastSyncedAt: string | null = null;
  
  if (user) {
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('last_synced_at')
      .not('last_synced_at', 'is', null)
      .order('last_synced_at', { ascending: false })
      .limit(1);
    
    if (campaigns && campaigns.length > 0) {
      lastSyncedAt = campaigns[0].last_synced_at;
    }
  }

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Kampanyalar</h1>
          <SyncStatus lastSyncedAt={lastSyncedAt} />
        </div>
        <SyncButton />
      </div>
      
      <CampaignListWrapper />
    </div>
  );
}
