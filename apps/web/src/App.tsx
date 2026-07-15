const features = [
  { title: "Jejak Sejarah", description: "Jelajahi perjalanan menuju kemerdekaan Indonesia." },
  { title: "Harapan untuk Bangsa", description: "Sampaikan harapanmu untuk Indonesia." },
  { title: "Photobooth Merdeka", description: "Buat foto bertema HUT RI dan unduh melalui QR." },
];

export function App() {
  return (
    <main className="min-h-screen bg-brand-red text-white">
      <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-10 py-8 lg:px-20 lg:py-12">
        <header className="flex items-center justify-between gap-8" aria-label="Identitas penyelenggara">
          <div className="flex items-center gap-8">
            <img className="h-12 w-auto object-contain lg:h-16" src="/branding/injourney.png" alt="InJourney Airports" />
            <img className="h-12 w-auto object-contain lg:h-16" src="/branding/upg.png" alt="Bandara Sultan Hasanuddin Makassar" />
          </div>
          <img className="h-24 w-auto object-contain lg:h-36" src="/branding/hut-ri-81.png" alt="HUT ke-81 Republik Indonesia" />
        </header>

        <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-4xl text-left">
            <p className="mb-5 text-2xl font-bold uppercase tracking-[0.15em]">Indonesia Berdaulat, Adil dan Makmur</p>
            <h1 className="text-7xl font-bold leading-[0.95] lg:text-[7rem]">Gema Kemerdekaan RI</h1>
            <p className="mt-8 max-w-2xl text-3xl leading-snug">Sentuh layar untuk merayakan kemerdekaan bersama di Bandara Sultan Hasanuddin.</p>
            <button className="mt-10 min-h-20 rounded-full bg-white px-12 py-5 text-3xl font-bold text-brand-red shadow-xl transition-transform active:scale-95" type="button">
              Sentuh untuk Memulai
            </button>
          </div>

          <div className="grid gap-5" aria-label="Fitur aplikasi">
            {features.map((feature, index) => (
              <article className="rounded-[2rem] border border-white/35 bg-black/10 p-7 backdrop-blur-sm" key={feature.title}>
                <div className="flex items-start gap-6">
                  <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white text-2xl font-bold text-brand-red">{index + 1}</span>
                  <div>
                    <h2 className="text-3xl font-bold">{feature.title}</h2>
                    <p className="mt-2 text-2xl leading-snug text-white/90">{feature.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

