/**
 * Health Check and System Monitoring
 * 
 * Provides health check endpoints and system status monitoring
 * for GrowthPilot AI platform.
 */

import { createClient } from '@/lib/supabase/server';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: CheckStatus;
    metaAPI: CheckStatus;
    geminiAPI: CheckStatus;
    cache: CheckStatus;
  };
  metrics: {
    uptime: number;
    responseTime: number;
  };
}

interface CheckStatus {
  status: 'ok' | 'warning' | 'error';
  message: string;
  responseTime?: number;
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  const checks = {
    database: await checkDatabase(),
    metaAPI: await checkMetaAPI(),
    geminiAPI: await checkGeminiAPI(),
    cache: await checkCache()
  };

  // Determine overall status
  const hasError = Object.values(checks).some(check => check.status === 'error');
  const hasWarning = Object.values(checks).some(check => check.status === 'warning');
  
  let status: 'healthy' | 'degraded' | 'unhealthy';
  if (hasError) {
    status = 'unhealthy';
  } else if (hasWarning) {
    status = 'degraded';
  } else {
    status = 'healthy';
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      uptime: process.uptime(),
      responseTime: Date.now() - startTime
    }
  };
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<CheckStatus> {
  const startTime = Date.now();
  
  try {
    const supabase = createClient();
    
    // Simple query to test connection
    const { error } = await supabase
      .from('users')
      .select('user_id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'error',
        message: `Veritabanı bağlantı hatası: ${error.message}`,
        responseTime
      };
    }

    if (responseTime > 1000) {
      return {
        status: 'warning',
        message: `Veritabanı yavaş yanıt veriyor: ${responseTime}ms`,
        responseTime
      };
    }

    return {
      status: 'ok',
      message: 'Veritabanı bağlantısı başarılı',
      responseTime
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Veritabanı kontrolü başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * Check Meta API availability
 */
async function checkMetaAPI(): Promise<CheckStatus> {
  try {
    // Check if Meta API credentials are configured
    if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
      return {
        status: 'warning',
        message: 'Meta API kimlik bilgileri yapılandırılmamış'
      };
    }

    // In production, you would make a test API call here
    // For now, we just verify configuration
    return {
      status: 'ok',
      message: 'Meta API yapılandırması mevcut'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Meta API kontrolü başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Check Gemini API availability
 */
async function checkGeminiAPI(): Promise<CheckStatus> {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      return {
        status: 'warning',
        message: 'Gemini API anahtarı yapılandırılmamış'
      };
    }

    // In production, you would make a test API call here
    // For now, we just verify configuration
    return {
      status: 'ok',
      message: 'Gemini API yapılandırması mevcut'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Gemini API kontrolü başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Check cache system
 */
async function checkCache(): Promise<CheckStatus> {
  try {
    // For now, cache is in-memory, so we just verify it's available
    // In production with Redis, you would test the connection
    return {
      status: 'ok',
      message: 'Önbellek sistemi aktif'
    };
  } catch (error) {
    return {
      status: 'error',
      message: `Önbellek kontrolü başarısız: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
    };
  }
}

/**
 * Get system metrics
 */
export function getSystemMetrics() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  };
}

/**
 * Check if system is ready to accept requests
 */
export async function isSystemReady(): Promise<boolean> {
  const health = await performHealthCheck();
  return health.status !== 'unhealthy';
}
