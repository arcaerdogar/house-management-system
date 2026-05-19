import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { aggregatePairwiseBalances } from "../../src/domain/snapshot/pairwise-balance.js";

const d = (n: number) => new Prisma.Decimal(n);

describe("aggregatePairwiseBalances", () => {
  it("nets opposing directed edges", () => {
    const result = aggregatePairwiseBalances([
      { creditorMemberId: "a", debtorMemberId: "b", amount: d(100) },
      { creditorMemberId: "b", debtorMemberId: "a", amount: d(30) },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      creditorMemberId: "a",
      debtorMemberId: "b",
      netAmount: d(70),
    });
  });

  it("returns empty when debts cancel out", () => {
    const result = aggregatePairwiseBalances([
      { creditorMemberId: "a", debtorMemberId: "b", amount: d(50) },
      { creditorMemberId: "b", debtorMemberId: "a", amount: d(50) },
    ]);
    expect(result).toHaveLength(0);
  });

  it("ignores self-loops and zero amounts", () => {
    const result = aggregatePairwiseBalances([
      { creditorMemberId: "a", debtorMemberId: "a", amount: d(10) },
      { creditorMemberId: "a", debtorMemberId: "b", amount: d(0) },
      { creditorMemberId: "a", debtorMemberId: "c", amount: d(25) },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.creditorMemberId).toBe("a");
    expect(result[0]?.debtorMemberId).toBe("c");
  });

  it("handles three-member triangle to net pairs", () => {
    const result = aggregatePairwiseBalances([
      { creditorMemberId: "a", debtorMemberId: "b", amount: d(10) },
      { creditorMemberId: "b", debtorMemberId: "c", amount: d(10) },
    ]);
    expect(result.length).toBeGreaterThanOrEqual(1);
    const total = result.reduce((s, r) => s + Number(r.netAmount), 0);
    expect(total).toBeGreaterThan(0);
  });
});
