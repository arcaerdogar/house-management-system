import { prisma } from "../../../config/db.js";

export interface MemberEmailRow {
  memberId: string;
  memberName: string | null;
  email: string;
}

export async function getMemberEmail(
  memberId: string
): Promise<MemberEmailRow | null> {
  const member = await prisma.houseMember.findUnique({
    where: { id: memberId },
    include: { user: { select: { email: true, name: true } } },
  });

  if (!member?.isActive || !member.user.email) {
    return null;
  }

  return {
    memberId: member.id,
    memberName: member.user.name,
    email: member.user.email,
  };
}

export async function getActiveHouseMemberEmails(
  houseId: string
): Promise<MemberEmailRow[]> {
  const members = await prisma.houseMember.findMany({
    where: { houseId, isActive: true },
    include: { user: { select: { email: true, name: true } } },
  });

  return members
    .filter((member) => member.user.email)
    .map((member) => ({
      memberId: member.id,
      memberName: member.user.name,
      email: member.user.email,
    }));
}
