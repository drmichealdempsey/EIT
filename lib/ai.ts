import { EventItem, Opportunity, ScamWarning } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const MODEL = 'gpt-4o';

// IMPORTANT: this file only ever runs on the server (API routes / server components).
// process.env.OPENAI_API_KEY must never be read from a 'use client' file.
async function callOpenAI(prompt: string, useWebSearch = false): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');

  const body: Record<string, unknown> = {
    model: MODEL,
    input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
    max_output_tokens: 1000,
  };

  if (useWebSearch) {
    body.tools = [{ type: 'web_search_preview' }];
  }

  const res = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const text = (Array.isArray(data.output) ? data.output : [])
    .flatMap((item: any) => (Array.isArray(item.content) ? item.content : []))
    .filter((part: any) => part.type === 'output_text' || part.type === 'text')
    .map((part: any) => part.text || '')
    .join('\n')
    .trim();

  if (text) return text;
  throw new Error('No output text found in OpenAI response');
}

// Models sometimes add a stray sentence before/after the JSON — pull the array out
// instead of requiring the whole response to be strict JSON.
function extractJsonArray(text: string): any[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found in OpenAI response');
  return JSON.parse(match[0]);
}

export async function scoreEvents(events: EventItem[]): Promise<EventItem[]> {
  if (events.length === 0) return events;

  const list = events
    .map((e) => `id:${e.id} | ${e.name} | ${e.city} | ${e.date} | ${e.tag} | ${e.blurb}`)
    .join('\n');

  const prompt = `You are scoring events for a solo freelance developer and content builder who is looking for realistic short-term money-making angles (content, quick tools/landing pages, freelance services tied to the moment, affiliate angles, or — for donation/charity events — building donation pages, matching-gift tools, or fundraising campaign support). Score each event below from 1-10 on "opportunity fit" for this person, and give a one-sentence reason.

Events:
${list}

Respond with ONLY a JSON array, no markdown, no preamble, in this exact shape:
[{"id": "the id given above", "score": 7, "reason": "short reason here"}, ...]`;

  try {
    const text = await callOpenAI(prompt);
    const scores: { id: string; score: number; reason: string }[] = extractJsonArray(text);
    const byId = new Map(scores.map((s) => [String(s.id), s]));
    return events.map((e) => {
      const s = byId.get(e.id);
      return s ? { ...e, score: s.score, reason: s.reason } : e;
    });
  } catch (err) {
    console.error('scoreEvents failed:', err);
    return events; // fail soft — feed still renders, just unscored
  }
}

export async function getOpportunities(event: EventItem): Promise<Opportunity[]> {
  const prompt = `You are advising a solo freelance developer and content builder (does web/app builds, content, small automation tools, freelance services) who is looking at this event as a potential money-making opportunity:

Name: ${event.name}
City: ${event.city}
Date: ${event.date}
Category: ${event.tag}
Summary: ${event.blurb}

List exactly 5 concrete, specific money-making opportunities tied to this particular event — not generic advice. Each should be something he could realistically start within days. Mix angles where it makes sense (content, quick tools/landing pages, freelance services, affiliate, local demand).

Respond with ONLY a JSON array, no markdown, no preamble, in this exact shape:
[{"title": "short title (4-6 words)", "desc": "one sentence, specific to this event"}, ...] — exactly 5 items.`;

  const text = await callOpenAI(prompt, true);
  return extractJsonArray(text) as Opportunity[];
}

export async function getScams(event: EventItem): Promise<ScamWarning[]> {
  const prompt = `You are a consumer-protection assistant. For this event, identify common or recently reported scam patterns people should watch out for.

Name: ${event.name}
City: ${event.city}
Date: ${event.date}
Category: ${event.tag}
Summary: ${event.blurb}

Use web search to check for any recent, real reports tied to this specific event, artist, cause, or venue. If nothing specific is found, fall back to well-known scam patterns for this general type of event (e.g. fake ticket resellers for concerts, spoofed donation pages for charity drives, phishing around political events). Keep each one factual and actionable, not alarmist.

Respond with ONLY a JSON array (can be empty), no markdown, no preamble, in this exact shape:
[{"title": "short title (4-6 words)", "desc": "one or two sentences: what it looks like and how to avoid it"}, ...] — 2 to 4 items.`;

  const text = await callOpenAI(prompt, true);
  return extractJsonArray(text) as ScamWarning[];
}

export async function askAboutEvent(event: EventItem, question: string): Promise<string> {
  const prompt = `You are an event-intelligence agent inside a personal opportunity-tracking tool. The user clicked into this event:

Name: ${event.name}
City: ${event.city}
Date: ${event.date}
Category: ${event.tag}
Summary: ${event.blurb}

The user's question: "${question}"

Answer directly and concisely (2-5 sentences), using web search if you need current, specific, or verifiable information. If something can't be found, say so plainly rather than guessing.`;

  return callOpenAI(prompt, true);
}
