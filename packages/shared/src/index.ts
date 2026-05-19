/**
 * Cross-package contract types for HouseMate Finance.
 * Owned by schema agent (Phase 0). Other agents import from here — do not duplicate enums.
 * Source of truth: HouseMate_Finance_PRD_v3.pdf + docs/api-contract.md
 */

export const HouseMemberRole = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER",
} as const;
export type HouseMemberRole =
  (typeof HouseMemberRole)[keyof typeof HouseMemberRole];

export const ExpenseType = {
  REGULAR: "REGULAR",
  INSTANT: "INSTANT",
  ROTATIONAL: "ROTATIONAL",
} as const;
export type ExpenseType = (typeof ExpenseType)[keyof typeof ExpenseType];

export const RegularExpensePeriod = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;
export type RegularExpensePeriod =
  (typeof RegularExpensePeriod)[keyof typeof RegularExpensePeriod];

export const SnapshotTriggerType = {
  ABSENCE_START: "ABSENCE_START",
  ABSENCE_END: "ABSENCE_END",
  MEMBER_JOIN: "MEMBER_JOIN",
} as const;
export type SnapshotTriggerType =
  (typeof SnapshotTriggerType)[keyof typeof SnapshotTriggerType];

/** API error shape — all agents must use this for HTTP errors */
export interface ApiErrorBody {
  error: string;
  code?: string;
  details?: unknown;
}

/** Pagination query params used across list endpoints */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Domain DTOs (API response shapes, camelCase) ---

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
}

export interface House {
  id: string;
  name: string;
  inviteCode: string;
  monthlySummaryDay: number;
  createdAt: string;
}

export interface HouseMember {
  id: string;
  userId: string;
  houseId: string;
  role: HouseMemberRole;
  isActive: boolean;
  joinedAt: string;
  user?: UserSummary;
}

export interface Absence {
  id: string;
  memberId: string;
  houseId: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  member?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface RegularExpenseTemplate {
  id: string;
  houseId: string;
  title: string;
  responsibleMemberId: string;
  period: RegularExpensePeriod;
  respectsAbsence: boolean;
  isActive: boolean;
  createdAt: string;
  responsibleMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface RotationalExpenseType {
  id: string;
  houseId: string;
  title: string;
  respectsAbsence: boolean;
  isActive: boolean;
  createdAt: string;
  /** Present on GET list — computed by rotational module (PRD 5.1) */
  nextInQueue?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface ExpenseExclusion {
  id: string;
  expenseId: string;
  excludedMemberId: string;
  excludedMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  debtorMemberId: string;
  amountOwed: string;
  isSettled: boolean;
  debtorMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface Expense {
  id: string;
  houseId: string;
  payerMemberId: string;
  templateId: string | null;
  rotationalTypeId: string | null;
  expenseType: ExpenseType;
  amount: string;
  description: string;
  respectsAbsence: boolean;
  expenseDate: string;
  createdAt: string;
  payerMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
  exclusions?: ExpenseExclusion[];
  splits?: ExpenseSplit[];
}

/** Per rotational type: memberId → purchase count at snapshot time (PRD 5.1) */
export type RotationalCounts = Record<string, Record<string, number>>;

export interface BalanceSnapshotEntry {
  id: string;
  snapshotId: string;
  creditorMemberId: string;
  debtorMemberId: string;
  netAmount: string;
  creditorMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
  debtorMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface BalanceSnapshot {
  id: string;
  houseId: string;
  triggerType: SnapshotTriggerType;
  triggerMemberId: string;
  absenceId: string | null;
  rotationalCounts: RotationalCounts;
  createdAt: string;
  entries?: BalanceSnapshotEntry[];
  triggerMember?: Pick<HouseMember, "id" | "userId"> & { user?: UserSummary };
}

export interface PairwiseBalance {
  memberId: string;
  memberName: string | null;
  netAmount: string;
  direction: "OWED_TO_YOU" | "YOU_OWE";
}

export interface DashboardSummary {
  houseId: string;
  memberId: string;
  consolidatedBalance: string;
  consolidatedDirection: "CREDITOR" | "DEBTOR" | "SETTLED";
  pairwise: PairwiseBalance[];
}

export interface DebtDetailLine {
  expenseId: string;
  description: string;
  expenseDate: string;
  expenseType: ExpenseType;
  amountOwed: string;
  payerMemberId: string;
  payerName: string | null;
}

export interface MemberDebtDetail {
  houseId: string;
  viewerMemberId: string;
  counterpartyMemberId: string;
  counterpartyName: string | null;
  netAmount: string;
  direction: "OWED_TO_YOU" | "YOU_OWE" | "SETTLED";
  lines: DebtDetailLine[];
}

export interface ActivityItem {
  id: string;
  houseId: string;
  expenseId: string;
  expenseType: ExpenseType;
  description: string;
  amount: string;
  expenseDate: string;
  createdAt: string;
  payerMemberId: string;
  payerName: string | null;
  yourShare: string | null;
}
