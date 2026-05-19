---
name: housemate-dashboard
description: >-
  Implements HouseMate dashboard balance, pairwise debt detail, and activity
  audit feed per PRD epics 7-8 and balance algorithm 5.3. Use for dashboard
  and activity API modules.
---

# Dashboard Agent (Phase 3)

## Ownership

`backend/src/modules/dashboard/` only.

## Requirements

- FR-7.1–7.3: Consolidated balance, per-person breakdown, drill-down
- FR-7.4: Exclude ROTATIONAL from debt totals
- FR-8.1–8.3: Activity feed with filters (type, date, member)
- PRD 5.3: latest snapshot entries + unsettled splits after snapshot.created_at

## Balance formula

For current user in house:
`net = (snapshotCredits + newCredits) - (snapshotDebts + newDebts)`

Pairwise: net between user A and B from snapshot entries + bilateral splits.

## Activity cards

Include: actor, description, amount, date, user's share.

## Do not

- Create or mutate expenses/absences/snapshots
- Send emails
