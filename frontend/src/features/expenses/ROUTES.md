# Expenses feature — orchestrator integration

## `HousesRoutes.tsx`

Inside the `:houseId` layout route:

```tsx
import { ExpensesRoutes } from "@/features/expenses";

// within <Route path=":houseId" element={<HouseLayout />}>
<Route path="expenses/*" element={<ExpensesRoutes />} />
```

## `HouseLayout.tsx` (houses agent or orchestrator)

Add a tab link:

```tsx
<NavLink to={`/houses/${houseId}/expenses`} ...>
  Harcamalar
</NavLink>
```

## Full URL map

| Path | Page |
|------|------|
| `/houses/:houseId/expenses` | Harcama listesi + filtreler |
| `/houses/:houseId/expenses/instant/new` | Anlık harcama formu |
| `/houses/:houseId/expenses/regular/new` | Düzenli ödeme (şablon seçimi) |
| `/houses/:houseId/expenses/templates` | Şablon yönetimi (admin CRUD) |
| `/houses/:houseId/expenses/rotational` | Sıralı türler + sıra rozeti |
| `/houses/:houseId/expenses/rotational/new?typeId=` | Sıralı harcama kaydı |

`App.tsx` değişikliği gerekmez; mevcut `houses/*` altına nested mount yeterlidir.
