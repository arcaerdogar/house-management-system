import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { listExpenses } from "@/api/expenses";
import { ExpenseType, type Expense } from "@housemate/shared";
import { formatDisplayDate, todayDateOnly } from "./dateUtils";
import { ExpenseListFab } from "./ExpenseListFab";
import { ExpenseQuickLinks } from "./ExpenseQuickLinks";
import { ExpenseTypeBadge } from "./ExpenseTypeBadge";
import { useHouseMembers } from "./useHouseMembers";
import { formatMoney, memberDisplayName } from "./utils";
import "./expenses.css";

export function ExpenseListPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { members, loading: membersLoading } = useHouseMembers(houseId);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<"" | ExpenseType>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [memberFilter, setMemberFilter] = useState("");

  const loadExpenses = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listExpenses(houseId, {
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(fromDate ? { from: fromDate } : {}),
        ...(toDate ? { to: toDate } : {}),
        ...(memberFilter ? { memberId: memberFilter } : {}),
      });
      setExpenses(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Harcamalar yüklenemedi"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId, typeFilter, fromDate, toDate, memberFilter]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

  if (!houseId) {
    return (
      <p className="expenses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  const base = `/houses/${houseId}/expenses`;
  const hasActiveFilters =
    typeFilter !== "" || fromDate !== "" || toDate !== "" || memberFilter !== "";

  return (
    <div className="expenses-card">
      <h3>Harcamalar</h3>
      <p className="expenses-help-box" role="note">
        Yeni gider eklemek için aşağıdaki düğmeleri kullanın. Anlık harcamalar
        eşit bölünür; düzenli ödemeler şablona bağlıdır; sıralı harcamalarda
        sıradaki kişi otomatik belirlenir.
      </p>

      <ExpenseQuickLinks houseId={houseId} />

      <div className="expenses-toolbar" style={{ marginTop: "0.5rem" }}>
        <Link
          to={`${base}/templates`}
          className="expenses-btn expenses-btn-secondary"
        >
          Düzenli şablonlar (yönetici)
        </Link>
      </div>

      <form
        className="expenses-filters expenses-form"
        onSubmit={(e) => {
          e.preventDefault();
          void loadExpenses();
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
          Ödeyen üye
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
          Başlangıç tarihi
          <input
            type="date"
            value={fromDate}
            max={toDate || todayDateOnly()}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </label>
        <label>
          Bitiş tarihi
          <input
            type="date"
            value={toDate}
            min={fromDate}
            max={todayDateOnly()}
            onChange={(e) => setToDate(e.target.value)}
          />
        </label>
        <div className="expenses-toolbar">
          <button type="submit" className="expenses-btn expenses-btn-primary">
            Filtrele
          </button>
          <button
            type="button"
            className="expenses-btn expenses-btn-secondary"
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
        <p className="expenses-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="expenses-loading" style={{ marginTop: "1rem" }}>
          Harcamalar yükleniyor…
        </p>
      ) : expenses.length === 0 ? (
        <div className="expenses-empty-cta">
          <h4>
            {hasActiveFilters
              ? "Bu filtrelere uygun harcama yok"
              : "Henüz harcama kaydı yok"}
          </h4>
          <p className="expenses-muted">
            {hasActiveFilters
              ? "Filtreleri temizleyin veya yeni bir harcama ekleyin."
              : "İlk harcamanızı eklemek için aşağıdaki seçeneklerden birini seçin."}
          </p>
          <ExpenseQuickLinks houseId={houseId} variant="grid" />
        </div>
      ) : (
        <ul className="expenses-list" style={{ marginTop: "1rem" }}>
          {expenses.map((expense) => {
            const payerMember = expense.payerMember
              ? expense.payerMember
              : members.find((m) => m.id === expense.payerMemberId);
            const payerName = payerMember
              ? memberDisplayName(payerMember)
              : "Üye";

            return (
              <li key={expense.id} className="expenses-list-item">
                <div className="expenses-list-main">
                  <span className="expenses-list-title">
                    {expense.description}
                  </span>
                  <span className="expenses-list-meta">
                    {formatDisplayDate(expense.expenseDate)} · {payerName}
                  </span>
                </div>
                <div className="expenses-toolbar">
                  <strong>{formatMoney(expense.amount)}</strong>
                  <ExpenseTypeBadge type={expense.expenseType} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ExpenseListFab houseId={houseId} />
    </div>
  );
}
