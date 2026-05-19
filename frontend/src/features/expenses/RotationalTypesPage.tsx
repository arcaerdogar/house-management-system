import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  createRotationalType,
  listRotationalTypes,
  updateRotationalType,
} from "@/api/expenses";
import type { RotationalExpenseType } from "@housemate/shared";
import { useHouseMembers } from "./useHouseMembers";
import { memberDisplayName } from "./utils";
import "./expenses.css";

export function RotationalTypesPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { isAdmin } = useHouseMembers(houseId);
  const [types, setTypes] = useState<RotationalExpenseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [respectsAbsence, setRespectsAbsence] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadTypes = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listRotationalTypes(houseId);
      setTypes(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Türler yüklenemedi"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!houseId) return;

    setSubmitting(true);
    setError(null);
    try {
      await createRotationalType(houseId, {
        title: title.trim(),
        respectsAbsence,
      });
      setTitle("");
      setShowForm(false);
      await loadTypes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(type: RotationalExpenseType) {
    if (!houseId || !isAdmin) return;
    setError(null);
    try {
      await updateRotationalType(houseId, type.id, {
        isActive: !type.isActive,
      });
      await loadTypes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Güncellenemedi");
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
        <span>Sıralı harcamalar</span>
      </nav>

      <h3>Sıralı harcama türleri</h3>
      <p className="expenses-muted">
        Her tür için sıradaki kişi otomatik belirlenir. Harcama kaydı eklerken
        sıra uyarısı alabilirsiniz.
      </p>

      {error && (
        <p className="expenses-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {isAdmin && (
        <div className="expenses-toolbar" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="expenses-btn expenses-btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Formu gizle" : "Yeni tür"}
          </button>
        </div>
      )}

      {showForm && isAdmin && (
        <form
          className="expenses-form expenses-template-form"
          onSubmit={handleCreate}
        >
          <label>
            Başlık
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              disabled={submitting}
            />
          </label>
          <label>
            Yokluğu dikkate al
            <select
              value={respectsAbsence ? "yes" : "no"}
              onChange={(e) => setRespectsAbsence(e.target.value === "yes")}
              disabled={submitting}
            >
              <option value="yes">Evet</option>
              <option value="no">Hayır</option>
            </select>
          </label>
          <button
            type="submit"
            className="expenses-btn expenses-btn-primary"
            disabled={submitting || !title.trim()}
          >
            {submitting ? "Kaydediliyor…" : "Oluştur"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="expenses-loading" style={{ marginTop: "1rem" }}>
          Türler yükleniyor…
        </p>
      ) : types.length === 0 ? (
        <p className="expenses-muted" style={{ marginTop: "1rem" }}>
          Henüz sıralı harcama türü yok.
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {types.map((type) => {
            const nextName = type.nextInQueue
              ? memberDisplayName(type.nextInQueue)
              : "Belirlenmedi";

            return (
              <div key={type.id} className="expenses-type-row">
                <div>
                  <strong>{type.title}</strong>
                  <p className="expenses-muted">
                    Yokluk: {type.respectsAbsence ? "dikkate alınır" : "alınmaz"}
                  </p>
                  {type.isActive && (
                    <div className="expenses-queue-banner">
                      <span className="expenses-badge expenses-badge-queue">
                        Sıradaki
                      </span>
                      <span>{nextName}</span>
                    </div>
                  )}
                </div>
                <div className="expenses-toolbar">
                  <span
                    className={
                      type.isActive
                        ? "expenses-badge expenses-badge-rotational"
                        : "expenses-badge"
                    }
                  >
                    {type.isActive ? "Aktif" : "Pasif"}
                  </span>
                  {type.isActive && (
                    <Link
                      to={`${listPath}/rotational/new?typeId=${type.id}`}
                      className="expenses-btn expenses-btn-primary"
                    >
                      Harcama ekle
                    </Link>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="expenses-btn expenses-btn-secondary"
                      onClick={() => void toggleActive(type)}
                    >
                      {type.isActive ? "Pasifleştir" : "Aktifleştir"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="expenses-toolbar" style={{ marginTop: "1.25rem" }}>
        <Link to={listPath} className="expenses-btn expenses-btn-secondary">
          ← Harcamalara dön
        </Link>
      </div>
    </div>
  );
}
