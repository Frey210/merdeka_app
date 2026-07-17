import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminApp } from "./AdminApp";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminApp", () => {
  it("menampilkan foto privat tanpa tindakan publikasi", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith("/admin/session")) {
        return Response.json({ email: "admin@example.test", subject: "test" });
      }
      if (url.includes("/admin/photos?")) {
        return Response.json([
          {
            id: "photo-id",
            public_consent: false,
            status: "pending",
            created_at: "2026-07-16T00:00:00Z",
            expires_at: "2026-07-23T00:00:00Z",
            reviewed_at: null,
            reviewed_by: null,
          },
        ]);
      }
      return Response.json([]);
    });
    render(<AdminApp />);

    fireEvent.click(screen.getByRole("button", { name: "Foto" }));

    expect(await screen.findByAltText(/foto photobooth untuk moderasi/i)).toBeInTheDocument();
    expect(screen.getByText("Privat")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tampilkan/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Hapus" })).toBeInTheDocument();
  });

  it("menampilkan dan dapat menyembunyikan skor leaderboard", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/admin/session")) {
        return Response.json({ email: "admin@example.test", subject: "test" });
      }
      if (url.includes("/admin/leaderboard/score-id") && init?.method === "PATCH") {
        return Response.json({
          id: "score-id",
          display_name: "Garuda81",
          score: 810,
          created_at: "2026-07-16T00:00:00Z",
          hidden_at: "2026-07-16T01:00:00Z",
        });
      }
      if (url.includes("/admin/leaderboard?")) {
        return Response.json([
          {
            id: "score-id",
            display_name: "Garuda81",
            score: 810,
            created_at: "2026-07-16T00:00:00Z",
            hidden_at: null,
          },
        ]);
      }
      return Response.json([]);
    });
    render(<AdminApp />);

    fireEvent.click(screen.getByRole("button", { name: "Leaderboard" }));
    expect(await screen.findByText("Garuda81")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sembunyikan" }));

    expect(await screen.findByRole("button", { name: "Pulihkan" })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/admin/leaderboard/score-id",
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
