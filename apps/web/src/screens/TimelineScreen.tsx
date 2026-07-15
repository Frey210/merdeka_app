import { useRef, useState } from "react";
import { timelineEvents } from "../data/timeline";

interface TimelineScreenProps {
  onBack: () => void;
}

export function TimelineScreen({ onBack }: TimelineScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const event = timelineEvents[activeIndex];

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) => Math.min(Math.max(current + direction, 0), timelineEvents.length - 1));
  };

  return (
    <section className="flex flex-1 flex-col py-5 lg:py-8">
      <div className="mb-6 flex items-center justify-between gap-6">
        <button className="touch-button-secondary" type="button" onClick={onBack}>
          ← Kembali
        </button>
        <div className="text-right">
          <p className="text-xl font-bold uppercase tracking-[0.18em] text-brand-red">Jejak Sejarah</p>
          <p className="mt-1 text-xl text-ink/60">Geser atau gunakan tombol navigasi</p>
        </div>
      </div>

      <div
        className="grid flex-1 select-none overflow-hidden rounded-[3rem] bg-ink text-white shadow-2xl lg:grid-cols-[0.7fr_1.3fr]"
        onPointerDown={(pointerEvent) => {
          pointerStart.current = pointerEvent.clientX;
        }}
        onPointerUp={(pointerEvent) => {
          if (pointerStart.current === null) return;
          const distance = pointerEvent.clientX - pointerStart.current;
          if (Math.abs(distance) > 80) move(distance > 0 ? -1 : 1);
          pointerStart.current = null;
        }}
      >
        <div className="relative flex min-h-[22rem] flex-col justify-between overflow-hidden bg-brand-red p-10 lg:min-h-0 lg:p-14">
          <div className="absolute -right-24 -top-24 size-80 rounded-full border-[3.5rem] border-white/15" />
          <p className="relative text-2xl font-bold uppercase tracking-[0.16em]">{event.accent}</p>
          <p className="relative text-[8rem] font-bold leading-none lg:text-[12rem]" aria-hidden="true">
            {event.year}
          </p>
          <p className="relative text-3xl font-bold">{event.date}</p>
        </div>

        <article className="flex flex-col justify-center p-10 lg:p-16" aria-live="polite">
          <p className="text-2xl font-bold text-brand-red">
            {String(activeIndex + 1).padStart(2, "0")} / {String(timelineEvents.length).padStart(2, "0")}
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-bold leading-tight lg:text-7xl">{event.title}</h1>
          <p className="mt-8 max-w-4xl text-3xl leading-relaxed text-white/80">{event.description}</p>
          <p className="mt-8 text-lg text-white/45">Sumber: Direktorat Kebudayaan/Kemendikbud</p>

          <div className="mt-12 flex items-center justify-between gap-6">
            <div className="flex gap-3" aria-label="Posisi timeline">
              {timelineEvents.map((timelineEvent, index) => (
                <button
                  className={`h-3 rounded-full transition-all ${index === activeIndex ? "w-12 bg-brand-red" : "w-3 bg-white/30"}`}
                  key={`${timelineEvent.year}-${timelineEvent.date}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Buka ${timelineEvent.title}`}
                  aria-current={index === activeIndex ? "step" : undefined}
                />
              ))}
            </div>

            <div className="flex gap-4">
              <button
                className="timeline-arrow"
                type="button"
                onClick={() => move(-1)}
                disabled={activeIndex === 0}
                aria-label="Peristiwa sebelumnya"
              >
                ←
              </button>
              <button
                className="timeline-arrow"
                type="button"
                onClick={() => move(1)}
                disabled={activeIndex === timelineEvents.length - 1}
                aria-label="Peristiwa berikutnya"
              >
                →
              </button>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

