import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/ai';
import { EventItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  const event: EventItem = await req.json();
  try {
    const opportunities = await getOpportunities(event);
    return NextResponse.json({ opportunities });
  } catch (err) {
    console.error('opportunities route failed:', err);
    return NextResponse.json({ error: 'Failed to generate opportunities' }, { status: 500 });
  }
}
