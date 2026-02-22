'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils/locale';

interface ClientListProps {
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  refreshTrigger?: number;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function ClientList({ onEdit, onDelete, refreshTrigger }: ClientListProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      if (industryFilter) {
        params.append('industry', industryFilter);
      }

      const response = await fetch(`/api/clients?${params.toString()}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Müşteriler yüklenemedi');
      }

      const data = await response.json();
      setClients(data.clients);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, refreshTrigger]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchClients();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
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

  if (loading && clients.length === 0) {
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
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Müşteri adı ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div className="w-48">
            <Input
              type="text"
              placeholder="Sektör filtrele..."
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handleSearch}>Ara</Button>
        </div>
      </Card>

      <Card>
        {clients.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            Henüz müşteri bulunmuyor
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Müşteri Adı</TableHead>
                  <TableHead>Sektör</TableHead>
                  <TableHead>İletişim E-posta</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead>Meta Ads</TableHead>
                  <TableHead>Oluşturulma Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.client_id}>
                    <TableCell className="font-medium">
                      <Link 
                        href={`/dashboard/clients/${client.client_id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {client.name}
                      </Link>
                    </TableCell>
                    <TableCell>{client.industry || '-'}</TableCell>
                    <TableCell>{client.contact_email || '-'}</TableCell>
                    <TableCell>{client.contact_phone || '-'}</TableCell>
                    <TableCell>
                      {client.meta_connected ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                          Bağlı
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
                          Bağlı Değil
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(client.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/clients/${client.client_id}`}>
                          <Button variant="outline" size="sm">
                            Detay
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(client)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(client)}
                        >
                          Sil
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t p-4">
                <div className="text-sm text-muted-foreground">
                  Toplam {pagination.total} müşteri - Sayfa {pagination.page} / {pagination.totalPages}
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
