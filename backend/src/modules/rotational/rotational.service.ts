import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";
import { houseMembershipService } from "./membership.js";
import { computeRotationalQueue } from "./queue.service.js";
import { toRotationalTypeDto } from "./rotational.dto.js";

export async function createRotationalType(
  houseId: string,
  userId: string,
  input: { title: string; respectsAbsence?: boolean }
) {
  await houseMembershipService.assertAdmin(houseId, userId);

  const type = await prisma.rotationalExpenseType.create({
    data: {
      houseId,
      title: input.title,
      respectsAbsence: input.respectsAbsence ?? true,
    },
  });

  return toRotationalTypeDto(type);
}

export async function listRotationalTypes(houseId: string, userId: string) {
  await houseMembershipService.assertActiveMember(houseId, userId);

  const types = await prisma.rotationalExpenseType.findMany({
    where: { houseId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  const results = [];
  for (const type of types) {
    const queue = await computeRotationalQueue(
      houseId,
      type.id,
      type.respectsAbsence
    );
    results.push(
      toRotationalTypeDto(type, {
        nextInQueue: queue.nextInQueue,
        queueCounts: queue.counts,
      })
    );
  }

  return results;
}

export async function updateRotationalType(
  houseId: string,
  typeId: string,
  userId: string,
  input: {
    title?: string;
    respectsAbsence?: boolean;
    isActive?: boolean;
  }
) {
  await houseMembershipService.assertAdmin(houseId, userId);

  const existing = await prisma.rotationalExpenseType.findFirst({
    where: { id: typeId, houseId },
  });

  if (!existing) {
    throw HttpError.notFound("Rotational expense type not found.");
  }

  const updated = await prisma.rotationalExpenseType.update({
    where: { id: typeId },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.respectsAbsence !== undefined
        ? { respectsAbsence: input.respectsAbsence }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });

  return toRotationalTypeDto(updated);
}

export async function getRotationalTypeForHouse(
  houseId: string,
  rotationalTypeId: string
) {
  const type = await prisma.rotationalExpenseType.findFirst({
    where: { id: rotationalTypeId, houseId, isActive: true },
  });

  if (!type) {
    throw HttpError.notFound("Rotational expense type not found.");
  }

  return type;
}
