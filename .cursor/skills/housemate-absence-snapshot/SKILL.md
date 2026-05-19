---
name: housemate-absence-snapshot
description: >-
  Implements HouseMate absence declarations and BalanceSnapshot lifecycle per
  PRD epics 2 and algorithms 5.3-5.4. Use for absence CRUD, snapshot triggers,
  and ISnapshotService implementation.
---

# Absence & Snapshot Agent (Phase 1)

## Ownership

- `backend/src/modules/absences/`
- `backend/src/modules/snapshots/`
- `backend/src/domain/snapshot/` (implementation helpers)

## Requirements

- FR-2.1–2.4: CRUD, overlap → 409, admin calendar, future-only edit/delete rules
- FR-2.5–2.8: Snapshot on absence start/end, member join (join called from house agent)
- PRD 5.4: Snapshot creation aggregates unsettled splits + prior snapshot entries + rotational_counts JSON

## Implement `ISnapshotService`

Single entry point `createSnapshot`. Never recalculate balance from full history without latest snapshot base.

## Cron hook (Phase 1)

Export `registerAbsenceSnapshotJobs(queue)` — full cron logic completed with jobs-mail agent but register here.

## Do not

- Create ExpenseSplits or expense routes
- Implement rotational queue algorithm (read counts from snapshot only)
