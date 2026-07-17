import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KioskKeyboard } from "./KioskKeyboard";

afterEach(cleanup);

describe("KioskKeyboard", () => {
  it("types through touchscreen keys and can be dismissed", () => {
    const onChange = vi.fn();
    const onClose = vi.fn();

    render(
      <KioskKeyboard
        value=""
        onChange={onChange}
        onClose={onClose}
        maxLength={20}
        label="Nama"
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "a" }));
    fireEvent.pointerUp(screen.getByRole("button", { name: "a" }));
    expect(onChange.mock.lastCall?.[0]).toBe("a");

    fireEvent.click(screen.getByRole("button", { name: "Tutup keyboard layar" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses Enter as a new line for the hope message", () => {
    const onChange = vi.fn();

    render(
      <KioskKeyboard
        value="Maju"
        onChange={onChange}
        onClose={vi.fn()}
        maxLength={240}
        multiline
        label="Harapan untuk Indonesia"
      />,
    );

    fireEvent.pointerDown(screen.getByRole("button", { name: "Baris baru" }));
    fireEvent.pointerUp(screen.getByRole("button", { name: "Baris baru" }));
    expect(onChange.mock.lastCall?.[0]).toBe("Maju\n");
  });

  it("returns Shift to lowercase after one uppercase character", () => {
    render(<KioskKeyboard value="" onChange={vi.fn()} onClose={vi.fn()} maxLength={20} label="Nama" />);

    const shift = screen.getByRole("button", { name: "Shift" });
    fireEvent.pointerDown(shift);
    fireEvent.pointerUp(shift);
    const uppercaseA = screen.getByRole("button", { name: "A" });
    fireEvent.pointerDown(uppercaseA);
    fireEvent.pointerUp(uppercaseA);

    expect(screen.getByRole("button", { name: "a" })).toBeInTheDocument();
  });

  it("keeps Caps active and provides a symbols layout", () => {
    render(<KioskKeyboard value="" onChange={vi.fn()} onClose={vi.fn()} maxLength={20} label="Nama" />);

    const caps = screen.getByRole("button", { name: "Caps" });
    fireEvent.pointerDown(caps);
    fireEvent.pointerUp(caps);
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();

    const symbols = screen.getByRole("button", { name: "!@#" });
    fireEvent.pointerDown(symbols);
    fireEvent.pointerUp(symbols);
    expect(screen.getByRole("button", { name: "@" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ABC" })).toBeInTheDocument();
  });
});
