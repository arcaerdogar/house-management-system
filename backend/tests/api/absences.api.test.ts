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
import { dateOnlyInDays } from "../helpers/dates.js";

describe.skipIf(!hasTestDatabase())("absences API", () => {
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

  it("creates absence and rejects overlapping range with 409", async () => {
    const ctx = await createHouseAsAdmin(app);
    const start = dateOnlyInDays(10);
    const end = dateOnlyInDays(15);

    await api(app)
      .post(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ startDate: start, endDate: end })
      .expect(201);

    const overlap = await api(app)
      .post(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ startDate: dateOnlyInDays(12), endDate: dateOnlyInDays(18) })
      .expect(409);

    expect(overlap.body.Error).toBe("ABSENCE_OVERLAP");
  });

  it("allows future edit and forbids delete when absence already started", async () => {
    const ctx = await createHouseAsAdmin(app);
    const pastStart = dateOnlyInDays(-5);
    const pastEnd = dateOnlyInDays(-1);

    const created = await api(app)
      .post(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ startDate: pastStart, endDate: pastEnd })
      .expect(201);

    await api(app)
      .delete(`/absences/${created.body.id}`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(400);

    const future = await api(app)
      .post(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        startDate: dateOnlyInDays(20),
        endDate: dateOnlyInDays(25),
      })
      .expect(201);

    await api(app)
      .patch(`/absences/${future.body.id}`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ endDate: dateOnlyInDays(28) })
      .expect(200);
  });

  it("lists absences for all members in house", async () => {
    const ctx = await createHouseAsAdmin(app);
    const member = await joinHouse(app, ctx.inviteCode);

    await api(app)
      .post(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(member.accessToken))
      .send({
        startDate: dateOnlyInDays(30),
        endDate: dateOnlyInDays(35),
      })
      .expect(201);

    const list = await api(app)
      .get(`/houses/${ctx.houseId}/absences`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(list.body.length).toBeGreaterThanOrEqual(1);
  });
});
