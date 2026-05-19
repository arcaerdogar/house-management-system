import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/config/db.js";
import { expenseSplitCalculator } from "../../src/modules/expenses/expense-split.calculator.js";
import { houseMembershipService } from "../../src/modules/houses/membership.service.js";
import { HttpError } from "../../src/modules/common/errors.js";
import { parseDateOnly } from "../../src/domain/snapshot/date-utils.js";

describe("expenseSplitCalculator", () => {
  const houseId = "house-1";
  const payer = "member-payer";
  const m2 = "member-2";
  const m3 = "member-3";

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(houseMembershipService, "listActiveMembers").mockResolvedValue([
      { memberId: payer, userId: "u1", role: "MEMBER", joinedAt: new Date() },
      { memberId: m2, userId: "u2", role: "MEMBER", joinedAt: new Date() },
      { memberId: m3, userId: "u3", role: "MEMBER", joinedAt: new Date() },
    ]);
    vi.spyOn(prisma.absence, "findMany").mockResolvedValue([]);
  });

  it("splits equally with cent remainder distribution", async () => {
    const lines = await expenseSplitCalculator.calculateSplits({
      houseId,
      amount: 10,
      expenseDate: parseDateOnly("2026-05-19"),
      respectsAbsence: false,
      excludedMemberIds: [],
      payerMemberId: payer,
    });
    expect(lines).toHaveLength(3);
    const sum = lines.reduce((s, l) => s + l.amountOwed, 0);
    expect(sum).toBeCloseTo(10, 2);
  });

  it("excludes absent members when respectsAbsence is true", async () => {
    vi.spyOn(prisma.absence, "findMany").mockResolvedValue([
      { memberId: m3 } as never,
    ]);
    const lines = await expenseSplitCalculator.calculateSplits({
      houseId,
      amount: 100,
      expenseDate: parseDateOnly("2026-05-19"),
      respectsAbsence: true,
      excludedMemberIds: [],
      payerMemberId: payer,
    });
    expect(lines.some((l) => l.debtorMemberId === m3)).toBe(false);
    expect(lines).toHaveLength(2);
  });

  it("rejects payer in excludedMemberIds", async () => {
    await expect(
      expenseSplitCalculator.calculateSplits({
        houseId,
        amount: 50,
        expenseDate: parseDateOnly("2026-05-19"),
        respectsAbsence: false,
        excludedMemberIds: [payer],
        payerMemberId: payer,
      })
    ).rejects.toMatchObject({ statusCode: 400, code: "PAYER_EXCLUDED" });
  });

  it("rejects unknown excluded member", async () => {
    await expect(
      expenseSplitCalculator.calculateSplits({
        houseId,
        amount: 50,
        expenseDate: parseDateOnly("2026-05-19"),
        respectsAbsence: false,
        excludedMemberIds: ["ghost"],
        payerMemberId: payer,
      })
    ).rejects.toBeInstanceOf(HttpError);
  });

  it("rejects when no members remain included", async () => {
    vi.spyOn(houseMembershipService, "listActiveMembers").mockResolvedValue([
      { memberId: payer, userId: "u1", role: "MEMBER", joinedAt: new Date() },
    ]);
    await expect(
      expenseSplitCalculator.calculateSplits({
        houseId,
        amount: 50,
        expenseDate: parseDateOnly("2026-05-19"),
        respectsAbsence: false,
        excludedMemberIds: [payer],
        payerMemberId: payer,
      })
    ).rejects.toMatchObject({ code: "PAYER_EXCLUDED" });
  });

  it("rejects when everyone is excluded or absent", async () => {
    vi.spyOn(prisma.absence, "findMany").mockResolvedValue([
      { memberId: m2 } as never,
      { memberId: m3 } as never,
      { memberId: payer } as never,
    ]);
    await expect(
      expenseSplitCalculator.calculateSplits({
        houseId,
        amount: 50,
        expenseDate: parseDateOnly("2026-05-19"),
        respectsAbsence: true,
        excludedMemberIds: [],
        payerMemberId: payer,
      })
    ).rejects.toMatchObject({ code: "NO_INCLUDED_MEMBERS" });
  });
});
