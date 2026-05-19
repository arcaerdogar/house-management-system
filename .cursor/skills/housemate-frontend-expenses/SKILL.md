---
name: housemate-frontend-expenses
description: >-
  Implements HouseMate expense entry UI for instant, regular, and rotational
  expenses plus template management in frontend/src/features/expenses. Use for
  PRD epics 4-6 frontend.
---

# Frontend Expenses Agent (Phase 3)

## Ownership

`frontend/src/features/expenses/` only.

## Pages

- Expense list with filters
- Instant expense form (respectsAbsence default true, exclusions)
- Regular: template list (admin), payer submit flow
- Rotational: type list, next person badge, entry with override confirm

## Do not

- Dashboard balance UI (dashboard agent)
- House member admin (houses agent)
