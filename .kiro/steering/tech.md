# Technology Stack

## Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Components**: Shadcn/UI component library
- **Charts**: Recharts for data visualization

## Backend
- **API**: Next.js API Routes and Server Actions
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)

## External APIs
- **Meta Graph API**: Campaign data synchronization
- **Google Gemini API**: AI-powered recommendations and content generation (using gemini-1.5-flash model)

## Deployment
- **Platform**: Vercel (recommended)
- **Cron Jobs**: Vercel Cron for scheduled tasks
  - 00:00 UTC: Meta API sync
  - 01:00 UTC: AI recommendations generation
  - 02:00 UTC: Notification cleanup

## Security
- Row-Level Security (RLS) policies on all database tables
- AES-256 encryption for Meta API access tokens
- Bcrypt password hashing (10+ salt rounds)
- HTTPS enforcement

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler check

# Database
npx supabase migration new <name>  # Create new migration
npx supabase db push               # Apply migrations
npx supabase db reset              # Reset database
```

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `GEMINI_API_KEY`
- `ENCRYPTION_KEY` (for AES-256 token encryption)

## Performance Considerations
- Cache dashboard metrics (5 min TTL)
- Pagination for lists > 50 records
- Async report generation to avoid UI blocking
- Database indexes on date, client_id, user_id fields
- Connection pooling for concurrent requests
