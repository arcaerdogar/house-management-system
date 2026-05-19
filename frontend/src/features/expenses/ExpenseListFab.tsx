import { Link } from "react-router-dom";
import "./expenses.css";

interface ExpenseListFabProps {
  houseId: string;
}

/** Mobile-only quick-add menu (FAB). */
export function ExpenseListFab({ houseId }: ExpenseListFabProps) {
  const base = `/houses/${houseId}/expenses`;

  return (
    <details className="expenses-fab">
      <summary aria-label="Hızlı harcama ekle">+</summary>
      <nav className="expenses-fab-menu" aria-label="Hızlı ekle">
        <Link to={`${base}/instant/new`}>Anlık harcama</Link>
        <Link to={`${base}/regular/new`}>Düzenli ödeme</Link>
        <Link to={`${base}/rotational/new`}>Sıralı harcama</Link>
        <Link to={`${base}/rotational`}>Sıralı türler</Link>
      </nav>
    </details>
  );
}
