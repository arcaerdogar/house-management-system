import { prisma } from "../../config/db.js";
import type {
  IExpenseSplitCalculator,
  SplitInput,
  SplitLine,
} from "../../domain/contracts/expense-split.calculator.js";
import { houseMembershipService } from "../houses/membership.service.js";
import { HttpError } from "../common/errors.js";

function distributeEqualAmount(
  amount: number,
  memberIds: string[]
): SplitLine[] {
  const sorted = [...memberIds].sort();
  const totalCents = Math.round(amount * 100);
  const baseCents = Math.floor(totalCents / sorted.length);
  const remainder = totalCents % sorted.length;

  return sorted.map((debtorMemberId, index) => ({
    debtorMemberId,
    amountOwed: (baseCents + (index < remainder ? 1 : 0)) / 100,
  }));
}

class ExpenseSplitCalculator implements IExpenseSplitCalculator {
  async calculateSplits(input: SplitInput): Promise<SplitLine[]> {
    const activeMembers = await houseMembershipService.listActiveMembers(
      input.houseId
    );
    const activeIds = new Set(activeMembers.map((m) => m.memberId));

    for (const excludedId of input.excludedMemberIds) {
      if (!activeIds.has(excludedId)) {
        throw HttpError.badRequest(
          "excludedMemberIds must reference active house members",
          "INVALID_EXCLUSION"
        );
      }
    }

    if (input.excludedMemberIds.includes(input.payerMemberId)) {
      throw HttpError.badRequest(
        "Payer cannot be listed in excludedMemberIds",
        "PAYER_EXCLUDED"
      );
    }

    let includedIds = activeMembers.map((m) => m.memberId);

    if (input.excludedMemberIds.length > 0) {
      const excluded = new Set(input.excludedMemberIds);
      includedIds = includedIds.filter((id) => !excluded.has(id));
    }

    if (input.respectsAbsence) {
      const absentIds = await this.findAbsentMemberIds(
        input.houseId,
        input.expenseDate
      );
      const absent = new Set(absentIds);
      includedIds = includedIds.filter((id) => !absent.has(id));
    }

    if (includedIds.length === 0) {
      throw HttpError.badRequest(
        "No members are included in this expense split",
        "NO_INCLUDED_MEMBERS"
      );
    }

    return distributeEqualAmount(input.amount, includedIds);
  }

  private async findAbsentMemberIds(
    houseId: string,
    expenseDate: Date
  ): Promise<string[]> {
    const absences = await prisma.absence.findMany({
      where: {
        houseId,
        startDate: { lte: expenseDate },
        endDate: { gte: expenseDate },
      },
      select: { memberId: true },
    });

    return absences.map((a) => a.memberId);
  }
}

export const expenseSplitCalculator = new ExpenseSplitCalculator();
