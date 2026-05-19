# HouseMate Finance

Ortak ev harcama yönetim sistemi — monorepo.

| Paket | Yol | Açıklama |
|-------|-----|----------|
| Backend | `backend/` | Express + Prisma + BullMQ |
| Frontend | `frontend/` | React SPA |
| Shared | `packages/shared/` | API contract tipleri |

## Geliştirme

Multi-agent süreç: [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md)

Orchestrator skill: `.cursor/skills/housemate-orchestrator/SKILL.md`

## Komutlar

```bash
npm install
npm run dev:backend
npm run dev:frontend
```

PRD: `HouseMate_Finance_PRD_v3.pdf`
