import { prisma } from "../../../config/db.js";
import { formatDateOnly } from "../../../domain/snapshot/date-utils.js";
import { addBulkEmailJob } from "../../mail-service/bulkmailService.js";
import { getMemberEmail } from "../utils/member-lookup.js";
import type { ExpenseNotifyJobData } from "../types.js";

async function loadExpenseContext(payload: ExpenseNotifyJobData) {
  return prisma.expense.findFirst({
    where: { id: payload.expenseId, houseId: payload.houseId },
    include: {
      house: { select: { name: true } },
      payerMember: { include: { user: { select: { name: true } } } },
      splits: true,
    },
  });
}

/**
 * FR-9.2 — notify all members included in an instant expense split.
 */
export async function processInstantExpenseNotify(
  payload: ExpenseNotifyJobData
): Promise<void> {
  const expense = await loadExpenseContext(payload);
  if (!expense) {
    console.warn(`[jobs] Instant notify: expense ${payload.expenseId} not found`);
    return;
  }

  const memberIds = new Set<string>([
    expense.payerMemberId,
    ...expense.splits.map((split) => split.debtorMemberId),
  ]);

  const destinations = [];
  for (const memberId of memberIds) {
    const member = await getMemberEmail(memberId);
    if (!member) continue;

    const split = expense.splits.find((row) => row.debtorMemberId === memberId);
    const yourShare =
      memberId === expense.payerMemberId
        ? null
        : split?.amountOwed.toFixed(2) ?? null;

    destinations.push({
      destination: member.email,
      templateData: {
        memberName: member.memberName ?? member.email,
        houseName: expense.house.name,
        description: expense.description,
        amount: expense.amount.toFixed(2),
        expenseDate: formatDateOnly(expense.expenseDate),
        payerName: expense.payerMember.user.name ?? "Ev arkadaşın",
        yourShare,
      },
    });
  }

  if (destinations.length === 0) {
    return;
  }

  await addBulkEmailJob(
    "housemate-instant-expense",
    `HouseMate — Yeni ortak gider: ${expense.description}`,
    destinations
  );
}

/**
 * Confirmation mail after a regular expense is submitted (queued by expense module).
 */
export async function processRegularExpenseNotify(
  payload: ExpenseNotifyJobData
): Promise<void> {
  const expense = await loadExpenseContext(payload);
  if (!expense) {
    console.warn(`[jobs] Regular notify: expense ${payload.expenseId} not found`);
    return;
  }

  const memberIds = new Set<string>(
    expense.splits.map((split) => split.debtorMemberId)
  );

  const destinations = [];
  for (const memberId of memberIds) {
    const member = await getMemberEmail(memberId);
    if (!member) continue;

    const split = expense.splits.find((row) => row.debtorMemberId === memberId);
    destinations.push({
      destination: member.email,
      templateData: {
        memberName: member.memberName ?? member.email,
        houseName: expense.house.name,
        description: expense.description,
        amount: expense.amount.toFixed(2),
        expenseDate: formatDateOnly(expense.expenseDate),
        yourShare: split?.amountOwed.toFixed(2) ?? "0.00",
      },
    });
  }

  if (destinations.length === 0) {
    return;
  }

  await addBulkEmailJob(
    "housemate-regular-expense",
    `HouseMate — Düzenli gider kaydedildi: ${expense.description}`,
    destinations
  );
}
