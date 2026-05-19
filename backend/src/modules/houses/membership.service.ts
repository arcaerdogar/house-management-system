import { HouseMemberRole } from "@housemate/shared";
import { prisma } from "../../config/db.js";
import type {
  ActiveMember,
  IHouseMembershipService,
} from "../../domain/contracts/house-membership.service.js";
import { HttpError } from "../common/errors.js";

class HouseMembershipService implements IHouseMembershipService {
  async assertActiveMember(
    houseId: string,
    userId: string
  ): Promise<ActiveMember> {
    const member = await prisma.houseMember.findFirst({
      where: { houseId, userId, isActive: true },
    });
    if (!member) {
      throw HttpError.forbidden("You are not an active member of this house.");
    }
    return {
      memberId: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }

  async assertAdmin(houseId: string, userId: string): Promise<ActiveMember> {
    const member = await this.assertActiveMember(houseId, userId);
    if (member.role !== HouseMemberRole.ADMIN) {
      throw HttpError.forbidden("Admin role required for this action.");
    }
    return member;
  }

  async listActiveMembers(houseId: string): Promise<ActiveMember[]> {
    const members = await prisma.houseMember.findMany({
      where: { houseId, isActive: true },
      orderBy: { joinedAt: "asc" },
    });
    return members.map((member) => ({
      memberId: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt,
    }));
  }
}

export const houseMembershipService = new HouseMembershipService();
