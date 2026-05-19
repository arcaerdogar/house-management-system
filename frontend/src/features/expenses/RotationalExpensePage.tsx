import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { createExpense, listRotationalTypes } from "@/api/expenses";
import { ExpenseType, type RotationalExpenseType } from "@housemate/shared";
import { todayDateOnly } from "./dateUtils";
import { useHouseMembers } from "./useHouseMembers";
import {
  isValidAmount,
  memberDisplayName,
  normalizeAmountInput,
} from "./utils";
import "./expenses.css";

const QUEUE_MISMATCH = "ROTATIONAL_QUEUE_MISMATCH";

interface QueueMismatchBody {
  error?: string;
  message?: string;
  allowOverride?: boolean;
  expectedMemberId?: string;
  nextInQueue?: RotationalExpenseType["nextInQueue"];
}

export function RotationalExpensePage() {
  const { houseId } = useParams<{ houseId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { myMemberId } = useHouseMembers(houseId);

  const [types, setTypes] = useState<RotationalExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [rotationalTypeId, setRotationalTypeId] = useState(
    searchParams.get("typeId") ?? ""
  );
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(todayDateOnly());
  const [error, setError] = useState<string | null>(null);
  const [queueWarning, setQueueWarning] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!houseId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listRotationalTypes(houseId!);
        const active = data.filter((t) => t.isActive);
        if (!cancelled) {
          setTypes(active);
          const fromUrl = searchParams.get("typeId");
          const pick =
            active.find((t) => t.id === fromUrl) ??
            active.find((t) => t.id === rotationalTypeId) ??
            active[0];
          if (pick) setRotationalTypeId(pick.id);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Türler yüklenemedi"
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
  }, [houseId, searchParams, rotationalTypeId]);

  const selected = types.find((t) => t.id === rotationalTypeId);
  const nextName = selected?.nextInQueue
    ? memberDisplayName(selected.nextInQueue)
    : null;
  const isMyTurn =
    selected?.nextInQueue?.id != null &&
    myMemberId != null &&
    selected.nextInQueue.id === myMemberId;

  async function submit(allowOverride: boolean) {
    if (!houseId || !rotationalTypeId) return;

    const normalized = normalizeAmountInput(amount);
    if (!isValidAmount(normalized)) {
      setError("Geçerli bir tutar girin (ör. 125,50).");
      return;
    }

    setSubmitting(true);
    setError(null);
    setQueueWarning(null);
    try {
      await createExpense(houseId, {
        expenseType: ExpenseType.ROTATIONAL,
        amount: normalized,
        description: description.trim(),
        expenseDate,
        rotationalTypeId,
        ...(allowOverride ? { allowOverride: true } : {}),
      });
      navigate(`/houses/${houseId}/expenses`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.body as QueueMismatchBody | undefined;
        const code = body?.error;
        if (code === QUEUE_MISMATCH || body?.allowOverride) {
          const expected = body?.nextInQueue
            ? memberDisplayName(body.nextInQueue)
            : "başka bir üye";
          setQueueWarning(
            `Sırada ${expected} var. Yine de kaydetmek istiyor musunuz?`
          );
          return;
        }
      }
      setError(err instanceof ApiError ? err.message : "Kaydedilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await submit(false);
  }

  async function handleOverrideConfirm() {
    const confirmed = window.confirm(
      queueWarning ??
        "Sıra dışı kayıt oluşturmak istediğinize emin misiniz?"
    );
    if (!confirmed) return;
    await submit(true);
  }

  if (!houseId) {
    return (
      <p className="expenses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  const listPath = `/houses/${houseId}/expenses`;
  const rotationalPath = `${listPath}/rotational`;

  return (
    <div className="expenses-card">
      <nav className="expenses-breadcrumb" aria-label="Konum">
        <Link to={listPath}>Harcamalar</Link>
        <span>/</span>
        <Link to={rotationalPath}>Sıralı</Link>
        <span>/</span>
        <span>Kayıt ekle</span>
      </nav>

      <h3>Sıralı harcama ekle</h3>

      {loading ? (
        <p className="expenses-loading">Yükleniyor…</p>
      ) : types.length === 0 ? (
        <>
          <p className="expenses-muted">Aktif sıralı harcama türü yok.</p>
          <Link
            to={rotationalPath}
            className="expenses-btn expenses-btn-secondary"
            style={{ marginTop: "0.75rem" }}
          >
            Tür listesine git
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
            Harcama türü
            <select
              value={rotationalTypeId}
              onChange={(e) => {
                setRotationalTypeId(e.target.value);
                setQueueWarning(null);
              }}
              required
              disabled={submitting}
            >
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>

          {selected && nextName && (
            <div className="expenses-queue-banner" role="status">
              <span className="expenses-badge expenses-badge-queue">
                Sıradaki
              </span>
              <span>{nextName}</span>
              {isMyTurn && (
                <span className="expenses-badge expenses-badge-regular">
                  Sizin sıranız
                </span>
              )}
            </div>
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

          {queueWarning && (
            <div>
              <p className="expenses-warning" role="alert">
                {queueWarning}
              </p>
              <button
                type="button"
                className="expenses-btn expenses-btn-primary"
                disabled={submitting}
                onClick={() => void handleOverrideConfirm()}
              >
                Sıra dışı kaydet
              </button>
            </div>
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
              to={rotationalPath}
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
