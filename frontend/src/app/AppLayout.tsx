import { Outlet, Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useHouse } from "@/app/HouseContext";

export function AppLayout() {
  const { logout } = useAuth();
  const { activeHouseId } = useHouse();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="brand">
          HouseMate
        </Link>
        <nav>
          <Link to="/houses">Evler</Link>
          {activeHouseId && (
            <>
              <Link to={`/houses/${activeHouseId}/expenses`}>Harcamalar</Link>
              <Link to={`/houses/${activeHouseId}/dashboard`}>Özet</Link>
            </>
          )}
        </nav>
        <button type="button" onClick={() => void logout()}>
          Çıkış
        </button>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

