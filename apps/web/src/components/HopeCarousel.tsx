import { useEffect, useState } from "react";
import { listApprovedGuestEntries, type ApprovedGuestEntry } from "../lib/api";

const REFRESH_INTERVAL_MS = 30_000;
const ROTATION_INTERVAL_MS = 8_000;

export function HopeCarousel() {
  const [entries, setEntries] = useState<ApprovedGuestEntry[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const approved = await listApprovedGuestEntries();
        if (!active) return;
        setEntries(approved);
        setIndex((current) => (approved.length ? current % approved.length : 0));
      } catch {
        // Keep current carousel or fallback when kiosk is offline.
      }
    }
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (entries.length < 2) return;
    const rotationTimer = window.setInterval(() => {
      setIndex((current) => (current + 1) % entries.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(rotationTimer);
  }, [entries.length]);

  const entry = entries[index];
  if (!entry) {
    return (
      <div className="relative hidden min-h-[34rem] lg:block" aria-hidden="true">
        <div className="absolute inset-12 rotate-6 rounded-[4rem] bg-white/10" />
        <div className="absolute inset-x-4 top-24 bottom-8 -rotate-3 rounded-[4rem] border-4 border-white/35" />
        <div className="absolute inset-0 grid place-items-center text-[20rem] leading-none font-bold text-white/95">
          81
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden min-h-[34rem] items-center lg:flex" aria-label="Harapan pengunjung untuk Indonesia">
      <article
        className="hope-card-enter relative w-full overflow-hidden rounded-[3.5rem] border-4 border-white/30 bg-white p-12 text-ink shadow-2xl"
        key={entry.id}
      >
        <div className="absolute top-0 right-0 size-40 translate-x-14 -translate-y-14 rounded-full bg-brand-red/10" />
        <p className="text-xl font-bold tracking-[0.16em] text-brand-red uppercase">
          Harapan untuk Indonesia
        </p>
        <blockquote className="mt-8 text-4xl leading-tight font-bold before:text-brand-red before:content-['“'] after:text-brand-red after:content-['”'] xl:text-5xl">
          {entry.message}
        </blockquote>
        <footer className="mt-10 flex items-end justify-between gap-6 border-t border-black/10 pt-6">
          <div>
            <p className="text-2xl font-bold">{entry.display_name}</p>
            <p className="text-xl text-black/55">{entry.origin}</p>
          </div>
          <p className="shrink-0 text-lg font-bold text-black/35">
            {index + 1} / {entries.length}
          </p>
        </footer>
      </article>
    </aside>
  );
}
