# Dosya Sahipliği Matrisi

Subagent'lar **yalnızca** kendi dizinlerinde değişiklik yapar. Başka dizine dokunmak orchestrator onayı gerektirir.

| Agent | Sahip olduğu yollar | Yasak |
|-------|---------------------|-------|
| **schema** | `backend/prisma/`, `packages/shared/src/` | `backend/src/modules/*` implementasyon |
| **house** | `backend/src/modules/houses/` | prisma schema, diğer modüller |
| **absence-snapshot** | `backend/src/modules/absences/`, `backend/src/modules/snapshots/`, `backend/src/domain/snapshot/` | expenses, rotational, dashboard |
| **expense** | `backend/src/modules/expenses/`, `backend/src/modules/templates/` | rotational, snapshot service impl |
| **rotational** | `backend/src/modules/rotational/` | expense split logic, templates |
| **dashboard** | `backend/src/modules/dashboard/` | expense create, snapshot create |
| **jobs-mail** | `backend/src/services/jobs/`, `backend/src/services/mail-service/templates/housemate-*` | domain modül business logic |
| **frontend-shell** | `frontend/src/app/`, `frontend/src/api/`, `frontend/src/auth/`, `frontend/vite.config.ts`, `frontend/package.json` | feature pages |
| **frontend-houses** | `frontend/src/features/houses/` | expenses, dashboard pages |
| **frontend-expenses** | `frontend/src/features/expenses/` | houses, dashboard |
| **frontend-dashboard** | `frontend/src/features/dashboard/` | houses, expenses |
| **orchestrator** | `docs/`, `.cursor/`, root `package.json`, `AGENTS.md` | feature implementation |

## Paylaşılan dosyalar (orchestrator merge)

| Dosya | Kural |
|-------|-------|
| `backend/src/server.ts` | Her agent route import PR'ı orchestrator birleştirir |
| `backend/src/domain/contracts/*.ts` | Phase 0'da schema agent oluşturur; implementasyon ilgili agent'ta |
| `docs/api-contract.md` | Schema agent yazar; orchestrator onaylar |

## Import kuralları

- Modüller arası: `backend/src/domain/contracts/` üzerinden interface import
- Circular import yasak — orchestrator çözer
- Frontend → `@housemate/shared` ve `frontend/src/api/` client
