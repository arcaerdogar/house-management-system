import { HouseMemberRole } from "@housemate/shared";
import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";
import { toHouseDto, toHouseMemberDto } from "./houses.dto.js";
import { generateUniqueInviteCode } from "./invite-code.utils.js";
import { houseMembershipService } from "./membership.service.js";

type SnapshotServiceModule = {
  snapshotService: {
    createMemberJoinSnapshot: (
      houseId: string,
      newMemberId: string
    ) => Promise<{ snapshotId: string }>;
  };
};

const SNAPSHOT_SERVICE_MODULE: string = "../snapshots/snapshot.service.js";

async function callMemberJoinSnapshotIfAvailable(
  houseId: string,
  newMemberId: string
): Promise<void> {
  try {
    const snapshotModule = (await import(
      SNAPSHOT_SERVICE_MODULE
    )) as SnapshotServiceModule;
    await snapshotModule.snapshotService.createMemberJoinSnapshot(
      houseId,
      newMemberId
    );
  } catch (error) {
    const isModuleMissing =
      error instanceof Error &&
      (error.message.includes("Cannot find module") ||
        (error as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND");

    if (isModuleMissing) {
      // TODO(absence-snapshot): wire MEMBER_JOIN snapshot when snapshot service is ready (FR-2.7)
      return;
    }

    throw error;
  }
}

export async function createHouse(userId: string, name: string) {
  const inviteCode = await generateUniqueInviteCode();

  const house = await prisma.$transaction(async (tx) => {
    const created = await tx.house.create({
      data: { name, inviteCode },
    });
    await tx.houseMember.create({
      data: {
        userId,
        houseId: created.id,
        role: HouseMemberRole.ADMIN,
      },
    });
    return created;
  });

  return toHouseDto(house);
}

export async function joinHouse(userId: string, inviteCode: string) {
  const house = await prisma.house.findUnique({
    where: { inviteCode },
  });
  if (!house) {
    throw HttpError.notFound("House not found for this invite code.");
  }

  const existing = await prisma.houseMember.findUnique({
    where: {
      userId_houseId: { userId, houseId: house.id },
    },
    include: { user: true },
  });

  if (existing?.isActive) {
    throw HttpError.conflict("You are already a member of this house.");
  }

  const member = existing
    ? await prisma.houseMember.update({
        where: { id: existing.id },
        data: { isActive: true, role: HouseMemberRole.MEMBER },
        include: { user: true },
      })
    : await prisma.houseMember.create({
        data: {
          userId,
          houseId: house.id,
          role: HouseMemberRole.MEMBER,
        },
        include: { user: true },
      });

  await callMemberJoinSnapshotIfAvailable(house.id, member.id);

  return toHouseMemberDto(member);
}

export async function getHouse(houseId: string, userId: string) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const house = await prisma.house.findUnique({ where: { id: houseId } });
  if (!house) {
    throw HttpError.notFound("House not found.");
  }

  return toHouseDto(house);
}

export async function listHouseMembers(houseId: string, userId: string) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const members = await prisma.houseMember.findMany({
    where: { houseId, isActive: true },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  return members.map(toHouseMemberDto);
}

export async function removeHouseMember(
  houseId: string,
  actorUserId: string,
  targetMemberId: string
) {
  const actor = await houseMembershipService.assertAdmin(houseId, actorUserId);

  const target = await prisma.houseMember.findFirst({
    where: { id: targetMemberId, houseId, isActive: true },
  });
  if (!target) {
    throw HttpError.notFound("Member not found in this house.");
  }

  if (target.id === actor.memberId) {
    throw HttpError.badRequest("You cannot remove yourself from the house.");
  }

  if (target.role === HouseMemberRole.ADMIN) {
    const adminCount = await prisma.houseMember.count({
      where: { houseId, isActive: true, role: HouseMemberRole.ADMIN },
    });
    if (adminCount <= 1) {
      throw HttpError.conflict("Cannot remove the only admin of the house.");
    }
  }

  await prisma.houseMember.update({
    where: { id: target.id },
    data: { isActive: false },
  });
}
