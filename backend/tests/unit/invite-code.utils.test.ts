import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../../src/config/db.js";
import { generateUniqueInviteCode } from "../../src/modules/houses/invite-code.utils.js";
import { HttpError } from "../../src/modules/common/errors.js";

describe("generateUniqueInviteCode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns code when database has no collision", async () => {
    vi.spyOn(prisma.house, "findUnique").mockResolvedValue(null);
    const code = await generateUniqueInviteCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9_-]+$/);
  });

  it("retries when invite code already exists", async () => {
    const findUnique = vi
      .spyOn(prisma.house, "findUnique")
      .mockResolvedValueOnce({ id: "existing" } as never)
      .mockResolvedValue(null);

    const code = await generateUniqueInviteCode();
    expect(code).toHaveLength(8);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it("throws internal error after max attempts", async () => {
    vi.spyOn(prisma.house, "findUnique").mockResolvedValue({ id: "x" } as never);
    await expect(generateUniqueInviteCode()).rejects.toBeInstanceOf(HttpError);
  });
});
