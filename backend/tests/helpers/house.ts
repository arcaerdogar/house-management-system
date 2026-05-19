import type { Application } from "express";
import { api, authHeader, registerAndLogin, uniqueEmail, type AuthSession } from "./http.js";

export interface TestHouseContext {
  houseId: string;
  inviteCode: string;
  admin: AuthSession;
  adminMemberId: string;
}

export async function createHouseAsAdmin(
  app: Application,
  houseName = "QA Test House"
): Promise<TestHouseContext> {
  const admin = await registerAndLogin(app, uniqueEmail("admin"));
  const houseRes = await api(app)
    .post("/houses")
    .set(authHeader(admin.accessToken))
    .send({ name: houseName })
    .expect(201);

  const houseId = houseRes.body.id as string;
  const inviteCode = houseRes.body.inviteCode as string;

  const membersRes = await api(app)
    .get(`/houses/${houseId}/members`)
    .set(authHeader(admin.accessToken))
    .expect(200);

  const adminMember = (membersRes.body as Array<{ userId: string; id: string }>).find(
    (m) => m.userId === admin.userId
  );

  return {
    houseId,
    inviteCode,
    admin,
    adminMemberId: adminMember!.id,
  };
}

export async function joinHouse(
  app: Application,
  inviteCode: string,
  emailPrefix = "member"
): Promise<AuthSession & { memberId: string; houseId: string }> {
  const member = await registerAndLogin(app, uniqueEmail(emailPrefix));
  const joinRes = await api(app)
    .post("/houses/join")
    .set(authHeader(member.accessToken))
    .send({ inviteCode })
    .expect(201);

  return {
    ...member,
    memberId: joinRes.body.id as string,
    houseId: joinRes.body.houseId as string,
  };
}
