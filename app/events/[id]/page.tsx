import { notFound } from 'next/navigation';
import { getScoredEvents } from '@/lib/events';
import { getEventById } from '@/lib/ticketmaster';
import EventDetailClient from '@/components/EventDetailClient';

export default async function EventPage({ params }: { params: { id: string } }) {
  const events = await getScoredEvents();
  let event = events.find((e) => e.id === params.id);

  if (!event) {
    const fallbackEvent = await getEventById(params.id);
    event = fallbackEvent ?? undefined;
  }

  if (!event) return notFound();

  return (
    <main className="min-h-screen bg-bg">
      <EventDetailClient event={event} />
    </main>
  );
}
