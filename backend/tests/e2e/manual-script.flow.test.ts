import type { Application } from "express";
import { ExpenseType } from "@housemate/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../../src/config/db.js";
import { getApp } from "../helpers/app.js";
import {
  api,
  authHeader,
  registerAndLogin,
  uniqueEmail,
} from "../helpers/http.js";
import { dateOnlyInDays } from "../helpers/dates.js";
import {
  disconnectDatabase,
  hasTestDatabase,
  resetDatabase,
} from "../helpers/db.js";
import { getMailMockState } from "../mocks/mail.mock.js";

function assertDecimalString(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(value).toMatch(/^\d+\.\d{2}$/);
}

function assertDateOnly(value: unknown): void {
  expect(typeof value).toBe("string");
  expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
}

function sumSplitAmounts(splits: Array<{ amountOwed: string }>): number {
  return splits.reduce((acc, s) => acc + Number.parseFloat(s.amountOwed), 0);
}

async function assertNoSettleEndpoint(
  app: Application,
  token: string,
  houseId: string
): Promise<void> {
  const paths = [
    `/houses/${houseId}/settle`,
    `/houses/${houseId}/settle-up`,
    `/houses/${houseId}/expenses/settle`,
  ];
  for (const path of paths) {
    await api(app).post(path).set(authHeader(token)).send({}).expect(404);
  }
}

function assertMailJobsEnqueued(
  names: Array<"expense:instant-notify" | "expense:regular-notify" | "rotational:turn-notify">
): void {
  const mail = getMailMockState();
  for (const name of names) {
    expect(mail.housemateJobs.some((j) => j.name === name)).toBe(true);
  }
  expect(mail.sesEmails).toHaveLength(0);
}

