---
name: housemate-frontend-shell
description: >-
  Scaffolds HouseMate React SPA with Vite, auth flow, API client, routing, and
  app layout. Use for Phase 1 frontend foundation in frontend/src/app, api, and
  auth directories.
---

# Frontend Shell Agent (Phase 1)

## Ownership

- `frontend/` package setup (package.json, vite, tsconfig)
- `frontend/src/app/`
- `frontend/src/api/`
- `frontend/src/auth/`
- `frontend/index.html`, `frontend/.env.example`

## Deliverables

- Vite + React 18 + TypeScript + react-router-dom
- Pages: Login, Register (use backend `/auth/*`)
- `apiClient`: attach Bearer, refresh on 401
- `AppLayout`, `ProtectedRoute`, `HouseProvider` (houseId from localStorage)
- Routes: `/login`, `/`, `/houses/*` placeholder

## Env

`VITE_API_URL=http://localhost:3000`

## Do not

- Implement `features/houses|expenses|dashboard` pages (other agents)
- Modify backend
