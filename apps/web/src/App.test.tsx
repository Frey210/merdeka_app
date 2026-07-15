import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
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
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("/guestbook/approved")) return Response.json([]);
      return new Response(JSON.stringify({ id: "entry-id", status: "pending" }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    });
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

  it("membuka pemberitahuan privasi photobooth sebelum kamera", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));
    fireEvent.click(screen.getByRole("button", { name: /photobooth merdeka/i }));

    expect(screen.getByRole("heading", { name: /siap berfoto/i })).toBeInTheDocument();
    expect(screen.getByText(/foto disimpan privat maksimal 7 hari/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("memasang stream setelah elemen video selesai dirender", async () => {
    const stop = vi.fn();
    const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    const getUserMedia = vi.fn().mockResolvedValue(stream);
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia },
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const { container } = render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));
    fireEvent.click(screen.getByRole("button", { name: /photobooth merdeka/i }));
    fireEvent.click(screen.getByRole("button", { name: /aktifkan kamera/i }));

    const video = await waitFor(() => {
      const element = container.querySelector("video");
      expect(element).not.toBeNull();
      expect(element?.srcObject).toBe(stream);
      return element as HTMLVideoElement;
    });
    Object.defineProperty(video, "videoWidth", { configurable: true, value: 1280 });
    Object.defineProperty(video, "videoHeight", { configurable: true, value: 720 });
    fireEvent.loadedMetadata(video);

    expect(await screen.findByText("Kamera siap")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ambil Foto" })).toBeEnabled();
  });

  it("memulai BGM setelah sentuhan pertama dan menyediakan tombol jeda", async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    render(<App />);

    expect(screen.queryByText("Hari Merdeka")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /sentuh untuk memulai pengalaman/i }));

    const pauseButton = await screen.findByRole("button", { name: /jeda musik latar/i });
    expect(play).toHaveBeenCalled();
    expect(screen.getByText("Hari Merdeka")).toBeInTheDocument();
    fireEvent.click(pauseButton);
    expect(pause).toHaveBeenCalled();
  });
});
