# Project Structure

## Directory Organization

```
/
├── app/                          # Next.js 14 App Router
│   ├── (auth)/                   # Authentication routes
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── overview/
│   │   ├── clients/
│   │   ├── campaigns/
│   │   ├── action-plan/
│   │   ├── strategy-cards/
│   │   ├── reports/
│   │   ├── creative-generator/
│   │   └── leads/
│   ├── api/                      # API routes
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── campaigns/
│   │   ├── meta/
│   │   ├── ai/
│   │   ├── reports/
│   │   ├── leads/
│   │   └── notifications/
│   └── layout.tsx                # Root layout
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── clients/                  # Client management
│   ├── campaigns/                # Campaign views
│   ├── ai/                       # AI features (action plans, strategy cards)
│   ├── reports/                  # Report generation
│   ├── creative/                 # Creative generator
│   ├── leads/                    # Lead management
│   └── ui/                       # Shadcn/UI components
├── lib/                          # Utility functions and clients
│   ├── supabase/                 # Supabase client and helpers
│   ├── meta/                     # Meta API client
│   ├── gemini/                   # Gemini API client
│   ├── utils/                    # General utilities
│   └── types/                    # TypeScript type definitions
├── hooks/                        # Custom React hooks
├── middleware.ts                 # Next.js middleware (auth protection)
├── supabase/                     # Database migrations and types
│   └── migrations/
└── public/                       # Static assets
```

## Key Architectural Patterns

### Data Flow
1. User interacts with React components
2. Components call API routes or Server Actions
3. API routes interact with Supabase database or external APIs
4. RLS policies enforce data isolation at database level

### Authentication Flow
- Supabase Auth handles authentication
- Middleware protects dashboard routes
- RLS policies restrict database access to authenticated user's data

### External API Integration
- Meta API: OAuth flow stores encrypted tokens, daily sync via cron
- Gemini API: Prompt templates in `/lib/gemini/prompts.ts`
- Retry logic with exponential backoff for both APIs

### Component Organization
- Page components in `/app` directory (App Router)
- Reusable UI components in `/components`
- Shadcn/UI components in `/components/ui`
- Business logic in `/lib` utilities

### Database Schema
All tables use UUID primary keys and include RLS policies:
- Users, Clients, Commission_Models
- Campaigns, Ad_Sets, Ads, Meta_Metrics
- Leads, AI_Recommendations, Creative_Library
- Reports, Notifications, Meta_Tokens

Foreign keys cascade on delete to maintain referential integrity.

## Naming Conventions

- **Files**: kebab-case (e.g., `client-list.tsx`)
- **Components**: PascalCase (e.g., `ClientList`)
- **Functions**: camelCase (e.g., `calculateCommission`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (e.g., `ClientData`, `MetricsResponse`)

## Testing Structure

```
/__tests__/
├── unit/                         # Unit tests
│   ├── auth/
│   ├── clients/
│   ├── campaigns/
│   └── utils/
├── integration/                  # Integration tests
│   ├── api/
│   └── flows/
└── property/                     # Property-based tests
    └── properties.test.ts        # All 48 correctness properties
```

Property-based tests use `fast-check` library with minimum 100 iterations per property.
