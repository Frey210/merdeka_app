import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HopeCarousel } from "./HopeCarousel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HopeCarousel", () => {
  it("hanya meminta feed approved dan menampilkan harapan publik", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json([
        {
          id: "approved-id",
          display_name: "Ayu",
          origin: "Maros",
          message: "Semoga Indonesia semakin maju dan sejahtera.",
          created_at: "2026-07-16T00:00:00Z",
        },
      ]),
    );

    render(<HopeCarousel />);

    expect(await screen.findByText(/semoga indonesia semakin maju/i)).toBeInTheDocument();
    expect(screen.getByText("Ayu")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/guestbook/approved?limit=20",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
