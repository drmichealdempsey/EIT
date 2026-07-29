'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EventItem, Opportunity, ScamWarning } from '@/lib/types';

type ChatMsg = { role: 'user' | 'agent'; text: string };
type SectionKey = 'summary' | 'opportunities' | 'scams';

function getScoreTone(score?: number) {
  if (typeof score !== 'number') {
    return 'border-line bg-[#11192A] text-muted';
  }
  if (score >= 7) return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300';
  if (score >= 4) return 'border-amber-400/30 bg-amber-500/10 text-amber-300';
  return 'border-rose-400/30 bg-rose-500/10 text-rose-300';
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[#17223A] ${className ?? ''}`} />;
}

export default function EventDetailClient({ event }: { event: EventItem }) {
  const [opportunities, setOpportunities] = useState<Opportunity[] | null>(null);
  const [oppError, setOppError] = useState(false);
  const [oppVisible, setOppVisible] = useState(false);
  const [scams, setScams] = useState<ScamWarning[] | null>(null);
  const [scamError, setScamError] = useState(false);
  const [scamVisible, setScamVisible] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    summary: true,
    opportunities: true,
    scams: true,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOppVisible(false);
    setScamVisible(false);
    setOppError(false);
    setScamError(false);

    fetch(`/api/events/${event.id}/opportunities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.opportunities) {
          setOpportunities(d.opportunities);
          setOppVisible(true);
        } else {
          setOppError(true);
        }
      })
      .catch(() => setOppError(true));

    fetch(`/api/events/${event.id}/scams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.scams) {
          setScams(d.scams);
          setScamVisible(true);
        } else {
          setScamError(true);
        }
      })
      .catch(() => setScamError(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id]);

  function toggleSection(key: SectionKey) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function focusChat() {
    inputRef.current?.focus();
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

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
    } catch {
      setMessages((m) => [...m, { role: 'agent', text: 'Something went wrong reaching the agent.' }]);
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <Link href="/" className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted transition hover:text-sweep">
            ← back to feed
          </Link>
          <div className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] ${getScoreTone(event.score)}`}>
            score {typeof event.score === 'number' ? `${event.score}/10` : 'pending'}
          </div>
        </div>

        <header className="rounded-[28px] border border-line bg-[#10182B]/90 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-sweep">
                {event.tag}
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
                {event.name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-2 text-[12px] text-muted">
                <span className="rounded-full border border-line bg-[#11192A] px-3 py-1.5">{event.city}</span>
                <span className="rounded-full border border-line bg-[#11192A] px-3 py-1.5">{event.date}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className={`rounded-full border px-4 py-2 font-display text-sm font-semibold ${getScoreTone(event.score)}`}>
                {typeof event.score === 'number' ? `${event.score}/10` : 'Awaiting score'}
              </div>
              <button
                onClick={focusChat}
                className="rounded-full border border-sweep/40 bg-sweep/10 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.3em] text-sweep transition hover:bg-sweep/20"
              >
                Ask a question
              </button>
            </div>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-7 text-muted">{event.blurb}</p>
        </header>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.65fr_0.85fr]">
          <div className="space-y-4">
            <section className="overflow-hidden rounded-[24px] border border-line bg-[#10182B]/90">
              <button
                onClick={() => toggleSection('summary')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-sweep">
                    Event summary
                  </div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">Overview</div>
                </div>
                <span className="rounded-full border border-line bg-[#11192A] px-2.5 py-1 font-mono text-[11px] text-muted">
                  {openSections.summary ? '−' : '+'}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openSections.summary ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-7 text-muted">{event.blurb}</p>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-line bg-[#10182B]/90">
              <button
                onClick={() => toggleSection('opportunities')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-hot">
                    Top opportunities
                  </div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">Five high-fit ideas</div>
                </div>
                <span className="rounded-full border border-line bg-[#11192A] px-2.5 py-1 font-mono text-[11px] text-muted">
                  {openSections.opportunities ? '−' : '+'}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openSections.opportunities ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden px-5 pb-5">
                  {!opportunities && !oppError && (
                    <div className="space-y-3">
                      <SkeletonBlock className="h-16" />
                      <SkeletonBlock className="h-16" />
                      <SkeletonBlock className="h-16" />
                    </div>
                  )}
                  {oppError && (
                    <div className="rounded-2xl border border-red-900/40 bg-red-950/20 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-300">
                      Could not generate opportunities.
                    </div>
                  )}
                  {opportunities && (
                    <ol className={`space-y-3 transition-all duration-500 ${oppVisible ? 'opacity-100' : 'opacity-0'}`}>
                      {opportunities.map((o, i) => (
                        <li key={`${o.title}-${i}`} className="flex gap-3 rounded-2xl border border-line bg-[#11192A] px-3 py-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-hot/30 bg-hot/10 font-mono text-[10.5px] text-hot">
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-display text-[14px] font-semibold text-white">{o.title}</div>
                            <div className="mt-1 text-sm leading-6 text-muted">{o.desc}</div>
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[24px] border border-line bg-[#10182B]/90">
              <button
                onClick={() => toggleSection('scams')}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-rose-300">
                    Scams &amp; risks
                  </div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">Watch-outs</div>
                </div>
                <span className="rounded-full border border-line bg-[#11192A] px-2.5 py-1 font-mono text-[11px] text-muted">
                  {openSections.scams ? '−' : '+'}
                </span>
              </button>
              <div className={`grid transition-all duration-300 ${openSections.scams ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden px-5 pb-5">
                  {!scams && !scamError && (
                    <div className="space-y-3">
                      <SkeletonBlock className="h-16" />
                      <SkeletonBlock className="h-16" />
                    </div>
                  )}
                  {scamError && (
                    <div className="rounded-2xl border border-red-900/40 bg-red-950/20 px-3 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-red-300">
                      Could not check for scams.
                    </div>
                  )}
                  {scams && (
                    <ul className={`space-y-2.5 transition-all duration-500 ${scamVisible ? 'opacity-100' : 'opacity-0'}`}>
                      {scams.length === 0 ? (
                        <li className="rounded-2xl border border-line bg-[#11192A] px-3 py-3 text-sm text-muted">
                          No specific scam pattern found — standard caution still applies.
                        </li>
                      ) : (
                        scams.map((s, i) => (
                          <li key={`${s.title}-${i}`} className="rounded-2xl border border-rose-900/30 bg-rose-950/20 px-3 py-3">
                            <div className="font-display text-[14px] font-semibold text-white">{s.title}</div>
                            <div className="mt-1 text-sm leading-6 text-muted">{s.desc}</div>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <section className="sticky bottom-4 rounded-[24px] border border-line bg-[#10182B]/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-sweep">
                Ask the agent
              </div>
              <div className="mt-3 flex flex-col gap-2.5">
                {messages.length === 0 && (
                  <p className="text-sm italic text-muted">
                    Ask anything about timing, likely demand, or the best angle for this event.
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${
                      m.role === 'user'
                        ? 'ml-auto bg-[#1D2C4A] text-white'
                        : 'border border-line bg-[#11192A] text-muted'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {asking && <div className="font-mono text-[12px] text-muted">Thinking…</div>}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && askAgent()}
                  placeholder="Ask a question…"
                  className="flex-1 rounded-2xl border border-line bg-[#0A0F1C] px-3 py-2.5 text-[13px] text-white outline-none transition focus:border-sweep"
                />
                <button
                  onClick={askAgent}
                  disabled={asking}
                  className="rounded-2xl bg-sweep px-4 py-2.5 font-display font-semibold text-[13px] text-bg transition disabled:opacity-40"
                >
                  Ask
                </button>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[24px] border border-line bg-[#10182B]/90 p-5">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.3em] text-hot">
                Why this score
              </div>
              <div className="mt-3 rounded-2xl border border-hot/20 bg-hot/10 px-3 py-3 text-[14px] leading-7 text-white">
                {event.reason || 'This event is still being scored. A short rationale will appear here once the agent responds.'}
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-line bg-[#11192A] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">City</div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">{event.city}</div>
                </div>
                <div className="rounded-2xl border border-line bg-[#11192A] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Date</div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">{event.date}</div>
                </div>
                <div className="rounded-2xl border border-line bg-[#11192A] p-3">
                  <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">Category</div>
                  <div className="mt-1 font-display text-[15px] font-semibold text-white">{event.tag}</div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={focusChat}
                  className="rounded-2xl border border-sweep/40 bg-sweep/10 px-3 py-2.5 font-mono text-[11px] uppercase tracking-[0.3em] text-sweep transition hover:bg-sweep/20"
                >
                  Ask a question
                </button>
                <Link
                  href="/"
                  className="rounded-2xl border border-line bg-[#11192A] px-3 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-muted transition hover:text-sweep"
                >
                  Back to feed
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
