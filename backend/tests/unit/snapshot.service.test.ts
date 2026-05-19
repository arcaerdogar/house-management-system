import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseType, Prisma, SnapshotTriggerType } from "@prisma/client";
import { prisma } from "../../src/config/db.js";
import { snapshotService } from "../../src/modules/snapshots/snapshot.service.js";

describe("snapshotService.createSnapshot", () => {
  const houseId = "house-snap";
  const triggerMemberId = "member-trigger";

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("creates snapshot with aggregated entries from prior snapshot and new splits", async () => {
    vi.spyOn(prisma.balanceSnapshot, "findFirst").mockResolvedValue({
      id: "snap-prev",
      houseId,
      createdAt: new Date("2026-05-01T00:00:00.000Z"),
      rotationalCounts: {},
      entries: [
        {
          creditorMemberId: "a",
          debtorMemberId: "b",
          netAmount: new Prisma.Decimal(50),
        },
      ],
    } as never);

    vi.spyOn(prisma.expenseSplit, "findMany").mockResolvedValue([
      {
        amountOwed: new Prisma.Decimal(20),
        debtorMemberId: "c",
        expense: { payerMemberId: "a" },
      },
    ] as never);

    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([]);

    const tx = {
      balanceSnapshot: {
        create: vi.fn().mockResolvedValue({ id: "snap-new" }),
      },
      balanceSnapshotEntry: {
        createMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };
    vi.spyOn(prisma, "$transaction").mockImplementation(async (fn) =>
      fn(tx as never)
    );

    const result = await snapshotService.createSnapshot({
      houseId,
      triggerType: SnapshotTriggerType.MEMBER_JOIN,
      triggerMemberId,
    });

    expect(result.snapshotId).toBe("snap-new");
    expect(tx.balanceSnapshot.create).toHaveBeenCalled();
    expect(tx.balanceSnapshotEntry.createMany).toHaveBeenCalled();
  });

  it("createMemberJoinSnapshot delegates with MEMBER_JOIN trigger", async () => {
    const spy = vi
      .spyOn(snapshotService, "createSnapshot")
      .mockResolvedValue({ snapshotId: "joined" });

    const result = await snapshotService.createMemberJoinSnapshot(
      houseId,
      triggerMemberId
    );

    expect(result.snapshotId).toBe("joined");
    expect(spy).toHaveBeenCalledWith({
      houseId,
      triggerType: SnapshotTriggerType.MEMBER_JOIN,
      triggerMemberId,
    });
  });

  it("ignores rotational expenses when aggregating splits", async () => {
    vi.spyOn(prisma.balanceSnapshot, "findFirst").mockResolvedValue(null);
    const findSplits = vi.spyOn(prisma.expenseSplit, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([
      {
        rotationalTypeId: "rot-1",
        payerMemberId: "m1",
      },
    ] as never);

    const tx = {
      balanceSnapshot: {
        create: vi.fn().mockResolvedValue({ id: "snap-empty" }),
      },
      balanceSnapshotEntry: {
        createMany: vi.fn(),
      },
    };
    vi.spyOn(prisma, "$transaction").mockImplementation(async (fn) =>
      fn(tx as never)
    );

    await snapshotService.createSnapshot({
      houseId,
      triggerType: SnapshotTriggerType.ABSENCE_START,
      triggerMemberId,
      absenceId: "abs-1",
    });

    expect(findSplits).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          expense: expect.objectContaining({
            expenseType: { not: ExpenseType.ROTATIONAL },
          }),
        }),
      })
    );
  });
});
