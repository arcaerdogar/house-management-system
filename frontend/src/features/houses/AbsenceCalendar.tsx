import type { Absence } from "@housemate/shared";
import {
  eachDayInRange,
  formatDateOnly,
  formatDisplayDate,
  monthLabel,
  parseDateOnly,
} from "./dateUtils";
import "./houses.css";

const WEEKDAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

interface AbsenceCalendarProps {
  absences: Absence[];
  year: number;
  month: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function memberLabel(absence: Absence): string {
  return (
    absence.member?.user?.name ??
    absence.member?.user?.email ??
    "Üye"
  );
}

function absenceOnDay(absences: Absence[], day: Date): Absence[] {
  const key = formatDateOnly(day);
  return absences.filter((a) => {
    const days = eachDayInRange(a.startDate, a.endDate);
    return days.some((d) => formatDateOnly(d) === key);
  });
}

export function AbsenceCalendar({
  absences,
  year,
  month,
  onPrevMonth,
  onNextMonth,
}: AbsenceCalendarProps) {
  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastOfMonth.getDate();
  const todayKey = formatDateOnly(new Date());

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(year, month, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="houses-card">
      <div className="houses-calendar-header">
        <button
          type="button"
          className="houses-btn houses-btn-secondary"
          onClick={onPrevMonth}
          aria-label="Önceki ay"
        >
          ←
        </button>
        <h4>{monthLabel(year, month)}</h4>
        <button
          type="button"
          className="houses-btn houses-btn-secondary"
          onClick={onNextMonth}
          aria-label="Sonraki ay"
        >
          →
        </button>
      </div>

      <div className="houses-calendar-grid" role="grid" aria-label="Yokluk takvimi">
        {WEEKDAYS.map((day) => (
          <div key={day} className="houses-calendar-weekday">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) {
            return (
              <div
                key={`empty-${index}`}
                className="houses-calendar-day houses-calendar-day-empty"
              />
            );
          }

          const dayKey = formatDateOnly(day);
          const dayAbsences = absenceOnDay(absences, day);
          const isToday = dayKey === todayKey;

          return (
            <div
              key={dayKey}
              className={
                isToday
                  ? "houses-calendar-day houses-calendar-day-today"
                  : "houses-calendar-day"
              }
              role="gridcell"
            >
              <div className="houses-calendar-day-num">{day.getDate()}</div>
              {dayAbsences.slice(0, 2).map((a) => (
                <div
                  key={a.id}
                  className="houses-calendar-absence"
                  title={`${memberLabel(a)}: ${formatDisplayDate(a.startDate)} – ${formatDisplayDate(a.endDate)}`}
                >
                  {memberLabel(a)}
                </div>
              ))}
              {dayAbsences.length > 2 && (
                <div className="houses-calendar-absence">
                  +{dayAbsences.length - 2}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AbsenceList({
  absences,
  currentUserId,
  onEdit,
  onDelete,
  deletingId,
}: {
  absences: Absence[];
  currentUserId: string | undefined;
  onEdit: (absence: Absence) => void;
  onDelete: (absenceId: string) => void;
  deletingId: string | null;
}) {
  if (absences.length === 0) {
    return <p className="houses-muted">Henüz yokluk bildirimi yok.</p>;
  }

  const sorted = [...absences].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  return (
    <div className="houses-absence-list">
      {sorted.map((absence) => {
        const isOwn = absence.member?.userId === currentUserId;
        const canModify =
          isOwn &&
          parseDateOnly(absence.startDate).getTime() >
            parseDateOnly(formatDateOnly(new Date())).getTime();

        return (
          <div key={absence.id} className="houses-absence-item">
            <div className="houses-absence-meta">
              <strong>
                {memberLabel(absence)}
                {isOwn && " (siz)"}
              </strong>
              <span className="houses-absence-dates">
                {formatDisplayDate(absence.startDate)} –{" "}
                {formatDisplayDate(absence.endDate)}
              </span>
            </div>
            {canModify && (
              <div className="houses-absence-actions">
                <button
                  type="button"
                  className="houses-btn houses-btn-secondary"
                  onClick={() => onEdit(absence)}
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  className="houses-btn houses-btn-danger"
                  disabled={deletingId === absence.id}
                  onClick={() => onDelete(absence.id)}
                >
                  {deletingId === absence.id ? "Siliniyor…" : "Sil"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
