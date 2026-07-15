interface BrandHeaderProps {
  onHome?: () => void;
}

export function BrandHeader({ onHome }: BrandHeaderProps) {
  const content = (
    <>
      <div className="flex items-center gap-5 lg:gap-8">
        <img
          className="h-9 w-auto object-contain lg:h-12"
          src="/branding/injourney.png"
          alt="InJourney Airports"
        />
        <span className="h-10 w-px bg-black/15" aria-hidden="true" />
        <img
          className="h-9 w-auto object-contain lg:h-12"
          src="/branding/upg.png"
          alt="Bandara Sultan Hasanuddin Makassar"
        />
      </div>
      <img
        className="h-16 w-auto object-contain lg:h-24"
        src="/branding/hut-ri-81.png"
        alt="HUT ke-81 Republik Indonesia"
      />
    </>
  );

  return (
    <header className="flex min-h-24 items-center justify-between gap-8" aria-label="Identitas penyelenggara">
      {onHome ? (
        <button
          className="contents focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-8 focus-visible:outline-brand-red"
          type="button"
          onClick={onHome}
          aria-label="Kembali ke menu utama"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </header>
  );
}

