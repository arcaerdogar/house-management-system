import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";
import {
  datesOverlap,
  isFutureDateOnly,
  parseDateOnly,
} from "../../domain/snapshot/date-utils.js";
import { toAbsenceDto } from "./absences.dto.js";
import { assertActiveMember } from "./membership.js";

const absenceInclude = {
  member: {
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  },
} as const;

async function assertNoOverlap(
  memberId: string,
  startDate: Date,
  endDate: Date,
  excludeAbsenceId?: string
) {
  const existing = await prisma.absence.findMany({
    where: {
      memberId,
      ...(excludeAbsenceId ? { id: { not: excludeAbsenceId } } : {}),
    },
  });

  for (const absence of existing) {
    if (datesOverlap(startDate, endDate, absence.startDate, absence.endDate)) {
      throw HttpError.conflict(
        "Absence overlaps with an existing declaration",
        "ABSENCE_OVERLAP"
      );
    }
  }
}

function assertFutureStart(startDate: Date) {
  if (!isFutureDateOnly(startDate)) {
    throw HttpError.badRequest(
      "Only future absences can be updated or deleted",
      "ABSENCE_ALREADY_STARTED"
    );
  }
}

export async function createAbsence(
  houseId: string,
  userId: string,
  input: { startDate: string; endDate: string }
) {
  const member = await assertActiveMember(houseId, userId);
  const startDate = parseDateOnly(input.startDate);
  const endDate = parseDateOnly(input.endDate);

  await assertNoOverlap(member.id, startDate, endDate);

  const absence = await prisma.absence.create({
    data: {
      memberId: member.id,
      houseId,
      startDate,
      endDate,
    },
    include: absenceInclude,
  });

  return toAbsenceDto(absence);
}

export async function listHouseAbsences(houseId: string, userId: string) {
  await assertActiveMember(houseId, userId);

  const absences = await prisma.absence.findMany({
    where: { houseId },
    orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    include: absenceInclude,
  });

  return absences.map(toAbsenceDto);
}

export async function updateAbsence(
  absenceId: string,
  userId: string,
  input: { startDate?: string; endDate?: string }
) {
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      member: true,
    },
  });

  if (!absence) {
    throw HttpError.notFound("Absence not found");
  }

  if (absence.member.userId !== userId) {
    throw HttpError.forbidden("You can only update your own absence declarations");
  }

  assertFutureStart(absence.startDate);

  const startDate = input.startDate
    ? parseDateOnly(input.startDate)
    : absence.startDate;
  const endDate = input.endDate ? parseDateOnly(input.endDate) : absence.endDate;

  if (input.startDate) {
    assertFutureStart(startDate);
  }

  await assertNoOverlap(absence.memberId, startDate, endDate, absence.id);

  const updated = await prisma.absence.update({
    where: { id: absenceId },
    data: {
      startDate,
      endDate,
    },
    include: absenceInclude,
  });

  return toAbsenceDto(updated);
}

export async function deleteAbsence(absenceId: string, userId: string) {
  const absence = await prisma.absence.findUnique({
    where: { id: absenceId },
    include: {
      member: true,
    },
  });

  if (!absence) {
    throw HttpError.notFound("Absence not found");
  }

  if (absence.member.userId !== userId) {
    throw HttpError.forbidden("You can only delete your own absence declarations");
  }

  assertFutureStart(absence.startDate);

  await prisma.absence.delete({
    where: { id: absenceId },
  });
}
