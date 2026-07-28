import { useEffect, useState } from "react";
import { approvedPhotoContentUrl } from "../lib/api";
import { loadGalleryItems, type GalleryItem } from "../lib/gallery";

const REFRESH_INTERVAL_MS = 30_000;
const ROTATION_INTERVAL_MS = 8_000;

interface HopeCarouselProps {
  onOpenGallery: () => void;
}

export function HopeCarousel({ onOpenGallery }: HopeCarouselProps) {
  const [slides, setSlides] = useState<GalleryItem[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const nextSlides = await loadGalleryItems(20);
        if (!active) return;
        setSlides(nextSlides);
        setIndex((current) => (nextSlides.length ? current % nextSlides.length : 0));
      } catch {
        // Keep the last successful slides during a temporary connection failure.
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

  return (
    <button
      className="group hidden min-h-[34rem] w-full items-center text-left lg:flex"
      type="button"
      onClick={onOpenGallery}
      aria-label="Buka Galeri Merdeka"
    >
      <article
        className="hope-card-enter relative w-full overflow-hidden rounded-[3.5rem] border-4 border-white/30 bg-white text-ink shadow-2xl transition duration-300 group-active:scale-[0.98]"
        key={slide.id}
      >
        {slide.kind === "photo" ? (
          <>
            <div className="relative p-6 pb-0">
              <img
                className="aspect-video w-full rounded-[2.5rem] bg-black object-cover"
                src={approvedPhotoContentUrl(slide.photo.id)}
                alt="Foto Merdeka pengunjung yang telah disetujui"
                draggable="false"
              />
              <span className="absolute right-10 bottom-5 rounded-full bg-ink/75 px-5 py-2 text-lg font-bold text-white">
                Sentuh untuk membuka galeri
              </span>
            </div>
            <footer className="flex items-center justify-between gap-6 px-10 py-6">
              <div>
                <p className="text-xl font-bold tracking-[0.16em] text-brand-red uppercase">Momen Merdeka</p>
                <p className="mt-1 text-xl text-black/55">Karya pengunjung Bandara Sultan Hasanuddin</p>
              </div>
              <p className="shrink-0 text-lg font-bold text-black/35">{index + 1} / {slides.length}</p>
            </footer>
          </>
        ) : (
          <div className="relative p-12">
            <div className="absolute top-0 right-0 size-40 translate-x-14 -translate-y-14 rounded-full bg-brand-red/10" />
            <p className="text-xl font-bold tracking-[0.16em] text-brand-red uppercase">Harapan untuk Indonesia</p>
            <blockquote className="mt-8 text-4xl leading-tight font-bold xl:text-5xl">
              “{slide.entry.message}”
            </blockquote>
            <footer className="mt-10 flex items-end justify-between gap-6 border-t border-black/10 pt-6">
              <div>
                <p className="text-2xl font-bold">{slide.entry.display_name}</p>
                <p className="text-xl text-black/55">{slide.entry.origin}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-brand-red">Sentuh untuk membuka galeri</p>
                <p className="mt-1 text-lg font-bold text-black/35">{index + 1} / {slides.length}</p>
              </div>
            </footer>
          </div>
        )}
      </article>
    </button>
  );
}
