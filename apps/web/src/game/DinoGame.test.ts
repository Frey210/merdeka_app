import { describe, expect, it } from "vitest";
import { getGameDurationMs } from "./DinoGame";

describe("getGameDurationMs", () => {
  it("treats zero as a valid Phaser start time", () => {
    expect(getGameDurationMs(1_550, 0)).toBe(1_550);
  });

  it("returns null only before the game clock is initialized", () => {
    expect(getGameDurationMs(1_550, null)).toBeNull();
  });

  it("never returns a negative duration", () => {
    expect(getGameDurationMs(10, 20)).toBe(0);
  });
});
