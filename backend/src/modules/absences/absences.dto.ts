import type { Absence } from "@housemate/shared";
import type { Prisma } from "@prisma/client";
import { formatDateOnly } from "../../domain/snapshot/date-utils.js";

type AbsenceRecord = Prisma.AbsenceGetPayload<{
  include: {
    member: {
      include: {
        user: {
          select: {
            id: true;
            name: true;
            email: true;
          };
        };
      };
    };
  };
}>;

export function toAbsenceDto(absence: AbsenceRecord): Absence {
  return {
    id: absence.id,
    memberId: absence.memberId,
    houseId: absence.houseId,
    startDate: formatDateOnly(absence.startDate),
    endDate: formatDateOnly(absence.endDate),
    createdAt: absence.createdAt.toISOString(),
    member: {
      id: absence.member.id,
      userId: absence.member.userId,
      user: {
        id: absence.member.user.id,
        name: absence.member.user.name,
        email: absence.member.user.email,
      },
    },
  };
}
