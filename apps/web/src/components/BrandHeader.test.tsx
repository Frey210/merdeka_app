import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BrandHeader } from "./BrandHeader";

afterEach(cleanup);

describe("BrandHeader", () => {
  it("menampilkan tiga logo penyelenggara dalam satu panel", () => {
    render(<BrandHeader />);

    expect(screen.getByAltText("Danantara Indonesia")).toBeInTheDocument();
    expect(screen.getByAltText("InJourney Airports")).toBeInTheDocument();
    expect(screen.getByAltText("Bandara Sultan Hasanuddin Makassar")).toBeInTheDocument();
    expect(screen.getByTestId("brand-logo-panel")).toHaveClass("bg-white/95");
  });

  it("tetap menjadikan seluruh identitas sebagai tombol kembali", () => {
    const onHome = vi.fn();
    render(<BrandHeader onHome={onHome} />);

    screen.getByRole("button", { name: "Kembali ke menu utama" }).click();
    expect(onHome).toHaveBeenCalledOnce();
  });

  it("mendukung logo HUT putih untuk latar merah", () => {
    render(<BrandHeader hutLogoVariant="white" />);

    expect(screen.getByAltText("HUT ke-81 Republik Indonesia")).toHaveStyle({
      filter: "brightness(0) invert(1)",
    });
    expect(screen.getByTestId("hut-logo-area")).toContainElement(
      screen.getByAltText("HUT ke-81 Republik Indonesia"),
    );
  });

  it("memakai warna asli logo HUT di halaman terang", () => {
    render(<BrandHeader />);

    expect(screen.getByAltText("HUT ke-81 Republik Indonesia")).toHaveStyle({ filter: "none" });
    expect(screen.getByAltText("HUT ke-81 Republik Indonesia")).toHaveAttribute(
      "src",
      "/branding/hut-ri-81-horizontal.png",
    );
  });
});
