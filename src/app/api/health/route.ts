import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health checks
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        database: 'online',
        cache: 'online',
        backend: 'online'
      }
    };

    // You can add more sophisticated health checks here:
    // - Database connectivity
    // - Redis cache status
    // - Backend server health
    // - External service dependencies

    return NextResponse.json(checks, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 503 }
    );
  }
}