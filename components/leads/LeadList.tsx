'use client';

import React from 'react';
const { useState, useEffect } = React;
import { formatDate } from '@/lib/utils/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Lead {
  lead_id: string;
  ad_id: string;
  lead_source: string | null;
  contact_info: any;
  converted_status: boolean;
  created_at: string;
  updated_at: string;
  ads?: {
    ad_name: string;
    ad_sets?: {
      ad_set_name: string;
      campaigns?: {
        campaign_name: string;
        clients?: {
          name: string;
        };
      };
    };
  };
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LeadListProps {
  campaignId?: string;
  adId?: string;
  refreshTrigger?: number;
}

export default function LeadList({ campaignId, adId, refreshTrigger }: LeadListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [filterConverted, setFilterConverted] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (campaignId) {
        params.append('campaign_id', campaignId);
      }

      if (adId) {
        params.append('ad_id', adId);
      }

      if (filterConverted !== null) {
        params.append('converted_status', filterConverted);
      }

      const response = await fetch(`/api/leads?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Potansiyel müşteriler yüklenemedi');
      }

      const data = await response.json();
      setLeads(data.leads);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [pagination.page, campaignId, adId, filterConverted, refreshTrigger]);

  const handleToggleConversion = async (leadId: string, currentStatus: boolean) => {
    try {
      setUpdatingLeadId(leadId);

      const response = await fetch(`/api/leads/${leadId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          converted_status: !currentStatus
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Durum güncellenemedi');
      }

      // Update local state
      setLeads(prevLeads =>
        prevLeads.map(lead =>
          lead.lead_id === leadId
            ? { ...lead, converted_status: !currentStatus }
            : lead
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handlePreviousPage = () => {
    if (pagination.page > 1) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  if (loading && leads.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Yükleniyor...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">{error}</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <Label>Filtrele:</Label>
          <Button
            variant={filterConverted === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterConverted(null)}
          >
            Tümü
          </Button>
          <Button
            variant={filterConverted === 'true' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterConverted('true')}
          >
            Dönüşüm Sağladı
          </Button>
          <Button
            variant={filterConverted === 'false' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterConverted('false')}
          >
            Dönüşüm Sağlamadı
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {leads.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Henüz potansiyel müşteri bulunmuyor
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Kampanya</TableHead>
                  <TableHead>Reklam</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead className="text-center">Dönüşüm Durumu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.lead_id}>
                    <TableCell className="font-medium">
                      {lead.ads?.ad_sets?.campaigns?.clients?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {lead.ads?.ad_sets?.campaigns?.campaign_name || '-'}
                    </TableCell>
                    <TableCell>{lead.ads?.ad_name || '-'}</TableCell>
                    <TableCell>{lead.lead_source || '-'}</TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Label
                          htmlFor={`lead-${lead.lead_id}`}
                          className={`text-sm ${
                            lead.converted_status
                              ? 'text-green-600 font-medium'
                              : 'text-gray-500'
                          }`}
                        >
                          {lead.converted_status ? 'Dönüşüm Sağladı' : 'Dönüşüm Sağlamadı'}
                        </Label>
                        <Switch
                          id={`lead-${lead.lead_id}`}
                          checked={lead.converted_status}
                          onCheckedChange={() =>
                            handleToggleConversion(lead.lead_id, lead.converted_status)
                          }
                          disabled={updatingLeadId === lead.lead_id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Toplam {pagination.total} potansiyel müşteri - Sayfa {pagination.page} / {pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={pagination.page === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
