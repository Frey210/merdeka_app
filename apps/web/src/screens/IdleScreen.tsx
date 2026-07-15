import { BrandHeader } from "../components/BrandHeader";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { HopeCarousel } from "../components/HopeCarousel";

interface IdleScreenProps {
  onStart: () => void;
}

export function IdleScreen({ onStart }: IdleScreenProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-brand-red text-white">
      <div className="pointer-events-none absolute -right-40 -top-48 size-[44rem] rounded-full border-[7rem] border-white/10" />
      <div className="pointer-events-none absolute -bottom-72 -left-40 size-[48rem] rounded-full border-[8rem] border-black/10" />

      <button
        className="relative z-10 block min-h-screen w-full text-left focus-visible:outline focus-visible:outline-8 focus-visible:outline-inset focus-visible:outline-white"
        type="button"
        onClick={onStart}
        aria-label="Sentuh untuk memulai pengalaman Gema Kemerdekaan RI"
      >
        <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-8 py-6 lg:px-16 lg:py-8">
          <BrandHeader hutLogoVariant="white" />
          <section className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="max-w-5xl">
              <p className="mb-5 text-2xl font-bold uppercase tracking-[0.16em] lg:text-3xl">
                Indonesia Berdaulat, Adil dan Makmur
              </p>
              <h1 className="text-7xl font-bold leading-[0.9] lg:text-[8.5rem]">Gema Kemerdekaan RI</h1>
              <p className="mt-8 max-w-3xl text-3xl leading-snug lg:text-4xl">
                Rayakan kemerdekaan bersama di Bandara Sultan Hasanuddin Makassar.
              </p>
              <span className="mt-12 inline-flex min-h-20 items-center rounded-full bg-white px-12 py-5 text-3xl font-bold text-brand-red shadow-2xl lg:text-4xl">
                Sentuh layar untuk memulai
              </span>
            </div>

            <HopeCarousel />
          </section>
        </div>
      </button>
      <ConnectionStatus />
    </main>
  );
}
