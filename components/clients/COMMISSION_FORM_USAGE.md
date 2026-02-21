# CommissionForm Component Usage

## Overview

The `CommissionForm` component provides a dialog-based form for creating and editing commission models for clients. It includes validation, Turkish localization, and proper error handling.

## Features

- Create new commission models
- Edit existing commission models
- Percentage input with validation (0-100)
- Radio button selection for calculation basis (Sales Revenue / Total Revenue)
- Turkish error messages and labels
- Input sanitization (allows only numbers and decimal points)
- Visual percentage indicator

## Props

```typescript
interface CommissionFormProps {
  open: boolean;                      // Controls dialog visibility
  onClose: () => void;                // Called when dialog closes
  onSuccess: () => void;              // Called after successful save
  clientId: string;                   // Client ID for new commission models
  clientName: string;                 // Client name for display
  commissionModel?: CommissionModel | null;  // Existing model for editing
}
```

## Usage Example

### In a Client Detail Page

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import CommissionForm from '@/components/clients/CommissionForm';
import { CommissionModel } from '@/lib/types';

export default function ClientDetailPage({ clientId, clientName }) {
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [commissionModel, setCommissionModel] = useState<CommissionModel | null>(null);

  // Fetch existing commission model
  useEffect(() => {
    async function fetchCommissionModel() {
      const response = await fetch(`/api/commission-models/client/${clientId}`);
      const data = await response.json();
      setCommissionModel(data.commissionModel);
    }
    fetchCommissionModel();
  }, [clientId]);

  const handleSuccess = () => {
    // Refresh commission model data
    fetchCommissionModel();
  };

  return (
    <div>
      <h1>{clientName}</h1>
      
      {/* Show commission info or create button */}
      {commissionModel ? (
        <div>
          <p>Komisyon: %{commissionModel.commission_percentage}</p>
          <p>Hesaplama: {commissionModel.calculation_basis === 'sales_revenue' ? 'Satış Geliri' : 'Toplam Gelir'}</p>
          <Button onClick={() => setShowCommissionForm(true)}>
            Komisyon Modelini Düzenle
          </Button>
        </div>
      ) : (
        <Button onClick={() => setShowCommissionForm(true)}>
          Komisyon Modeli Oluştur
        </Button>
      )}

      {/* Commission Form Dialog */}
      <CommissionForm
        open={showCommissionForm}
        onClose={() => setShowCommissionForm(false)}
        onSuccess={handleSuccess}
        clientId={clientId}
        clientName={clientName}
        commissionModel={commissionModel}
      />
    </div>
  );
}
```

### In ClientList Component

```tsx
import { useState } from 'react';
import CommissionForm from '@/components/clients/CommissionForm';

export default function ClientList() {
  const [selectedClient, setSelectedClient] = useState<{
    id: string;
    name: string;
    commissionModel?: CommissionModel;
  } | null>(null);

  const handleEditCommission = (client) => {
    setSelectedClient(client);
  };

  return (
    <div>
      {/* Client list with edit commission buttons */}
      {clients.map(client => (
        <div key={client.client_id}>
          <span>{client.name}</span>
          <Button onClick={() => handleEditCommission(client)}>
            Komisyon
          </Button>
        </div>
      ))}

      {/* Commission Form */}
      {selectedClient && (
        <CommissionForm
          open={!!selectedClient}
          onClose={() => setSelectedClient(null)}
          onSuccess={() => {
            // Refresh client list
            fetchClients();
            setSelectedClient(null);
          }}
          clientId={selectedClient.id}
          clientName={selectedClient.name}
          commissionModel={selectedClient.commissionModel}
        />
      )}
    </div>
  );
}
```

## Validation Rules

1. **Commission Percentage**:
   - Required field
   - Must be a valid number
   - Must be between 0 and 100 (inclusive)
   - Supports decimal values (e.g., 15.5)
   - Input sanitization removes non-numeric characters except decimal point

2. **Calculation Basis**:
   - Required field (defaults to 'sales_revenue')
   - Two options: 'sales_revenue' or 'total_revenue'

## Error Messages (Turkish)

- "Komisyon yüzdesi zorunludur" - Commission percentage is required
- "Geçerli bir sayı giriniz" - Enter a valid number
- "Komisyon yüzdesi 0 ile 100 arasında olmalıdır" - Commission percentage must be between 0 and 100

## API Integration

The component automatically calls the appropriate API endpoints:

- **Create**: `POST /api/commission-models`
- **Update**: `PUT /api/commission-models/:id`

Request body for create:
```json
{
  "client_id": "uuid",
  "commission_percentage": 15,
  "calculation_basis": "sales_revenue"
}
```

Request body for update:
```json
{
  "commission_percentage": 20,
  "calculation_basis": "total_revenue"
}
```

## Styling

The component uses:
- Shadcn/UI Dialog component for modal
- Shadcn/UI Input, Label, Button components
- Custom RadioGroup component for calculation basis selection
- TailwindCSS for styling
- Red color (#ef4444) for validation errors
- Gray color for helper text

## Accessibility

- Proper label associations with `htmlFor` attributes
- Required field indicators with red asterisks
- Descriptive helper text for each field
- Keyboard navigation support via RadioGroup
- Focus management in dialog

## Related Files

- **Utility**: `lib/utils/commission.ts` - Commission calculation functions
- **Types**: `lib/types/index.ts` - CommissionModel type definition
- **API Routes**: 
  - `app/api/commission-models/route.ts` - Create endpoint
  - `app/api/commission-models/[id]/route.ts` - Update endpoint
  - `app/api/commission-models/client/[clientId]/route.ts` - Get by client endpoint
