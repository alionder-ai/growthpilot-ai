'use client';

import { useState } from 'react';
import { Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import ClientList from '@/components/clients/ClientList';
import ClientForm from '@/components/clients/ClientForm';
import DeleteClientDialog from '@/components/clients/DeleteClientDialog';

export default function ClientsPage() {
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddClient = () => {
    setSelectedClient(null);
    setShowForm(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowForm(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setShowDeleteDialog(true);
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Müşteriler</h1>
          <p className="text-muted-foreground">
            Müşteri portföyünüzü yönetin
          </p>
        </div>
        <Button onClick={handleAddClient}>
          Yeni Müşteri Ekle
        </Button>
      </div>

      {/* Client List */}
      <ClientList
        onEdit={handleEditClient}
        onDelete={handleDeleteClient}
        refreshTrigger={refreshTrigger}
      />

      {/* Client Form Modal */}
      <ClientForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        client={selectedClient}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteClientDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={handleDeleteSuccess}
        client={selectedClient}
      />
    </div>
  );
}
