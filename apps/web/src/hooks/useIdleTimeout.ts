import { useEffect } from "react";

interface IdleTimeoutOptions {
  enabled: boolean;
  timeoutMs: number;
  onTimeout: () => void;
}

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];

export function useIdleTimeout({ enabled, timeoutMs, onTimeout }: IdleTimeoutOptions) {
  useEffect(() => {
    if (!enabled) return;

    let timer = window.setTimeout(onTimeout, timeoutMs);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(onTimeout, timeoutMs);
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, reset, { passive: true });
    }

    return () => {
      window.clearTimeout(timer);
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, reset);
      }
    };
  }, [enabled, onTimeout, timeoutMs]);
}

