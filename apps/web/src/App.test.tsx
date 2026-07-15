import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  vi.useRealTimers();
});

describe("App", () => {
  it("berpindah dari idle ke menu lalu membuka timeline", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));
    expect(screen.getByRole("heading", { name: /mari rayakan bersama/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /jejak sejarah/i }));
    expect(screen.getByRole("heading", { name: /kebangkitan nasional/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /peristiwa berikutnya/i }));
    expect(screen.getByRole("heading", { name: /sumpah pemuda/i })).toBeInTheDocument();
  });

  it("kembali ke idle setelah 90 detik tanpa aktivitas", () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));
    expect(screen.getByRole("heading", { name: /mari rayakan bersama/i })).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(90_000));

    expect(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i })).toBeInTheDocument();
  });
});
