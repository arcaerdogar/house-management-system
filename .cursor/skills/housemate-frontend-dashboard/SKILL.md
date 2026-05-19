---
name: housemate-frontend-dashboard
description: >-
  Implements HouseMate dashboard, debt drill-down, and activity feed UI in
  frontend/src/features/dashboard. Use for PRD epics 7-8 frontend, Phase 4.
---

# Frontend Dashboard Agent (Phase 4)

## Ownership

`frontend/src/features/dashboard/` only.

## Pages

- Home dashboard: consolidated balance, per-person cards
- Member detail: expense line items
- Activity feed with filters

## Rules

- Do not show rotational items in debt totals (show separate "sıra" section link to expenses)
- Format currency as TRY with `tr-TR`

## Do not

- Expense forms or house admin
