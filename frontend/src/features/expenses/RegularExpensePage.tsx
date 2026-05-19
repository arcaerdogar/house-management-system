import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { createExpense, listTemplates } from "@/api/expenses";
import { ExpenseType, type RegularExpenseTemplate } from "@housemate/shared";
import { todayDateOnly } from "./dateUtils";
import { useHouseMembers } from "./useHouseMembers";
import { isValidAmount, normalizeAmountInput, periodLabel } from "./utils";
import "./expenses.css";

export function RegularExpensePage() {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const { myMemberId, loading: membersLoading } = useHouseMembers(houseId);

  const [templates, setTemplates] = useState<RegularExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!houseId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listTemplates(houseId!);
        const active = data.filter((t) => t.isActive);
        if (!cancelled) {
          setTemplates(active);
          const mine = active.filter(
            (t) => t.responsibleMemberId === myMemberId
          );
          const pick = mine[0] ?? active[0];
          if (pick) setTemplateId(pick.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Şablonlar yüklenemedi"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [houseId, myMemberId]);

  const selected = templates.find((t) => t.id === templateId);
  const myTemplates = templates.filter(
    (t) => t.responsibleMemberId === myMemberId
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!houseId || !templateId) return;

    const normalized = normalizeAmountInput(amount);
    if (!isValidAmount(normalized)) {
      setError("Geçerli bir tutar girin (ör. 125,50).");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await createExpense(houseId, {
        expenseType: ExpenseType.REGULAR,
        amount: normalized,
        description: description.trim(),
        expenseDate,
        templateId,
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
        <span>Düzenli ödeme</span>
      </nav>

      <h3>Düzenli harcama kaydet</h3>
      <p className="expenses-muted">
        Aktif bir şablona bağlı ödemeyi kaydedin. Sorumlu olduğunuz şablonlar
        öncelikli listelenir.
      </p>

      {loading || membersLoading ? (
        <p className="expenses-loading">Şablonlar yükleniyor…</p>
      ) : templates.length === 0 ? (
        <>
          <p className="expenses-muted">
            Aktif şablon yok. Yönetici şablon oluşturabilir.
          </p>
          <Link
            to={`${listPath}/templates`}
            className="expenses-btn expenses-btn-secondary"
            style={{ marginTop: "0.75rem" }}
          >
            Şablonlara git
          </Link>
        </>
      ) : (
        <form className="expenses-form" onSubmit={handleSubmit}>
          {error && (
            <p className="expenses-error" role="alert">
              {error}
            </p>
          )}

          <label>
            Şablon
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              disabled={submitting}
            >
              {myTemplates.length > 0 && (
                <optgroup label="Sorumlu olduğunuz">
                  {myTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({periodLabel(t.period)})
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup
                label={
                  myTemplates.length > 0 ? "Diğer şablonlar" : "Tüm şablonlar"
                }
              >
                {templates
                  .filter((t) => !myTemplates.some((m) => m.id === t.id))
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({periodLabel(t.period)})
                    </option>
                  ))}
              </optgroup>
            </select>
          </label>

          {selected && (
            <p className="expenses-muted">
              Yokluk: {selected.respectsAbsence ? "dikkate alınır" : "alınmaz"}
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
            Ödeme tarihi
            <input
              type="date"
              value={expenseDate}
              max={todayDateOnly()}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
              disabled={submitting}
            />
          </label>

          <div className="expenses-toolbar">
            <button
              type="submit"
              className="expenses-btn expenses-btn-primary"
              disabled={submitting || !description.trim() || !templateId}
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
      )}
    </div>
  );
}
