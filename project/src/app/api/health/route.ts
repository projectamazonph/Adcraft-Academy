/**
 * AdCraft: Health Check Endpoint
 *
 * Enhanced health check for load balancer probes, uptime monitoring,
 * and operational debugging. Returns app version, uptime, memory
 * usage, and database connectivity status.
 *
 * GET /api/health — returns 200 if healthy, 503 if database is down.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Track server start time for uptime calculation
const SERVER_START_TIME = Date.now();

// Read version from package.json at build time
const VERSION = process.env.npm_package_version || '0.1.0';

export async function GET() {
  const startTime = Date.now();

  // Database connectivity check
  let dbStatus: string;
  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const responseTimeMs = Date.now() - startTime;
  const uptimeSeconds = Math.floor((Date.now() - SERVER_START_TIME) / 1000);

  // Memory usage (Node.js process)
  const memUsage = process.memoryUsage();
  const memory = {
    rssMb: Math.round(memUsage.rss / 1024 / 1024),
    heapUsedMb: Math.round(memUsage.heapUsed / 1024 / 1024),
    heapTotalMb: Math.round(memUsage.heapTotal / 1024 / 1024),
    externalMb: Math.round(memUsage.external / 1024 / 1024),
  };

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: VERSION,
      uptimeSeconds,
      responseTimeMs,
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        database: dbStatus,
      },
      memory,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
