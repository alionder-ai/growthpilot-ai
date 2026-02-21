# Monitoring and Observability Setup

## Overview

GrowthPilot AI implements comprehensive monitoring and observability to ensure system reliability, performance, and quick issue resolution.

## Monitoring Stack

### 1. Vercel Analytics (Built-in)

Automatically enabled for all Vercel deployments.

**Metrics Tracked**:
- Page views and unique visitors
- Page load times (Web Vitals)
- Geographic distribution
- Device and browser analytics
- Conversion tracking

**Access**: Vercel Dashboard → Analytics tab

### 2. Sentry Error Tracking (Optional)

Real-time error tracking and performance monitoring.

**Setup**:

```bash
# Install Sentry SDK
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

**Configuration**:

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV
});
```

**Environment Variables**:
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

### 3. Custom Analytics

Built-in analytics module in `lib/monitoring/analytics.ts`.

**Usage**:

```typescript
import { trackEvent, trackAPICall, trackError } from '@/lib/monitoring/analytics';

// Track user events
trackEvent('client_created', { clientId: '123' });

// Track API performance
trackAPICall('/api/clients', 'GET', 250, 200);

// Track errors
trackError(new Error('Something went wrong'), { context: 'client-form' });
```

### 4. Health Check Endpoint

**Endpoint**: `/api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2026-02-21T10:00:00Z",
  "checks": {
    "database": {
      "status": "ok",
      "message": "Veritabanı bağlantısı başarılı",
      "responseTime": 45
    },
    "metaAPI": {
      "status": "ok",
      "message": "Meta API yapılandırması mevcut"
    },
    "geminiAPI": {
      "status": "ok",
      "message": "Gemini API yapılandırması mevcut"
    },
    "cache": {
      "status": "ok",
      "message": "Önbellek sistemi aktif"
    }
  },
  "metrics": {
    "uptime": 86400,
    "responseTime": 120
  },
  "system": {
    "uptime": 86400,
    "memory": {...},
    "nodeVersion": "v18.17.0",
    "platform": "linux"
  }
}
```

**Status Codes**:
- `200`: Healthy or degraded
- `503`: Unhealthy

## Key Metrics to Monitor

### Application Metrics

1. **Response Times**
   - Dashboard load time: < 2 seconds
   - API response time: < 500ms
   - Database query time: < 100ms

2. **Error Rates**
   - Target: < 1% error rate
   - Alert threshold: > 5% error rate

3. **Availability**
   - Target: 99.9% uptime
   - Alert on downtime > 5 minutes

### Business Metrics

1. **User Activity**
   - Daily active users
   - Client creation rate
   - Report generation count
   - AI recommendation usage

2. **External API Usage**
   - Meta API sync success rate
   - Gemini API call count
   - API quota utilization

3. **Performance**
   - Cache hit rate (target: > 80%)
   - Database connection pool usage
   - Cron job execution time

## Alert Configuration

### Critical Alerts (Immediate Action)

1. **System Down**
   - Health check fails for > 5 minutes
   - Database connection lost
   - Multiple API routes returning 500 errors

2. **External API Failures**
   - Meta API authentication failures
   - Gemini API quota exceeded
   - Repeated API timeouts

3. **Security Issues**
   - Multiple failed login attempts
   - RLS policy violations
   - Unauthorized access attempts

### Warning Alerts (Monitor)

1. **Performance Degradation**
   - Response times > 2 seconds
   - Database queries > 1 second
   - Cache hit rate < 50%

2. **Resource Usage**
   - Memory usage > 80%
   - Database connections > 80% of pool
   - API quota > 80% utilized

3. **Business Metrics**
   - Sync failures for multiple clients
   - AI recommendation generation failures
   - Report generation timeouts

## Setting Up Alerts

### Vercel Alerts

1. Go to Vercel Dashboard → Settings → Notifications
2. Configure alerts for:
   - Build failures
   - Deployment errors
   - Function errors
   - Performance issues

### Sentry Alerts

