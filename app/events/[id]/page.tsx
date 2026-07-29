import { notFound } from 'next/navigation';
import { getScoredEvents } from '@/lib/events';
import EventDetailClient from '@/components/EventDetailClient';

export default async function EventPage({ params }: { params: { id: string } }) {
  const events = await getScoredEvents();
  const event = events.find((e) => e.id === params.id);
  if (!event) return notFound();

  return <EventDetailClient event={event} />;
}
