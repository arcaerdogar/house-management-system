import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/config/db.js";
import { parseDateOnly } from "../../src/domain/snapshot/date-utils.js";
import { computeRotationalQueue } from "../../src/modules/rotational/queue.service.js";

const houseId = "house-q";
const typeId = "type-q";

function member(
  id: string,
  joinedAt: string,
  userId = `user-${id}`
) {
  return {
    id,
    userId,
    houseId,
    role: "MEMBER" as const,
    isActive: true,
    joinedAt: new Date(joinedAt),
    user: { id: userId, name: null, email: `${userId}@test.com` },
  };
}

describe("computeRotationalQueue", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.balanceSnapshot, "findFirst").mockResolvedValue(null);
    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([]);
    vi.spyOn(prisma.absence, "findMany").mockResolvedValue([]);
  });

  it("picks member with lowest count (PRD tiebreaker step 1)", async () => {
    vi.spyOn(prisma.houseMember, "findMany").mockResolvedValue([
      member("m1", "2026-01-01T00:00:00.000Z"),
      member("m2", "2026-01-02T00:00:00.000Z"),
    ]);
    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([
      {
        payerMemberId: "m1",
        expenseDate: parseDateOnly("2026-05-01"),
      },
    ] as never);

    const result = await computeRotationalQueue(
      houseId,
      typeId,
      false,
      parseDateOnly("2026-05-19")
    );
    expect(result.nextMemberId).toBe("m2");
  });

  it("when counts are zero, picks earliest joinedAt", async () => {
    vi.spyOn(prisma.houseMember, "findMany").mockResolvedValue([
      member("m-late", "2026-03-01T00:00:00.000Z"),
      member("m-early", "2026-01-01T00:00:00.000Z"),
    ]);

    const result = await computeRotationalQueue(
      houseId,
      typeId,
      false,
      parseDateOnly("2026-05-19")
    );
    expect(result.nextMemberId).toBe("m-early");
  });

  it("when counts tie above zero, picks oldest last expense date", async () => {
    vi.spyOn(prisma.houseMember, "findMany").mockResolvedValue([
      member("m1", "2026-01-01T00:00:00.000Z"),
      member("m2", "2026-01-02T00:00:00.000Z"),
    ]);
    vi.spyOn(prisma.expense, "findMany").mockResolvedValue([
      {
        payerMemberId: "m1",
        expenseDate: parseDateOnly("2026-04-01"),
      },
      {
        payerMemberId: "m2",
        expenseDate: parseDateOnly("2026-05-01"),
      },
    ] as never);

    const result = await computeRotationalQueue(
      houseId,
      typeId,
      false,
      parseDateOnly("2026-05-19")
    );
    expect(result.nextMemberId).toBe("m1");
  });

  it("excludes absent members when respectsAbsence is true", async () => {
    vi.spyOn(prisma.houseMember, "findMany").mockResolvedValue([
      member("m1", "2026-01-01T00:00:00.000Z"),
      member("m2", "2026-01-02T00:00:00.000Z"),
    ]);
    vi.spyOn(prisma.absence, "findMany").mockResolvedValue([
      { memberId: "m1" },
    ] as never);

    const result = await computeRotationalQueue(
      houseId,
      typeId,
      true,
      parseDateOnly("2026-05-19")
    );
    expect(result.nextMemberId).toBe("m2");
  });
});
