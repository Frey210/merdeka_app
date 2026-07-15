import { useCallback, useState } from "react";
import { BrandHeader } from "./components/BrandHeader";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { ComingSoonScreen } from "./screens/ComingSoonScreen";
import { IdleScreen } from "./screens/IdleScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { TimelineScreen } from "./screens/TimelineScreen";

export type AppScreen =
  | "idle"
  | "menu"
  | "timeline"
  | "guestbook"
  | "camera"
  | "preview"
  | "download";

const INTERACTION_TIMEOUT_MS = 90_000;

export function App() {
  const [screen, setScreen] = useState<AppScreen>("idle");
  const resetToIdle = useCallback(() => setScreen("idle"), []);

  useIdleTimeout({
    enabled: screen !== "idle",
    timeoutMs: INTERACTION_TIMEOUT_MS,
    onTimeout: resetToIdle,
  });

  if (screen === "idle") {
    return <IdleScreen onStart={() => setScreen("menu")} />;
  }

  return (
    <main className="min-h-screen bg-warm-white text-ink">
      <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-8 py-6 lg:px-16 lg:py-8">
        <BrandHeader onHome={() => setScreen("menu")} />

        {screen === "menu" && <MenuScreen onNavigate={setScreen} />}
        {screen === "timeline" && <TimelineScreen onBack={() => setScreen("menu")} />}
        {screen === "guestbook" && (
          <ComingSoonScreen
            eyebrow="Tulis Harapan"
            title="Ruang untuk harapanmu sedang kami siapkan."
            onBack={() => setScreen("menu")}
          />
        )}
        {screen === "camera" && (
          <ComingSoonScreen
            eyebrow="Photobooth Merdeka"
            title="Kamera dan twibbon akan hadir pada tahap berikutnya."
            onBack={() => setScreen("menu")}
          />
        )}
      </div>
    </main>
  );
}

