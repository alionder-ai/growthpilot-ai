# Report Generation Module

## Overview

The report generation module allows users to create customizable performance reports for their clients in both WhatsApp text format and PDF format.

## Features

- **Multiple Report Types**: Weekly and monthly reports
- **Customizable Metrics**: Select which metrics to include
- **Dual Format Support**: WhatsApp text and PDF formats
- **Turkish Locale**: All formatting uses Turkish standards (TRY currency, DD.MM.YYYY dates)
- **Report History**: View and manage previously generated reports
- **Async Processing**: Reports generated within 5 seconds with timeout protection

## Components

### ReportGenerator
Main component for creating new reports.

**Props:**
- `clients`: Array of client objects with `client_id` and `name`

**Features:**
- Client selection dropdown
- Report type selector (weekly/monthly)
- Date range picker with auto-population
- Format selector (WhatsApp/PDF)
- Metrics checkboxes for customization
- Real-time validation
- Loading state during generation
- Copy to clipboard for WhatsApp reports

### ReportHistory
Component for viewing and managing past reports.

**Features:**
- List of all generated reports
- Download functionality for PDF reports
- Delete functionality with confirmation
- Formatted dates in Turkish locale
- Loading and error states

## API Routes

### POST /api/reports/generate
Generate a new report.

**Request Body:**
```json
{
  "clientId": "uuid",
  "reportType": "weekly" | "monthly",
  "periodStart": "YYYY-MM-DD",
  "periodEnd": "YYYY-MM-DD",
  "selectedMetrics": ["totalSpend", "totalRevenue", ...],
  "format": "whatsapp" | "pdf"
}
```

**Response (WhatsApp):**
```json
{
  "success": true,
  "format": "whatsapp",
  "content": "formatted text report",
  "metrics": { ... }
}
```

**Response (PDF):**
```json
{
  "success": true,
  "report": { ... },
  "metrics": { ... },
  "fileUrl": "/path/to/pdf"
}
```

### GET /api/reports
List all reports for the authenticated user.

**Query Parameters:**
- `clientId` (optional): Filter by client
- `limit` (optional): Number of records (default: 50)
- `offset` (optional): Pagination offset (default: 0)

### GET /api/reports/:id/download
Download a specific report.

**Response:**
```json
{
  "success": true,
  "fileUrl": "/path/to/file",
  "report": { ... }
}
```

### DELETE /api/reports/:id/download
Delete a specific report.

## Utilities

### lib/utils/report-formatters.ts
Functions for generating WhatsApp formatted reports.

**Functions:**
- `generateWhatsAppReport()`: Generate standard report with all metrics
- `generateCustomWhatsAppReport()`: Generate report with selected metrics only

### lib/utils/pdf-generator.ts
Functions for generating PDF reports.

**Functions:**
- `generatePDFReport()`: Generate PDF with charts and tables
- `savePDFToFile()`: Save PDF to storage (needs implementation)
- `pdfBase64ToBlob()`: Convert base64 to downloadable blob

## Available Metrics

### Core Metrics (always recommended)
- **totalSpend**: Total ad spend
- **totalRevenue**: Commission revenue
- **roas**: Return on ad spend
- **leadCount**: Number of leads
- **costPerLead**: Cost per lead

### Detailed Metrics (optional)
- **impressions**: Ad impressions
- **clicks**: Ad clicks
- **ctr**: Click-through rate
- **cpc**: Cost per click
- **conversions**: Total conversions
- **purchases**: Purchase events

## Turkish Formatting

All reports use Turkish locale formatting:
- Currency: ₺1.234,56
- Dates: DD.MM.YYYY
- Numbers: 1.234,56
- Percentages: %12,5

## Installation Requirements

The PDF generation feature requires the jsPDF library:

```bash
npm install jspdf
```

## Storage Implementation

The current implementation includes placeholder functions for file storage. To complete the implementation:

1. **Supabase Storage** (recommended):
```typescript
const { data, error } = await supabase.storage
  .from('reports')
  .upload(fileUrl, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: false
  });
```

2. **AWS S3**:
```typescript
const s3 = new AWS.S3();
await s3.putObject({
  Bucket: 'your-bucket',
  Key: fileUrl,
  Body: pdfBuffer,
  ContentType: 'application/pdf'
}).promise();
```

## Performance Considerations

- Reports are generated asynchronously with a 5-second timeout
- Database queries are optimized with proper indexes
- Large date ranges may take longer to process
- Consider implementing caching for frequently requested reports

## Error Handling

The module handles various error scenarios:
- Authentication failures
- Missing or invalid parameters
- Client not found
- Timeout (> 5 seconds)
- Database errors
- File storage errors

All errors are returned in Turkish with user-friendly messages.

## Usage Example

```typescript
// In a page component
import ReportGenerator from '@/components/reports/ReportGenerator';
import ReportHistory from '@/components/reports/ReportHistory';

export default async function ReportsPage() {
  const clients = await fetchClients();
  
  return (
    <div>
      <ReportGenerator clients={clients} />
      <ReportHistory />
    </div>
  );
}
```

## Future Enhancements

- Email delivery of reports
- Scheduled report generation
- Custom report templates
- Chart visualizations in PDF
- Multi-client comparison reports
- Export to Excel format
