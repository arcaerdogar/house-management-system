# API Contract (Phase 0 — schema agent maintains)

Base URL: `/api` (orchestrator configures proxy: frontend → backend)

Auth: `Authorization: Bearer <accessToken>` on all `/houses/*` routes.

## Houses

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/houses` | `{ name: string }` | `House` |
| POST | `/houses/join` | `{ inviteCode: string }` | `HouseMember` |
| GET | `/houses/:houseId` | — | `House` |
| GET | `/houses/:houseId/members` | — | `HouseMember[]` |
| DELETE | `/houses/:houseId/members/:memberId` | — | `204` |

## Absences

| Method | Path | Notes |
|--------|------|-------|
| POST | `/houses/:houseId/absences` | Overlap → 409 |
| GET | `/houses/:houseId/absences` | Admin: all; member: own |
| PATCH | `/absences/:absenceId` | Future start_date only |
| DELETE | `/absences/:absenceId` | Not started only |

## Snapshots

| Method | Path |
|--------|------|
| GET | `/houses/:houseId/snapshots` |
| GET | `/houses/:houseId/snapshots/latest` |

## Expenses

| Method | Path | Body highlights |
|--------|------|-----------------|
| POST | `/houses/:houseId/expenses` | `expenseType`, `amount`, `expenseDate`, `respectsAbsence?`, `excludedMemberIds?`, `templateId?`, `rotationalTypeId?` |
| GET | `/houses/:houseId/expenses` | Query: `type`, `from`, `to`, `memberId` |
| GET | `/houses/:houseId/expenses/:expenseId` | — |

## Templates

| Method | Path |
|--------|------|
| POST | `/houses/:houseId/templates` |
| GET | `/houses/:houseId/templates` |
| PATCH | `/houses/:houseId/templates/:templateId` |
| DELETE | `/houses/:houseId/templates/:templateId` |

## Rotational

| Method | Path |
|--------|------|
| POST | `/houses/:houseId/rotational-types` |
| GET | `/houses/:houseId/rotational-types` | Includes `nextInQueue` per type |
| PATCH | `/houses/:houseId/rotational-types/:typeId` |

## Dashboard

| Method | Path |
|--------|------|
| GET | `/houses/:houseId/dashboard` |
| GET | `/houses/:houseId/dashboard/:memberId` |
| GET | `/houses/:houseId/activity` |

## Domain DTOs

See `packages/shared` and Prisma models. Agents must not invent alternate field names.
