# HouseMate Finance — Manuel Test Senaryosu (v1)

Bu belge, sıfırdan uçtan uca manuel QA için adım adım kontrol listesidir.

## Otomatik API E2E (manuel script)

Manuel adımların API karşılığı tek bir Supertest akışında çalıştırılabilir (tarayıcı/UI yok):

```bash
cd backend
# DATABASE_URL gerekir (.env.test veya .env)
npm run test:manual
```

Tüm `tests/e2e` klasörü için: `npm run test:e2e`.

Akış: kullanıcı kayıt/giriş, ev/davet, yokluk, şablonlar, INSTANT/REGULAR/ROTATIONAL harcamalar, dashboard/aktivite, snapshot, admin kuralları, mail mock doğrulama, regresyon (401/409, decimal/date). Settle Up endpoint’i yoktur; borçlar dashboard ile doğrulanır.

---

## Ortam

| Servis | URL (Docker Compose) |
|--------|----------------------|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Redis | `localhost:6380` (host) / `redis:6379` (container içi) |

**Başlatma:**

```bash
# Monorepo kökünden
docker compose up --build
```

Backend ve frontend ayrı çalıştırılacaksa: `backend/.env` dosyasını doldurun, `npm run dev -w backend` ve `npm run dev -w frontend`.

**Otomatik testler:** `cd backend && npm run test:unit` (DB gerekmez). API testleri için `backend/.env.test` içinde `DATABASE_URL` ve `npm run test:api`. Bu belgenin tam akışı: `npm run test:manual`.

**E-posta:** Manuel testte gerçek AWS SES isteğe bağlıdır (`MAIL_MODE` veya `.env` anahtarları). CI ve otomatik testlerde mail **mock** kullanılır; gerçek SES çağrılmaz.

---

## v1 kapsam notu — Settle Up yok

PRD v1 kapsamında **Settle Up** akışı ve `is_settled` alanını manuel işaretleme API’si **yoktur**. “Ödendi beyanı” adımında kullanıcıya böyle bir ekran gösterilmemelidir; borç doğrulaması **dashboard** üzerinden yapılır (konsolide bakiye, ikili borç detayı, aktivite).

---

## 1. Kullanıcı hesapları

- [ ] **Kullanıcı A** kayıt ol (`/auth/register` veya UI kayıt)
- [ ] **Kullanıcı B** kayıt ol (farklı e-posta)
- [ ] **Kullanıcı C** kayıt ol (isteğe bağlı, 3+ üye senaryosu)
- [ ] A ile giriş yap; token / oturum sürdürülüyor mu?
- [ ] Çıkış / yeniden giriş dene

---

## 2. Ev oluşturma ve davet

- [ ] A ile **ev oluştur** (ad: örn. “Test Evi”)
- [ ] Davet kodunu not et (`inviteCode`)
- [ ] B ile **davet koduyla katıl**
- [ ] Üye listesinde A (ADMIN) ve B (MEMBER) görünüyor mu?
- [ ] Geçersiz davet kodu → hata mesajı
- [ ] B’nin tekrar katılması → çakışma / zaten üye mesajı

---

## 3. Yokluk (absence)

- [ ] B kendi adına **gelecek tarihli** yokluk bildir (başlangıç ≤ bitiş)
- [ ] Çakışan ikinci yokluk → 409 benzeri hata
- [ ] Başlamamış yokluğu **düzenle** (bitiş tarihini uzat)
- [ ] Başlamış yokluğu silmeyi dene → reddedilmeli
- [ ] Ev yokluk listesinde tüm üyelerin kayıtları görünür

---

## 4. Şablonlar (düzenli gider)

- [ ] ADMIN ile **REGULAR şablon** oluştur (ör. “Kira”, sorumlu üye, MONTHLY/WEEKLY)
- [ ] Sorumlu olmayan üyenin aynı şablon için REGULAR harcama girmesini dene → 403
- [ ] Sorumlu üye dönem içinde **bir REGULAR harcama** gir
- [ ] Aynı dönemde ikinci REGULAR → 409 (dönem çakışması)

---

## 5. Harcamalar — üç tip

### 5.1 INSTANT (anında)

- [ ] Toplam tutar, açıklama, tarih gir
- [ ] `respectsAbsence: true` ile yokluktaki üyenin paya dahil olmadığını doğrula
- [ ] `excludedMemberIds` ile seçili üyelerin hariç tutulduğunu doğrula
- [ ] Harcama detayında **ExpenseSplits** var; tutarlar toplamı ≈ harcama tutarı

### 5.2 REGULAR (şablondan)

- [ ] Yukarıdaki şablon üzerinden kayıt
- [ ] Bildirim / aktivite akışında görünür

### 5.3 ROTATIONAL (sıralı)

- [ ] ADMIN **rotational type** oluştur (ör. “Su”)
- [ ] Sıradaki olmayan üye harcama girsin → 409 + `allowOverride` bilgisi
- [ ] `allowOverride: true` ile devam (veya sıradaki üye girsin)
- [ ] Harcamada **ExpenseSplits yok** (ROTATIONAL kuralı)
- [ ] Rotasyon tipi listesinde `nextInQueue` güncellenir

---

## 6. Dashboard ve borç doğrulama

> Settle Up yok — borçları buradan kontrol edin.

- [ ] **Konsolide bakiye** (`/houses/:id/dashboard`): yön (CREDITOR / DEBTOR / SETTLED) mantıklı mı?
- [ ] **İkili liste** (`pairwise`): diğer üyelerle net tutarlar
- [ ] Bir üyeye tıklayınca **borç detayı** (`/dashboard/:memberId`): satırlar harcamalarla eşleşiyor mu?
- [ ] **Aktivite** (`/activity`): filtre `type`, `from`, `to` çalışıyor mu?
- [ ] INSTANT/REGULAR sonrası `yourShare` dolu; ROTATIONAL’da `yourShare` null

---

## 7. Snapshot (isteğe bağlı derin kontrol)

- [ ] Yeni üye katılınca snapshot listesinde `MEMBER_JOIN` kaydı
- [ ] `/snapshots/latest` → `entries` ve `rotationalCounts` JSON yapısı okunabilir

---

## 8. Admin işlemleri

- [ ] ADMIN, üyeyi evden çıkarabiliyor mu?
- [ ] MEMBER aynı işlemi yapamıyor mu? (403)
- [ ] Tek ADMIN’i silmeye çalış → engellenmeli

---

## 9. E-posta (opsiyonel, gerçek SES)

- [ ] `.env` içinde geçerli SES ayarları ile bir INSTANT harcama sonrası kuyruk / e-posta (sadece bilinçli test ortamında)
- [ ] Otomatik testlerde `getMailMockState()` ile job kaydı — gerçek gönderim yok

---

## 10. Regresyon kontrol listesi (kısa)

- [ ] 401: korumalı route token’sız
- [ ] 409: yokluk overlap, REGULAR dönem tekrarı, rotational sıra uyumsuzluğu
- [ ] Decimal alanlar API’de string (`"125.50"`)
- [ ] Tarih alanları `YYYY-MM-DD`

---

## Sorun kaydı

Hata bulursanız: endpoint, kullanıcı rolü, istek gövdesi (secret’sız), beklenen/gerçekleşen HTTP kodu ve ekran görüntüsü ile issue açın.
