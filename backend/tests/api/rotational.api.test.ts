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
import { prisma } from "../../src/config/db.js";
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

describe.skipIf(!hasTestDatabase())("rotational API", () => {
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

  async function setupRotationalHouse() {
    const ctx = await createHouseAsAdmin(app);
    const m2 = await joinHouse(app, ctx.inviteCode, "rot-m2");

    const type = await api(app)
      .post(`/houses/${ctx.houseId}/rotational-types`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ title: "Su faturası", respectsAbsence: false })
      .expect(201);

    return { ctx, m2, typeId: type.body.id as string };
  }

  it("CRUD rotational types (admin create)", async () => {
    const { ctx, typeId } = await setupRotationalHouse();

    const list = await api(app)
      .get(`/houses/${ctx.houseId}/rotational-types`)
      .set(authHeader(ctx.admin.accessToken))
      .expect(200);

    expect(list.body[0].nextInQueue).toBeDefined();

    await api(app)
      .patch(`/houses/${ctx.houseId}/rotational-types/${typeId}`)
      .set(authHeader(ctx.admin.accessToken))
      .send({ title: "Su + Doğalgaz" })
      .expect(200);
  });

  it("returns 409 queue mismatch and allows override; no ExpenseSplits", async () => {
    const { ctx, m2, typeId } = await setupRotationalHouse();

    const mismatch = await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(m2.accessToken))
      .send({
        expenseType: ExpenseType.ROTATIONAL,
        rotationalTypeId: typeId,
        amount: "120.00",
        description: "Su",
        expenseDate: dateOnlyInDays(0),
      })
      .expect(409);

    expect(mismatch.body.error).toBe("ROTATIONAL_QUEUE_MISMATCH");
    expect(mismatch.body.allowOverride).toBe(true);

    const expense = await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(m2.accessToken))
      .send({
        expenseType: ExpenseType.ROTATIONAL,
        rotationalTypeId: typeId,
        amount: "120.00",
        description: "Su override",
        expenseDate: dateOnlyInDays(0),
        allowOverride: true,
      })
      .expect(201);

    expect(expense.body.expenseType).toBe("ROTATIONAL");
    expect(expense.body.splits ?? []).toHaveLength(0);

    const splits = await prisma.expenseSplit.findMany({
      where: { expenseId: expense.body.id },
    });
    expect(splits).toHaveLength(0);

    const mail = getMailMockState();
    expect(
      mail.housemateJobs.some((j) => j.name === "rotational:turn-notify")
    ).toBe(true);
  });

  it("allows next-in-queue member without override", async () => {
    const { ctx, typeId } = await setupRotationalHouse();

    await api(app)
      .post(`/houses/${ctx.houseId}/expenses`)
      .set(authHeader(ctx.admin.accessToken))
      .send({
        expenseType: ExpenseType.ROTATIONAL,
        rotationalTypeId: typeId,
        amount: "80.00",
        description: "Su",
        expenseDate: dateOnlyInDays(0),
      })
      .expect(201);
  });
});
