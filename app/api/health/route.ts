import { NextResponse } from 'next';
import { performHealthCheck, getSystemMetrics } from '@/lib/monitoring/health-check';

// Force dynamic rendering - this endpoint needs runtime data
export const dynamic = 'force-dynamic';

/**
 * Health Check Endpoint
 * 
 * Returns system health status and metrics
 * Used by monitoring tools and load balancers
 */
export async function GET() {
  try {
    const health = await performHealthCheck();
    const metrics = getSystemMetrics();

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(
      {
        ...health,
        system: metrics
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 503 }
    );
  }
}

/**
 * Simple liveness probe
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}
