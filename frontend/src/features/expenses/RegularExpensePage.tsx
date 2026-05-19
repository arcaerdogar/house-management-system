import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { createExpense, listTemplates } from "@/api/expenses";
import { ExpenseType, type RegularExpenseTemplate } from "@housemate/shared";
import { todayDateOnly } from "./dateUtils";
import { useHouseMembers } from "./useHouseMembers";
import {
  isValidAmount,
  memberDisplayName,
  normalizeAmountInput,
  periodLabel,
} from "./utils";
import "./expenses.css";

export function RegularExpensePage() {
  const { houseId } = useParams<{ houseId: string }>();
  const navigate = useNavigate();
  const { members, myMemberId, isAdmin, loading: membersLoading } =
    useHouseMembers(houseId);

  const [templates, setTemplates] = useState<RegularExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [templateId, setTemplateId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!houseId || membersLoading) return;
    if (!myMemberId) {
      setTemplates([]);
      setLoading(false);
      setError("Bu evin aktif üyesi değilsiniz.");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listTemplates(houseId!);
        const mine = data.filter(
          (t) => t.isActive && t.responsibleMemberId === myMemberId
        );
        if (!cancelled) {
          setTemplates(mine);
          setTemplateId(mine[0]?.id ?? "");
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
  }, [houseId, myMemberId, membersLoading]);

  const selected = templates.find((t) => t.id === templateId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!houseId || !templateId || !myMemberId) return;

    if (selected && selected.responsibleMemberId !== myMemberId) {
      setError(
        "Seçilen şablonda sorumlu siz değilsiniz. Yalnızca kendi sorumlu olduğunuz şablonlar için kayıt ekleyebilirsiniz."
      );
      return;
    }

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
        Düzenli ödemeyi yalnızca şablonda <strong>sorumlu üye</strong> olarak
        atandığınız kalemler için kaydedebilirsiniz. Ev yöneticisi (admin)
        olmak, başkasının şablonu adına kayıt eklemek için yetmez.
      </p>

      {loading || membersLoading ? (
        <p className="expenses-loading">Şablonlar yükleniyor…</p>
      ) : templates.length === 0 ? (
        <>
          <p className="expenses-error" role="alert">
            Sorumlu olduğunuz aktif şablon yok. Şablon oluştururken veya
            düzenlerken &quot;Sorumlu üye&quot; alanında sizin adınızın
            seçili olduğundan emin olun.
          </p>
          {isAdmin && (
            <Link
              to={`${listPath}/templates`}
              className="expenses-btn expenses-btn-secondary"
              style={{ marginTop: "0.75rem" }}
            >
              Şablonları yönet
            </Link>
          )}
          {!isAdmin && (
            <p className="expenses-muted" style={{ marginTop: "0.75rem" }}>
              Şablon ataması için ev yöneticisine başvurun.
            </p>
          )}
        </>
      ) : (
        <form className="expenses-form" onSubmit={handleSubmit}>
          {error && (
            <p className="expenses-error" role="alert">
              {error}
            </p>
          )}

          <label>
            Şablon (sorumlu olduğunuz)
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              required
              disabled={submitting || templates.length <= 1}
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({periodLabel(t.period)})
                </option>
              ))}
            </select>
          </label>

          {selected && (
            <p className="expenses-muted">
              Sorumlu:{" "}
              {memberDisplayName(
                members.find((m) => m.id === selected.responsibleMemberId) ?? {
                  user: undefined,
                }
              )}{" "}
              · Yokluk:{" "}
              {selected.respectsAbsence ? "dikkate alınır" : "alınmaz"}
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
