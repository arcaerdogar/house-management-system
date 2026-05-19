import type { House, HouseMember, UserSummary } from "@housemate/shared";
import type { House as PrismaHouse, HouseMember as PrismaHouseMember, User } from "@prisma/client";

type MemberWithUser = PrismaHouseMember & { user?: User | null };

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function toHouseDto(house: PrismaHouse): House {
  return {
    id: house.id,
    name: house.name,
    inviteCode: house.inviteCode,
    monthlySummaryDay: house.monthlySummaryDay,
    createdAt: house.createdAt.toISOString(),
  };
}

export function toHouseMemberDto(member: MemberWithUser): HouseMember {
  const dto: HouseMember = {
    id: member.id,
    userId: member.userId,
    houseId: member.houseId,
    role: member.role,
    isActive: member.isActive,
    joinedAt: member.joinedAt.toISOString(),
  };
  if (member.user) {
    dto.user = toUserSummary(member.user);
  }
  return dto;
}
