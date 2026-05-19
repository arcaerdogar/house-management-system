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
