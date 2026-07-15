import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
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

  it("mengirim harapan dan menampilkan konfirmasi moderasi", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "entry-id", status: "pending" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));
    fireEvent.click(screen.getByRole("button", { name: /harapan untuk bangsa/i }));
    fireEvent.change(screen.getByLabelText(/^nama$/i), { target: { value: "Andi" } });
    fireEvent.change(screen.getByLabelText(/asal daerah/i), { target: { value: "Makassar" } });
    fireEvent.change(screen.getByLabelText(/harapan untuk indonesia/i), {
      target: { value: "Semoga Indonesia semakin adil dan makmur." },
    });
    fireEvent.click(screen.getByRole("button", { name: /kirim harapan/i }));

    expect(await screen.findByRole("heading", { name: /terima kasih, andi/i })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/guestbook",
      expect.objectContaining({ method: "POST" }),
    );
    fetchMock.mockRestore();
  });
});
