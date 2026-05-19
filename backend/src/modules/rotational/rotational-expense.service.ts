import { ExpenseType, Prisma } from "@prisma/client";
import { prisma } from "../../config/db.js";
import {
  parseDateOnly,
  todayUtcDateOnly,
} from "../../domain/snapshot/date-utils.js";
import { HttpError } from "../common/errors.js";
import { houseMembershipService } from "./membership.js";
import { computeRotationalQueue } from "./queue.service.js";
import { RotationalQueueMismatchError } from "./rotational.errors.js";
import { toRotationalExpenseDto } from "./rotational.dto.js";
import { getRotationalTypeForHouse } from "./rotational.service.js";
import { enqueueRotationalTurnNotify } from "./rotational-turn-notify.jobs.js";

export interface CreateRotationalExpenseInput {
  rotationalTypeId: string;
  amount: string;
  description: string;
  expenseDate: string;
  respectsAbsence?: boolean;
  allowOverride?: boolean;
}

/**
 * Creates a ROTATIONAL expense without ExpenseSplits (FR-6.7).
 * Throws {@link RotationalQueueMismatchError} when payer is not next in queue (FR-6.5).
 */
export async function createRotationalExpense(
  houseId: string,
  userId: string,
  input: CreateRotationalExpenseInput
) {
  const payer = await houseMembershipService.assertActiveMember(houseId, userId);
  const type = await getRotationalTypeForHouse(houseId, input.rotationalTypeId);
  const expenseDate = parseDateOnly(input.expenseDate);

  const queue = await computeRotationalQueue(
    houseId,
    type.id,
    type.respectsAbsence,
    expenseDate
  );

  if (payer.memberId !== queue.nextMemberId && !input.allowOverride) {
    throw new RotationalQueueMismatchError(
      "You are not next in the rotational queue for this expense type.",
      queue.nextMemberId,
      queue.nextInQueue
    );
  }

  const amount = new Prisma.Decimal(input.amount);
  if (amount.lte(0)) {
    throw HttpError.badRequest("Amount must be greater than zero.");
  }

  const expense = await prisma.expense.create({
    data: {
      houseId,
      payerMemberId: payer.memberId,
      rotationalTypeId: type.id,
      expenseType: ExpenseType.ROTATIONAL,
      amount,
      description: input.description,
      respectsAbsence: input.respectsAbsence ?? type.respectsAbsence,
      expenseDate,
    },
    include: {
      payerMember: {
        include: { user: true },
      },
    },
  });

  const nextQueue = await computeRotationalQueue(
    houseId,
    type.id,
    type.respectsAbsence,
    todayUtcDateOnly()
  );

  await enqueueRotationalTurnNotify({
    houseId,
    rotationalTypeId: type.id,
    nextMemberId: nextQueue.nextMemberId,
  });

  return toRotationalExpenseDto(expense);
}
