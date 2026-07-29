import { EventItem } from './types';

const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Atlanta', 'Austin'];
const CATEGORY_CONFIG = [
  { key: 'pol', label: 'Political', promptLabel: 'political' },
  { key: 'trend', label: 'Trending', promptLabel: 'trending' },
  { key: 'don', label: 'Donation/Charity', promptLabel: 'donation/charity' },
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseEventsFromText(text: string): Array<Partial<EventItem>> {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: Array<Partial<EventItem>> = [];
  for (const line of lines) {
    const match = line.match(/^[-•*]?\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+)$/i);
    if (!match) continue;
    const [, name, city, date, description] = match;
    if (!name || !city || !date || !description) continue;
    parsed.push({ name: name.trim(), city: city.trim(), date: date.trim(), blurb: description.trim() });
  }

  return parsed;
}

async function fetchCategoryEvents(category: (typeof CATEGORY_CONFIG)[number]): Promise<EventItem[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY is not set');
    return [];
  }

  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 14);
  const minDateString = minDate.toISOString().split('T')[0];

  const prompt = `You are a research assistant. Find REAL, currently findable upcoming ${category.promptLabel} events in the following cities: ${CITIES.join(', ')}.

Requirements:
- Only include events that are genuinely findable via web search and are at least 14 days from today (${minDateString}).
- Do NOT invent or guess. If you cannot confidently verify a real event for a city, skip that city entirely.
- Return up to 3 events total for this category across all the cities.
- Return each event as a line in this exact format:
name | city | YYYY-MM-DD | one-sentence description

Do not include any other text, bullets, markdown, or commentary.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
        tools: [{ type: 'web_search_preview' }],
        max_output_tokens: 1200,
      }),
    });

    if (!response.ok) {
      console.error(`Trend event fetch failed for ${category.label}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    const text =
      (typeof data.output_text === 'string' && data.output_text.trim()) ||
      (Array.isArray(data.output) ? data.output : [])
        .flatMap((item: any) => (Array.isArray(item.content) ? item.content : []))
        .filter((part: any) => part.type === 'output_text' || part.type === 'text')
        .map((part: any) => part.text || '')
        .join('\n')
        .trim();

    if (!text) return [];

    const parsed = parseEventsFromText(text);
    return parsed.slice(0, 3).map((event) => ({
      id: `${category.key}-${slugify(`${event.name ?? 'event'}-${event.city ?? 'city'}`)}`,
      name: event.name ?? 'Untitled event',
      city: event.city ?? 'Unknown city',
      date: event.date ?? 'TBA',
      category: category.key,
      tag: category.label.toUpperCase(),
      blurb: event.blurb ?? 'Upcoming event discovered via web research.',
      minPrice: undefined,
      maxPrice: undefined,
    }));
  } catch (error) {
    console.error(`Trend event fetch threw for ${category.label}:`, error);
    return [];
  }
}

export async function fetchTrendEvents(): Promise<EventItem[]> {
  const results = await Promise.all(CATEGORY_CONFIG.map((category) => fetchCategoryEvents(category)));
  return results.flat();
}
