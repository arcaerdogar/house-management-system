import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { listActivity } from "@/api/dashboard";
import { ExpenseType, type ActivityItem } from "@housemate/shared";
import { formatDisplayDate, formatDateTime, todayDateOnly } from "./dateUtils";
import { ExpenseTypeBadge } from "./ExpenseTypeBadge";
import { useHouseMembers } from "./useHouseMembers";
import { formatMoney, memberDisplayName, memberLabel } from "./utils";
import "./dashboard.css";

export function ActivityFeedPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { members, loading: membersLoading } = useHouseMembers(houseId);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"" | ExpenseType>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [memberFilter, setMemberFilter] = useState("");

  const loadActivity = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listActivity(houseId, {
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
        ...(memberFilter ? { memberId: memberFilter } : {}),
      });
      setItems(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Aktivite yüklenemedi"
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [houseId, typeFilter, fromDate, toDate, memberFilter]);

  useEffect(() => {
    void loadActivity();
  }, [loadActivity]);

  if (!houseId) {
    return (
      <p className="dashboard-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  const dashboardBase = `/houses/${houseId}/dashboard`;

  return (
    <div className="dashboard-card">
      <nav className="dashboard-breadcrumb" aria-label="Konum">
        <Link to={dashboardBase}>Bakiye özeti</Link>
        <span aria-hidden>›</span>
        <span>Aktivite</span>
      </nav>

      <h3>Aktivite akışı</h3>
      <p className="dashboard-muted">
        Evdeki harcama hareketleri. Sıralı harcamalarda payınız borç olarak
        gösterilmez.
      </p>

      <form
        className="dashboard-filters"
        onSubmit={(e) => {
          e.preventDefault();
          void loadActivity();
        }}
      >
        <label>
          Tür
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as "" | ExpenseType)
            }
          >
            <option value="">Tümü</option>
            <option value={ExpenseType.INSTANT}>Anlık</option>
            <option value={ExpenseType.REGULAR}>Düzenli</option>
            <option value={ExpenseType.ROTATIONAL}>Sıralı</option>
          </select>
        </label>
        <label>
          Üye
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            disabled={membersLoading}
          >
            <option value="">Tümü</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {memberDisplayName(m)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Başlangıç
          <input
            type="date"
            value={fromDate}
            max={toDate || todayDateOnly()}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          Bitiş
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={todayDateOnly()}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        <div className="dashboard-toolbar" style={{ alignSelf: "end" }}>
          <button type="submit" className="dashboard-btn dashboard-btn-primary">
            Filtrele
          </button>
          <button
            type="button"
            className="dashboard-btn dashboard-btn-secondary"
            onClick={() => {
              setTypeFilter("");
              setFromDate("");
              setToDate("");
              setMemberFilter("");
            }}
          >
            Temizle
          </button>
        </div>
      </form>

      {error && (
        <p className="dashboard-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="dashboard-loading" style={{ marginTop: "1rem" }}>
          Aktivite yükleniyor…
        </p>
      ) : items.length === 0 ? (
        <p className="dashboard-muted" style={{ marginTop: "1rem" }}>
          Bu filtrelere uygun kayıt bulunamadı.
        </p>
      ) : (
        <ul className="dashboard-list">
          {items.map((item) => (
            <li key={item.id} className="dashboard-list-item">
              <div className="dashboard-list-main">
                <span className="dashboard-list-title">{item.description}</span>
                <span className="dashboard-list-meta">
                  {formatDisplayDate(item.expenseDate)} ·{" "}
                  {memberLabel(item.payerName)} ·{" "}
                  {formatDateTime(item.createdAt)}
                </span>
              </div>
              <div className="dashboard-list-side">
                <strong>{formatMoney(item.amount)}</strong>
                {item.expenseType === ExpenseType.ROTATIONAL ? (
                  <span className="dashboard-muted" style={{ fontSize: "0.8125rem" }}>
                    Payınız: —
                  </span>
                ) : item.yourShare != null ? (
                  <span className="dashboard-muted" style={{ fontSize: "0.8125rem" }}>
                    Payınız: {formatMoney(item.yourShare)}
                  </span>
                ) : null}
                <ExpenseTypeBadge type={item.expenseType} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="dashboard-callout" style={{ marginTop: "1.25rem" }}>
        <p>
          Sıralı harcamalar borç toplamlarına dahil değildir. Sıra bilgisi için:
        </p>
        <Link
          to={`/houses/${houseId}/expenses/rotational`}
          className="dashboard-btn dashboard-btn-secondary"
        >
          Sıralı harcamalar →
        </Link>
      </div>
    </div>
  );
}
