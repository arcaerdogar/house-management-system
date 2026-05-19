import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ACTIVE_HOUSE_KEY } from "@/api/session";

interface HouseContextValue {
  activeHouseId: string | null;
  setActiveHouseId: (id: string | null) => void;
  clearActiveHouse: () => void;
}

const HouseContext = createContext<HouseContextValue | null>(null);

export function HouseProvider({ children }: { children: ReactNode }) {
  const [activeHouseId, setActiveHouseIdState] = useState<string | null>(() =>
    localStorage.getItem(ACTIVE_HOUSE_KEY)
  );

  const setActiveHouseId = useCallback((id: string | null) => {
    setActiveHouseIdState(id);
    if (id) localStorage.setItem(ACTIVE_HOUSE_KEY, id);
    else localStorage.removeItem(ACTIVE_HOUSE_KEY);
  }, []);

  const clearActiveHouse = useCallback(() => {
    setActiveHouseId(null);
  }, [setActiveHouseId]);

  const value = useMemo(
    () => ({ activeHouseId, setActiveHouseId, clearActiveHouse }),
    [activeHouseId, setActiveHouseId, clearActiveHouse]
  );

  return (
    <HouseContext.Provider value={value}>{children}</HouseContext.Provider>
  );
}

export function useHouse() {
  const ctx = useContext(HouseContext);
  if (!ctx) throw new Error("useHouse must be used within HouseProvider");
  return ctx;
}
