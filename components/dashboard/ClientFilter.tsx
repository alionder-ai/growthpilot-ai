'use client';

import { useEffect, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Client } from '@/lib/types';

interface ClientFilterProps {
  selectedClientId: string | null;
  onClientChange: (clientId: string | null) => void;
}

export function ClientFilter({
  selectedClientId,
  onClientChange,
}: ClientFilterProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Müşteriler yüklenemedi');
      }

      const data = await response.json();
      setClients(data);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError('Müşteriler yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (value: string) => {
    if (value === 'all') {
      onClientChange(null);
    } else {
      onClientChange(value);
    }
  };

  if (error) {
    return (
      <div className="text-sm text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="client-filter" className="text-sm font-medium text-gray-700">
        Müşteri Filtrele:
      </label>
      <Select
        value={selectedClientId || 'all'}
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger id="client-filter" className="w-64">
          <SelectValue placeholder="Müşteri seçin" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm Müşteriler</SelectItem>
          {clients.map((client) => (
            <SelectItem key={client.client_id} value={client.client_id}>
              {client.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && (
        <span className="text-sm text-gray-500">Yükleniyor...</span>
      )}
    </div>
  );
}
