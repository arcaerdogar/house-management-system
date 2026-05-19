import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import {
  createAbsence,
  deleteAbsence,
  listAbsences,
  updateAbsence,
} from "@/api/houses";
import type { Absence } from "@housemate/shared";
import { AbsenceCalendar, AbsenceList } from "./AbsenceCalendar";
import { AbsenceForm } from "./AbsenceForm";
import { useCurrentUser } from "./useCurrentUser";
import "./houses.css";

export function AbsenceCalendarPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const { user, loading: userLoading } = useCurrentUser();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Absence | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(() => new Date());

  const loadAbsences = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listAbsences(houseId);
      setAbsences(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Yokluk listesi alınamadı"
      );
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void loadAbsences();
  }, [loadAbsences]);

  function prevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  async function handleCreate(input: { startDate: string; endDate: string }) {
    if (!houseId) return;
    await createAbsence(houseId, input);
    await loadAbsences();
  }

  async function handleUpdate(input: { startDate: string; endDate: string }) {
    if (!editing) return;
    await updateAbsence(editing.id, input);
    setEditing(null);
    await loadAbsences();
  }

  async function handleDelete(absenceId: string) {
    const confirmed = window.confirm(
      "Bu yokluk bildirimi silinsin mi?"
    );
    if (!confirmed) return;

    setDeletingId(absenceId);
    setError(null);
    try {
      await deleteAbsence(absenceId);
      if (editing?.id === absenceId) setEditing(null);
      await loadAbsences();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Silinemedi");
    } finally {
      setDeletingId(null);
    }
  }

  if (!houseId) {
    return (
      <p className="houses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  if (loading || userLoading) {
    return <p className="houses-loading">Yokluklar yükleniyor…</p>;
  }

  return (
    <>
      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}

      <div className="houses-card">
        <h3>{editing ? "Yokluğu düzenle" : "Yokluk bildir"}</h3>
        <p className="houses-muted">
          Gelecekteki yokluklarınızı bildirin. Başlamış yokluklar düzenlenemez.
        </p>
        <AbsenceForm
          key={editing?.id ?? "new"}
          initial={
            editing
              ? { startDate: editing.startDate, endDate: editing.endDate }
              : undefined
          }
          submitLabel={editing ? "Güncelle" : "Bildir"}
          onSubmit={editing ? handleUpdate : handleCreate}
          onCancel={editing ? () => setEditing(null) : undefined}
        />
      </div>

      <AbsenceCalendar
        absences={absences}
        year={viewDate.getFullYear()}
        month={viewDate.getMonth()}
        onPrevMonth={prevMonth}
        onNextMonth={nextMonth}
      />

      <div className="houses-card">
        <h3>Tüm yokluklar</h3>
        <AbsenceList
          absences={absences}
          currentUserId={user?.id}
          onEdit={setEditing}
          onDelete={(id) => void handleDelete(id)}
          deletingId={deletingId}
        />
      </div>
    </>
  );
}
