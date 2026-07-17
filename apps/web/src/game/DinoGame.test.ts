import { describe, expect, it } from "vitest";
import {
  advanceGameDurationMs,
  getStartCountdownCue,
  selectObstacleTexture,
  START_COUNTDOWN_STEP_MS,
} from "./DinoGame";

describe("advanceGameDurationMs", () => {
  it("starts every game instance from zero", () => {
    expect(advanceGameDurationMs(0, 16)).toBe(16);
  });

  it("accumulates only the frame delta instead of a global clock value", () => {
    expect(advanceGameDurationMs(1_550, 16)).toBe(1_566);
  });

  it("ignores negative deltas and caps a run at two minutes", () => {
    expect(advanceGameDurationMs(10, -20)).toBe(10);
    expect(advanceGameDurationMs(119_990, 20)).toBe(120_000);
  });
});

describe("getStartCountdownCue", () => {
  it("shows Bersedia, Siap, and Mulai before the run begins", () => {
    expect(getStartCountdownCue(0)).toBe("BERSEDIA");
    expect(getStartCountdownCue(START_COUNTDOWN_STEP_MS)).toBe("SIAP");
    expect(getStartCountdownCue(START_COUNTDOWN_STEP_MS * 2)).toBe("MULAI!");
    expect(getStartCountdownCue(START_COUNTDOWN_STEP_MS * 3)).toBeNull();
  });
});

describe("selectObstacleTexture", () => {
  it("introduces the low plane only after the player learns the ground obstacles", () => {
    expect(selectObstacleTexture(5_999, 0.1)).toBe("obstacle-suitcase");
    expect(selectObstacleTexture(6_000, 0.1)).toBe("obstacle-plane");
  });

  it("keeps cone and suitcase variants in the obstacle rotation", () => {
    expect(selectObstacleTexture(10_000, 0.4)).toBe("obstacle-suitcase");
    expect(selectObstacleTexture(10_000, 0.8)).toBe("obstacle-cone");
  });
});
