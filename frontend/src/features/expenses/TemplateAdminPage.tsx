import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  createTemplate,
  deleteTemplate,
  listTemplates,
  updateTemplate,
} from "@/api/expenses";
import {
  HouseMemberRole,
  RegularExpensePeriod,
  type RegularExpenseTemplate,
} from "@housemate/shared";
import { useHouseMembers } from "./useHouseMembers";
import { memberDisplayName, periodLabel } from "./utils";
import "./expenses.css";

export function TemplateAdminPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { members, isAdmin, loading: membersLoading } =
    useHouseMembers(houseId);
  const [templates, setTemplates] = useState<RegularExpenseTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [responsibleMemberId, setResponsibleMemberId] = useState("");
  const [period, setPeriod] = useState<RegularExpensePeriod>(
    RegularExpensePeriod.MONTHLY
  );
  const [respectsAbsence, setRespectsAbsence] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadTemplates = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listTemplates(houseId);
      setTemplates(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Şablonlar yüklenemedi"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (members.length > 0 && !responsibleMemberId) {
      setResponsibleMemberId(members[0].id);
    }
  }, [members, responsibleMemberId]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!houseId) return;

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createTemplate(houseId, {
        title: title.trim(),
        responsibleMemberId,
        period,
        respectsAbsence,
      });
      setTitle("");
      setShowForm(false);
      setSuccess("Şablon oluşturuldu.");
      await loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Oluşturulamadı");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(template: RegularExpenseTemplate) {
    if (!houseId || !isAdmin) return;
    setError(null);
    setSuccess(null);
    try {
      await updateTemplate(houseId, template.id, {
        isActive: !template.isActive,
      });
      await loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Güncellenemedi");
    }
  }

  async function handleDelete(templateId: string, templateTitle: string) {
    if (!houseId || !isAdmin) return;
    const confirmed = window.confirm(
      `“${templateTitle}” şablonu silinsin mi?`
    );
    if (!confirmed) return;

    setError(null);
    setSuccess(null);
    try {
      await deleteTemplate(houseId, templateId);
      setSuccess("Şablon silindi.");
      await loadTemplates();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Silinemedi");
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
        <span>Düzenli şablonlar</span>
      </nav>

      <h3>Düzenli harcama şablonları</h3>
      <p className="expenses-muted">
        Kira, fatura gibi tekrarlayan ödemeler için şablon tanımlayın. Yalnızca
        yöneticiler şablon ekleyebilir veya silebilir.
      </p>

      {error && (
        <p className="expenses-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}
      {success && (
        <p className="expenses-success" style={{ marginTop: "1rem" }}>
          {success}
        </p>
      )}

      {isAdmin && (
        <div className="expenses-toolbar" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className="expenses-btn expenses-btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Formu gizle" : "Yeni şablon"}
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
            Sorumlu üye
            <select
              value={responsibleMemberId}
              onChange={(e) => setResponsibleMemberId(e.target.value)}
              required
              disabled={submitting || membersLoading}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {memberDisplayName(m)}
                  {m.role === HouseMemberRole.ADMIN ? " (ev yöneticisi)" : ""}
                </option>
              ))}
            </select>
            <span className="expenses-muted">
              Ödeme kaydını yalnızca burada seçilen üye ekleyebilir; ev
              yöneticisi farklı bir üye ise onun adına kayıt ekleyemez.
            </span>
          </label>
          <label>
            Periyot
            <select
              value={period}
              onChange={(e) =>
                setPeriod(e.target.value as RegularExpensePeriod)
              }
              disabled={submitting}
            >
              <option value={RegularExpensePeriod.WEEKLY}>Haftalık</option>
              <option value={RegularExpensePeriod.MONTHLY}>Aylık</option>
            </select>
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
          <div className="expenses-toolbar">
            <button
              type="submit"
              className="expenses-btn expenses-btn-primary"
              disabled={submitting || !title.trim()}
            >
              {submitting ? "Kaydediliyor…" : "Oluştur"}
            </button>
          </div>
        </form>
      )}

      {loading || membersLoading ? (
        <p className="expenses-loading" style={{ marginTop: "1rem" }}>
          Şablonlar yükleniyor…
        </p>
      ) : templates.length === 0 ? (
        <p className="expenses-muted" style={{ marginTop: "1rem" }}>
          Henüz şablon yok.
        </p>
      ) : (
        <div style={{ marginTop: "1rem" }}>
          {templates.map((template) => {
            const responsible = members.find(
              (m) => m.id === template.responsibleMemberId
            );
            const responsibleName = responsible
              ? memberDisplayName(responsible)
              : "Üye";

            return (
              <div key={template.id} className="expenses-type-row">
                <div>
                  <strong>{template.title}</strong>
                  <p className="expenses-muted">
                    {periodLabel(template.period)} · {responsibleName} · Yokluk:{" "}
                    {template.respectsAbsence ? "evet" : "hayır"}
                  </p>
                </div>
                <div className="expenses-toolbar">
                  <span
                    className={
                      template.isActive
                        ? "expenses-badge expenses-badge-regular"
                        : "expenses-badge"
                    }
                  >
                    {template.isActive ? "Aktif" : "Pasif"}
                  </span>
                  {isAdmin && (
                    <>
                      <button
                        type="button"
                        className="expenses-btn expenses-btn-secondary"
                        onClick={() => void toggleActive(template)}
                      >
                        {template.isActive ? "Pasifleştir" : "Aktifleştir"}
                      </button>
                      <button
                        type="button"
                        className="expenses-btn expenses-btn-danger"
                        onClick={() =>
                          void handleDelete(template.id, template.title)
                        }
                      >
                        Sil
                      </button>
                    </>
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
