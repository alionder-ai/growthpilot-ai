/**
 * Alert System
 * 
 * Handles alert generation and notification for critical system events
 */

import { createClient } from '@/lib/supabase/server';
import { captureException, captureMessage } from './sentry';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertCategory = 'meta_api' | 'gemini_api' | 'performance' | 'security' | 'system';

export interface Alert {
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

/**
 * Send alert to monitoring systems and create notification
 */
export async function sendAlert(alert: Alert) {
  const { severity, category, message, details } = alert;

  // Log to console
  const logLevel = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'log';
  console[logLevel](`[ALERT] ${category.toUpperCase()}: ${message}`, details);

  // Send to Sentry
  if (severity === 'critical') {
    captureException(new Error(message), { category, ...details });
  } else {
    captureMessage(message, severity === 'warning' ? 'warning' : 'info', { category, ...details });
  }

  // Create notification in database for critical and warning alerts
  if (severity === 'critical' || severity === 'warning') {
    await createSystemNotification(alert);
  }

  // In production, you would also send to:
  // - Email
  // - Slack
  // - PagerDuty
  // - SMS (for critical alerts)
}

/**
 * Create system notification in database
 */
async function createSystemNotification(alert: Alert) {
  try {
    const supabase = createClient();

    // Get all admin users (you would need to add an is_admin field to users table)
    // For now, we'll create a general system notification
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        message: `[${alert.severity.toUpperCase()}] ${alert.message}`,
        type: 'general',
        read_status: false
      });

    if (error) {
      console.error('Failed to create system notification:', error);
    }
  } catch (error) {
    console.error('Error creating system notification:', error);
  }
}

/**
 * Alert: Meta API sync failure
 */
export async function alertMetaAPISyncFailure(
  clientId: string,
  error: string,
  retryCount: number
) {
  await sendAlert({
    severity: retryCount >= 3 ? 'critical' : 'warning',
    category: 'meta_api',
    message: `Meta API senkronizasyonu başarısız: ${error}`,
    details: {
      clientId,
      error,
      retryCount,
      action: 'Meta hesabını yeniden bağlayın'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Meta API authentication failure
 */
export async function alertMetaAPIAuthFailure(userId: string, error: string) {
  await sendAlert({
    severity: 'critical',
    category: 'meta_api',
    message: 'Meta API kimlik doğrulama hatası',
    details: {
      userId,
      error,
      action: 'Kullanıcı Meta hesabını yeniden bağlamalı'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Gemini API error
 */
export async function alertGeminiAPIError(
  operation: string,
  error: string,
  retryCount: number
) {
  await sendAlert({
    severity: retryCount >= 3 ? 'critical' : 'warning',
    category: 'gemini_api',
    message: `Gemini API hatası: ${operation}`,
    details: {
      operation,
      error,
      retryCount,
      action: 'API anahtarını ve kotayı kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Gemini API quota exceeded
 */
export async function alertGeminiAPIQuotaExceeded() {
  await sendAlert({
    severity: 'critical',
    category: 'gemini_api',
    message: 'Gemini API kotası aşıldı',
    details: {
      action: 'API kotasını artırın veya kullanımı azaltın'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Performance degradation
 */
export async function alertPerformanceDegradation(
  metric: string,
  value: number,
  threshold: number
) {
  await sendAlert({
    severity: 'warning',
    category: 'performance',
    message: `Performans düşüşü tespit edildi: ${metric}`,
    details: {
      metric,
      value,
      threshold,
      unit: metric.includes('time') ? 'ms' : 'count',
      action: 'Sistem performansını kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: High error rate
 */
export async function alertHighErrorRate(
  errorCount: number,
  timeWindow: string,
  threshold: number
) {
  await sendAlert({
    severity: 'critical',
    category: 'system',
    message: 'Yüksek hata oranı tespit edildi',
    details: {
      errorCount,
      timeWindow,
      threshold,
      action: 'Hata loglarını inceleyin ve sorunu çözün'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Database connection failure
 */
export async function alertDatabaseConnectionFailure(error: string) {
  await sendAlert({
    severity: 'critical',
    category: 'system',
    message: 'Veritabanı bağlantı hatası',
    details: {
      error,
      action: 'Veritabanı bağlantısını kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Cron job failure
 */
export async function alertCronJobFailure(
  jobName: string,
  error: string,
  consecutiveFailures: number
) {
  await sendAlert({
    severity: consecutiveFailures >= 3 ? 'critical' : 'warning',
    category: 'system',
    message: `Cron job başarısız: ${jobName}`,
    details: {
      jobName,
      error,
      consecutiveFailures,
      action: 'Cron job loglarını kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Security event
 */
export async function alertSecurityEvent(
  eventType: string,
  userId: string,
  details: Record<string, any>
) {
  await sendAlert({
    severity: 'critical',
    category: 'security',
    message: `Güvenlik olayı: ${eventType}`,
    details: {
      eventType,
      userId,
      ...details,
      action: 'Güvenlik loglarını inceleyin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: RLS policy violation
 */
export async function alertRLSViolation(
  userId: string,
  table: string,
  operation: string
) {
  await sendAlert({
    severity: 'critical',
    category: 'security',
    message: 'RLS politika ihlali tespit edildi',
    details: {
      userId,
      table,
      operation,
      action: 'Kullanıcı erişimini kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Multiple failed login attempts
 */
export async function alertMultipleFailedLogins(
  email: string,
  attemptCount: number,
  ipAddress: string
) {
  await sendAlert({
    severity: 'warning',
    category: 'security',
    message: 'Çoklu başarısız giriş denemesi',
    details: {
      email,
      attemptCount,
      ipAddress,
      action: 'Hesabı geçici olarak kilitleyin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Cache performance degradation
 */
export async function alertCachePerformance(
  hitRate: number,
  threshold: number
) {
  await sendAlert({
    severity: 'warning',
    category: 'performance',
    message: 'Önbellek performansı düşük',
    details: {
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      threshold: `${(threshold * 100).toFixed(2)}%`,
      action: 'Önbellek yapılandırmasını kontrol edin'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Alert: Disk space low (if applicable)
 */
export async function alertDiskSpaceLow(
  usage: number,
  threshold: number
) {
  await sendAlert({
    severity: 'warning',
    category: 'system',
    message: 'Disk alanı azalıyor',
    details: {
      usage: `${usage}%`,
      threshold: `${threshold}%`,
      action: 'Disk alanını temizleyin veya artırın'
    },
    timestamp: new Date().toISOString()
  });
}

/**
 * Check and alert on system health
 */
export async function checkAndAlertSystemHealth() {
  try {
    const { performHealthCheck } = await import('./health-check');
    const health = await performHealthCheck();

    if (health.status === 'unhealthy') {
      await sendAlert({
        severity: 'critical',
        category: 'system',
        message: 'Sistem sağlıksız durumda',
        details: {
          checks: health.checks,
          action: 'Sistem durumunu acilen kontrol edin'
        },
        timestamp: new Date().toISOString()
      });
    } else if (health.status === 'degraded') {
      await sendAlert({
        severity: 'warning',
        category: 'system',
        message: 'Sistem performansı düşük',
        details: {
          checks: health.checks,
          action: 'Sistem durumunu kontrol edin'
        },
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to check system health:', error);
  }
}
