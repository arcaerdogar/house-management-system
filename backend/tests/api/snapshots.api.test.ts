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

describe.skipIf(!hasTestDatabase())("snapshots API", () => {
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

  it("lists snapshots and returns latest after member join", async () => {
    const ctx = await createHouseAsAdmin(app);
    await joinHouse(app, ctx.inviteCode, "snap-member");

    const list = await api(app)
      .get(`/houses/${ctx.houseId}/snapshots`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.length).toBeGreaterThanOrEqual(1);

    const latest = await api(app)
      .get(`/houses/${ctx.houseId}/snapshots/latest`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(latest.body.triggerType).toBe("MEMBER_JOIN");
    expect(latest.body.entries).toBeDefined();
  });
});
