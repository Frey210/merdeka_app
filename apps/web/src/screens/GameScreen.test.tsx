import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createGameSession: vi.fn(),
  finishGameSession: vi.fn(),
  listLeaderboard: vi.fn(),
  mountDinoGame: vi.fn(),
}));

vi.mock("../components/KioskKeyboard", () => ({ KioskKeyboard: () => null }));
vi.mock("../game/DinoGame", () => ({ mountDinoGame: mocks.mountDinoGame }));
vi.mock("../lib/api", () => ({
  createGameSession: mocks.createGameSession,
  finishGameSession: mocks.finishGameSession,
  listLeaderboard: mocks.listLeaderboard,
}));

import type { DinoGameResult } from "../game/DinoGame";
import { GameScreen } from "./GameScreen";

describe("GameScreen replay lifecycle", () => {
  const callbacks: Array<(result: DinoGameResult) => void> = [];

  beforeEach(() => {
    callbacks.length = 0;
    mocks.createGameSession
      .mockReset()
      .mockResolvedValueOnce({ id: "session-1", seed: 81, expires_at: "2026-08-17T00:05:00Z" })
      .mockResolvedValueOnce({ id: "session-2", seed: 82, expires_at: "2026-08-17T00:05:00Z" });
    mocks.finishGameSession
      .mockReset()
      .mockResolvedValueOnce({ score: 10, rank: 1 })
      .mockResolvedValueOnce({ score: 20, rank: 1 });
    mocks.listLeaderboard.mockReset().mockResolvedValue({ period: "daily", items: [] });
    mocks.mountDinoGame.mockReset().mockImplementation(async (options: { onGameOver: (result: DinoGameResult) => void }) => {
      callbacks.push(options.onGameOver);
      return vi.fn();
    });
  });

  it("starts Main Lagi as a fresh run and keeps its score paired with the new session", async () => {
    render(<GameScreen onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Mulai Berlari" }));
    await waitFor(() => expect(mocks.mountDinoGame).toHaveBeenCalledTimes(1));

    act(() => callbacks[0]({ durationMs: 1_000, score: 10, jumpTimesMs: [500] }));
    fireEvent.change(screen.getByPlaceholderText("Contoh: Garuda81"), { target: { value: "Fariz" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Skor" }));

    expect(await screen.findByText("Skor tersimpan")).toBeInTheDocument();
    expect(mocks.finishGameSession).toHaveBeenLastCalledWith("session-1", {
      display_name: "Fariz",
      duration_ms: 1_000,
      jump_times_ms: [500],
    });

    fireEvent.click(screen.getByRole("button", { name: "Main Lagi" }));
    await waitFor(() => expect(mocks.mountDinoGame).toHaveBeenCalledTimes(2));
    expect(screen.getByLabelText(/Area permainan Dino Merdeka/i)).toBeInTheDocument();

    act(() => callbacks[0]({ durationMs: 99_000, score: 990, jumpTimesMs: [] }));
    expect(screen.queryByText("0990")).not.toBeInTheDocument();

    act(() => callbacks[1]({ durationMs: 2_000, score: 20, jumpTimesMs: [600] }));
    expect(screen.getByText("0020")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contoh: Garuda81")).toHaveValue("");

    fireEvent.change(screen.getByPlaceholderText("Contoh: Garuda81"), { target: { value: "Fariz" } });
    fireEvent.click(screen.getByRole("button", { name: "Simpan Skor" }));
    await waitFor(() => expect(mocks.finishGameSession).toHaveBeenLastCalledWith("session-2", {
      display_name: "Fariz",
      duration_ms: 2_000,
      jump_times_ms: [600],
    }));
  });
});
