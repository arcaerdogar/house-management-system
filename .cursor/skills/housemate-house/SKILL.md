---
name: housemate-house
description: >-
  Implements HouseMate house and member management APIs (create, join, members,
  admin remove). Use for FR-1.x, house routes, and IHouseMembershipService
  implementation in the houses module.
---

# House Agent (Phase 1)

## Ownership

`backend/src/modules/houses/` only.

## Requirements (PRD)

- FR-1.2: POST `/houses`, POST `/houses/join` (invite_code)
- FR-1.3: DELETE member, role ADMIN/MEMBER
- FR-2.7: On join → call `ISnapshotService.createMemberJoinSnapshot`

## Implement `IHouseMembershipService`

Export singleton from `houses/membership.service.ts` for other modules.

## Patterns

Copy `backend/src/modules/auth/` structure: routes → controller → service → Zod validators.

## Auth

All routes use `authGuard`; resolve `userId` from `req.user.id`.

## Do not

- Touch prisma schema
- Implement absences, expenses, snapshots (call contract only)
- Edit `server.ts` (export router for orchestrator)
