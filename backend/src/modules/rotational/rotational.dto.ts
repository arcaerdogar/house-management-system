import type {
  Expense,
  HouseMember,
  RotationalExpenseType,
  UserSummary,
} from "@housemate/shared";
import type {
  Expense as PrismaExpense,
  HouseMember as PrismaHouseMember,
  RotationalExpenseType as PrismaRotationalType,
  User,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

type MemberWithUser = PrismaHouseMember & { user?: User | null };

export function decimalToString(value: Prisma.Decimal): string {
  return value.toFixed(2);
}

export function toUserSummary(user: User): UserSummary {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}

export function toMemberSummary(member: MemberWithUser): NonNullable<
  RotationalExpenseType["nextInQueue"]
> {
  const summary: NonNullable<RotationalExpenseType["nextInQueue"]> = {
    id: member.id,
    userId: member.userId,
  };
  if (member.user) {
    summary.user = toUserSummary(member.user);
  }
  return summary;
}

export function toRotationalTypeDto(
  type: PrismaRotationalType,
  extras?: {
    nextInQueue?: RotationalExpenseType["nextInQueue"];
    queueCounts?: Record<string, number>;
  }
): RotationalExpenseType & { queueCounts?: Record<string, number> } {
  const dto: RotationalExpenseType & { queueCounts?: Record<string, number> } =
    {
      id: type.id,
      houseId: type.houseId,
      title: type.title,
      respectsAbsence: type.respectsAbsence,
      isActive: type.isActive,
      createdAt: type.createdAt.toISOString(),
    };

  if (extras?.nextInQueue) {
    dto.nextInQueue = extras.nextInQueue;
  }
  if (extras?.queueCounts) {
    dto.queueCounts = extras.queueCounts;
  }

  return dto;
}

type ExpenseWithPayer = PrismaExpense & {
  payerMember?: MemberWithUser | null;
};

export function toRotationalExpenseDto(expense: ExpenseWithPayer): Expense {
  const dto: Expense = {
    id: expense.id,
    houseId: expense.houseId,
    payerMemberId: expense.payerMemberId,
    templateId: expense.templateId,
    rotationalTypeId: expense.rotationalTypeId,
    expenseType: expense.expenseType,
    amount: decimalToString(expense.amount),
    description: expense.description,
    respectsAbsence: expense.respectsAbsence,
    expenseDate: formatExpenseDate(expense.expenseDate),
    createdAt: expense.createdAt.toISOString(),
  };

  if (expense.payerMember) {
    dto.payerMember = toMemberSummary(expense.payerMember) as HouseMember;
  }

  return dto;
}

function formatExpenseDate(value: Date): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, "0");
  const day = String(value.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
