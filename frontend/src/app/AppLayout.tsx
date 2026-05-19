import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useHouse } from "@/app/HouseContext";

export function AppLayout() {
  const { logout } = useAuth();
  const { activeHouseId } = useHouse();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/houses" className="brand" end>
          HouseMate
        </NavLink>
        <nav className="nav" aria-label="Ana menü">
          <NavLink to="/houses" end>
            Evler
          </NavLink>
          {activeHouseId && (
            <>
              <NavLink to={`/houses/${activeHouseId}/expenses`}>
                Harcamalar
              </NavLink>
              <NavLink to={`/houses/${activeHouseId}/dashboard`}>
                Özet
              </NavLink>
            </>
          )}
        </nav>
        <button
          type="button"
          className="btn-logout"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
        >
          {loggingOut ? "Çıkılıyor…" : "Çıkış"}
        </button>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
