import { useEffect, useMemo, useRef, useState } from "react";
import { BrandHeader } from "../components/BrandHeader";
import { approvedPhotoContentUrl } from "../lib/api";
import { loadGalleryItems, type GalleryItem } from "../lib/gallery";

interface GalleryScreenProps {
  onClose: () => void;
}

type GalleryFilter = "all" | GalleryItem["kind"];

const filters: { id: GalleryFilter; label: string }[] = [
  { id: "all", label: "Semua Karya" },
  { id: "photo", label: "Foto" },
  { id: "hope", label: "Harapan" },
];

export function GalleryScreen({ onClose }: GalleryScreenProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pointerStartX = useRef<number | null>(null);

  useEffect(() => {
    let active = true;
    void loadGalleryItems(50)
      .then((nextItems) => {
        if (!active) return;
        setItems(nextItems);
        setError("");
      })
      .catch(() => {
        if (active) setError("Galeri belum dapat dimuat. Periksa koneksi lalu coba lagi.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => filter === "all" || item.kind === filter),
    [filter, items],
  );
  const selected = visibleItems[index];

  useEffect(() => {
    setIndex(0);
  }, [filter]);

  useEffect(() => {
    if (index >= visibleItems.length) setIndex(0);
  }, [index, visibleItems.length]);

  function move(direction: -1 | 1) {
    if (visibleItems.length < 2) return;
    setIndex((current) => (current + direction + visibleItems.length) % visibleItems.length);
  }

  function finishSwipe(clientX: number) {
    if (pointerStartX.current === null) return;
    const distance = clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(distance) < 70) return;
    move(distance < 0 ? 1 : -1);
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-56 -right-40 size-[42rem] rounded-full border-[7rem] border-brand-red/25" />
      <div className="pointer-events-none absolute -bottom-64 -left-52 size-[46rem] rounded-full border-[8rem] border-white/5" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1920px] flex-col px-8 py-6 lg:px-16 lg:py-8">
        <div className="flex items-center justify-between gap-8">
          <BrandHeader hutLogoVariant="white" />
          <div className="flex items-center gap-4">
            <div className="hidden text-right xl:block">
              <p className="text-lg font-bold tracking-[0.15em] text-brand-red uppercase">Karya pengunjung</p>
              <h1 className="text-4xl font-bold">Galeri Merdeka</h1>
            </div>
            <button
              className="min-h-16 rounded-full border-2 border-white/25 bg-white px-8 text-2xl font-bold text-ink"
              type="button"
              onClick={onClose}
            >
              Tutup Galeri
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-3 rounded-full bg-white/8 p-2" aria-label="Filter galeri">
            {filters.map((option) => (
              <button
                className={`min-h-14 rounded-full px-7 text-xl font-bold transition ${
                  filter === option.id ? "bg-brand-red text-white shadow-lg" : "text-white/70"
                }`}
                key={option.id}
                type="button"
                onClick={() => setFilter(option.id)}
                aria-pressed={filter === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="text-xl text-white/55">
            Geser foto atau gunakan tombol panah · Kembali otomatis saat tidak digunakan
          </p>
        </div>

        <section className="mt-5 grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_9.5rem] gap-5">
          <div
            className="gallery-swipe relative grid min-h-0 place-items-center overflow-hidden rounded-[3rem] border-2 border-white/15 bg-white/5 p-5 shadow-2xl"
            onPointerDown={(event) => {
              pointerStartX.current = event.clientX;
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => finishSwipe(event.clientX)}
            onPointerCancel={() => {
              pointerStartX.current = null;
            }}
          >
            {loading ? (
              <p className="text-3xl font-bold text-white/65">Menyiapkan Galeri Merdeka…</p>
            ) : error ? (
              <div className="text-center">
                <p className="text-3xl font-bold">{error}</p>
                <button className="touch-button-primary mt-6" type="button" onClick={onClose}>Kembali</button>
              </div>
            ) : !selected ? (
              <div className="text-center">
                <p className="text-4xl font-bold">Belum ada karya pada kategori ini</p>
                <p className="mt-3 text-2xl text-white/55">Pilih kategori lainnya untuk melanjutkan.</p>
              </div>
            ) : selected.kind === "photo" ? (
              <figure className="gallery-item-enter grid size-full min-h-0 grid-cols-[minmax(0,1fr)_22rem] gap-6" key={selected.id}>
                <img
                  className="min-h-0 size-full rounded-[2.25rem] bg-black object-contain"
                  src={approvedPhotoContentUrl(selected.photo.id)}
                  alt="Foto Merdeka pengunjung"
                  draggable="false"
                />
                <figcaption className="flex flex-col justify-end rounded-[2.25rem] bg-white p-8 text-ink">
                  <p className="text-lg font-bold tracking-[0.16em] text-brand-red uppercase">Momen Merdeka</p>
                  <h2 className="mt-3 text-4xl leading-tight font-bold">Cerita kemerdekaan dari Bandara Sultan Hasanuddin</h2>
                  <p className="mt-5 text-xl text-black/55">
                    {new Date(selected.createdAt).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </p>
                  <p className="mt-8 text-xl font-bold text-black/35">{index + 1} / {visibleItems.length}</p>
                </figcaption>
              </figure>
            ) : (
              <article className="gallery-item-enter relative grid size-full place-items-center overflow-hidden rounded-[2.25rem] bg-warm-white p-12 text-center text-ink" key={selected.id}>
                <div className="absolute -top-28 -right-24 size-80 rounded-full bg-brand-red/10" />
                <div className="relative max-w-6xl">
                  <p className="text-xl font-bold tracking-[0.18em] text-brand-red uppercase">Harapan untuk Indonesia</p>
                  <blockquote className="mt-8 text-5xl leading-tight font-bold xl:text-7xl">
                    “{selected.entry.message}”
                  </blockquote>
                  <div className="mx-auto mt-10 h-1 w-36 rounded-full bg-brand-red" />
                  <p className="mt-7 text-3xl font-bold">{selected.entry.display_name}</p>
                  <p className="text-2xl text-black/55">{selected.entry.origin}</p>
                  <p className="mt-7 text-xl font-bold text-black/30">{index + 1} / {visibleItems.length}</p>
                </div>
              </article>
            )}

            {visibleItems.length > 1 && (
              <>
                <button className="gallery-arrow left-8" type="button" onClick={() => move(-1)} aria-label="Karya sebelumnya">‹</button>
                <button className="gallery-arrow right-8" type="button" onClick={() => move(1)} aria-label="Karya berikutnya">›</button>
              </>
            )}
          </div>

          <div className="gallery-filmstrip kiosk-scrollbar flex gap-3 overflow-x-auto rounded-[2rem] bg-white/8 p-3" aria-label="Daftar karya galeri">
            {visibleItems.map((item, itemIndex) => (
              <button
                className={`relative aspect-video h-32 shrink-0 overflow-hidden rounded-2xl border-4 text-left transition ${
                  itemIndex === index ? "border-brand-red shadow-xl" : "border-transparent opacity-65"
                }`}
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                aria-label={`Tampilkan karya ${itemIndex + 1}`}
                aria-current={itemIndex === index}
              >
                {item.kind === "photo" ? (
                  <img
                    className="size-full object-cover"
                    src={approvedPhotoContentUrl(item.photo.id)}
                    alt=""
                    loading="lazy"
                    draggable="false"
                  />
                ) : (
                  <span className="grid size-full place-items-center bg-warm-white p-3 text-center text-sm font-bold text-ink">
                    “{item.entry.message.slice(0, 64)}{item.entry.message.length > 64 ? "…" : ""}”
                  </span>
                )}
                <span className="absolute right-2 bottom-2 rounded-full bg-ink/75 px-2 py-1 text-xs font-bold text-white">
                  {item.kind === "photo" ? "Foto" : "Harapan"}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
