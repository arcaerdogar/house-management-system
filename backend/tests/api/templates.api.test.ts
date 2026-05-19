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
import { api, authHeader } from "../helpers/http.js";
import { createHouseAsAdmin, joinHouse } from "../helpers/house.js";

describe.skipIf(!hasTestDatabase())("templates API", () => {
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

  it("supports template CRUD for active members", async () => {
    const ctx = await createHouseAsAdmin(app);
    const member = await joinHouse(app, ctx.inviteCode, "tpl-m");

    const created = await api(app)
      .post(`/houses/${ctx.houseId}/templates`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        title: "İnternet",
        responsibleMemberId: member.memberId,
        period: "WEEKLY",
        respectsAbsence: true,
      })
      .expect(201);

    expect(created.body.respectsAbsence).toBe(true);

    const list = await api(app)
      .get(`/houses/${ctx.houseId}/templates`)
      .set(authHeader(member.accessToken))
      .expect(200);

    expect(list.body.some((t: { id: string }) => t.id === created.body.id)).toBe(
      true
    );

    await api(app)
      .patch(`/houses/${ctx.houseId}/templates/${created.body.id}`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ title: "İnternet + TV" })
      .expect(200);

    await api(app)
      .delete(`/houses/${ctx.houseId}/templates/${created.body.id}`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(204);

    const afterDelete = await api(app)
      .get(`/houses/${ctx.houseId}/templates`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(
      afterDelete.body.some((t: { id: string }) => t.id === created.body.id)
    ).toBe(false);
  });
});
