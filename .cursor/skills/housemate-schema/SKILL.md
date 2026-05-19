---
name: housemate-schema
description: >-
  Implements HouseMate Prisma schema, migrations, packages/shared types, and
  domain contract interfaces. Use for Phase 0 database design, enum alignment
  with PRD v3, and api-contract.md updates.
---

# Schema Agent (Phase 0)

## Ownership

- `backend/prisma/schema.prisma`, `backend/prisma/migrations/`
- `packages/shared/src/`
- `backend/src/domain/contracts/` (interface definitions)
- `docs/api-contract.md`

## PRD tables (section 4)

Users (extend existing), Houses, HouseMembers, Absences, RegularExpenseTemplates, RotationalExpenseTypes, Expenses, ExpenseExclusions, ExpenseSplits, BalanceSnapshots, BalanceSnapshotEntries.

Add `name` to User if missing per PRD.

## Enums

Mirror `@housemate/shared`: HouseMemberRole, ExpenseType, RegularExpensePeriod, SnapshotTriggerType.

## Contracts to export

- `ISnapshotService`, `IHouseMembershipService`, `IExpenseSplitCalculator` — signatures in contracts; no implementation here.

## Steps

1. Map PRD fields → Prisma models with indexes on `house_id`, `member_id`, dates
2. `rotational_counts` → `Json` on BalanceSnapshot
3. Run migration; add `@housemate/shared` to backend `package.json` workspace dep
4. Build shared package
5. Document DTO shapes in api-contract.md

## Do not

- Create `backend/src/modules/*` implementations
- Modify `server.ts`
