import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "housemate_active_house";

interface HouseContextValue {
  activeHouseId: string | null;
  setActiveHouseId: (id: string | null) => void;
}

const HouseContext = createContext<HouseContextValue | null>(null);

export function HouseProvider({ children }: { children: ReactNode }) {
  const [activeHouseId, setActiveHouseIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const setActiveHouseId = (id: string | null) => {
    setActiveHouseIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ activeHouseId, setActiveHouseId }),
    [activeHouseId]
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