1. Go to Sentry → Alerts → Create Alert Rule
2. Configure alerts for:
   - Error rate threshold
   - New error types
   - Performance degradation
   - Custom metrics

**Example Alert Rules**:

```yaml
# High Error Rate
- name: "High Error Rate"
  conditions:
    - error_count > 100 in 5 minutes
  actions:
    - send_email
    - send_slack

# Slow API Response
- name: "Slow API Response"
  conditions:
    - p95_response_time > 2000ms
  actions:
    - send_email

# Meta API Failure
- name: "Meta API Sync Failure"
  conditions:
    - error_message contains "Meta API"
    - count > 5 in 1 hour
  actions:
    - send_email
    - send_slack
```

### Custom Monitoring Script

Create `scripts/monitor.ts`:

```typescript
import { performHealthCheck } from '@/lib/monitoring/health-check';

async function monitor() {
  const health = await performHealthCheck();
  
  if (health.status === 'unhealthy') {
    console.error('ALERT: System unhealthy', health);
    // Send alert via email/Slack
  }
  
  if (health.status === 'degraded') {
    console.warn('WARNING: System degraded', health);
  }
}

// Run every 5 minutes
setInterval(monitor, 5 * 60 * 1000);
```

## Logging Best Practices

### Structured Logging

```typescript
// Good: Structured logging
console.log({
  level: 'info',
  message: 'Client created',
  clientId: '123',
  userId: '456',
  timestamp: new Date().toISOString()
});

// Bad: Unstructured logging
console.log('Client 123 created by user 456');
```

### Log Levels

- **ERROR**: System errors, exceptions, failures
- **WARN**: Degraded performance, potential issues
- **INFO**: Important business events
- **DEBUG**: Detailed diagnostic information

### What to Log

**Always Log**:
- Authentication attempts (success/failure)
- API errors and exceptions
- External API calls (Meta, Gemini)
- Cron job executions
- Database errors
- Security events

**Never Log**:
- Passwords or tokens
- Personal identifiable information (PII)
- Credit card numbers
- API keys or secrets

## Dashboard Monitoring

### Vercel Dashboard

Monitor in real-time:
- Deployment status
- Function invocations
- Error rates
- Performance metrics
- Cron job executions

### Supabase Dashboard

Monitor database:
- Query performance
- Connection pool usage
- Table sizes
- RLS policy violations
- Authentication events

### Custom Dashboard (Optional)

Create monitoring dashboard using:
- Grafana for metrics visualization
- Prometheus for metrics collection
- Loki for log aggregation

## Performance Monitoring

### Web Vitals

Monitor Core Web Vitals in `app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### API Performance

Track API performance in middleware:

```typescript
import { trackAPICall } from '@/lib/monitoring/analytics';

export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const response = await NextResponse.next();
  const duration = Date.now() - startTime;
  
  trackAPICall(
    request.nextUrl.pathname,
    request.method,
    duration,
    response.status
  );
  
  return response;
}
```

## Troubleshooting Guide

### High Error Rate

1. Check Sentry for error details
2. Review recent deployments
3. Check external API status
4. Verify database connectivity
5. Review recent code changes

### Slow Performance

1. Check database query performance
2. Review cache hit rates
3. Check external API response times
4. Monitor memory usage
5. Review recent traffic patterns

### Cron Job Failures

1. Check Vercel cron logs
2. Verify environment variables
3. Test endpoints manually
4. Check external API status
5. Review error logs

## Maintenance Tasks

### Daily
- Review error logs
- Check cron job execution
- Monitor API usage

### Weekly
- Review performance metrics
- Check alert configurations
- Update monitoring dashboards

### Monthly
- Analyze trends and patterns
- Optimize slow queries
- Review and update alert thresholds
- Clean up old logs

## Resources

- [Vercel Analytics Documentation](https://vercel.com/docs/analytics)
- [Sentry Documentation](https://docs.sentry.io/)
- [Next.js Monitoring](https://nextjs.org/docs/app/building-your-application/optimizing/analytics)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
