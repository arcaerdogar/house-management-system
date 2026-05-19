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
import { getMailMockState } from "../mocks/mail.mock.js";

describe.skipIf(!hasTestDatabase())("expenses API", () => {
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

  async function houseWithThreeMembers() {
    const ctx = await createHouseAsAdmin(app);
    const m2 = await joinHouse(app, ctx.inviteCode, "exp-m2");
    const m3 = await joinHouse(app, ctx.inviteCode, "exp-m3");
    return { ctx, m2, m3 };
  }

  it("creates INSTANT expense with exclusions and enqueues mail mock", async () => {
    const { ctx, m2, m3 } = await houseWithThreeMembers();

    const expense = await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        expenseType: ExpenseType.INSTANT,
        amount: "90.00",
        description: "Market",
        expenseDate: dateOnlyInDays(0),
        respectsAbsence: false,
        excludedMemberIds: [m3.memberId],
      })
      .expect(201);

    expect(expense.body.splits?.length).toBeGreaterThan(0);
    expect(
      expense.body.splits.every(
        (s: { debtorMemberId: string }) => s.debtorMemberId !== m3.memberId
      )
    ).toBe(true);

    const mail = getMailMockState();
    expect(
      mail.housemateJobs.some((j) => j.name === "expense:instant-notify")
    ).toBe(true);
    expect(mail.sesEmails).toHaveLength(0);
  });

  it("creates REGULAR expense for responsible member only", async () => {
    const { ctx, m2 } = await houseWithThreeMembers();

    const template = await api(app)
      .post(`/houses/${ctx.houseId}/templates`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        title: "Kira",
        responsibleMemberId: m2.memberId,
        period: "MONTHLY",
        respectsAbsence: false,
      })
      .expect(201);

    await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(m2.accessToken))
      .send({
        expenseType: ExpenseType.REGULAR,
        amount: "5000.00",
        description: "Mayıs kirası",
        expenseDate: dateOnlyInDays(0),
        templateId: template.body.id,
      })
      .expect(201);

    await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        expenseType: ExpenseType.REGULAR,
        amount: "5000.00",
        description: "Admin denemesi",
        expenseDate: dateOnlyInDays(0),
        templateId: template.body.id,
      })
      .expect(403);

    const mail = getMailMockState();
    expect(
      mail.housemateJobs.some((j) => j.name === "expense:regular-notify")
    ).toBe(true);
  });

  it("returns 409 for duplicate REGULAR period", async () => {
    const { ctx, m2 } = await houseWithThreeMembers();
    const template = await api(app)
      .post(`/houses/${ctx.houseId}/templates`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        title: "Elektrik",
        responsibleMemberId: m2.memberId,
        period: "MONTHLY",
      })
      .expect(201);

    const expenseDate = dateOnlyInDays(0);
    await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(m2.accessToken))
      .send({
        expenseType: ExpenseType.REGULAR,
        amount: "200.00",
        description: "Fatura",
        expenseDate,
        templateId: template.body.id,
      })
      .expect(201);

    const dup = await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(m2.accessToken))
      .send({
        expenseType: ExpenseType.REGULAR,
        amount: "210.00",
        description: "Fatura tekrar",
        expenseDate,
        templateId: template.body.id,
      })
      .expect(409);

    expect(dup.body.Error).toBe("REGULAR_PERIOD_EXISTS");
  });
});
