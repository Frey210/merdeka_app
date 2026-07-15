import type { AppScreen } from "../App";
import { ConnectionStatus } from "../components/ConnectionStatus";

interface MenuScreenProps {
  onNavigate: (screen: AppScreen) => void;
}

const menuItems: { screen: AppScreen; number: string; title: string; description: string }[] = [
  {
    screen: "timeline",
    number: "01",
    title: "Jejak Sejarah",
    description: "Kenali enam momentum perjalanan bangsa menuju kedaulatan.",
  },
  {
    screen: "guestbook",
    number: "02",
    title: "Harapan untuk Bangsa",
    description: "Tuliskan harapan terbaikmu untuk Indonesia.",
  },
  {
    screen: "camera",
    number: "03",
    title: "Photobooth Merdeka",
    description: "Abadikan momen dengan bingkai HUT RI ke-81.",
  },
];

export function MenuScreen({ onNavigate }: MenuScreenProps) {
  return (
    <section className="flex flex-1 flex-col justify-center py-8 lg:py-12">
      <div className="mb-10 flex items-end justify-between gap-8">
        <div>
          <p className="text-xl font-bold uppercase tracking-[0.18em] text-brand-red lg:text-2xl">Pilih pengalamanmu</p>
          <h1 className="mt-2 text-5xl font-bold leading-none lg:text-7xl">Mari Rayakan Bersama</h1>
        </div>
        <p className="hidden max-w-md text-right text-2xl leading-snug text-ink/65 xl:block">
          Semua aktivitas dirancang singkat agar tetap nyaman di sela perjalananmu.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {menuItems.map((item, index) => (
          <button
            className="group flex min-h-[25rem] flex-col rounded-[2.5rem] border-2 border-black/10 bg-white p-8 text-left shadow-[0_1.5rem_4rem_rgba(0,0,0,0.08)] transition duration-200 hover:-translate-y-2 hover:border-brand-red focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-brand-red active:translate-y-0 lg:p-10"
            key={item.screen}
            type="button"
            onClick={() => onNavigate(item.screen)}
          >
            <span className="text-2xl font-bold text-brand-red">{item.number}</span>
            <span className="mt-auto text-4xl font-bold leading-tight lg:text-5xl">{item.title}</span>
            <span className="mt-5 text-2xl leading-snug text-ink/65">{item.description}</span>
            <span className="mt-8 text-2xl font-bold text-brand-red" aria-hidden="true">
              Buka <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
            </span>
            {index === 0 && <span className="sr-only">Tersedia sekarang</span>}
          </button>
        ))}
      </div>
      <ConnectionStatus />
    </section>
  );
}