describe.skipIf(!hasTestDatabase())("manual script E2E flow", () => {
  let app: Application;

  beforeAll(async () => {
    await resetDatabase();
    app = await getApp();
  });

  afterAll(async () => {
    await disconnectDatabase();
  });

  it(
    "runs sections 1–10 of MANUAL_TEST_SCRIPT.md in one journey",
    async () => {
      // —— 1. Kullanıcı hesapları ——
      console.log("[E2E] Step 1: User accounts (register, login, logout)");

      const userA = await registerAndLogin(app, uniqueEmail("user-a"));
      const userB = await registerAndLogin(app, uniqueEmail("user-b"));
      const userC = await registerAndLogin(app, uniqueEmail("user-c"));

      const meA = await api(app)
        .get("/me")
        .set(authHeader(userA.accessToken))
        .expect(200);
      expect(meA.body.user.id).toBe(userA.userId);

      await api(app)
        .post("/auth/logout")
        .send({ refreshToken: userA.refreshToken })
        .expect(200);

      const reloginA = await api(app)
        .post("/auth/login")
        .send({ email: userA.email, password: "TestPass123!" })
        .expect(200);
      userA.accessToken = reloginA.body.access as string;

      // —— 2. Ev oluşturma ve davet ——
      console.log("[E2E] Step 2: House create, join, invite edge cases");

      const houseRes = await api(app)
        .post("/houses")
        .set(authHeader(userA.accessToken))
        .send({ name: "Test Evi" })
        .expect(201);

      const houseId = houseRes.body.id as string;
      const inviteCode = houseRes.body.inviteCode as string;
      expect(houseRes.body.createdAt).toBeTruthy();

      const joinB = await api(app)
        .post("/houses/join")
        .set(authHeader(userB.accessToken))
        .send({ inviteCode })
        .expect(201);
      const memberBId = joinB.body.id as string;

      const joinC = await api(app)
        .post("/houses/join")
        .set(authHeader(userC.accessToken))
        .send({ inviteCode })
        .expect(201);
      const memberCId = joinC.body.id as string;

      const membersAfterJoin = await api(app)
        .get(`/houses/${houseId}/members`)
        .set(authHeader(userA.accessToken))
        .expect(200);

      expect(membersAfterJoin.body).toHaveLength(3);
      const adminMember = membersAfterJoin.body.find(
        (m: { userId: string; role: string }) => m.userId === userA.userId
      );
      const adminMemberId = adminMember.id as string;
      expect(adminMember.role).toBe("ADMIN");
      expect(
        membersAfterJoin.body.find((m: { userId: string }) => m.userId === userB.userId)
          ?.role
      ).toBe("MEMBER");

      await api(app)
        .post("/houses/join")
        .set(authHeader(userB.accessToken))
        .send({ inviteCode: "INVALID1" })
        .expect(404);

      await api(app)
        .post("/houses/join")
        .set(authHeader(userB.accessToken))
        .send({ inviteCode })
        .expect(409);

      // —— 7. Snapshot (member join) — early while 3 members exist ——
      console.log("[E2E] Step 7: Snapshots after member join");

      const snapshots = await api(app)
        .get(`/houses/${houseId}/snapshots`)
        .set(authHeader(userA.accessToken))
        .expect(200);
      expect(snapshots.body.length).toBeGreaterThanOrEqual(1);
      expect(
        snapshots.body.some((s: { triggerType: string }) => s.triggerType === "MEMBER_JOIN")
      ).toBe(true);

      const latestSnapshot = await api(app)
        .get(`/houses/${houseId}/snapshots/latest`)
        .set(authHeader(userA.accessToken))
        .expect(200);
      expect(latestSnapshot.body.entries).toBeDefined();
      expect(latestSnapshot.body.rotationalCounts).toBeDefined();

      // —— 3. Yokluk ——
      console.log("[E2E] Step 3: Absences (create, overlap, edit, delete rules)");

      const futureStart = dateOnlyInDays(10);
      const futureEnd = dateOnlyInDays(15);

      const absenceFuture = await api(app)
        .post(`/houses/${houseId}/absences`)
        .set(authHeader(userB.accessToken))
        .send({ startDate: futureStart, endDate: futureEnd })
        .expect(201);
      assertDateOnly(absenceFuture.body.startDate);
      assertDateOnly(absenceFuture.body.endDate);

      const overlap = await api(app)
        .post(`/houses/${houseId}/absences`)
        .set(authHeader(userB.accessToken))
        .send({ startDate: dateOnlyInDays(12), endDate: dateOnlyInDays(18) })
        .expect(409);
      expect(overlap.body.Error).toBe("ABSENCE_OVERLAP");

      await api(app)
        .patch(`/absences/${absenceFuture.body.id}`)
        .set(authHeader(userB.accessToken))
        .send({ endDate: dateOnlyInDays(28) })
        .expect(200);

      const pastAbsence = await api(app)
        .post(`/houses/${houseId}/absences`)
        .set(authHeader(userA.accessToken))
        .send({ startDate: dateOnlyInDays(-5), endDate: dateOnlyInDays(-1) })
        .expect(201);

      await api(app)
        .delete(`/absences/${pastAbsence.body.id}`)
        .set(authHeader(userA.accessToken))
        .expect(400);

      const absenceForInstant = await api(app)
        .post(`/houses/${houseId}/absences`)
        .set(authHeader(userB.accessToken))
        .send({ startDate: dateOnlyInDays(0), endDate: dateOnlyInDays(5) })
        .expect(201);

      const absenceList = await api(app)
        .get(`/houses/${houseId}/absences`)
        .set(authHeader(userA.accessToken))
        .expect(200);
      expect(absenceList.body.length).toBeGreaterThanOrEqual(2);

      // —— 4. Şablonlar (REGULAR) ——
      console.log("[E2E] Step 4: REGULAR templates and period rules");

      const template = await api(app)
        .post(`/houses/${houseId}/templates`)
        .set(authHeader(userA.accessToken))
        .send({
          title: "Kira",
          responsibleMemberId: memberBId,
          period: "MONTHLY",
          respectsAbsence: false,
        })
        .expect(201);

      await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userA.accessToken))
        .send({
          expenseType: ExpenseType.REGULAR,
          amount: "5000.00",
          description: "Admin denemesi",
          expenseDate: dateOnlyInDays(0),
          templateId: template.body.id,
        })
        .expect(403);

      const regularExpenseDate = dateOnlyInDays(0);
      const regularExpense = await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userB.accessToken))
        .send({
          expenseType: ExpenseType.REGULAR,
          amount: "5000.00",
          description: "Mayıs kirası",
          expenseDate: regularExpenseDate,
          templateId: template.body.id,
        })
        .expect(201);
      assertDecimalString(regularExpense.body.amount);

      const regularDup = await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userB.accessToken))
        .send({
          expenseType: ExpenseType.REGULAR,
          amount: "5100.00",
          description: "Kira tekrar",
          expenseDate: regularExpenseDate,
          templateId: template.body.id,
        })
        .expect(409);
      expect(regularDup.body.Error).toBe("REGULAR_PERIOD_EXISTS");

      assertMailJobsEnqueued(["expense:regular-notify"]);

      console.log("[E2E] Step 5.2: REGULAR expense recorded via template (section 4)");

      // —— 5. Harcamalar ——
      console.log("[E2E] Step 5.1: INSTANT expense (absence + exclusions + splits)");

      const instantDate = dateOnlyInDays(1);
      const instantAmount = "90.00";
      const instant = await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userA.accessToken))
        .send({
          expenseType: ExpenseType.INSTANT,
          amount: instantAmount,
          description: "Market",
          expenseDate: instantDate,
          respectsAbsence: true,
          excludedMemberIds: [memberCId],
        })
        .expect(201);

      expect(instant.body.splits?.length).toBeGreaterThan(0);
      expect(
        instant.body.splits.every(
          (s: { debtorMemberId: string }) =>
            s.debtorMemberId !== memberBId && s.debtorMemberId !== memberCId
        )
      ).toBe(true);
      const splitTotal = sumSplitAmounts(instant.body.splits);
      expect(Math.abs(splitTotal - Number.parseFloat(instantAmount))).toBeLessThan(0.02);
      instant.body.splits.forEach((s: { amountOwed: string }) =>
        assertDecimalString(s.amountOwed)
      );

      assertMailJobsEnqueued(["expense:instant-notify"]);

      console.log("[E2E] Step 5.3: ROTATIONAL expense (queue, override, no splits)");

      const rotType = await api(app)
        .post(`/houses/${houseId}/rotational-types`)
        .set(authHeader(userA.accessToken))
        .send({ title: "Su", respectsAbsence: false })
        .expect(201);
      const rotationalTypeId = rotType.body.id as string;

      const queueMismatch = await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userB.accessToken))
        .send({
          expenseType: ExpenseType.ROTATIONAL,
          rotationalTypeId,
          amount: "120.00",
          description: "Su",
          expenseDate: dateOnlyInDays(0),
        })
        .expect(409);
      expect(queueMismatch.body.error).toBe("ROTATIONAL_QUEUE_MISMATCH");
      expect(queueMismatch.body.allowOverride).toBe(true);

      const rotational = await api(app)
        .post(`/houses/${houseId}/expenses`)
        .set(authHeader(userB.accessToken))
        .send({
          expenseType: ExpenseType.ROTATIONAL,
          rotationalTypeId,
          amount: "120.00",
          description: "Su override",
          expenseDate: dateOnlyInDays(0),
          allowOverride: true,
        })
        .expect(201);

      expect(rotational.body.expenseType).toBe("ROTATIONAL");
      expect(rotational.body.splits ?? []).toHaveLength(0);
      const dbSplits = await prisma.expenseSplit.findMany({
        where: { expenseId: rotational.body.id },
      });
      expect(dbSplits).toHaveLength(0);

      const rotTypesAfter = await api(app)
        .get(`/houses/${houseId}/rotational-types`)
        .set(authHeader(userA.accessToken))
        .expect(200);
      expect(rotTypesAfter.body[0].nextInQueue).toBeDefined();

      assertMailJobsEnqueued(["rotational:turn-notify"]);

      // —— 6. Dashboard (Settle Up yok) ——
      console.log("[E2E] Step 6: Dashboard, debt detail, activity (no Settle Up)");

      await assertNoSettleEndpoint(app, userB.accessToken, houseId);

      const dashboard = await api(app)
        .get(`/houses/${houseId}/dashboard`)
        .set(authHeader(userB.accessToken))
        .expect(200);

      assertDecimalString(dashboard.body.consolidatedBalance);
      expect(["CREDITOR", "DEBTOR", "SETTLED"]).toContain(
        dashboard.body.consolidatedDirection
      );
      expect(dashboard.body.pairwise).toBeInstanceOf(Array);

      const counterpartyId =
        dashboard.body.pairwise[0]?.memberId ?? adminMemberId;
      const debtDetail = await api(app)
        .get(`/houses/${houseId}/dashboard/${counterpartyId}`)
        .set(authHeader(userB.accessToken))
        .expect(200);
      expect(debtDetail.body.lines).toBeInstanceOf(Array);
      expect(debtDetail.body.lines.length).toBeGreaterThan(0);

      const activityInstant = await api(app)
        .get(`/houses/${houseId}/activity`)
        .query({ type: ExpenseType.INSTANT, from: dateOnlyInDays(-30), to: dateOnlyInDays(30) })
        .set(authHeader(userB.accessToken))
        .expect(200);
      const instantActivity = activityInstant.body.find(
        (a: { expenseType: string }) => a.expenseType === "INSTANT"
      );
      expect(instantActivity).toBeDefined();
      assertDecimalString(instantActivity.amount);

      const activityRot = await api(app)
        .get(`/houses/${houseId}/activity`)
        .query({ type: ExpenseType.ROTATIONAL })
        .set(authHeader(userB.accessToken))
        .expect(200);
      const rotActivity = activityRot.body.find(
        (a: { expenseType: string }) => a.expenseType === "ROTATIONAL"
      );
      expect(rotActivity).toBeDefined();
      expect(rotActivity.yourShare).toBeNull();

      const activityRegular = await api(app)
        .get(`/houses/${houseId}/activity`)
        .query({ type: ExpenseType.REGULAR })
        .set(authHeader(userB.accessToken))
        .expect(200);
      const regularActivity = activityRegular.body.find(
        (a: { expenseType: string }) => a.expenseType === "REGULAR"
      );
      expect(regularActivity).toBeDefined();
      assertDecimalString(regularActivity.yourShare);

      // —— 8. Admin işlemleri ——
      console.log("[E2E] Step 8: Admin member removal rules");

      await api(app)
        .delete(`/houses/${houseId}/members/${memberCId}`)
        .set(authHeader(userA.accessToken))
        .expect(204);

      await api(app)
        .delete(`/houses/${houseId}/members/${adminMemberId}`)
        .set(authHeader(userB.accessToken))
        .expect(403);

      await api(app)
        .delete(`/houses/${houseId}/members/${adminMemberId}`)
        .set(authHeader(userA.accessToken))
        .expect(400);

      // —— 9. E-posta (mock) ——
      console.log("[E2E] Step 9: Mail mock jobs (no real SES)");

      assertMailJobsEnqueued([
        "expense:instant-notify",
        "expense:regular-notify",
        "rotational:turn-notify",
      ]);

      // —— 10. Regresyon ——
      console.log("[E2E] Step 10: Regression (401, decimals, dates)");

      await api(app).get(`/houses/${houseId}/dashboard`).expect(401);

      const expenseDetail = await api(app)
        .get(`/houses/${houseId}/expenses/${instant.body.id}`)
        .set(authHeader(userA.accessToken))
        .expect(200);
      assertDecimalString(expenseDetail.body.amount);
      assertDateOnly(expenseDetail.body.expenseDate);

      expect(absenceForInstant.body.id).toBeTruthy();
    },
    120_000
  );
});
