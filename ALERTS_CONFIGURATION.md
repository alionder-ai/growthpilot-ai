# Alerts Configuration Guide

## Overview

GrowthPilot AI implements a comprehensive alerting system to notify administrators of critical issues, performance degradation, and security events.

## Alert Severity Levels

### Critical
- **Response Time**: Immediate (< 5 minutes)
- **Notification Channels**: Email, Slack, SMS (optional)
- **Examples**:
  - System down
  - Database connection failure
  - Meta API authentication failure
  - High error rate (> 5%)
  - Security breach attempts

### Warning
- **Response Time**: Within 1 hour
- **Notification Channels**: Email, Slack
- **Examples**:
  - Performance degradation
  - API sync failures (< 3 retries)
  - Cache hit rate low
  - Cron job failures (< 3 consecutive)

### Info
- **Response Time**: Review during business hours
- **Notification Channels**: Dashboard notification
- **Examples**:
  - Successful deployments
  - Scheduled maintenance
  - System updates

## Alert Categories

### 1. Meta API Alerts

#### Meta API Sync Failure
**Trigger**: Meta API sync fails for a client
**Severity**: Warning (< 3 retries), Critical (≥ 3 retries)
**Action**: Check Meta token validity, verify API status

```typescript
import { alertMetaAPISyncFailure } from '@/lib/monitoring/alerts';

await alertMetaAPISyncFailure(clientId, error.message, retryCount);
```

#### Meta API Authentication Failure
**Trigger**: Meta OAuth token expired or invalid
**Severity**: Critical
**Action**: User must reconnect Meta account

```typescript
import { alertMetaAPIAuthFailure } from '@/lib/monitoring/alerts';

await alertMetaAPIAuthFailure(userId, error.message);
```

### 2. Gemini API Alerts

#### Gemini API Error
**Trigger**: Gemini API call fails
**Severity**: Warning (< 3 retries), Critical (≥ 3 retries)
**Action**: Check API key, verify quota

```typescript
import { alertGeminiAPIError } from '@/lib/monitoring/alerts';

await alertGeminiAPIError('action_plan_generation', error.message, retryCount);
```

#### Gemini API Quota Exceeded
**Trigger**: API quota limit reached
**Severity**: Critical
**Action**: Increase quota or reduce usage

```typescript
import { alertGeminiAPIQuotaExceeded } from '@/lib/monitoring/alerts';

await alertGeminiAPIQuotaExceeded();
```

### 3. Performance Alerts

#### Performance Degradation
**Trigger**: Response time > threshold
**Severity**: Warning
**Thresholds**:
- Dashboard load time: > 2 seconds
- API response time: > 500ms
- Database query time: > 1 second

```typescript
import { alertPerformanceDegradation } from '@/lib/monitoring/alerts';

await alertPerformanceDegradation('api_response_time', 2500, 500);
```

#### Cache Performance
**Trigger**: Cache hit rate < 50%
**Severity**: Warning
**Action**: Review cache configuration

```typescript
import { alertCachePerformance } from '@/lib/monitoring/alerts';

await alertCachePerformance(0.45, 0.50);
```

### 4. System Alerts

#### High Error Rate
**Trigger**: Error count > threshold in time window
**Severity**: Critical
**Threshold**: > 100 errors in 5 minutes

```typescript
import { alertHighErrorRate } from '@/lib/monitoring/alerts';

await alertHighErrorRate(150, '5 minutes', 100);
```

#### Database Connection Failure
**Trigger**: Database connection lost
**Severity**: Critical
**Action**: Check database status, verify credentials

```typescript
import { alertDatabaseConnectionFailure } from '@/lib/monitoring/alerts';

await alertDatabaseConnectionFailure(error.message);
```

#### Cron Job Failure
**Trigger**: Cron job execution fails
**Severity**: Warning (< 3 failures), Critical (≥ 3 failures)
**Action**: Check cron logs, verify configuration

```typescript
import { alertCronJobFailure } from '@/lib/monitoring/alerts';

await alertCronJobFailure('meta_sync', error.message, consecutiveFailures);
```

### 5. Security Alerts

#### Security Event
**Trigger**: Suspicious activity detected
**Severity**: Critical
**Examples**:
- Unauthorized access attempts
- RLS policy violations
- Multiple failed login attempts

```typescript
import { alertSecurityEvent } from '@/lib/monitoring/alerts';

await alertSecurityEvent('unauthorized_access', userId, { 
  resource: 'client_data',
  attemptedAction: 'read'
});
```

#### RLS Policy Violation
**Trigger**: User attempts to access data they don't own
**Severity**: Critical
**Action**: Review user permissions, check RLS policies

```typescript
import { alertRLSViolation } from '@/lib/monitoring/alerts';

await alertRLSViolation(userId, 'clients', 'SELECT');
```

#### Multiple Failed Login Attempts
**Trigger**: > 5 failed login attempts in 15 minutes
**Severity**: Warning
**Action**: Temporarily lock account, notify user

```typescript
import { alertMultipleFailedLogins } from '@/lib/monitoring/alerts';

await alertMultipleFailedLogins(email, attemptCount, ipAddress);
```

## Notification Channels

### 1. Email Notifications

**Setup**: Configure email service (e.g., SendGrid, AWS SES)

```typescript
// lib/notifications/email.ts
export async function sendEmailAlert(alert: Alert) {
  // Send email using your email service
  await emailService.send({
    to: process.env.ADMIN_EMAIL,
    subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
    body: formatAlertEmail(alert)
  });
}
```

