import { NextRequest, NextResponse } from 'next/server';
import { askAboutEvent } from '@/lib/ai';
import { EventItem } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { event, question }: { event: EventItem; question: string } = await req.json();
  try {
    const answer = await askAboutEvent(event, question);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error('ask route failed:', err);
    return NextResponse.json({ error: 'Failed to reach the agent' }, { status: 500 });
  }
}
