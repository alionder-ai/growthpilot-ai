# GrowthPilot AI - Deployment Guide

## Prerequisites

- Vercel account
- Supabase project
- Meta Developer App
- Google Gemini API key
- Sentry account (optional, for error tracking)

## Step 1: Vercel Project Setup

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Link your project:
```bash
vercel link
```

## Step 2: Environment Variables Configuration

Set up environment variables in Vercel dashboard or via CLI:

```bash
# Supabase
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Meta API
vercel env add META_APP_ID
vercel env add META_APP_SECRET
vercel env add META_REDIRECT_URI

# Gemini API
vercel env add GEMINI_API_KEY

# Security
vercel env add ENCRYPTION_KEY
vercel env add NEXTAUTH_SECRET

# Monitoring (optional)
vercel env add SENTRY_DSN
vercel env add SENTRY_AUTH_TOKEN
vercel env add SENTRY_ORG
vercel env add SENTRY_PROJECT

# App URL
vercel env add NEXT_PUBLIC_APP_URL
```

### Generating Secure Keys

```bash
# Generate ENCRYPTION_KEY (32 characters)
openssl rand -base64 32

# Generate NEXTAUTH_SECRET
openssl rand -base64 32
```

## Step 3: Supabase Configuration

1. Create Supabase project at https://supabase.com
2. Run database migrations:
```bash
npx supabase db push
```

3. Enable Row Level Security on all tables
4. Configure authentication providers (Email, Google OAuth)

## Step 4: Meta Developer App Setup

1. Create Meta App at https://developers.facebook.com
2. Add "Marketing API" product
3. Configure OAuth redirect URI: `https://your-domain.com/api/meta/callback`
4. Request permissions: `ads_read`, `ads_management`
5. Copy App ID and App Secret to environment variables

## Step 5: Google Gemini API Setup

1. Get API key from https://ai.google.dev
2. Enable Gemini API
3. Set usage limits and quotas
4. Add API key to environment variables

## Step 6: Deploy to Vercel

### Production Deployment

```bash
vercel --prod
```

### Preview Deployment

```bash
vercel
```

## Step 7: Cron Jobs Verification

Cron jobs are automatically configured via `vercel.json`:

- **Meta Sync**: Daily at 00:00 UTC (`/api/meta/sync`)
- **AI Recommendations**: Daily at 01:00 UTC (`/api/ai/cron/generate-action-plans`)
- **Notification Cleanup**: Daily at 02:00 UTC (`/api/notifications/cleanup`)

Verify cron jobs in Vercel dashboard under "Cron Jobs" tab.

### Testing Cron Jobs Locally

```bash
# Test Meta sync
curl -X POST http://localhost:3000/api/meta/sync

# Test AI recommendations
curl -X POST http://localhost:3000/api/ai/cron/generate-action-plans

# Test notification cleanup
curl -X POST http://localhost:3000/api/notifications/cleanup
```

## Step 8: Domain Configuration

1. Add custom domain in Vercel dashboard
2. Configure DNS records
3. Enable automatic HTTPS
4. Update `NEXT_PUBLIC_APP_URL` and `META_REDIRECT_URI`

## Step 9: Monitoring Setup

### Vercel Analytics (Automatic)

Vercel Analytics is automatically enabled for all deployments. View metrics in Vercel dashboard.

### Sentry Error Tracking (Optional)

1. Create Sentry project at https://sentry.io
2. Install Sentry SDK:
```bash
npm install @sentry/nextjs
```

3. Initialize Sentry:
```bash
npx @sentry/wizard@latest -i nextjs
```

4. Configure environment variables (see Step 2)

### Performance Monitoring

Monitor these key metrics in Vercel dashboard:
- Page load times (target: < 2 seconds)
- API response times
- Build times
- Error rates
- Cache hit rates

## Step 10: Post-Deployment Verification

### Health Checks

1. **Authentication**: Test login/logout flow
2. **Meta API**: Connect Meta account and trigger sync
3. **Gemini API**: Generate action plan or strategy card
4. **Database**: Verify RLS policies are active
5. **Cron Jobs**: Check execution logs in Vercel dashboard

### Security Verification

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] RLS policies active on all tables
- [ ] Meta tokens encrypted in database
- [ ] Security headers configured (see `vercel.json`)

### Performance Verification

- [ ] Dashboard loads in < 2 seconds
- [ ] API routes respond in < 500ms
- [ ] Database queries use indexes
- [ ] Cache is working (5 min TTL)

## Troubleshooting

### Build Failures

```bash
# Check build logs
vercel logs

# Test build locally
npm run build
```

### Cron Job Failures

- Check Vercel cron logs in dashboard
- Verify API routes are accessible
- Check environment variables are set
- Review error logs in Sentry

### Database Connection Issues

- Verify Supabase URL and keys
- Check connection pooling settings
- Review RLS policy errors in Supabase logs

### Meta API Issues

- Verify OAuth redirect URI matches
- Check token expiration (60 days)
- Review Meta API rate limits
- Ensure permissions are granted

### Gemini API Issues

- Verify API key is valid
- Check quota limits
- Review token limits in prompts
- Monitor API response times

## Rollback Procedure

```bash
# List deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]
```

## Monitoring Alerts

Configure alerts in Vercel dashboard for:
- Build failures
- High error rates (> 1%)
- Slow response times (> 2s)
- Cron job failures

Configure alerts in Sentry for:
- Meta API authentication failures
- Gemini API errors
- Database connection errors
- Unhandled exceptions

## Maintenance

### Regular Tasks

- Monitor error rates weekly
- Review performance metrics monthly
- Update dependencies quarterly
- Rotate encryption keys annually
- Review and optimize database queries

### Scaling Considerations

- Enable Vercel Pro for higher limits
- Upgrade Supabase plan for more connections
- Implement Redis cache for high traffic
- Consider CDN for static assets

## Support

- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Meta API Documentation: https://developers.facebook.com/docs/marketing-apis
- Gemini API Documentation: https://ai.google.dev/docs
