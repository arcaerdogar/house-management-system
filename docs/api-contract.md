# API Contract (Phase 0 — schema agent maintains)

Base URL: `/api` (orchestrator configures proxy: frontend → backend)

Auth: `Authorization: Bearer <accessToken>` on all `/houses/*` routes.

Decimal amounts are serialized as **strings** (e.g. `"125.50"`) to avoid floating-point loss.

Date-only fields (`startDate`, `endDate`, `expenseDate`) are **ISO 8601 date strings** (`YYYY-MM-DD`).

Timestamps (`createdAt`, `joinedAt`) are **ISO 8601 datetime strings**.

## Houses

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/houses` | `{ name: string }` | `House` |
| POST | `/houses/join` | `{ inviteCode: string }` | `HouseMember` |
| GET | `/houses/:houseId` | — | `House` |
| GET | `/houses/:houseId/members` | — | `HouseMember[]` |
| DELETE | `/houses/:houseId/members/:memberId` | — | `204` |

### `House`

| Field | Type |
|-------|------|
| `id` | `string` |
| `name` | `string` |
| `inviteCode` | `string` |
| `monthlySummaryDay` | `number` (1–28) |
| `createdAt` | `string` (datetime) |

### `HouseMember`

| Field | Type |
|-------|------|
| `id` | `string` |
| `userId` | `string` |
| `houseId` | `string` |
| `role` | `"ADMIN" \| "MEMBER"` |
| `isActive` | `boolean` |
| `joinedAt` | `string` (datetime) |
| `user` | `UserSummary` (optional, on list/detail) |

### `UserSummary`

| Field | Type |
|-------|------|
| `id` | `string` |
| `name` | `string \| null` |
| `email` | `string` |

## Absences

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/houses/:houseId/absences` | `{ startDate, endDate }` | `Absence` |
| GET | `/houses/:houseId/absences` | — | `Absence[]` |
| PATCH | `/absences/:absenceId` | `{ startDate?, endDate? }` | `Absence` |
| DELETE | `/absences/:absenceId` | — | `204` |

Overlap → **409**.

### `Absence`

| Field | Type |
|-------|------|
| `id` | `string` |
| `memberId` | `string` |
| `houseId` | `string` |
| `startDate` | `string` (date) |
| `endDate` | `string` (date) |
| `createdAt` | `string` (datetime) |
| `member` | partial member + `user` (optional) |

## Snapshots

| Method | Path | Response |
|--------|------|----------|
| GET | `/houses/:houseId/snapshots` | `BalanceSnapshot[]` |
| GET | `/houses/:houseId/snapshots/latest` | `BalanceSnapshot` (with `entries`) |

### `BalanceSnapshot`

| Field | Type |
|-------|------|
| `id` | `string` |
| `houseId` | `string` |
| `triggerType` | `"ABSENCE_START" \| "ABSENCE_END" \| "MEMBER_JOIN"` |
| `triggerMemberId` | `string` |
| `absenceId` | `string \| null` |
| `rotationalCounts` | `Record<rotationalTypeId, Record<memberId, count>>` |
| `createdAt` | `string` (datetime) |
| `entries` | `BalanceSnapshotEntry[]` (optional) |

### `BalanceSnapshotEntry`

| Field | Type |
|-------|------|
| `id` | `string` |
| `snapshotId` | `string` |
| `creditorMemberId` | `string` |
| `debtorMemberId` | `string` |
| `netAmount` | `string` (decimal) |

## Expenses

| Method | Path | Body highlights | Response |
|--------|------|-----------------|----------|
| POST | `/houses/:houseId/expenses` | `expenseType`, `amount`, `description`, `expenseDate`, `respectsAbsence?`, `excludedMemberIds?`, `templateId?`, `rotationalTypeId?` | `Expense` |
| GET | `/houses/:houseId/expenses` | Query: `type`, `from`, `to`, `memberId` | `Expense[]` |
| GET | `/houses/:houseId/expenses/:expenseId` | — | `Expense` |

### `Expense`

| Field | Type |
|-------|------|
| `id` | `string` |
| `houseId` | `string` |
| `payerMemberId` | `string` |
| `templateId` | `string \| null` |
| `rotationalTypeId` | `string \| null` |
| `expenseType` | `"REGULAR" \| "INSTANT" \| "ROTATIONAL"` |
| `amount` | `string` (decimal) |
| `description` | `string` |
| `respectsAbsence` | `boolean` |
| `expenseDate` | `string` (date) |
| `createdAt` | `string` (datetime) |
| `exclusions` | `ExpenseExclusion[]` (optional) |
| `splits` | `ExpenseSplit[]` (optional; absent for ROTATIONAL) |

