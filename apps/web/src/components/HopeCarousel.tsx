import { useEffect, useState } from "react";
import {
  approvedPhotoContentUrl,
  listApprovedGuestEntries,
  listApprovedPhotos,
  type ApprovedGuestEntry,
  type ApprovedPhoto,
} from "../lib/api";

const REFRESH_INTERVAL_MS = 30_000;
const ROTATION_INTERVAL_MS = 8_000;

type CarouselSlide =
  | { kind: "hope"; createdAt: string; entry: ApprovedGuestEntry }
  | { kind: "photo"; createdAt: string; photo: ApprovedPhoto };

export function HopeCarousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const [hopeResult, photoResult] = await Promise.allSettled([
        listApprovedGuestEntries(),
        listApprovedPhotos(),
      ]);
      if (!active) return;

      const nextSlides: CarouselSlide[] = [];
      if (hopeResult.status === "fulfilled") {
        nextSlides.push(
          ...hopeResult.value.map((entry) => ({
            kind: "hope" as const,
            createdAt: entry.created_at,
            entry,
          })),
        );
      }
      if (photoResult.status === "fulfilled") {
        nextSlides.push(
          ...photoResult.value.map((photo) => ({
            kind: "photo" as const,
            createdAt: photo.created_at,
            photo,
          })),
        );
      }
      if (hopeResult.status === "rejected" && photoResult.status === "rejected") return;

      nextSlides.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      setSlides(nextSlides);
      setIndex((current) => (nextSlides.length ? current % nextSlides.length : 0));
    }
    void refresh();
    const refreshTimer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(refreshTimer);
    };
  }, []);

  useEffect(() => {
    if (slides.length < 2) return;
    const rotationTimer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, ROTATION_INTERVAL_MS);
    return () => window.clearInterval(rotationTimer);
  }, [slides.length]);

  const slide = slides[index];
  if (!slide) {
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

  if (slide.kind === "photo") {
    return (
      <aside className="hidden min-h-[34rem] items-center lg:flex" aria-label="Karya pengunjung untuk Indonesia">
        <article
          className="hope-card-enter relative w-full overflow-hidden rounded-[3.5rem] border-4 border-white/30 bg-white p-6 text-ink shadow-2xl"
          key={`photo-${slide.photo.id}`}
        >
          <img
            className="aspect-video w-full rounded-[2.5rem] bg-black object-cover"
            src={approvedPhotoContentUrl(slide.photo.id)}
            alt="Foto Merdeka pengunjung yang telah disetujui"
          />
          <footer className="flex items-center justify-between gap-6 px-4 pb-2 pt-6">
            <div>
              <p className="text-xl font-bold tracking-[0.16em] text-brand-red uppercase">Momen Merdeka</p>
              <p className="mt-1 text-xl text-black/55">Karya pengunjung Bandara Sultan Hasanuddin</p>
            </div>
            <p className="shrink-0 text-lg font-bold text-black/35">
              {index + 1} / {slides.length}
            </p>
          </footer>
        </article>
      </aside>
    );
  }

  const entry = slide.entry;

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
            {index + 1} / {slides.length}
          </p>
        </footer>
      </article>
    </aside>
  );
}
