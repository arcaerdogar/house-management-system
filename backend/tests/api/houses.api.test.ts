import type { Application } from "express";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";
import {
  disconnectDatabase,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db.js";
import { getApp } from "../helpers/app.js";
import { api, authHeader, uniqueEmail } from "../helpers/http.js";
import { createHouseAsAdmin, joinHouse } from "../helpers/house.js";

describe.skipIf(!hasTestDatabase())("houses API", () => {
  let app: Application;

  beforeAll(async () => {
    app = await getApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it("creates house and lists members", async () => {
    const ctx = await createHouseAsAdmin(app);
    const members = await api(app)
      .get(`/houses/${ctx.houseId}/members`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(members.body).toHaveLength(1);
    expect(members.body[0].role).toBe("ADMIN");
  });

  it("joins with invite code and rejects invalid code", async () => {
    const ctx = await createHouseAsAdmin(app);
    const member = await joinHouse(app, ctx.inviteCode);

    await api(app)
      .post("/houses/join")
      .set(authHeader(member.accessToken))
      .send({ inviteCode: "INVALID1" })
      .expect(404);
  });

  it("rejects duplicate active join", async () => {
    const ctx = await createHouseAsAdmin(app);
    const member = await joinHouse(app, ctx.inviteCode);

    await api(app)
      .post("/houses/join")
      .set(authHeader(member.accessToken))
      .send({ inviteCode: ctx.inviteCode })
      .expect(409);
  });

  it("allows admin to remove member; non-admin forbidden", async () => {
    const ctx = await createHouseAsAdmin(app);
    const member = await joinHouse(app, ctx.inviteCode, "remove");

    await api(app)
      .delete(`/houses/${ctx.houseId}/members/${member.memberId}`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(204);

    await api(app)
      .delete(`/houses/${ctx.houseId}/members/${ctx.adminMemberId}`)
      .set(authHeader(member.accessToken))
      .expect(403);
  });
});
