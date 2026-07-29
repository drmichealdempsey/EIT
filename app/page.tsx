import { getScoredEvents } from '@/lib/events';
import EventFeed from '@/components/EventFeed';

export const revalidate = 21600;

export default async function Home() {
  const events = await getScoredEvents();

  return (
    <main>
      <header className="border-b border-line px-8 py-9">
        <div className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-sweep mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-sweep animate-pulse" />
          LIVE FEED — UNITED STATES
        </div>
        <h1 className="font-display text-4xl font-bold mb-2">Opportunity Radar</h1>
        <p className="text-muted max-w-xl text-sm leading-relaxed">
          Every event below is pre-filtered and scored once — you only ever look at what&apos;s
          already ranked best-first.
        </p>
      </header>
      <EventFeed events={events} />
    </main>
  );
}
