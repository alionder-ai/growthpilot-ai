# Report Module Installation

## Required Dependencies

The report generation module requires the jsPDF library for PDF generation:

```bash
npm install jspdf
```

Or if using yarn:

```bash
yarn add jspdf
```

Or if using pnpm:

```bash
pnpm add jspdf
```

## TypeScript Types

If using TypeScript, you may also want to install the type definitions:

```bash
npm install --save-dev @types/jspdf
```

## Verification

After installation, verify the module works by:

1. Starting the development server:
```bash
npm run dev
```

2. Navigate to `/dashboard/reports`

3. Try generating a WhatsApp format report (doesn't require jsPDF)

4. Try generating a PDF format report (requires jsPDF)

## Storage Configuration

The PDF files need to be stored somewhere. You have two options:

### Option 1: Supabase Storage (Recommended)

1. Create a storage bucket in Supabase:
```sql
-- In Supabase SQL Editor
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false);
```

2. Set up RLS policies:
```sql
-- Allow authenticated users to upload their own reports
create policy "Users can upload their own reports"
on storage.objects for insert
to authenticated
with check (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own reports
create policy "Users can read their own reports"
on storage.objects for select
to authenticated
using (bucket_id = 'reports' and auth.uid()::text = (storage.foldername(name))[1]);
```

3. Update `lib/utils/pdf-generator.ts` to implement Supabase storage

### Option 2: AWS S3

1. Install AWS SDK:
```bash
npm install @aws-sdk/client-s3
```

2. Configure AWS credentials in environment variables

3. Update `lib/utils/pdf-generator.ts` to implement S3 storage

## Environment Variables

No additional environment variables are required for basic functionality. If using AWS S3, add:

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_region
AWS_S3_BUCKET=your_bucket_name
```

## Testing

Run the test suite to verify everything works:

```bash
npm run test
```

## Troubleshooting

### "Cannot find module 'jspdf'"

Solution: Install jsPDF as shown above

### PDF generation fails

Solution: Check browser console for errors. jsPDF may have issues with certain fonts or characters.

### Reports not saving to database

Solution: Check Supabase connection and RLS policies. Verify the `reports` table exists.

### File storage not working

Solution: Implement the storage solution (Supabase or S3) as described above. The current implementation has placeholder functions.
