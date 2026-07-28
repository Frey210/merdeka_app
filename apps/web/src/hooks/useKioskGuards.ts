import { useCallback, useEffect, useRef, useState } from "react";

export function useKioskGuards() {
  const [fullscreenLost, setFullscreenLost] = useState(false);
  const fullscreenSessionStarted = useRef(false);

  useEffect(() => {
    document.body.classList.add("kiosk-guard-active");

    const preventDefault = (event: Event) => event.preventDefault();
    const preventMultiTouch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    const preventContextKey = (event: KeyboardEvent) => {
      if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
        event.preventDefault();
      }
    };
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        fullscreenSessionStarted.current = true;
        setFullscreenLost(false);
      } else if (fullscreenSessionStarted.current) {
        setFullscreenLost(true);
      }
    };

    window.addEventListener("contextmenu", preventDefault);
    window.addEventListener("dblclick", preventDefault);
    window.addEventListener("dragstart", preventDefault);
    window.addEventListener("gesturestart", preventDefault);
    window.addEventListener("gesturechange", preventDefault);
    window.addEventListener("gestureend", preventDefault);
    window.addEventListener("touchmove", preventMultiTouch, { passive: false });
    window.addEventListener("keydown", preventContextKey);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.body.classList.remove("kiosk-guard-active");
      window.removeEventListener("contextmenu", preventDefault);
      window.removeEventListener("dblclick", preventDefault);
      window.removeEventListener("dragstart", preventDefault);
      window.removeEventListener("gesturestart", preventDefault);
      window.removeEventListener("gesturechange", preventDefault);
      window.removeEventListener("gestureend", preventDefault);
      window.removeEventListener("touchmove", preventMultiTouch);
      window.removeEventListener("keydown", preventContextKey);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const enterFullscreen = useCallback(async () => {
    if (!import.meta.env.PROD || document.fullscreenElement || !document.fullscreenEnabled) return;
    try {
      await document.documentElement.requestFullscreen();
      fullscreenSessionStarted.current = true;
      setFullscreenLost(false);
    } catch {
      // Browser kiosk mode may already own fullscreen and reject the DOM request.
      setFullscreenLost(false);
    }
  }, []);

  return { enterFullscreen, fullscreenLost };
}
