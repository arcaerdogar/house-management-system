# HouseMate Finance — Agent Guide

## Orchestrator

The **orchestrator** (main Cursor agent) owns phase gates, subagent dispatch, and `server.ts` merges. Skill: `.cursor/skills/housemate-orchestrator/SKILL.md`

## Subagents

| Skill | Phase | Role |
|-------|-------|------|
| `housemate-schema` | 0 | Prisma + shared types + contracts |
| `housemate-house` | 1 | Houses & members |
| `housemate-absence-snapshot` | 1 | Absences & balance snapshots |
| `housemate-frontend-shell` | 1 | React app foundation |
| `housemate-expense` | 2 | Expenses & templates |
| `housemate-rotational` | 2 | Rotational queue |
| `housemate-frontend-houses` | 2 | House UI |
| `housemate-dashboard` | 3 | Dashboard & activity API |
| `housemate-jobs-mail` | 3 | BullMQ & SES |
| `housemate-frontend-expenses` | 3 | Expense UI |
| `housemate-frontend-dashboard` | 4 | Dashboard UI |

## Before coding

1. Read `docs/OWNERSHIP.md`
2. Read your skill's `SKILL.md`
3. Read `HouseMate_Finance_PRD_v3.pdf` for your epics only

## Never

- Edit another agent's directories
- Add Settle Up, multi-currency, WebSocket (out of scope v1)
- Duplicate enums outside `packages/shared`
- Run `git commit` or `git push` (orchestrator only — after every completed step)

## Git

Orchestrator: commit + push after each subagent task, integration merge, and phase gate. See `.cursor/rules/housemate-git-workflow.mdc`.
