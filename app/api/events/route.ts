import { NextResponse } from 'next/server';
import { getScoredEvents } from '@/lib/events';

export async function GET() {
  const events = await getScoredEvents();
  return NextResponse.json({ events });
}
