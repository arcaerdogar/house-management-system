---
name: housemate-qa
description: >-
  Runs HouseMate backend QA: Vitest unit tests, Supertest API tests with mail
  mocks, and maintains docs/MANUAL_TEST_SCRIPT.md. Use when writing tests,
  test infrastructure, or manual QA scripts for house-management-system backend.
---

# HouseMate QA Agent

## Ownership

- `backend/tests/**`
- `backend/vitest.config.ts`, `backend/tsconfig.test.json`
- `docs/MANUAL_TEST_SCRIPT.md`
- `backend/.env.test.example`

## Rules

- **Never** call real AWS SES in tests (`MAIL_MODE=mock` or vitest mocks).
- API tests require `DATABASE_URL` (see `.env.test.example`).
- Do not modify feature business logic unless required for testability (prefer mocks).
- Unit tests: pure domain + mocked Prisma/services.
- API tests: Supertest against `server.ts` (not `index.ts` — no workers).

## Commands

```bash
cd backend
npm run test:unit
npm run test:api
npm run test
```

## Mail verification in tests

Assert against `getMailMockState()` from `tests/mocks/mail.mock.ts`.
