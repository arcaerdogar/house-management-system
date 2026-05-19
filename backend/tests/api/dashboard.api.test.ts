import type { Application } from "express";
import { ExpenseType } from "@housemate/shared";
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

describe.skipIf(!hasTestDatabase())("dashboard API", () => {
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

  it("returns consolidated balance, pairwise detail, and filtered activity", async () => {
    const ctx = await createHouseAsAdmin(app);
    const m2 = await joinHouse(app, ctx.inviteCode, "dash-m2");

    await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        expenseType: ExpenseType.INSTANT,
        amount: "100.00",
        description: "Yemek",
        expenseDate: dateOnlyInDays(0),
        respectsAbsence: false,
      })
      .expect(201);

    const dashboard = await api(app)
      .get(`/houses/${ctx.houseId}/dashboard`)
      .set(authHeader(m2.accessToken))
      .expect(200);

    expect(dashboard.body.consolidatedBalance).toBeDefined();
    expect(dashboard.body.pairwise).toBeInstanceOf(Array);

    const counterpartyId = dashboard.body.pairwise[0]?.memberId ?? ctx.adminMemberId;
    const detail = await api(app)
      .get(`/houses/${ctx.houseId}/dashboard/${counterpartyId}`)
      .set(authHeader(m2.accessToken))
      .expect(200);

    expect(detail.body.lines).toBeInstanceOf(Array);

    const activity = await api(app)
      .get(`/houses/${ctx.houseId}/activity`)
      .query({ type: ExpenseType.INSTANT })
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(activity.body.length).toBeGreaterThanOrEqual(1);
    expect(activity.body.every((a: { expenseType: string }) => a.expenseType === "INSTANT")).toBe(
      true
    );
  });
});
