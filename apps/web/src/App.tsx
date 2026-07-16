import { useCallback, useRef, useState } from "react";
import {
  BackgroundMusic,
  type BackgroundMusicController,
} from "./components/BackgroundMusic";
import { BrandHeader } from "./components/BrandHeader";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { GuestBookScreen } from "./screens/GuestBookScreen";
import { GameScreen } from "./screens/GameScreen";
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
  | "game"
  | "preview"
  | "download";

const INTERACTION_TIMEOUT_MS = 90_000;

export function App() {
  const [screen, setScreen] = useState<AppScreen>("idle");
  const musicRef = useRef<BackgroundMusicController>(null);
  const resetToIdle = useCallback(() => setScreen("idle"), []);

  useIdleTimeout({
    enabled: screen !== "idle",
    timeoutMs: INTERACTION_TIMEOUT_MS,
    onTimeout: resetToIdle,
  });

  const startExperience = () => {
    void musicRef.current?.start();
    setScreen("menu");
  };

  return (
    <>
      <BackgroundMusic ref={musicRef} />
      {screen === "idle" ? (
        <IdleScreen onStart={startExperience} />
      ) : screen === "game" ? (
        <GameScreen onBack={() => setScreen("menu")} />
      ) : (
        <main className="min-h-screen bg-warm-white text-ink">
          <div className="mx-auto flex min-h-screen max-w-[1920px] flex-col px-8 py-6 lg:px-16 lg:py-8">
            <BrandHeader onHome={() => setScreen("menu")} />

            {screen === "menu" && <MenuScreen onNavigate={setScreen} />}
            {screen === "timeline" && <TimelineScreen onBack={() => setScreen("menu")} />}
            {screen === "guestbook" && <GuestBookScreen onBack={() => setScreen("menu")} />}
            {screen === "camera" && <PhotoBoothScreen onBack={() => setScreen("menu")} />}
          </div>
        </main>
      )}
    </>
  );
}
