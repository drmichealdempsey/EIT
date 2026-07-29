import { unstable_cache } from 'next/cache';
import { fetchTicketmasterEvents } from './ticketmaster';
import { scoreEvents } from './ai';

// This is the cost-control layer: the expensive part (Ticketmaster fetch + one
// batched Claude scoring call) runs at most once every 6 hours, no matter how
// many people/pages hit the site in between. Every page load just reads this cache.
export const getScoredEvents = unstable_cache(
  async () => {
    const raw = await fetchTicketmasterEvents();
    const scored = await scoreEvents(raw);
    return scored.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
  },
  ['scored-events'],
  { revalidate: 21600 } // 6 hours
);
