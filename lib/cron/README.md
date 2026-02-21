# Cron Jobs Configuration

## Overview

GrowthPilot AI uses Vercel Cron to schedule automated tasks. All cron jobs are configured in `vercel.json` and run on Vercel's infrastructure.

## Configured Cron Jobs

### 1. Meta API Sync (00:00 UTC)

**Endpoint**: `/api/meta/sync`  
**Schedule**: `0 0 * * *` (Daily at midnight UTC)  
**Purpose**: Synchronize campaign data from Meta Ads API

**What it does**:
- Fetches all active clients with Meta tokens
- Retrieves campaign, ad set, and ad data
- Updates metrics in database
- Creates notifications for sync failures

**Monitoring**:
- Check Vercel cron logs for execution status
- Review notifications table for sync errors
- Monitor Meta API rate limits

### 2. AI Recommendations Generation (01:00 UTC)

**Endpoint**: `/api/ai/cron/generate-action-plans`  
**Schedule**: `0 1 * * *` (Daily at 1:00 AM UTC)  
**Purpose**: Generate daily action plans for all clients

**What it does**:
- Fetches recent metrics for all clients
- Sends data to Gemini API for analysis
- Generates top 3 priority actions
- Stores recommendations in database
- Creates strategy cards based on metric thresholds

**Monitoring**:
- Check Gemini API usage and quotas
- Review AI_Recommendations table for new entries
- Monitor API response times

### 3. Notification Cleanup (02:00 UTC)

**Endpoint**: `/api/notifications/cleanup`  
**Schedule**: `0 2 * * *` (Daily at 2:00 AM UTC)  
**Purpose**: Delete old read notifications

**What it does**:
- Deletes read notifications older than 30 days
- Keeps database clean and performant
- Logs deletion count

**Monitoring**:
- Check deletion counts in logs
- Monitor notifications table size

## Cron Schedule Format

Vercel uses standard cron syntax:

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, 0 and 7 are Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

Examples:
- `0 0 * * *` - Daily at midnight
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

## Security

### Cron Secret (Recommended)

Add a `CRON_SECRET` environment variable to secure cron endpoints:

```bash
vercel env add CRON_SECRET
```

Each cron endpoint checks the authorization header:

```typescript
const authHeader = request.headers.get('authorization');
if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Testing Cron Jobs Locally

### Manual Trigger

```bash
# Meta sync
curl -X POST http://localhost:3000/api/meta/sync

# AI recommendations
curl -X POST http://localhost:3000/api/ai/cron/generate-action-plans

# Notification cleanup
curl -X POST http://localhost:3000/api/notifications/cleanup
```

### With Cron Secret

```bash
curl -X POST http://localhost:3000/api/meta/sync \
  -H "Authorization: Bearer your-cron-secret"
```

## Monitoring Cron Execution

### Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Navigate to "Cron Jobs" tab
3. View execution history, logs, and status

### Logs

```bash
# View recent logs
vercel logs --follow

# Filter by cron job
vercel logs --follow | grep "cron"
```

### Database Monitoring

Check execution results in database:

```sql
-- Check recent sync timestamps
SELECT client_id, last_synced_at 
FROM clients 
ORDER BY last_synced_at DESC;

-- Check AI recommendations created today
SELECT COUNT(*) 
FROM ai_recommendations 
WHERE created_at >= CURRENT_DATE;

-- Check notification cleanup
SELECT COUNT(*) 
FROM notifications 
WHERE read_status = true 
AND created_at < NOW() - INTERVAL '30 days';
```

## Error Handling

All cron jobs implement:
- Try-catch blocks for exception handling
- Detailed error logging
- Graceful failure responses
- User notifications for critical failures

### Common Issues

**Meta API Sync Failures**:
- Token expiration (60 days)
- Rate limit exceeded
- Network timeouts
- Solution: Check Meta tokens, implement retry logic

**Gemini API Failures**:
- Quota exceeded
- Invalid API key
- Token limit exceeded
- Solution: Monitor quotas, optimize prompts

**Database Connection Issues**:
- Connection pool exhausted
- Query timeouts
- RLS policy errors
- Solution: Optimize queries, increase pool size

## Scaling Considerations

### High Volume

For high-volume operations:
- Implement batch processing
- Add queue system (e.g., Vercel Queue)
- Use background jobs for long-running tasks
- Consider serverless functions with longer timeouts

### Rate Limiting

Respect external API limits:
- Meta API: 200 calls/hour per user
- Gemini API: Check quota limits
- Implement exponential backoff
- Queue requests during peak times

## Customization

### Adding New Cron Jobs

1. Create API route in `/app/api/`
2. Add cron configuration to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/your-endpoint",
      "schedule": "0 * * * *"
    }
  ]
}
```

3. Deploy to Vercel
4. Verify in Vercel dashboard

### Modifying Schedules

Edit `vercel.json` and redeploy:

```bash
vercel --prod
```

Changes take effect immediately after deployment.

## Best Practices

1. **Idempotency**: Ensure cron jobs can run multiple times safely
2. **Logging**: Log all executions with timestamps
3. **Monitoring**: Set up alerts for failures
4. **Timeouts**: Keep execution time under 10 seconds (Vercel limit)
5. **Error Handling**: Gracefully handle all errors
6. **Testing**: Test locally before deploying
7. **Documentation**: Document what each job does

## Troubleshooting

### Cron Job Not Running

- Check `vercel.json` syntax
- Verify deployment succeeded
- Check Vercel cron logs
- Ensure endpoint is accessible

### Execution Timeouts

- Optimize database queries
- Reduce API calls
- Implement pagination
- Consider background jobs

### High Error Rates

- Review error logs
- Check external API status
- Verify environment variables
- Test endpoints manually

## Resources

- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)
- [Cron Expression Generator](https://crontab.guru/)
- [Vercel Logs Documentation](https://vercel.com/docs/observability/runtime-logs)
