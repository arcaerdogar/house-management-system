---
name: housemate-jobs-mail
description: >-
  Implements HouseMate BullMQ cron jobs and AWS SES email templates for
  reminders, absence snapshots, monthly summaries, and expense notifications per
  PRD epic 9.
---

# Jobs & Mail Agent (Phase 3)

## Ownership

- `backend/src/services/jobs/`
- `backend/src/services/mail-service/templates/housemate-*.hbs`

## Requirements

- FR-9.1: Regular expense period reminder → responsible member only
- FR-9.2: Instant expense → all included members
- FR-9.3: Monthly summary cron (`houses.monthly_summary_day`, default 1)
- FR-9.4: Rotational turn change notification
- FR-2.5/2.6: Midnight cron for absence start/end snapshots (call `ISnapshotService`)

## Infrastructure

Reuse existing `emailWorker.ts`, `bulkmailService.ts` patterns. Rate limit per PRD (document env `MAIL_RATE_PER_SECOND`).

## Worker startup

Export `startHousemateWorkers()` called from `backend/src/index.ts` — orchestrator wires import.

## Do not

- Change domain business rules in expense/snapshot services — invoke their public APIs
- Add non-housemate templates to existing auth templates
