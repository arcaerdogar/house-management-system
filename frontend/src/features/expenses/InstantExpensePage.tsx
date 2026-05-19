import { type FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { createExpense } from "@/api/expenses";
import { ExpenseType } from "@housemate/shared";
import { todayDateOnly } from "./dateUtils";
import { useHouseMembers } from "./useHouseMembers";
import { isValidAmount, memberDisplayName, normalizeAmountInput } from "./utils";
import "./expenses.css";

export function InstantExpensePage() {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const { members, myMemberId, loading: membersLoading } =
    useHouseMembers(houseId);

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayDateOnly());
  const [respectsAbsence, setRespectsAbsence] = useState(true);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const otherMembers = members.filter((m) => m.id !== myMemberId);

  function toggleExclusion(memberId: string) {
    setExcludedIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!houseId) return;

    const normalized = normalizeAmountInput(amount);
    if (!isValidAmount(normalized)) {
      setError("Geçerli bir tutar girin (ör. 125,50).");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createExpense(houseId, {
        expenseType: ExpenseType.INSTANT,
        amount: normalized,
        description: description.trim(),
        expenseDate,
        respectsAbsence,
        ...(excludedIds.length > 0
          ? { excludedMemberIds: excludedIds }
          : {}),
      });
      navigate(`/houses/${houseId}/expenses`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kaydedilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  if (!houseId) {
    return (
      <p className="expenses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  const listPath = `/houses/${houseId}/expenses`;

  return (
    <div className="expenses-card">
      <nav className="expenses-breadcrumb" aria-label="Konum">
        <Link to={listPath}>Harcamalar</Link>
        <span>/</span>
        <span>Anlık harcama</span>
      </nav>

      <h3>Anlık harcama ekle</h3>
      <p className="expenses-muted">
        Tutar aktif üyeler arasında eşit bölünür. İstemediğiniz üyeleri
        hariç tutabilirsiniz.
      </p>

      <form className="expenses-form" onSubmit={handleSubmit}>
        {error && (
          <p className="expenses-error" role="alert">
            {error}
          </p>
        )}

        <label>
          Tutar (₺)
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            disabled={submitting}
          />
        </label>

        <label>
          Açıklama
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            required
            disabled={submitting}
          />
        </label>

        <label>
          Harcama tarihi
          <input
            type="date"
            value={expenseDate}
            max={todayDateOnly()}
            onChange={(e) => setExpenseDate(e.target.value)}
            required
            disabled={submitting}
          />
        </label>

        <label>
          <span>
            Yokluğu dikkate al
            <span className="expenses-inline-hint">
              {" "}
              — yokluktaki üyeler paya dahil edilmez
            </span>
          </span>
          <select
            value={respectsAbsence ? "yes" : "no"}
            onChange={(e) => setRespectsAbsence(e.target.value === "yes")}
            disabled={submitting}
          >
            <option value="yes">Evet</option>
            <option value="no">Hayır</option>
          </select>
        </label>

        {otherMembers.length > 0 && (
          <fieldset className="expenses-checkboxes">
            <legend>Hariç tutulan üyeler</legend>
            {otherMembers.map((member) => (
              <label key={member.id}>
                <input
                  type="checkbox"
                  checked={excludedIds.includes(member.id)}
                  onChange={() => toggleExclusion(member.id)}
                  disabled={submitting || membersLoading}
                />
                {memberDisplayName(member)}
              </label>
            ))}
          </fieldset>
        )}

        <div className="expenses-toolbar">
          <button
            type="submit"
            className="expenses-btn expenses-btn-primary"
            disabled={submitting || !description.trim()}
          >
            {submitting ? "Kaydediliyor…" : "Kaydet"}
          </button>
          <Link
            to={listPath}
            className="expenses-btn expenses-btn-secondary"
          >
            İptal
          </Link>
        </div>
      </form>
    </div>
  );
}
