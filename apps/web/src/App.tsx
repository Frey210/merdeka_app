import { useCallback, useState } from "react";
import { BrandHeader } from "./components/BrandHeader";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { GuestBookScreen } from "./screens/GuestBookScreen";
import { IdleScreen } from "./screens/IdleScreen";
import { MenuScreen } from "./screens/MenuScreen";
import { PhotoBoothScreen } from "./screens/PhotoBoothScreen";
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
        {screen === "guestbook" && <GuestBookScreen onBack={() => setScreen("menu")} />}
        {screen === "camera" && <PhotoBoothScreen onBack={() => setScreen("menu")} />}
      </div>
    </main>
  );
}
