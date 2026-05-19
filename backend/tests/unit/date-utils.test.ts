import { describe, expect, it } from "vitest";
import {
  datesOverlap,
  formatDateOnly,
  isFutureDateOnly,
  parseDateOnly,
  todayUtcDateOnly,
} from "../../src/domain/snapshot/date-utils.js";

describe("date-utils", () => {
  it("parseDateOnly accepts YYYY-MM-DD UTC", () => {
    const d = parseDateOnly("2026-05-19");
    expect(d.toISOString()).toBe("2026-05-19T00:00:00.000Z");
  });

  it("parseDateOnly rejects invalid format", () => {
    expect(() => parseDateOnly("19-05-2026")).toThrow();
    expect(() => parseDateOnly("2026/05/19")).toThrow();
  });

  it("formatDateOnly round-trips", () => {
    expect(formatDateOnly(parseDateOnly("2026-01-02"))).toBe("2026-01-02");
  });

  it("datesOverlap detects partial and contained ranges", () => {
    const a1 = parseDateOnly("2026-05-01");
    const a2 = parseDateOnly("2026-05-10");
    const b1 = parseDateOnly("2026-05-05");
    const b2 = parseDateOnly("2026-05-15");
    expect(datesOverlap(a1, a2, b1, b2)).toBe(true);
    expect(datesOverlap(a1, a2, parseDateOnly("2026-05-11"), b2)).toBe(false);
    expect(datesOverlap(a1, a2, a1, a2)).toBe(true);
  });

  it("datesOverlap treats touching boundaries as overlap", () => {
    const end = parseDateOnly("2026-05-10");
    const start = parseDateOnly("2026-05-10");
    expect(
      datesOverlap(
        parseDateOnly("2026-05-01"),
        end,
        start,
        parseDateOnly("2026-05-20")
      )
    ).toBe(true);
  });

  it("isFutureDateOnly compares to today UTC", () => {
    const tomorrow = new Date(todayUtcDateOnly());
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    expect(isFutureDateOnly(tomorrow)).toBe(true);
    expect(isFutureDateOnly(todayUtcDateOnly())).toBe(false);
  });
});
