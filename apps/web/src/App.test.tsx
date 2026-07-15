import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("menampilkan ajakan memulai", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /sentuh untuk memulai/i })).toBeInTheDocument();
  });
});
