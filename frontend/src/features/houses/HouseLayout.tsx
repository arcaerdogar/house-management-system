import { NavLink, Outlet, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "@/api/client";
import { getHouse } from "@/api/houses";
import { useHouse } from "@/app/HouseContext";
import type { House } from "@housemate/shared";
import { addKnownHouseId } from "./houseStorage";
import "./houses.css";

export function HouseLayout() {
  const { houseId } = useParams<{ houseId: string }>();
  const { setActiveHouseId } = useHouse();
  const [house, setHouse] = useState<House | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!houseId) return;
    const id = houseId;
    setActiveHouseId(id);
    addKnownHouseId(id);

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getHouse(id);
        if (!cancelled) setHouse(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Ev bilgisi alınamadı"
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
  }, [houseId, setActiveHouseId]);

  async function copyInviteCode() {
    if (!house?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(house.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (!houseId) {
    return (
      <p className="houses-error" role="alert">
        Geçersiz ev adresi
      </p>
    );
  }

  if (loading) {
    return <p className="houses-loading">Ev yükleniyor…</p>;
  }

  if (error || !house) {
    return (
      <section className="houses-page">
        <p className="houses-error" role="alert">
          {error ?? "Ev bulunamadı"}
        </p>
        <Link to="/houses" className="houses-btn houses-btn-secondary">
          ← Ev listesine dön
        </Link>
      </section>
    );
  }

  return (
    <section className="houses-page">
      <nav className="houses-breadcrumb" aria-label="Konum">
        <Link to="/houses">Evler</Link>
        <span>/</span>
        <span>{house.name}</span>
      </nav>

      <div className="houses-toolbar">
        <h2>{house.name}</h2>
      </div>

      <div className="houses-card">
        <h3>Davet kodu</h3>
        <p className="houses-muted">
          Yeni üyeler bu kodu kullanarak eve katılabilir.
        </p>
        <div className="houses-invite">
          <code>{house.inviteCode}</code>
          <button
            type="button"
            className="houses-btn houses-btn-secondary"
            onClick={() => void copyInviteCode()}
          >
            {copied ? "Kopyalandı" : "Kopyala"}
          </button>
        </div>
      </div>

      <nav className="houses-tabs" aria-label="Ev bölümleri">
        <NavLink
          to={`/houses/${houseId}`}
          end
          className={({ isActive }) =>
            isActive ? "houses-tab active" : "houses-tab"
          }
        >
          Genel
        </NavLink>
        <NavLink
          to={`/houses/${houseId}/members`}
          className={({ isActive }) =>
            isActive ? "houses-tab active" : "houses-tab"
          }
        >
          Üyeler
        </NavLink>
        <NavLink
          to={`/houses/${houseId}/absences`}
          className={({ isActive }) =>
            isActive ? "houses-tab active" : "houses-tab"
          }
        >
          Yokluk
        </NavLink>
        <NavLink
          to={`/houses/${houseId}/expenses`}
          className={({ isActive }) =>
            isActive ? "houses-tab active" : "houses-tab"
          }
        >
          Harcamalar
        </NavLink>
        <NavLink
          to={`/houses/${houseId}/dashboard`}
          className={({ isActive }) =>
            isActive ? "houses-tab active" : "houses-tab"
          }
        >
          Bakiye
        </NavLink>
      </nav>

      <Outlet context={{ house }} />
    </section>
  );
}

export function HouseOverviewPage() {
  const { houseId } = useParams<{ houseId: string }>();

  return (
    <div className="houses-card">
      <h3>Ev özeti</h3>
      <p className="houses-muted">
        Üye listesi ve yokluk takvimine üst menüden ulaşabilirsiniz.
      </p>
      <div className="houses-toolbar">
        <Link
          to={`/houses/${houseId}/members`}
          className="houses-btn houses-btn-secondary"
        >
          Üyeleri görüntüle
        </Link>
        <Link
          to={`/houses/${houseId}/absences`}
          className="houses-btn houses-btn-secondary"
        >
          Yokluk takvimi
        </Link>
      </div>
    </div>
  );
}
