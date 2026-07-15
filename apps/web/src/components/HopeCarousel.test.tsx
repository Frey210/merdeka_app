import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HopeCarousel } from "./HopeCarousel";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HopeCarousel", () => {
  it("hanya meminta feed approved dan menampilkan harapan publik", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("/photos/approved")) return Response.json([]);
      return Response.json([
        {
          id: "approved-id",
          display_name: "Ayu",
          origin: "Maros",
          message: "Semoga Indonesia semakin maju dan sejahtera.",
          created_at: "2026-07-16T00:00:00Z",
        },
      ]);
    });

    render(<HopeCarousel />);

    expect(await screen.findByText(/semoga indonesia semakin maju/i)).toBeInTheDocument();
    expect(screen.getByText("Ayu")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/guestbook/approved?limit=20",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/photos/approved?limit=20",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("merotasi harapan dan foto publik", async () => {
    vi.useFakeTimers();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("/photos/approved")) {
        return Response.json([{ id: "photo-id", created_at: "2026-07-16T01:00:00Z" }]);
      }
      return Response.json([
        {
          id: "hope-id",
          display_name: "Ayu",
          origin: "Maros",
          message: "Semoga Indonesia semakin maju dan sejahtera.",
          created_at: "2026-07-16T00:00:00Z",
        },
      ]);
    });

    render(<HopeCarousel />);
    await act(async () => Promise.resolve());
    expect(screen.getByAltText(/foto merdeka pengunjung/i)).toHaveAttribute(
      "src",
      "/api/v1/photos/approved/photo-id/content",
    );

    act(() => vi.advanceTimersByTime(8_000));
    expect(screen.getByText(/semoga indonesia semakin maju/i)).toBeInTheDocument();
  });
});
