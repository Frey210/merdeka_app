import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { KioskKeyboard } from "./KioskKeyboard";

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
});
