# HouseMate Finance — Yol Haritası (v1 sonrası)

PRD v3.0 kapsamındaki çekirdek özellikler tamamlandıktan sonraki iyileştirmeler.  
Tamamlanan fazlar için: [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) · PRD uyumu: [PRD_CHECKLIST.md](./PRD_CHECKLIST.md).

**Durum etiketleri:** `planlandı` · `devam` · `tamam` · `ertelendi`

---

## Özet tablo

| #   | Başlık                                                                 | Durum     | Öncelik |
| --- | ---------------------------------------------------------------------- | --------- | ------- |
| 1   | [Profil ve görünen ad](#1-profil-ve-görünen-ad)                        | planlandı | P0      |
| 2   | [Davet kodu + admin onayı](#2-davet-kodu-ile-eve-katılım--admin-onayı) | planlandı | P1      |
| 3   | [UI/UX iyileştirmeleri](#3-uiux-iyileştirmeleri)                       | planlandı | P1      |
| 4   | [Diğer adaylar](#4-diğer-adaylar)                                      | —         | —       |

---

## 1. Profil ve görünen ad

**Durum:** planlandı  
**Öncelik:** P0

### Problem

Kayıt yalnızca e-posta ve şifre alıyor; `User.name` çoğu kullanıcıda `null` kalıyor. Arayüzde üye adı `memberDisplayName` ile çözülüyor:

- `user.name` varsa → ad
- yoksa → e-posta
- ikisi de yoksa → **"Üye"**

Sonuç: üye listesi, harcama ödeyen, dashboard borç/alacak, sıralı harcama sırası, e-posta şablonları vb. yerlerde herkes **"Üye"** veya ham e-posta ile görünüyor; ev içi okunabilirlik düşük.

**İlgili kod (mevcut):**

- Şema: `User.name` (`String?`) — `backend/prisma/schema.prisma`
- Kayıt: `register(email, password)` — isim alanı yok — `frontend/src/auth/`
- Gösterim: `memberDisplayName` — `frontend/src/features/expenses/utils.ts`, `frontend/src/features/houses/HouseMembersPage.tsx`, `frontend/src/features/dashboard/utils.ts`
- API: `GET /me` var; profil **güncelleme** yok — `backend/src/modules/auth/meRoutes/`

### Hedef

Kullanıcılar kim olduklarını net şekilde görsün ve ev arkadaşları birbirini e-posta yerine **isim** ile tanısın.

### Kapsam (önerilen v1)

| Alan       | Açıklama                                                  | Zorunlu                |
| ---------- | --------------------------------------------------------- | ---------------------- |
| Ad         | Tek alan veya `firstName` + `lastName`                    | Evet (en az biri dolu) |
| Görünen ad | Listelerde kullanılacak kısa ad; boşsa ad+soyad birleşimi | Hayır (otomatik türet) |
| E-posta    | Mevcut; değişiklik bu fazda **dışında** (ayrı iş)         | —                      |
| Şifre      | Profil ekranında değiştirme isteğe bağlı (ayrı alt görev) | Hayır                  |

**Model kararı (implementasyon öncesi netleştir):**

- **A — Tek `name` alanı** (mevcut şema): "Ahmet Yılmaz" tek input; en az süre.
- **B — `firstName` + `lastName`:** Migration gerekir; formlar ve validasyon daha net.
- **C — `displayName` + opsiyonel ad/soyad:** Ev içi takma ad; ileride ev bazlı rumuz için zemin.

Öneri: kısa vadede **A** veya **B**; PRD’de ayrıntı yoksa **B** (kayıt + profil formları için daha iyi UX).

### Kullanıcı hikayeleri

1. Kayıt olurken ad (ve istenirse soyad) girebilmeliyim.
2. Giriş yaptıktan sonra profilimden ad/soyadımı güncelleyebilmeliyim.
3. Adım yokken uygulama beni nazikçe profili tamamlamaya yönlendirmeli (banner veya ilk giriş modalı).
4. Ev üyeleri listesinde ve harcamalarda herkes **"Üye"** yerine gerçek adıyla görünmeli.
5. E-posta bildirimlerinde alıcı adı anlamlı olmalı (`member-lookup`, job şablonları).

### Backend

- [ ] `PATCH /me` (veya `PUT /me/profile`) — auth zorunlu
  - Body: `{ name }` veya `{ firstName, lastName }` (model kararına göre)
  - Validasyon: trim, min/max uzunluk, boş string → 400
- [ ] `GET /me` yanıtında güncel profil alanları
- [ ] Kayıt (`POST /auth/register`) isteğe bağlı veya zorunlu isim alanı
- [ ] `UserSummary` / shared tipler güncelle — `packages/shared`
- [ ] Üye listesi ve expense/dashboard DTO’larında `user.name` (veya türetilmiş display) dolu dönsün
- [ ] Birim test: validator; API test: register + patch + GET /me

**Sahiplik:** `housemate-frontend-shell` (auth + profil UI), backend auth/users modülü (mevcut auth yapısına uygun agent veya küçük auth patch).

### Frontend

- [ ] **Profil / Ayarlar** sayfası (`/profile` veya `/settings`)
  - Ad, soyad (veya tek isim alanı)
  - Kaydet → `PATCH /me`
  - Başarı / hata mesajları (Türkçe)
- [ ] Kayıt formuna isim alan(ları)
- [ ] `memberDisplayName` tek yardımcıda topla (`@/lib/memberDisplayName` veya `shared` util); tüm feature’lar bunu kullansın
- [ ] Ad yokken: e-postanın yerel kısmı (`ahmet@…` → `ahmet`) **geçici** gösterim; asıl çözüm profil tamamlama
- [ ] Header veya layout’ta profil linki
- [ ] Opsiyonel: `name` null iken dashboard/ev girişinde “Profilini tamamla” banner’ı

### Kabul kriterleri

- [ ] İki farklı kullanıcı kayıt olduktan sonra aynı evde üye listesinde **farklı, okunabilir isimler** görünür.
- [ ] Anlık/düzenli/sıralı harcama ve bakiye ekranlarında ödeyen/alacaklı **"Üye"** fallback’i yalnızca gerçekten veri yokken kullanılır.
- [ ] Manuel test: [MANUAL_TEST_SCRIPT.md](./MANUAL_TEST_SCRIPT.md) — üye adı kontrolü maddesi eklenecek.
- [ ] `npm run build -w frontend` ve backend testleri yeşil.

### PRD / dışı kapsam (sonra düşünülebilir)

- Ev bazlı takma ad (aynı evde farklı görünen ad)
- Profil fotoğrafı
- E-posta değiştirme + doğrulama
- Telefon numarası

### Tahmini agent dağılımı

1. Schema (yalnızca B/C seçilirse) → `housemate-schema`
2. Auth + `/me` PATCH → backend auth modülü
3. Profil UI + kayıt formu → `housemate-frontend-shell`
4. `memberDisplayName` refactor → orchestrator veya ilgili frontend agent’lar (houses, expenses, dashboard)

---

## 2. Davet kodu ile eve katılım — admin onayı

**Durum:** planlandı  
**Öncelik:** P1 (profil sonrası veya paralel)

### Problem

Davet kodu (`POST /houses/join`) ile katılan kullanıcı **anında aktif üye** oluyor; ev yöneticisi onayı yok.

**Mevcut davranış:**

- `joinHouse` → `HouseMember` oluşturur / `isActive: true` yapar — `backend/src/modules/houses/houses.service.ts`
- Katılım sonrası üye listesi, harcamalar, dashboard hemen açılır — `assertActiveMember`
- `JoinHouseForm` başarıda doğrudan eve yönlendirir — `frontend/src/features/houses/JoinHouseForm.tsx`

Bu, tanımadığı kişilerin kodu bilerek eve girmesine izin verir.

### Hedef

1. Kullanıcı davet kodunu girer → **katılım isteği** oluşur (henüz eve erişemez).
2. Ev **yöneticisi (ADMIN)** isteği görür → **Kabul** veya **Red**.
3. Kabul edilirse üye aktif olur, eve ve tüm özelliklere erişir.
4. Reddedilirse istek kapanır; kullanıcı bilgilendirilir.

### Akış (önerilen)

```mermaid
sequenceDiagram
  participant U as Yeni kullanıcı
  participant API as Backend
  participant A as Ev yöneticisi

  U->>API: POST /houses/join { inviteCode }
  API-->>U: 202 / pending — "Onay bekleniyor"
  API->>A: (opsiyonel) e-posta / uygulama bildirimi
  A->>API: GET pending members
  A->>API: POST .../approve veya .../reject
  alt Kabul
    API-->>U: Üye aktif; MEMBER_JOIN snapshot
  else Red
    API-->>U: İstek reddedildi
  end
```

### Veri modeli (öneri)

**Seçenek A — `membershipStatus` enum (tercih edilen):**

`HouseMember` üzerinde:

| Değer      | Anlamı                                                     |
| ---------- | ---------------------------------------------------------- |
| `ACTIVE`   | Onaylı, tam erişim (mevcut `isActive: true` ile eşdeğer)   |
| `PENDING`  | Onay bekliyor; eve API/UI erişimi yok                      |
| `REJECTED` | Reddedildi (geçmiş / tekrar başvuru politikası ayrı karar) |
| `INACTIVE` | Çıkarılmış / ayrılmış (mevcut pasif üye)                   |

`isActive` ile çakışmayı önlemek için migration’da tek kaynak seçilmeli (ör. `status` alanı, `isActive` türetilmiş veya kaldırılır).

**Seçenek B — Yalnızca `isActive: false` + `pendingApproval: true`:** Daha az migration; durumlar daha az net.

**Tekrar başvuru:** Aynı kullanıcı + ev için reddedilmiş istekten sonra yeniden `join` → yeni `PENDING` kaydı veya mevcut kaydı `PENDING`’e çek (ürün kararı).

### Kullanıcı hikayeleri

1. Davet kodu girdim; “Yönetici onayı bekleniyor” mesajı görürüm, eve giremem.
2. Yönetici olarak bekleyen istekleri listeler, profil adı/e-posta ile kim olduğunu görürüm.
3. İsteği kabul edersem kişi üye listesine düşer ve harcama/bakiye kullanabilir.
4. Reddedersem kişi eve erişemez; istek listeden kalkar.
5. Zaten aktif üyeyim → kod ile tekrar katılmaya çalışırsam anlamlı hata (mevcut conflict).

### Backend

- [ ] Şema: üyelik durumu (`PENDING` / `ACTIVE` / …) — `housemate-schema`
- [ ] `POST /houses/join` → aktif üye **oluşturma**; `PENDING` kayıt + `202 Accepted` veya `201` + `status: PENDING`
- [ ] `assertActiveMember` ve tüm ev kapsamlı route’lar → yalnızca `ACTIVE` üyeler
- [ ] `GET /houses/:houseId/members/pending` — **ADMIN** only
- [ ] `POST /houses/:houseId/members/:memberId/approve` — **ADMIN** only → `ACTIVE`, `joinedAt` güncelle, **o zaman** `createMemberJoinSnapshot`
- [ ] `POST /houses/:houseId/members/:memberId/reject` — **ADMIN** only
- [ ] `GET /me` veya `GET /houses` → kullanıcının **bekleyen** ev istekleri (opsiyonel `pendingMemberships`)
- [ ] Shared tipler + [api-contract.md](./api-contract.md) güncelle
- [ ] API testleri: join → pending; member erişemez; admin approve → erişir; reject; non-admin 403
- [ ] E2E / manuel script: onay akışı adımı

**Not:** Onay öncesi split hesabı, harcama, yokluk snapshot’ına dahil etme.

### Frontend

- [ ] `JoinHouseForm`: başarı → “Onay bekleniyor” ekranı; eve **yönlendirme yok**
- [ ] Ev listesi: pending evler ayrı rozet (“Onay bekliyor”)
- [ ] `HouseMembersPage` (yönetici): “Bekleyen istekler” bölümü — Kabul / Red
- [ ] Pending üye ev layout’una giremezse guard: `HouseLayout` veya route seviyesinde `403` → bilgi sayfası
- [ ] Türkçe metinler ve hata mesajları

### Bildirim (opsiyonel, aynı veya sonraki iterasyon)

- [ ] Admin’e e-posta: “Yeni katılım isteği” — `housemate-jobs-mail`
- [ ] Kullanıcıya e-posta: onaylandı / reddedildi

### Kabul kriterleri

- [ ] Davet kodu ile katılan kullanıcı, admin kabul etmeden ev detayına / harcamaya / bakiyeye erişemez.
- [ ] Admin kabul edince önceki davranışla aynı tam üyelik.
- [ ] Admin olmayan üye pending listesini ve onay endpoint’lerini çağıramaz.
- [ ] Mevcut ev kurucusu (ilk ADMIN) davet akışından etkilenmez; yalnızca **join** sonrası yeni gelenler pending.

### PRD / dışı kapsam

- Ev bazında “onay gerekmez” ayarı (her ev için toggle)
- QR kod / süreli davet linki
- Yönetici olmayan üyelerin “davet et” yetkisi

### Tahmini agent dağılımı

1. Schema + migration → `housemate-schema`
2. Houses join + approve/reject API → `housemate-house`
3. `assertActiveMember` / membership taraması → orchestrator veya house agent
4. Üye listesi + join UI → `housemate-frontend-houses`
5. Bildirim → `housemate-jobs-mail` (opsiyonel)

### Profil maddesi ile ilişki

Onay ekranında bekleyen kullanıcı **isim** ile görünsün diye [#1 Profil](#1-profil-ve-görünen-ad) ile birlikte veya hemen öncesinde yapılması önerilir; aksi halde admin yine e-posta / “Üye” görür.

---

## 3. UI/UX iyileştirmeleri

**Durum:** planlandı  
**Öncelik:** P1 (kademeli teslim; profil ile paralel başlanabilir)

### Problem

Arayüz işlevsel ama **ürün kalitesinde değil**: PRD odaklı hızlı teslim sonrası görsel tutarlılık, bilgi hiyerarşisi ve mobil deneyim geride kaldı.

**Gözlemlenen eksikler (mevcut kod):**

| Alan                | Durum                                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Tasarım sistemi     | Yalnızca birkaç CSS değişkeni — `frontend/src/index.css`; tam token seti yok              |
| Stil dağınıklığı    | `houses.css`, `expenses.css`, `dashboard.css` — benzer buton/kart kuralları tekrarlanıyor |
| Global `a` stili    | Link rengi buton sınıflarıyla çakışabiliyor (düzenli harcama tarafında kısmen düzeltildi) |
| Navigasyon          | Üst header + ev sekmeleri çift menü; aktif ev bağlamı her zaman net değil                 |
| Auth                | Minimal formlar; marka / güven hissi zayıf                                                |
| Geri bildirim       | Çoğunlukla sayfa içi `<p class="…-error">`; toast/snackbar yok                            |
| Yükleme             | Metin “yükleniyor…”; skeleton / shimmer yok                                               |
| Boş durumlar        | Tutarsız; bazı sayfalarda iyi, bazılarında tek satır muted metin                          |
| Mobil               | FAB ve bazı toolbar’lar var; tablolar/listeler küçük ekranda sıkışık                      |
| Erişilebilirlik     | Kısmi `aria-label`; odak halkası, kontrast, form hata ilişkilendirme eksik                |
| Bileşen kütüphanesi | Ham HTML + sınıf adları; paylaşılan `Button`, `Card`, `Input` yok                         |

### Hedef

Uygulama **güvenilir, okunaklı ve ev arkadaşı uygulamasına yakışır** hissettirmeli; yeni özellikler tek tasarım diline otursun.

### İlkeler

1. **Tek kaynak:** Renk, tipografi, boşluk, radius — merkezi token’lar.
2. **Bileşen tekrarı:** Ortak UI primitives; feature CSS yalnızca yerel düzen.
3. **Mobil önce:** Ana akışlar (harcama ekle, bakiye, üye listesi) tek elle kullanılabilir.
4. **Türkçe UX:** Net CTA, kısa yardım metinleri, anlaşılır hata (backend mesajları + UI).
5. **Kademeli refactor:** Big-bang yeniden yazım yok; ekran ekran iyileştirme.

### Fazlar

#### Faz 3A — Temel ve kabuk (önce)

**Agent:** `housemate-frontend-shell` + orchestrator

- [ ] `frontend/src/styles/` — tokens (`--color-*`, spacing, typography, shadow, z-index)
- [ ] Paylaşılan bileşenler: `Button`, `Input`, `Select`, `Card`, `Badge`, `Alert`, `Spinner`
- [ ] `index.css` sadeleştir; feature CSS’lerdeki duplicate button/card kurallarını kaldır
- [ ] Global: `a` varsayılanı yalnızca prose/link sınıfında; `.btn` / `NavLink` ayrı
- [ ] **AppLayout:** aktif ev adı, ev seçici (dropdown), profil menüsü yeri, mobil hamburger veya alt nav
- [ ] Auth sayfaları (giriş/kayıt): ortalanmış kart, marka, alan hataları input altında
- [ ] Toast altyapısı (başarı / hata / bilgi) — form kayıtlarında kullan

**Kabul:** Yeni ekran eklendiğinde ham `.expenses-btn` kopyalamaya gerek kalmaz.

#### Faz 3B — Ev ve üyeler

**Agent:** `housemate-frontend-houses`

- [ ] Ev listesi: kart grid, boş durum illüstrasyonu veya ikon, “Ev oluştur / Koda katıl” net CTA
- [ ] `HouseLayout`: sekme çubuğu kaydırılabilir (mobil), davet kodu kopyala daha belirgin
- [ ] Üye listesi: avatar baş harf, rol rozeti, admin aksiyonları ayrı menü
- [ ] Yokluk takvimi: tarih seçimi ve liste okunabilirliği (mevcut işlevi bozmadan)

#### Faz 3C — Harcamalar ve bakiye

**Agent:** `housemate-frontend-expenses`, `housemate-frontend-dashboard`

- [ ] Harcama listesi: satır kartları, tür rozeti, tutar hizası, filtreler dar ekranda drawer/accordion
- [ ] Formlar (anlık / düzenli / sıralı): adım hissi, tutar alanı büyük, checkbox grupları dokunmatik hedef
- [ ] Dashboard: özet kartları (toplam borç/alacak), pairwise liste görsel hiyerarşi
- [ ] Aktivite akışı: tarih gruplama (bugün / bu hafta) — opsiyonel ikinci iterasyon

#### Faz 3D — Cila ve erişilebilirlik

- [ ] Tutarlı boş / hata / yükleme şablonları (`EmptyState`, `ErrorState`, `LoadingState`)
- [ ] Odak görünürlüğü, `aria-invalid` + `aria-describedby` formlarda
- [ ] Renk kontrastı (WCAG AA hedefi — primary/muted üzerinde kontrol)
- [ ] İsteğe bağlı: hafif geçişler (150–200ms), `prefers-reduced-motion` saygısı
- [ ] İsteğe bağlı: karanlık tema (token’lar hazırsa sonradan kolay)

### Hızlı kazanımlar (1–2 günlük dilim)

Önce bunlar kullanıcıya “fark edilir” iyileşme verir:

- [ ] Üst menüde **seçili ev adı** + ev değiştirme
- [ ] Tüm formlarda birincil buton rengi tutarlı (link mavisi değil)
- [ ] Harcama ekle FAB + toolbar mobilde çakışma kontrolü
- [ ] Sayfa başlıkları: `h1` hiyerarşisi (şu an çoğunlukla `h3` kart içi)
- [ ] `max-width` içerik sütunu geniş ekranda (okuma kolaylığı)

### Kabul kriterleri (genel)

- [ ] Yeni geliştirici / agent tek `Button` + `Card` ile sayfa açabiliyor.
- [ ] 375px genişlikte: ev sekmeleri, harcama listesi, bir form kaydı kullanılabilir (yatay scroll yok veya kasıtlı).
- [ ] Başarılı kayıt sonrası toast; hata hem toast hem formda (kritik alanlarda).
- [ ] Manuel test scriptine “UI smoke” maddesi: giriş → ev → harcama ekle → bakiye (görsel kontrol).
- [ ] Harici UI kütüphanesi kullanılırsa: bundle ve erişilebilirlik gerekçesi ROADMAP’e not düşülür (varsayılan: hafif, kendi bileşenlerimiz).

### PRD / dışı kapsam

- Tam marka kimliği / logo tasarımı (placeholder yeterli)
- Animasyonlu onboarding turu
- PWA / offline
- Çoklu dil (i18n) — şimdilik yalnızca TR

### Tahmini agent dağılımı

| Faz | Agent                                                          |
| --- | -------------------------------------------------------------- |
| 3A  | `housemate-frontend-shell`                                     |
| 3B  | `housemate-frontend-houses`                                    |
| 3C  | expenses + dashboard frontend agent’ları                       |
| 3D  | Orchestrator koordinasyonu, tüm feature’larda state şablonları |

### Diğer maddelerle ilişki

- [#1 Profil](#1-profil-ve-görünen-ad): profil sayfası 3A bileşenleriyle yapılmalı.
- [#2 Admin onayı](#2-davet-kodu-ile-eve-katılım--admin-onayı): “bekleyen istek” kartı 3B tasarım diline uymalı.

---

## 4. Diğer adaylar

Henüz detaylandırılmadı:

- Hesaplaşma / “Settle up” (`is_settled`)
- Yerel Postgres + hızlı test ortamı (Docker)
- Playwright UI E2E
- S3 env’i opsiyonel yapma (geliştirici deneyimi)

---

## Notlar

- Bu dosya **ürün/backlog** içindir; uygulama adımları tamamlandıkça ilgili maddenin durumu güncellenir.
- Büyük özellikler için alt görevler PR veya agent fazı olarak [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) formatında ayrıca açılabilir.
