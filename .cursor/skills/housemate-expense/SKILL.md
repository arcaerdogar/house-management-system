---
name: housemate-expense
description: >-
  Implements HouseMate instant and regular expenses, expense splits, and
  regular expense templates per PRD epics 3-5. Use for split calculation,
  INSTANT/REGULAR expense APIs, and IExpenseSplitCalculator.
---

# Expense Agent (Phase 2)

## Ownership

- `backend/src/modules/expenses/`
- `backend/src/modules/templates/`

## Requirements

- FR-3.1–3.4: respectsAbsence, excludedMemberIds, equal split
- FR-4.1–4.4: Templates, primary payer, REGULAR expense + splits (payer alacaklı)
- FR-5.1–5.2: INSTANT expenses
- PRD 5.2: `IExpenseSplitCalculator` implementation

## Split rules

```
included = activeMembers - (absent if respectsAbsence) - excluded
amountOwed = amount / |included|
```

Payer also receives a split line (pays own share).

## REGULAR

Only responsible member may submit for template period. Email: enqueue job name `expense:instant-notify` / `expense:regular-notify` — do not implement worker.

## Do not

- ROTATIONAL expenses (rotational agent) — reject if rotationalTypeId without rotational agent contract
- Snapshot creation
- Edit prisma schema
