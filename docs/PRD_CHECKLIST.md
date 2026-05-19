# PRD v3.0 — Kabul Checklist

Orchestrator faz gate'lerinde işaretler.

## Epik 1 — Ev ve Kullanıcı
- [x] FR-1.1 Auth (template)
- [x] FR-1.2 Ev oluştur / davet ile katıl
- [x] FR-1.3 Admin üye çıkar / rol

## Epik 2 — Yokluk & Snapshot
- [x] FR-2.1–2.4 Yokluk CRUD kuralları
- [x] FR-2.5 Yokluk başlangıcı snapshot (cron)
- [x] FR-2.6 Yokluk bitişi snapshot
- [x] FR-2.7 Yeni üye snapshot, bakiye sıfır
- [x] FR-2.8 Yalnızca 3 tetikleyici

## Epik 3–6 — Harcamalar
- [x] FR-3.1–3.4 Ortak davranışlar
- [x] FR-4.1–4.5 Düzenli giderler
- [x] FR-5.1–5.3 Anlık giderler
- [x] FR-6.1–6.7 Sıralı giderler (splits yok)

## Epik 7–9 — Dashboard & Bildirim
- [x] FR-7.1–7.4 Dashboard
- [x] FR-8.1–8.3 Aktivite akışı
- [x] FR-9.1–9.4 Mailler + cron

## Notlar
- E2E smoke DB + Redis gerektirir (`DATABASE_URL`, `REDIS_URL`)
- `GET /houses` listesi yok — frontend localStorage ile ev listesi
