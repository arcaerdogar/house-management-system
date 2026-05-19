import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { getMemberDebtDetail } from "@/api/dashboard";
import type { MemberDebtDetail } from "@housemate/shared";
import { formatDisplayDate } from "./dateUtils";
import { ExpenseTypeBadge } from "./ExpenseTypeBadge";
import {
  debtDetailDirectionLabel,
  formatMoney,
  memberLabel,
} from "./utils";
import "./dashboard.css";

export function MemberDebtDetailPage() {
  const { houseId, memberId } = useParams<{
    houseId: string;
    memberId: string;
  }>();
  const [detail, setDetail] = useState<MemberDebtDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!houseId || !memberId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getMemberDebtDetail(houseId, memberId);
      setDetail(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Borç detayı yüklenemedi"
      );
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [houseId, memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!houseId || !memberId) {
    return (
      <p className="dashboard-error" role="alert">
        Geçersiz adres
      </p>
    );
  }

  const dashboardBase = `/houses/${houseId}/dashboard`;

  return (
    <div className="dashboard-card">
      <nav className="dashboard-breadcrumb" aria-label="Konum">
        <Link to={dashboardBase}>Bakiye özeti</Link>
        <span aria-hidden>›</span>
        <span>{detail ? memberLabel(detail.counterpartyName) : "Üye detayı"}</span>
      </nav>

      <h3>Üye borç detayı</h3>
      <p className="dashboard-muted">
        Bu üye ile anlık ve düzenli harcamalardan oluşan açık kalemler. Sıralı
        harcamalar listelenmez.
      </p>

      {error && (
        <p className="dashboard-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="dashboard-loading" style={{ marginTop: "1rem" }}>
          Detay yükleniyor…
        </p>
      ) : detail ? (
        <>
          <div className="dashboard-detail-header">
            <h4>{memberLabel(detail.counterpartyName)}</h4>
            <p className="dashboard-muted" style={{ margin: 0 }}>
              {debtDetailDirectionLabel(
                detail.direction,
                detail.counterpartyName
              )}
            </p>
            <p
              className="dashboard-summary-amount"
              style={{ margin: "0.5rem 0 0", fontSize: "1.25rem" }}
            >
              {detail.direction === "SETTLED"
                ? formatMoney("0")
                : formatMoney(detail.netAmount)}
            </p>
          </div>

          {detail.lines.length === 0 ? (
            <p className="dashboard-muted" style={{ marginTop: "1rem" }}>
              Açık kalem bulunamadı.
            </p>
          ) : (
            <div className="dashboard-table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Açıklama</th>
                    <th>Tür</th>
                    <th>Ödeyen</th>
                    <th>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lines.map((line) => (
                    <tr key={`${line.expenseId}-${line.amountOwed}`}>
                      <td>{formatDisplayDate(line.expenseDate)}</td>
                      <td>{line.description}</td>
                      <td>
                        <ExpenseTypeBadge type={line.expenseType} />
                      </td>
                      <td>{memberLabel(line.payerName)}</td>
                      <td className="amount">{formatMoney(line.amountOwed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="dashboard-toolbar" style={{ marginTop: "1.25rem" }}>
            <Link
              to={dashboardBase}
              className="dashboard-btn dashboard-btn-secondary"
            >
              ← Özete dön
            </Link>
            <Link
              to={`/houses/${houseId}/expenses/rotational`}
              className="dashboard-btn dashboard-btn-secondary"
            >
              Sıralı harcamalar
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
