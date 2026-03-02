'use client';

/**
 * Campaign Selector Component
 * 
 * Allows users to select a campaign for AI Media Buyer analysis.
 * Displays campaign name, status, and budget.
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  status: string;
  budget?: number;
}

interface CampaignSelectorProps {
  campaigns: Campaign[];
  selectedCampaignId: string | null;
  onSelect: (campaignId: string) => void;
  disabled?: boolean;
}

export function CampaignSelector({
  campaigns,
  selectedCampaignId,
  onSelect,
  disabled = false,
}: CampaignSelectorProps) {
  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Kampanya Seçin</h3>
          <p className="text-sm text-gray-600 mb-4">
            Analiz etmek istediğiniz kampanyayı seçin
          </p>
        </div>

        <Select
          value={selectedCampaignId || ''}
          onValueChange={onSelect}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Kampanya seçin..." />
          </SelectTrigger>
          <SelectContent>
            {campaigns.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">
                Aktif kampanya bulunamadı
              </div>
            ) : (
              campaigns.map((campaign) => (
                <SelectItem key={campaign.campaign_id} value={campaign.campaign_id}>
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{campaign.campaign_name}</span>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`text-xs px-2 py-1 rounded ${
                        campaign.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status === 'ACTIVE' ? 'Aktif' : campaign.status}
                      </span>
                      {campaign.budget && (
                        <span className="text-xs text-gray-500">
                          ₺{campaign.budget.toLocaleString('tr-TR')}
                        </span>
                      )}
                    </div>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {selectedCampaignId && (
          <div className="text-sm text-gray-600">
            <p>✓ Kampanya seçildi. Analiz butonuna tıklayın.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
