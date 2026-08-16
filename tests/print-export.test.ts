import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { PRINT_COLOURS } from "../lib/print-theme";

describe("PDF / print export colour", () => {
  const css = readFileSync(path.join(process.cwd(), "app/globals.css"), "utf8");

  it("asks the browser to keep brand colour instead of greyscale", () => {
    expect(css).toMatch(/print-color-adjust:\s*exact/);
    expect(css).toMatch(/-webkit-print-color-adjust:\s*exact/);
  });

  it("prints on paper with navy, gold and moss rather than forcing black on white", () => {
    expect(css.toLowerCase()).toContain(PRINT_COLOURS.navy.toLowerCase());
    expect(css.toLowerCase()).toContain(PRINT_COLOURS.paper.toLowerCase());
    expect(css.toLowerCase()).toContain(PRINT_COLOURS.gold.toLowerCase());
    expect(css).not.toMatch(/@media print\s*\{[^}]*color:\s*#111/);
  });

  it("uses the same navy as the on-screen brand", () => {
    expect(PRINT_COLOURS.navy).toBe("#1B2A4A");
    expect(PRINT_COLOURS.gold).toBe("#C4A35A");
    expect(PRINT_COLOURS.moss).toBe("#2F5D45");
    expect(PRINT_COLOURS.clay).toBe("#B85C38");
  });
});
