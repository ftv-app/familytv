import { NextResponse } from 'next/server';
import { getSyncClockResponse, getClockHealth } from '@/lib/sync-clock';

export async function GET() {
  const health = getClockHealth();
  if (health === 'INITIALIZING') {
    return NextResponse.json({ error: 'Clock not initialized' }, { status: 503 });
  }
  return NextResponse.json(getSyncClockResponse(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