### `ExpenseExclusion`

| Field | Type |
|-------|------|
| `id` | `string` |
| `expenseId` | `string` |
| `excludedMemberId` | `string` |

### `ExpenseSplit`

| Field | Type |
|-------|------|
| `id` | `string` |
| `expenseId` | `string` |
| `debtorMemberId` | `string` |
| `amountOwed` | `string` (decimal) |
| `isSettled` | `boolean` |

## Templates

| Method | Path | Body highlights | Response |
|--------|------|-----------------|----------|
| POST | `/houses/:houseId/templates` | `title`, `responsibleMemberId`, `period`, `respectsAbsence?` | `RegularExpenseTemplate` |
| GET | `/houses/:houseId/templates` | — | `RegularExpenseTemplate[]` |
| PATCH | `/houses/:houseId/templates/:templateId` | partial fields | `RegularExpenseTemplate` |
| DELETE | `/houses/:houseId/templates/:templateId` | — | `204` |

### `RegularExpenseTemplate`

| Field | Type |
|-------|------|
| `id` | `string` |
| `houseId` | `string` |
| `title` | `string` |
| `responsibleMemberId` | `string` |
| `period` | `"WEEKLY" \| "MONTHLY"` |
| `respectsAbsence` | `boolean` |
| `isActive` | `boolean` |
| `createdAt` | `string` (datetime) |

## Rotational

| Method | Path | Response |
|--------|------|----------|
| POST | `/houses/:houseId/rotational-types` | `RotationalExpenseType` |
| GET | `/houses/:houseId/rotational-types` | `RotationalExpenseType[]` (each includes `nextInQueue`) |
| PATCH | `/houses/:houseId/rotational-types/:typeId` | `RotationalExpenseType` |

### `RotationalExpenseType`

| Field | Type |
|-------|------|
| `id` | `string` |
| `houseId` | `string` |
| `title` | `string` |
| `respectsAbsence` | `boolean` |
| `isActive` | `boolean` |
| `createdAt` | `string` (datetime) |
| `nextInQueue` | partial `HouseMember` + `user` (GET list only) |

## Dashboard

| Method | Path | Response |
|--------|------|----------|
| GET | `/houses/:houseId/dashboard` | `DashboardSummary` |
| GET | `/houses/:houseId/dashboard/:memberId` | `MemberDebtDetail` |
| GET | `/houses/:houseId/activity` | `ActivityItem[]` |

### `DashboardSummary`

| Field | Type |
|-------|------|
| `houseId` | `string` |
| `memberId` | `string` |
| `consolidatedBalance` | `string` (decimal, absolute) |
| `consolidatedDirection` | `"CREDITOR" \| "DEBTOR" \| "SETTLED"` |
| `pairwise` | `PairwiseBalance[]` |

### `PairwiseBalance`

| Field | Type |
|-------|------|
| `memberId` | `string` |
| `memberName` | `string \| null` |
| `netAmount` | `string` (decimal, absolute) |
| `direction` | `"OWED_TO_YOU" \| "YOU_OWE"` |

### `MemberDebtDetail`

| Field | Type |
|-------|------|
| `houseId` | `string` |
| `viewerMemberId` | `string` |
| `counterpartyMemberId` | `string` |
| `counterpartyName` | `string \| null` |
| `netAmount` | `string` (decimal, absolute) |
| `direction` | `"OWED_TO_YOU" \| "YOU_OWE" \| "SETTLED"` |
| `lines` | `DebtDetailLine[]` |

### `DebtDetailLine`

| Field | Type |
|-------|------|
| `expenseId` | `string` |
| `description` | `string` |
| `expenseDate` | `string` (date) |
| `expenseType` | expense type enum |
| `amountOwed` | `string` (decimal) |
| `payerMemberId` | `string` |
| `payerName` | `string \| null` |

### `ActivityItem`

| Field | Type |
|-------|------|
| `id` | `string` |
| `houseId` | `string` |
| `expenseId` | `string` |
| `expenseType` | expense type enum |
| `description` | `string` |
| `amount` | `string` (decimal) |
| `expenseDate` | `string` (date) |
| `createdAt` | `string` (datetime) |
| `payerMemberId` | `string` |
| `payerName` | `string \| null` |
| `yourShare` | `string \| null` (decimal; null for ROTATIONAL) |

## Domain DTOs

Canonical TypeScript definitions: `packages/shared/src/index.ts` (`@housemate/shared`).

Agents must not invent alternate field names.
