import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminApp } from "./AdminApp";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("AdminApp", () => {
  it("menampilkan antrean foto dan melarang approve foto privat", async () => {
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
    expect(screen.getByRole("button", { name: "Setujui" })).toBeDisabled();
  });
});
