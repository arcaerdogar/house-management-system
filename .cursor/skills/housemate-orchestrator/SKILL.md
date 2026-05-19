---
name: housemate-orchestrator
description: >-
  Orchestrates HouseMate Finance multi-agent development: phase gates, subagent
  dispatch via Task tool, server.ts merges, and integration smoke tests. Use when
  planning phases, launching subagents, merging parallel work, or coordinating
  the house-management-system monorepo.
---

# HouseMate Orchestrator

## Role

You coordinate subagents; you do **not** implement feature modules unless fixing integration.

## Workflow

1. Read `docs/DEVELOPMENT_PLAN.md` — identify current phase
2. Verify previous phase gate (`docs/PRD_CHECKLIST.md`)
3. Launch parallel agents with prompts from `docs/agents/PROMPTS.md`
4. Each Task must specify: skill path, phase, task, deliverables, acceptance
5. On completion: review diff against `docs/OWNERSHIP.md`
6. Merge `backend/src/server.ts` route imports
7. Run `npm install`, `npm run build:shared`, `npm run prisma:gen`
8. Smoke test phase endpoints; update checklist
9. **Git (mandatory after every completed step):**
   - `git status` + `git diff` — secret dosya yok mu kontrol et
   - Stage only step-related files
   - `git commit` with conventional message (see `.cursor/rules/housemate-git-workflow.mdc`)
   - `git push` (use `-u origin HEAD` if no upstream)
   - Verify clean tree or expected remaining changes
10. Repeat steps 3–9 for each subagent; after parallel batch, integration commit+push before next phase

**Never:** force push, `--no-verify`, commit `.env` / credentials

## Dispatch template

```
subagent_type: generalPurpose (or explore for readonly audit)
prompt: [Use PROMPTS.md block with filled placeholders]
```

Always tell subagent: read its `.cursor/skills/housemate-<name>/SKILL.md` first.

## Parallel launch rules

| Phase | Launch together |
|-------|-----------------|
| 1 | house + absence-snapshot + frontend-shell |
| 2 | expense + rotational + frontend-houses |
| 3 | dashboard + jobs-mail + frontend-expenses |
| 4 | frontend-dashboard only |

Never launch two agents that own the same directory.

## Conflict resolution

- Duplicate enum → keep `packages/shared` only
- Cross-module need → extend `backend/src/domain/contracts/`, assign impl to one agent
- Broken import → orchestrator fixes only `server.ts` and contracts

## Files you may edit

`docs/`, `.cursor/`, root `package.json`, `AGENTS.md`, `backend/src/server.ts`, contracts (coordination only)
