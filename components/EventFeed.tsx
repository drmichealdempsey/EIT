'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { EventItem } from '@/lib/types';

const CATS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'ent', label: 'Entertainment' },
  { key: 'pol', label: 'Political' },
  { key: 'trend', label: 'Trending' },
  { key: 'don', label: 'Donation/Charity' },
];

const RANGES: { key: number; label: string }[] = [
  { key: 30, label: 'Next 30 Days' },
  { key: 45, label: 'Next 45 Days' },
  { key: 60, label: 'Next 60 Days' },
];

export default function EventFeed({ events }: { events: EventItem[] }) {
  const [cat, setCat] = useState('all');
  const [city, setCity] = useState('all');
  const [range, setRange] = useState(30);

  const cities = useMemo(() => Array.from(new Set(events.map((e) => e.city))).sort(), [events]);

  const filtered = events.filter((e) => {
    if (cat !== 'all' && e.category !== cat) return false;
    if (city !== 'all' && e.city !== city) return false;

    const eventDate = new Date(e.date);
    if (Number.isNaN(eventDate.getTime())) return false;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + range);
    return eventDate <= cutoff;
  });

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 px-8 py-4 border-b border-line bg-panel">
        <span className="font-mono text-[10.5px] text-muted mr-1">CATEGORY</span>
        {CATS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`font-mono text-[11.5px] px-3 py-1.5 rounded-full border transition ${
              cat === c.key
                ? 'bg-sweep text-bg border-sweep font-semibold'
                : 'text-muted border-line hover:text-text hover:border-sweep'
            }`}
          >
            {c.label}
          </button>
        ))}
        <span className="font-mono text-[10.5px] text-muted ml-3">CITY</span>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="font-mono text-[11.5px] bg-bg text-text border border-line rounded-full px-3 py-1.5"
        >
          <option value="all">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <span className="font-mono text-[10.5px] text-muted ml-3">DATE RANGE</span>
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`font-mono text-[11.5px] px-3 py-1.5 rounded-full border transition ${
              range === r.key
                ? 'bg-sweep text-bg border-sweep font-semibold'
                : 'text-muted border-line hover:text-text hover:border-sweep'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="px-8 py-6">
        <div className="font-mono text-[11px] tracking-widest text-muted mb-4">
          RANKED BY OPPORTUNITY FIT — BEST FIRST
        </div>
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))' }}>
          {filtered.map((ev, i) => (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="relative block bg-panel border border-line rounded-2xl p-5 hover:border-sweep hover:bg-panelHi transition"
            >
              {ev.score != null && (
                <div className="absolute -top-2.5 left-3.5 bg-bg border border-hot text-hot font-mono text-[10px] px-2 py-0.5 rounded-full">
                  #{i + 1}
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-[10px] tracking-wide px-2 py-0.5 rounded-full border border-line text-muted">
                  {ev.tag}
                </span>
                {ev.score != null ? (
                  <div className="font-display font-bold text-hot text-[15px]">
                    {ev.score}
                    <small className="font-mono font-normal text-[10px] text-muted">/10</small>
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-muted">unscored</div>
                )}
              </div>
              <h3 className="font-display text-[17px] mb-2 leading-tight">{ev.name}</h3>
              <div className="font-mono text-[11.5px] text-muted flex gap-3 flex-wrap mb-2.5">
                <span>{ev.city}</span>
                <span>{ev.date}</span>
                {ev.maxPrice != null && (
                  <span>
                    {ev.minPrice != null ? `$${Math.round(ev.minPrice)}–$${Math.round(ev.maxPrice)}` : `$${Math.round(ev.maxPrice)}+`}
                  </span>
                )}
              </div>
              {ev.reason && (
                <div className="text-[12.5px] text-muted border-t border-line pt-2.5 mt-1 leading-snug">
                  <b className="text-text font-medium">Why: </b>
                  {ev.reason}
                </div>
              )}
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted text-sm col-span-full">No events match these filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
