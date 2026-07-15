interface ComingSoonScreenProps {
  eyebrow: string;
  title: string;
  onBack: () => void;
}

export function ComingSoonScreen({ eyebrow, title, onBack }: ComingSoonScreenProps) {
  return (
    <section className="grid flex-1 place-items-center py-10 text-center">
      <div className="max-w-4xl rounded-[3rem] border-2 border-black/10 bg-white p-14 shadow-2xl">
        <p className="text-2xl font-bold uppercase tracking-[0.18em] text-brand-red">{eyebrow}</p>
        <h1 className="mt-5 text-5xl font-bold leading-tight lg:text-7xl">{title}</h1>
        <p className="mx-auto mt-7 max-w-2xl text-2xl leading-relaxed text-ink/65">
          Fitur ini sudah masuk rencana implementasi dan akan dibuka setelah pengujian privasi serta perangkat selesai.
        </p>
        <button className="touch-button-primary mt-10" type="button" onClick={onBack}>
          Kembali ke Menu
        </button>
      </div>
    </section>
  );
}

