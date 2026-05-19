# Dashboard feature — orchestrator integration

## `HousesRoutes.tsx`

Inside the `:houseId` layout route:

```tsx
import { DashboardRoutes } from "@/features/dashboard";

// within <Route path=":houseId" element={<HouseLayout />}>
<Route path="dashboard/*" element={<DashboardRoutes />} />
```

## `HouseLayout.tsx` (houses agent or orchestrator)

Add a tab link:

```tsx
<NavLink to={`/houses/${houseId}/dashboard`} ...>
  Bakiye
</NavLink>
```

Optional: set house overview default link to dashboard instead of static summary.

## Full URL map

| Path | Page |
|------|------|
| `/houses/:houseId/dashboard` | Bakiye özeti (konsolide + üye kartları) |
| `/houses/:houseId/dashboard/members/:memberId` | Üye borç detayı (kalem listesi) |
| `/houses/:houseId/dashboard/activity` | Aktivite akışı + filtreler |

## Notes

- Borç toplamları yalnızca REGULAR / INSTANT (backend); UI sıralı harcamalar için `/houses/:houseId/expenses/rotational` linki verir.
- `App.tsx` değişikliği gerekmez; mevcut `houses/*` altına nested mount yeterlidir.
