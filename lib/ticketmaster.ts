import { EventItem } from './types';

// Start with a small, fixed city list — keep this short to control cost and API volume.
// Add more cities once the pipeline is working the way you want.
const CITIES = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'Atlanta', 'Austin'];

export async function fetchTicketmasterEvents(): Promise<EventItem[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.error('TICKETMASTER_API_KEY is not set');
    return [];
  }

  const results: EventItem[] = [];
  const startDateTime = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .replace(/\.\d{3}Z$/, 'Z');

  for (const city of CITIES) {
    const url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&city=${encodeURIComponent(
      city
    )}&size=5&sort=date,asc&startDateTime=${encodeURIComponent(startDateTime)}`;

    try {
      // Cache each city's fetch for 6 hours — this is the "free filter" layer, no AI cost here.
      const res = await fetch(url, { next: { revalidate: 21600 } });
      if (!res.ok) {
        console.error(`Ticketmaster fetch failed for ${city}: ${res.status}`);
        continue;
      }
      const data = await res.json();
      const events = data._embedded?.events ?? [];

      for (const e of events) {
        results.push({
          id: e.id,
          name: e.name,
          city,
          date: e.dates?.start?.localDate ?? 'TBA',
          category: 'ent',
          tag: (e.classifications?.[0]?.segment?.name ?? 'ENTERTAINMENT').toUpperCase(),
          blurb:
            e.info ||
            e.pleaseNote ||
            `${e.name} at ${e._embedded?.venues?.[0]?.name ?? city}, ${e.dates?.start?.localDate ?? ''}`,
          url: e.url,
        });
      }
    } catch (err) {
      console.error(`Ticketmaster fetch threw for ${city}:`, err);
    }
  }

  return results;
}

export async function getEventById(id: string): Promise<EventItem | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.error('TICKETMASTER_API_KEY is not set');
    return null;
  }

  const url = `https://app.ticketmaster.com/discovery/v2/events/${id}.json?apikey=${apiKey}`;

  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      if (res.status === 404) return null;
      console.error(`Ticketmaster single-event fetch failed for ${id}: ${res.status}`);
      return null;
    }

    const e = await res.json();
    if (!e?.id) return null;

    const venue = e._embedded?.venues?.[0];
    const city = venue?.city?.name ?? 'TBA';
    const date = e.dates?.start?.localDate ?? 'TBA';
    const tag = (e.classifications?.[0]?.segment?.name ?? 'ENTERTAINMENT').toUpperCase();

    return {
      id: e.id,
      name: e.name,
      city,
      date,
      category: 'ent',
      tag,
      blurb: e.info || e.pleaseNote || `${e.name} at ${venue?.name ?? city}, ${date}`,
      url: e.url,
    };
  } catch (err) {
    console.error(`Ticketmaster single-event fetch threw for ${id}:`, err);
    return null;
  }
}
