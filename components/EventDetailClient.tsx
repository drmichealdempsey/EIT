'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventItem, Opportunity, ScamWarning } from '@/lib/types';

type ChatMsg = { role: 'user' | 'agent'; text: string };

export default function EventDetailClient({ event }: { event: EventItem }) {
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [oppError, setOppError] = useState(false);
  const [scams, setScams] = useState<ScamWarning[] | null>(null);
  const [scamError, setScamError] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);

  useEffect(() => {
    fetch(`/api/events/${event.id}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then((r) => r.json())
      .then((d) => (d.opportunities ? setOpportunities(d.opportunities) : setOppError(true)))
      .catch(() => setOppError(true));

    fetch(`/api/events/${event.id}/scams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then((r) => r.json())
      .then((d) => (d.scams ? setScams(d.scams) : setScamError(true)))
      .catch(() => setScamError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  async function askAgent() {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setQuestion('');
    setAsking(true);
    try {
      const res = await fetch(`/api/events/${event.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, question: q }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        { role: 'agent', text: data.answer || 'No answer came back — try rephrasing.' },
      ]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'agent', text: 'Something went wrong reaching the agent.' }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <Link href="/" className="font-mono text-[11px] text-muted hover:text-sweep">
        ← back to feed
      </Link>

      <div className="mt-4 mb-6">
        <span className="font-mono text-[11px] tracking-widest text-sweep">{event.tag}</span>
        <h1 className="font-display text-3xl font-bold mt-2 mb-3">{event.name}</h1>
        <div className="font-mono text-[12px] text-muted leading-relaxed">
          {event.city}
          <br />
          {event.date}
        </div>
        <p className="text-muted text-sm mt-3 leading-relaxed">{event.blurb}</p>
        {event.reason && (
          <div className="mt-3 text-[12.5px] bg-panelHi border-l-2 border-hot rounded-md px-3 py-2.5">
            Score {event.score}/10 — {event.reason}
          </div>
        )}
      </div>

      <section className="border-t border-line pt-5 mb-6">
        <div className="font-mono text-[10.5px] tracking-widest text-hot mb-3">
          TOP 5 OPPORTUNITIES FOR THIS EVENT
        </div>
        {!opportunities && !oppError && (
          <div className="font-mono text-[11.5px] text-muted">Generating opportunities…</div>
        )}
        {oppError && (
          <div className="font-mono text-[11.5px] text-muted">Could not generate opportunities.</div>
        )}
        <ol className="flex flex-col gap-3">
          {opportunities?.map((o, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-md bg-panelHi border border-line text-hot font-mono text-[10.5px] flex items-center justify-center mt-0.5">
                {i + 1}
              </div>
              <div className="text-[12.5px] leading-relaxed">
                <b className="block font-display text-[13.5px] font-semibold">{o.title}</b>
                <span className="text-muted">{o.desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-line pt-5 mb-6">
        <div className="font-mono text-[10.5px] tracking-widest text-red-300 mb-3">
          SCAMS &amp; RISKS TO WATCH FOR
        </div>
        {!scams && !scamError && (
          <div className="font-mono text-[11.5px] text-muted">Checking for known scams…</div>
        )}
        {scamError && (
          <div className="font-mono text-[11.5px] text-muted">Could not check for scams.</div>
        )}
        <ul className="flex flex-col gap-2.5">
          {scams?.length === 0 && (
            <li className="text-[12.5px] text-muted">
              No specific scam pattern found — usual ticket/donation-site caution still applies.
            </li>
          )}
          {scams?.map((s, i) => (
            <li key={i} className="flex gap-2.5 bg-red-950/20 border border-red-900/40 rounded-lg px-3 py-2.5">
              <span className="flex-shrink-0">⚠</span>
              <div className="text-[12.5px] leading-relaxed">
                <b className="block font-display text-[13.5px] font-semibold">{s.title}</b>
                <span className="text-muted">{s.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-line pt-5">
        <div className="font-mono text-[10.5px] tracking-widest text-sweep mb-3">
          ASK THE AGENT ANYTHING ABOUT THIS EVENT
        </div>
        {messages.length === 0 && (
          <p className="text-[12.5px] text-muted italic mb-3">
            e.g. &quot;who&apos;s headlining&quot;, &quot;is there parking nearby&quot;
          </p>
        )}
        <div className="flex flex-col gap-2.5 mb-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-[13.5px] leading-relaxed px-3.5 py-2.5 rounded-xl max-w-[90%] ${
                m.role === 'user'
                  ? 'self-end bg-[#1D2C4A] ml-auto'
                  : 'bg-panelHi border border-line'
              }`}
            >
              {m.text}
            </div>
          ))}
          {asking && <div className="font-mono text-[12px] text-muted">Searching…</div>}
        </div>
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && askAgent()}
            placeholder="Ask a question…"
            className="flex-1 bg-bg border border-line rounded-lg px-3 py-2.5 text-[13.5px] focus:outline-none focus:border-sweep"
          />
          <button
            onClick={askAgent}
            disabled={asking}
            className="bg-sweep text-bg font-display font-semibold text-[13px] px-4 rounded-lg disabled:opacity-40"
          >
            Ask
          </button>
        </div>
      </section>
    </div>
  );
}
