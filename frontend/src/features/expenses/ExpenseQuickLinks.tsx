import { Link } from "react-router-dom";
import "./expenses.css";

interface ExpenseQuickLinksProps {
  houseId: string;
  /** `grid` — overview cards; `toolbar` — horizontal button row */
  variant?: "grid" | "toolbar";
}

export function ExpenseQuickLinks({
  houseId,
  variant = "toolbar",
}: ExpenseQuickLinksProps) {
  const base = `/houses/${houseId}/expenses`;

  if (variant === "grid") {
    return (
      <div className="expenses-quick-grid" aria-label="Harcama ekleme seçenekleri">
        <Link
          to={`${base}/instant/new`}
          className="expenses-quick-card expenses-quick-card-primary"
        >
          <span className="expenses-quick-card-title">Anlık harcama</span>
          <span className="expenses-quick-card-desc">
            Market, ortak yemek gibi tek seferlik giderler
          </span>
        </Link>
        <Link
          to={`${base}/regular/new`}
          className="expenses-quick-card"
        >
          <span className="expenses-quick-card-title">Düzenli ödeme</span>
          <span className="expenses-quick-card-desc">
            Kira, fatura gibi şablona bağlı ödemeler
          </span>
        </Link>
        <Link to={`${base}/rotational`} className="expenses-quick-card">
          <span className="expenses-quick-card-title">Sıralı harcama</span>
          <span className="expenses-quick-card-desc">
            Sırayla ödenen giderler — tür listesi ve kayıt
          </span>
        </Link>
        <Link to={base} className="expenses-quick-card">
          <span className="expenses-quick-card-title">Harcama listesi</span>
          <span className="expenses-quick-card-desc">
            Tüm kayıtları filtreleyerek görüntüle
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="expenses-toolbar expenses-toolbar-actions" aria-label="Harcama ekle">
      <Link
        to={`${base}/instant/new`}
        className="expenses-btn expenses-btn-primary"
      >
        Anlık harcama
      </Link>
      <Link
        to={`${base}/regular/new`}
        className="expenses-btn expenses-btn-secondary"
      >
        Düzenli ödeme
      </Link>
      <Link
        to={`${base}/rotational`}
        className="expenses-btn expenses-btn-secondary"
      >
        Sıralı harcama
      </Link>
      <span className="expenses-toolbar-spacer" />
      <Link to={base} className="expenses-btn expenses-btn-secondary">
        Tüm liste
      </Link>
    </div>
  );
}
