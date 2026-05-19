import { describe, expect, it } from "vitest";
import {
  emptyRotationalCounts,
  incrementRotationalCount,
  parseRotationalCounts,
} from "../../src/domain/snapshot/rotational-counts.js";

describe("rotational-counts", () => {
  it("parseRotationalCounts rejects invalid shapes", () => {
    expect(parseRotationalCounts(null)).toEqual({});
    expect(parseRotationalCounts([])).toEqual({});
    expect(parseRotationalCounts({ t1: "bad" })).toEqual({});
  });

  it("parseRotationalCounts keeps numeric member counts", () => {
    const parsed = parseRotationalCounts({
      type1: { m1: 2, m2: 0, bad: NaN },
    });
    expect(parsed).toEqual({ type1: { m1: 2, m2: 0 } });
  });

  it("incrementRotationalCount accumulates", () => {
    const counts = emptyRotationalCounts();
    incrementRotationalCount(counts, "typeA", "member1");
    incrementRotationalCount(counts, "typeA", "member1");
    expect(counts.typeA?.member1).toBe(2);
  });
});
