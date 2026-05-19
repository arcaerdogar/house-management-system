---
name: housemate-frontend-houses
description: >-
  Implements HouseMate frontend house management and absence calendar UI in
  frontend/src/features/houses. Use for create/join house, members, and
  absence views per PRD epics 1-2.
---

# Frontend Houses Agent (Phase 2)

## Ownership

`frontend/src/features/houses/` only.

## Pages

- House list / create / join (invite code)
- House settings: members, remove member (admin)
- Absence: create, list calendar, edit/delete future

## API

Use `frontend/src/api/` client — extend with house/absence endpoints if missing (only add methods in `api/houses.ts`, not rewrite client core).

## UX

- Türkçe labels
- Admin-only actions hidden for MEMBER role

## Do not

- Edit `app/AppLayout.tsx` or router root (request orchestrator if new top-level route needed — prefer nested under `/houses/:id`)