### 2. Slack Notifications

**Setup**: Create Slack webhook

```bash
# Add to environment variables
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

```typescript
// lib/notifications/slack.ts
export async function sendSlackAlert(alert: Alert) {
  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `*[${alert.severity.toUpperCase()}]* ${alert.message}`,
      attachments: [{
        color: alert.severity === 'critical' ? 'danger' : 'warning',
        fields: Object.entries(alert.details || {}).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        }))
      }]
    })
  });
}
```

### 3. SMS Notifications (Critical Only)

**Setup**: Configure SMS service (e.g., Twilio)

```typescript
// lib/notifications/sms.ts
export async function sendSMSAlert(alert: Alert) {
  if (alert.severity !== 'critical') return;
  
  await twilioClient.messages.create({
    to: process.env.ADMIN_PHONE,
    from: process.env.TWILIO_PHONE,
    body: `[CRITICAL] ${alert.message}`
  });
}
```

## Alert Configuration

### Environment Variables

```bash
# Alert Configuration
ADMIN_EMAIL=admin@growthpilot.ai
ADMIN_PHONE=+905551234567
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Alert Thresholds
ALERT_ERROR_RATE_THRESHOLD=100
ALERT_RESPONSE_TIME_THRESHOLD=2000
ALERT_CACHE_HIT_RATE_THRESHOLD=0.5
```

### Alert Rules Configuration

Create `config/alerts.json`:

```json
{
  "rules": [
    {
      "name": "high_error_rate",
      "condition": "error_count > 100 in 5 minutes",
      "severity": "critical",
      "channels": ["email", "slack", "sms"]
    },
    {
      "name": "slow_api_response",
      "condition": "p95_response_time > 2000ms",
      "severity": "warning",
      "channels": ["email", "slack"]
    },
    {
      "name": "meta_api_failure",
      "condition": "meta_sync_failure_count > 3",
      "severity": "critical",
      "channels": ["email", "slack"]
    },
    {
      "name": "gemini_quota_exceeded",
      "condition": "gemini_api_quota_usage > 90%",
      "severity": "warning",
      "channels": ["email", "slack"]
    },
    {
      "name": "database_connection_failure",
      "condition": "database_connection_error",
      "severity": "critical",
      "channels": ["email", "slack", "sms"]
    }
  ]
}
```

## Testing Alerts

### Manual Alert Testing

```bash
# Test Meta API sync failure alert
curl -X POST http://localhost:3000/api/test/alerts/meta-sync-failure

# Test Gemini API error alert
curl -X POST http://localhost:3000/api/test/alerts/gemini-error

# Test performance degradation alert
curl -X POST http://localhost:3000/api/test/alerts/performance
```

### Alert Test Endpoint

Create `app/api/test/alerts/route.ts`:

```typescript
import { sendAlert } from '@/lib/monitoring/alerts';

export async function POST(request: Request) {
  const { type } = await request.json();
  
  const testAlerts = {
    meta_sync: {
      severity: 'critical' as const,
      category: 'meta_api' as const,
      message: 'Test: Meta API sync failure',
      details: { test: true },
      timestamp: new Date().toISOString()
    },
    // Add more test alerts...
  };
  
  await sendAlert(testAlerts[type]);
  
  return Response.json({ success: true });
}
```

## Alert Monitoring Dashboard

### Vercel Dashboard

1. Go to Vercel Dashboard → Your Project
2. Navigate to "Monitoring" tab
3. View real-time alerts and metrics

### Custom Dashboard (Optional)

Create monitoring dashboard using:
- Grafana for visualization
- Prometheus for metrics
- AlertManager for alert routing

## Alert Response Procedures

### Critical Alerts

1. **Acknowledge** alert within 5 minutes
2. **Investigate** root cause
3. **Mitigate** immediate impact
4. **Resolve** underlying issue
5. **Document** incident and resolution

### Warning Alerts

1. **Review** alert details
2. **Assess** impact and urgency
3. **Schedule** resolution
4. **Monitor** for escalation

## Alert Fatigue Prevention

### Best Practices

1. **Set appropriate thresholds**: Avoid too many false positives
2. **Group related alerts**: Combine similar alerts
3. **Use alert suppression**: Suppress duplicate alerts
4. **Implement alert escalation**: Escalate unacknowledged alerts
5. **Regular review**: Review and adjust alert rules monthly

### Alert Suppression

```typescript
// Suppress duplicate alerts within time window
const alertCache = new Map<string, number>();

export async function sendAlertWithSuppression(alert: Alert) {
  const key = `${alert.category}:${alert.message}`;
  const lastSent = alertCache.get(key);
  const now = Date.now();
  
  // Suppress if sent within last 15 minutes
  if (lastSent && now - lastSent < 15 * 60 * 1000) {
    return;
  }
  
  await sendAlert(alert);
  alertCache.set(key, now);
}
```

## Maintenance

### Weekly Tasks
- Review alert logs
- Check alert response times
- Verify notification channels

### Monthly Tasks
- Analyze alert patterns
- Adjust thresholds
- Update alert rules
- Review false positive rate

### Quarterly Tasks
- Audit alert configuration
- Update contact information
- Test all notification channels
- Review incident response procedures

## Resources

- [Vercel Monitoring Documentation](https://vercel.com/docs/observability)
- [Sentry Alerts Documentation](https://docs.sentry.io/product/alerts/)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
