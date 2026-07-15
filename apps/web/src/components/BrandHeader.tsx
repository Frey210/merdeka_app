interface BrandHeaderProps {
  onHome?: () => void;
  hutLogoVariant?: "default" | "white";
}

export function BrandHeader({ onHome, hutLogoVariant = "default" }: BrandHeaderProps) {
  const content = (
    <>
      <div
        className="relative isolate overflow-hidden rounded-[2rem_3.5rem] border border-white/70 bg-white/95 px-5 py-3 shadow-[0_16px_40px_rgba(16,16,16,0.16)] backdrop-blur-sm lg:px-7 lg:py-4"
        data-testid="brand-logo-panel"
      >
        <span
          className="absolute -left-8 -top-10 h-20 w-24 rounded-full bg-brand-red/8 blur-xl"
          aria-hidden="true"
        />
        <span
          className="absolute -bottom-12 -right-8 h-20 w-24 rounded-full bg-black/5 blur-xl"
          aria-hidden="true"
        />

        <div className="relative grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)_1px_minmax(0,1fr)] items-center">
          <div className="flex h-12 w-28 items-center justify-center px-2 lg:h-16 lg:w-40 lg:px-3">
            <img
              className="max-h-full w-full object-contain"
              src="/branding/danantara.svg"
              alt="Danantara Indonesia"
            />
          </div>
          <span className="h-9 bg-black/12 lg:h-11" aria-hidden="true" />
          <div className="flex h-12 w-28 items-center justify-center px-2 lg:h-16 lg:w-40 lg:px-3">
            <img
              className="w-full object-contain"
              src="/branding/injourney.png"
              alt="InJourney Airports"
            />
          </div>
          <span className="h-9 bg-black/12 lg:h-11" aria-hidden="true" />
          <div className="flex h-12 w-28 items-center justify-center px-2 lg:h-16 lg:w-40 lg:px-3">
            <img
              className="max-h-full w-[145%] max-w-none object-contain"
              src="/branding/upg.png"
              alt="Bandara Sultan Hasanuddin Makassar"
            />
          </div>
        </div>
      </div>
      <div
        className="relative flex h-32 w-60 shrink-0 items-center justify-center lg:h-44 lg:w-[22rem]"
        data-testid="hut-logo-area"
      >
        {hutLogoVariant === "white" && (
          <span
            className="absolute right-0 size-44 rounded-full border-[1.75rem] border-white/10 lg:size-60 lg:border-[2.5rem]"
            aria-hidden="true"
          />
        )}
        <div className="relative h-full w-full overflow-hidden">
          <img
            className="absolute left-1/2 top-1/2 w-[160%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain"
            style={{ filter: hutLogoVariant === "white" ? "brightness(0) invert(1)" : "none" }}
            src="/branding/hut-ri-81-horizontal.png"
            alt="HUT ke-81 Republik Indonesia"
          />
        </div>
      </div>
    </>
  );

  return (
    <header className="flex min-h-44 items-center justify-between gap-8" aria-label="Identitas penyelenggara">
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
