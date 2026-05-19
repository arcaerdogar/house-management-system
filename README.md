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

### Docker (önerilen — Redis + backend + frontend)

```bash
# backend/.env dosyasını doldur (DATABASE_URL, JWT, AWS…)
docker compose up --build
```

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Redis | `localhost:6380` → container 6379 (compose içi: `redis://redis:6379`) |

```bash
npm run docker:up        # compose up --build
npm run docker:down      # compose down
```

### Host üzerinde (Redis yine compose'tan)

```bash
docker compose up redis -d
npm install
npm run dev:backend      # REDIS_URL=redis://localhost:6380
npm run dev:frontend
```

PRD: `HouseMate_Finance_PRD_v3.pdf`
