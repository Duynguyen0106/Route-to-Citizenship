import { describe, expect, it } from "vitest";
import { BRAND_MARK_WAYPOINTS } from "../components/BrandMark";
import { PRINT_COLOURS } from "../lib/print-theme";

describe("brand mark", () => {
  it("uses three waypoints for visa, ILR and citizenship", () => {
    expect(Object.keys(BRAND_MARK_WAYPOINTS)).toEqual(["visa", "ilr", "citizenship"]);
    expect(BRAND_MARK_WAYPOINTS.visa.fill).toBe(PRINT_COLOURS.paper);
    expect(BRAND_MARK_WAYPOINTS.ilr.fill).toBe(PRINT_COLOURS.gold);
    expect(BRAND_MARK_WAYPOINTS.citizenship.fill).toBe(PRINT_COLOURS.moss);
  });

  it("climbs from visa (lower left) to citizenship (upper right)", () => {
    const { visa, ilr, citizenship } = BRAND_MARK_WAYPOINTS;
    expect(visa.cy).toBeGreaterThan(ilr.cy);
    expect(ilr.cy).toBeGreaterThan(citizenship.cy);
    expect(visa.cx).toBeLessThan(ilr.cx);
    expect(ilr.cx).toBeLessThan(citizenship.cx);
  });
});
