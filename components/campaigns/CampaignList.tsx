'use client';

import React from 'react';
import { Campaign, AdSet, Ad } from '@/lib/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MetricsTable } from '@/components/campaigns/MetricsTable';

interface CampaignWithData extends Campaign {
  ad_sets: AdSetWithData[];
}

interface AdSetWithData extends AdSet {
  ads: AdWithMetrics[];
}

interface AdWithMetrics extends Ad {
  metrics: any | null;
}

interface CampaignListProps {
  campaigns: CampaignWithData[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  const [expandedCampaigns, setExpandedCampaigns] = React.useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = React.useState<Set<string>>(new Set());

  const toggleCampaign = (campaignId: string) => {
    setExpandedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const toggleAdSet = (adSetId: string) => {
    setExpandedAdSets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(adSetId)) {
        newSet.delete(adSetId);
      } else {
        newSet.add(adSetId);
      }
      return newSet;
    });
  };

  const getStatusBadgeClass = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'aktif') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'paused' || statusLower === 'duraklatıldı') {
      return 'bg-yellow-100 text-yellow-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  if (campaigns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Henüz kampanya bulunmuyor.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="divide-y divide-gray-200">
        {campaigns.map(campaign => (
          <div key={campaign.campaign_id}>
            {/* Campaign Row */}
            <div
              className="flex items-center p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => toggleCampaign(campaign.campaign_id)}
            >
              <button className="mr-3 text-gray-500 hover:text-gray-700">
                {expandedCampaigns.has(campaign.campaign_id) ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.campaign_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Kampanya • {campaign.ad_sets?.length || 0} Reklam Seti
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(campaign.status)}`}>
                    {campaign.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Expanded Campaign Content - Ad Sets */}
            {expandedCampaigns.has(campaign.campaign_id) && campaign.ad_sets && (
              <div className="bg-gray-50 border-t border-gray-200">
                {campaign.ad_sets.length === 0 ? (
                  <div className="p-4 pl-12 text-sm text-gray-500">
                    Bu kampanyada reklam seti bulunmuyor.
                  </div>
                ) : (
                  campaign.ad_sets.map(adSet => (
                    <div key={adSet.ad_set_id} className="border-b border-gray-200 last:border-b-0">
                      {/* Ad Set Row */}
                      <div
                        className="flex items-center p-4 pl-12 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleAdSet(adSet.ad_set_id);
                        }}
                      >
                        <button className="mr-3 text-gray-500 hover:text-gray-700">
                          {expandedAdSets.has(adSet.ad_set_id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-base font-medium text-gray-800">
                                {adSet.ad_set_name}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                Reklam Seti • {adSet.ads?.length || 0} Reklam
                                {adSet.budget && ` • Bütçe: ₺${adSet.budget.toLocaleString('tr-TR')}`}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(adSet.status)}`}>
                              {adSet.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Ad Set Content - Ads */}
                      {expandedAdSets.has(adSet.ad_set_id) && adSet.ads && (
                        <div className="bg-white">
                          {adSet.ads.length === 0 ? (
                            <div className="p-4 pl-20 text-sm text-gray-500">
                              Bu reklam setinde reklam bulunmuyor.
                            </div>
                          ) : (
                            adSet.ads.map(ad => (
                              <div key={ad.ad_id} className="border-t border-gray-100">
                                {/* Ad Row */}
                                <div className="p-4 pl-20">
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h5 className="text-sm font-medium text-gray-700">
                                        {ad.ad_name}
                                      </h5>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Reklam
                                      </p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(ad.status)}`}>
                                      {ad.status}
                                    </span>
                                  </div>

                                  {/* Metrics Table for this Ad */}
                                  {ad.metrics ? (
                                    <MetricsTable metrics={ad.metrics} />
                                  ) : (
                                    <div className="text-xs text-gray-500 italic">
                                      Bu reklam için henüz metrik verisi bulunmuyor.
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
