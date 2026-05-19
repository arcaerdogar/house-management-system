# Subagent Prompt Şablonları

Orchestrator her görevde aşağıdaki bloğu kopyalar, `{{PLACEHOLDER}}` doldurur ve Task tool ile gönderir.

---

## Genel prompt bloğu (tüm agent'lar)

```
You are the HouseMate {{AGENT_NAME}} subagent.

READ FIRST (mandatory):
- Skill: .cursor/skills/housemate-{{SKILL_SLUG}}/SKILL.md
- Ownership: docs/OWNERSHIP.md — only edit your paths
- PRD: HouseMate_Finance_PRD_v3.pdf
- API contract: docs/api-contract.md
- Phase: docs/DEVELOPMENT_PLAN.md — Phase {{PHASE}}

RULES:
- Do NOT modify files outside your ownership matrix
- Do NOT change prisma schema unless you are schema agent
- Use @housemate/shared enums — never duplicate
- Match backend template patterns (asyncHandler, Zod validate, HttpError)
- Import cross-module only via backend/src/domain/contracts/
- When done: list files changed, acceptance criteria status, blockers for orchestrator
- Do NOT run git commit or git push — orchestrator commits and pushes after each completed step

TASK:
{{TASK_DESCRIPTION}}

DELIVERABLES:
{{DELIVERABLES}}

ACCEPTANCE:
{{ACCEPTANCE_CRITERIA}}
```

---

## Faz 0 — Schema

**Skill:** `housemate-schema`  
**Task:** Implement full Prisma schema per PRD section 4. Add migration. Extend packages/shared. Create backend/src/domain/contracts/ interfaces. Update docs/api-contract.md with DTO shapes.

**Acceptance:** prisma migrate dev succeeds; shared package builds.

---

## Faz 1 — Paralel (3 prompt)

### house

**Task:** Implement backend/src/modules/houses/ — create house, join by invite, list members, remove member (admin). Wire routes (export router only; orchestrator merges server.ts). On member join call ISnapshotService.createMemberJoinSnapshot.

### absence-snapshot

**Task:** Implement absences + snapshots modules. Snapshot creation per PRD 5.4. Expose ISnapshotService. Absence overlap validation. Admin calendar endpoint.

### frontend-shell

**Task:** Complete frontend scaffold: Vite React TS, auth pages, API client with refresh, AppLayout, protected routes, env VITE_API_URL.

---

## Faz 2 — Paralel (3 prompt)

### expense

**Task:** expenses + templates modules. Split calculator per PRD 5.2. INSTANT and REGULAR only. Queue email job via contract (do not implement worker).

### rotational

**Task:** rotational module. Queue algorithm PRD 5.1. ROTATIONAL expenses without splits.

### frontend-houses

**Task:** frontend/src/features/houses/ — all house and absence UI.

---

## Faz 3 — Paralel (3 prompt)

### dashboard

**Task:** dashboard module — balance PRD 5.3, pairwise detail, activity feed with filters.

### jobs-mail

**Task:** BullMQ workers/crons FR-9.x + FR-2.5/2.6. housemate-*.hbs templates. Rate limit per PRD.

### frontend-expenses

**Task:** All expense UIs in frontend/src/features/expenses/.

---

## Faz 4 — frontend-dashboard

**Task:** Dashboard + activity pages in frontend/src/features/dashboard/. Polish empty states.

---

## Orchestrator integration prompt (self)

```
Merge route imports into backend/src/server.ts from completed modules.
Run: npm install && npm run build:shared && npm run prisma:gen
Smoke: health, auth login, {{PHASE_SPECIFIC_ENDPOINTS}}
Update docs/PRD_CHECKLIST.md for completed FR ids.
```
