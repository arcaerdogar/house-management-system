import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError } from "@/api/client";
import { getDashboardSummary } from "@/api/dashboard";
import type { DashboardSummary } from "@housemate/shared";
import {
  consolidatedDirectionLabel,
  formatMoney,
  memberLabel,
  pairwiseDirectionLabel,
} from "./utils";
import "./dashboard.css";

export function DashboardSummaryPage() {
  const { houseId } = useParams<{ houseId: string }>();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary(houseId);
      setSummary(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Özet yüklenemedi"
      );
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!houseId) {
    return (
      <p className="dashboard-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  const base = `/houses/${houseId}/dashboard`;

  const heroClass =
    summary?.consolidatedDirection === "CREDITOR"
      ? "creditor"
      : summary?.consolidatedDirection === "DEBTOR"
        ? "debtor"
        : "settled";

  return (
    <div className="dashboard-card">
      <h3>Bakiye özeti</h3>
      <p className="dashboard-muted">
        Anlık ve düzenli harcamalardan hesaplanan borç/alacak durumunuz. Sıralı
        harcamalar bu toplamlara dahil değildir.
      </p>

      <div className="dashboard-toolbar" style={{ marginTop: "1rem" }}>
        <Link
          to={`${base}/activity`}
          className="dashboard-btn dashboard-btn-secondary"
        >
          Aktivite akışı
        </Link>
        <span className="dashboard-toolbar-spacer" />
        <Link
          to={`/houses/${houseId}/expenses`}
          className="dashboard-btn dashboard-btn-secondary"
        >
          Harcamalar
        </Link>
      </div>

      {error && (
        <p className="dashboard-error" role="alert" style={{ marginTop: "1rem" }}>
          {error}
        </p>
      )}

      {loading ? (
        <p className="dashboard-loading" style={{ marginTop: "1rem" }}>
          Özet yükleniyor…
        </p>
      ) : summary ? (
        <>
          <div className={`dashboard-summary-hero ${heroClass}`}>
            <p className="dashboard-summary-label">
              {consolidatedDirectionLabel(summary.consolidatedDirection)}
            </p>
            <p className="dashboard-summary-amount">
              {summary.consolidatedDirection === "SETTLED"
                ? formatMoney("0")
                : formatMoney(summary.consolidatedBalance)}
            </p>
          </div>

          {summary.pairwise.length === 0 ? (
            <p className="dashboard-muted">
              Diğer üyelerle açık borç/alacak kaydı yok.
            </p>
          ) : (
            <>
              <h4 style={{ margin: "1.25rem 0 0", fontSize: "0.9375rem" }}>
                Üye bazında
              </h4>
              <ul className="dashboard-pair-list">
                {summary.pairwise.map((pair) => (
                  <li key={pair.memberId}>
                    <Link
                      to={`${base}/members/${pair.memberId}`}
                      className="dashboard-pair-item"
                    >
                      <div className="dashboard-pair-main">
                        <span className="dashboard-pair-name">
                          {memberLabel(pair.memberName)}
                        </span>
                        <span className="dashboard-pair-direction">
                          {pairwiseDirectionLabel(
                            pair.direction,
                            pair.memberName
                          )}
                        </span>
                      </div>
                      <span
                        className={`dashboard-pair-amount ${
                          pair.direction === "OWED_TO_YOU"
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {formatMoney(pair.netAmount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="dashboard-callout">
            <p>
              Sıralı harcamalar (market, temizlik vb.) borç toplamlarına dahil
              edilmez. Kimin sırada olduğunu sıralı harcamalar sayfasından
              görebilirsiniz.
            </p>
            <Link
              to={`/houses/${houseId}/expenses/rotational`}
              className="dashboard-btn dashboard-btn-secondary"
            >
              Sıralı harcamalar →
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
