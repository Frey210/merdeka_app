interface FullscreenRecoveryProps {
  visible: boolean;
  onRecover: () => void;
}

export function FullscreenRecovery({ visible, onRecover }: FullscreenRecoveryProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-ink/90 p-8 text-center text-white">
      <button
        className="max-w-3xl rounded-[3rem] border-4 border-white/30 bg-brand-red px-14 py-12 shadow-2xl"
        type="button"
        onClick={onRecover}
      >
        <span className="block text-xl font-bold tracking-[0.18em] uppercase">Mode kiosk terjeda</span>
        <strong className="mt-3 block text-5xl">Sentuh untuk kembali ke layar penuh</strong>
      </button>
    </div>
  );
}
