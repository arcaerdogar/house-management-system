import type { HouseMemberRole } from "@housemate/shared";

export interface ActiveMember {
  memberId: string;
  userId: string;
  role: HouseMemberRole;
  joinedAt: Date;
}

/**
 * House membership checks. Implemented by house agent.
 */
export interface IHouseMembershipService {
  assertActiveMember(houseId: string, userId: string): Promise<ActiveMember>;
  assertAdmin(houseId: string, userId: string): Promise<ActiveMember>;
  listActiveMembers(houseId: string): Promise<ActiveMember[]>;
}
