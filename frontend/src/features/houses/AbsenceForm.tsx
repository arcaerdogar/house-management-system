import { type FormEvent, useState } from "react";
import { ApiError } from "@/api/client";
import type { Absence } from "@housemate/shared";
import { todayDateOnly } from "./dateUtils";
import "./houses.css";

interface AbsenceFormProps {
  initial?: Pick<Absence, "startDate" | "endDate">;
  submitLabel: string;
  onSubmit: (input: { startDate: string; endDate: string }) => Promise<void>;
  onCancel?: () => void;
}

export function AbsenceForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: AbsenceFormProps) {
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (endDate < startDate) {
      setError("Bitiş tarihi başlangıçtan önce olamaz.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ startDate, endDate });
      if (!initial) {
        setStartDate("");
        setEndDate("");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Kaydedilemedi");
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = todayDateOnly();

  return (
    <form className="houses-form" onSubmit={handleSubmit}>
      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}
      <label>
        Başlangıç tarihi
        <input
          type="date"
          value={startDate}
          min={minDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          disabled={submitting}
        />
      </label>
      <label>
        Bitiş tarihi
        <input
          type="date"
          value={endDate}
          min={startDate || minDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          disabled={submitting}
        />
      </label>
      <div className="houses-toolbar">
        <button
          type="submit"
          className="houses-btn houses-btn-primary"
          disabled={submitting || !startDate || !endDate}
        >
          {submitting ? "Kaydediliyor…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="houses-btn houses-btn-secondary"
            onClick={onCancel}
            disabled={submitting}
          >
            İptal
          </button>
        )}
      </div>
    </form>
  );
}
