import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getHouse } from "@/api/houses";
import { useHouse } from "@/app/HouseContext";
import type { House, HouseMember } from "@housemate/shared";
import { CreateHouseForm } from "./CreateHouseForm";
import { JoinHouseForm } from "./JoinHouseForm";
import { addKnownHouseId, getKnownHouseIds } from "./houseStorage";
import "./houses.css";

export function HouseListPage() {
  const navigate = useNavigate();
  const { setActiveHouseId } = useHouse();
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    const ids = getKnownHouseIds();
    if (ids.length === 0) {
      setHouses([]);
      setLoading(false);
      return;
    }

    const results = await Promise.allSettled(ids.map((id) => getHouse(id)));
    const loaded: House[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        loaded.push(result.value);
      }
    }
    setHouses(loaded);
    if (loaded.length === 0 && ids.length > 0) {
      setError("Kayıtlı evler yüklenemedi. Yeni bir ev oluşturabilir veya davet kodu ile katılabilirsiniz.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadHouses();
  }, [loadHouses]);

  function onCreated(house: House) {
    addKnownHouseId(house.id);
    setActiveHouseId(house.id);
    navigate(`/houses/${house.id}`);
  }

  function onJoined(membership: HouseMember) {
    addKnownHouseId(membership.houseId);
    setActiveHouseId(membership.houseId);
    navigate(`/houses/${membership.houseId}`);
  }

  function selectHouse(houseId: string) {
    setActiveHouseId(houseId);
    navigate(`/houses/${houseId}`);
  }

  return (
    <section className="houses-page">
      <h2>Evler</h2>
      <p className="houses-muted">
        Ortak ev harcamalarını yönetmek için bir ev oluşturun veya davet kodu ile
        katılın.
      </p>

      {loading && <p className="houses-loading">Evler yükleniyor…</p>}
      {error && (
        <p className="houses-error" role="alert">
          {error}
        </p>
      )}

      {!loading && houses.length > 0 && (
        <div className="houses-card">
          <h3>Evleriniz</h3>
          <ul className="houses-list">
            {houses.map((house) => (
              <li key={house.id} className="houses-list-item">
                <button
                  type="button"
                  className="houses-btn houses-btn-secondary"
                  onClick={() => selectHouse(house.id)}
                >
                  {house.name}
                </button>
                <Link to={`/houses/${house.id}`}>Aç →</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="houses-card-grid">
        <div className="houses-card">
          <CreateHouseForm onCreated={onCreated} />
        </div>
        <div className="houses-card">
          <JoinHouseForm onJoined={onJoined} />
        </div>
      </div>
    </section>
  );
}
