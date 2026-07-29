import { NextResponse } from 'next/server';
import { generateBuildPrompt } from '@/lib/ai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event, opportunity } = body ?? {};

    if (!event || !opportunity) {
      return NextResponse.json({ error: 'Missing event or opportunity' }, { status: 400 });
    }

    const prompt = await generateBuildPrompt(event, opportunity);
    return NextResponse.json({ prompt });
  } catch (error) {
    console.error('build-prompt failed:', error);
    return NextResponse.json({ error: 'Failed to generate build prompt' }, { status: 500 });
  }
}
