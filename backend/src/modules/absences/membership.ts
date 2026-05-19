import { prisma } from "../../config/db.js";
import { HttpError } from "../common/errors.js";

export async function assertActiveMember(houseId: string, userId: string) {
  const member = await prisma.houseMember.findFirst({
    where: {
      houseId,
      userId,
      isActive: true,
    },
  });

  if (!member) {
    throw HttpError.forbidden("You are not an active member of this house");
  }

  return member;
}

export async function getActiveMember(houseId: string, userId: string) {
  return assertActiveMember(houseId, userId);
}
