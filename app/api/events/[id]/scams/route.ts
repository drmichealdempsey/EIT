import { NextRequest, NextResponse } from 'next/server';
import { getScams } from '@/lib/ai';
import { EventItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  const event: EventItem = await req.json();
  try {
    const scams = await getScams(event);
    return NextResponse.json({ scams });
  } catch (err) {
    console.error('scams route failed:', err);
    return NextResponse.json({ error: 'Failed to check for scams' }, { status: 500 });
  }
}
