'use client';

import { useEffect, useState } from 'react';

import { Client } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/clients');
      if (!response.ok) {
        throw new Error('Müşteriler yüklenemedi');
      }

      const data = await response.json();
      setClients(data.clients || []);
    } catch (err) {
      setClients([]);
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

  if (clients.length === 0) {
    return null;
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
